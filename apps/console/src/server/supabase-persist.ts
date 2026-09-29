import "server-only";
import { getPg } from "./postgres-client";
import type {
  AppUser,
  ChatMessage,
  Conversation,
  Credential,
  Db,
  DeskCollections,
  LocalSession,
  MessageReceipt,
  Org,
  OrgRequest,
  StaffUser,
} from "./types";

let schemaPatchPromise: Promise<void> | null = null;

function getSql(): ReturnType<typeof getPg> {
  return getPg();
}

/** Idempotent patches for DBs created before newer console columns. */
async function ensureSchemaPatches(): Promise<void> {
  if (!schemaPatchPromise) {
    schemaPatchPromise = (async () => {
      const db = getSql();
      await db.unsafe(`
        alter table public.chat_messages
          add column if not exists receipts jsonb not null default '[]'::jsonb;
      `);
    })().catch((err) => {
      schemaPatchPromise = null;
      throw err;
    });
  }
  await schemaPatchPromise;
}

type UserRow = {
  id: string;
  email: string;
  name: string;
  activated: boolean;
  created_at: Date;
};

type StaffRow = {
  id: string;
  org_id: string;
  name: string;
  email: string;
  role: string;
  scope: string;
  status: string;
  status_note: string;
};

type RequestRow = {
  id: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  country: string;
  branch: string;
  about: string;
  member_years: number;
  member_count: number;
  min_properties: number;
  status: string;
};

type SessionRow = {
  token: string;
  user_id: string;
  created_at: Date;
  expires_at: Date;
  refresh_token: string | null;
};

type ConversationRow = {
  id: string;
  kind: string;
  title: string;
  member_emails: string[];
  created_by: string;
  created_at: Date;
  updated_at: Date;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_email: string;
  body: string;
  sent_at: Date;
  receipts: MessageReceipt[] | null;
};

function mapUser(row: UserRow): AppUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    activated: row.activated,
    createdAt: row.created_at.toISOString(),
  };
}

function mapStaff(row: StaffRow): StaffUser {
  return {
    id: row.id,
    orgId: row.org_id,
    name: row.name,
    email: row.email,
    role: row.role,
    scope: row.scope,
    status: row.status as StaffUser["status"],
    statusNote: row.status_note,
  };
}

function mapRequest(row: RequestRow): OrgRequest {
  return {
    id: row.id,
    company: row.company,
    contact: row.contact,
    email: row.email,
    phone: row.phone,
    country: row.country,
    branch: row.branch,
    about: row.about,
    memberYears: row.member_years,
    memberCount: row.member_count,
    minProperties: row.min_properties,
    status: row.status as OrgRequest["status"],
  };
}

function mapSession(row: SessionRow): LocalSession {
  return {
    token: row.token,
    userId: row.user_id,
    createdAt: row.created_at.toISOString(),
    expiresAt: row.expires_at.toISOString(),
    ...(row.refresh_token ? { refreshToken: row.refresh_token } : {}),
  };
}

function mapConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    kind: row.kind as Conversation["kind"],
    title: row.title,
    memberEmails: row.member_emails,
    createdBy: row.created_by,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function mapMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderEmail: row.sender_email,
    body: row.body,
    sentAt: row.sent_at.toISOString(),
    receipts: Array.isArray(row.receipts) ? row.receipts : [],
  };
}

/** Organisations only. Does not load sessions, chat, or the full in-memory database. */
export async function loadOrgsFromPostgres(): Promise<Org[]> {
  const db = getSql();
  const rows = await db<{ id: string; data: Org }[]>`
    select id, data from organisations
  `;
  return rows.map((row) => row.data);
}

/** Memberships only. */
export async function loadStaffFromPostgres(): Promise<StaffUser[]> {
  const db = getSql();
  const rows = await db<StaffRow[]>`
    select id, org_id, name, email, role, scope, status, status_note
    from org_memberships
  `;
  return rows.map(mapStaff);
}

/** Registration requests only. */
export async function loadOrgRequestsFromPostgres(): Promise<OrgRequest[]> {
  const db = getSql();
  const rows = await db<RequestRow[]>`
    select id, company, contact, email, phone, country, branch, about,
           member_years, member_count, min_properties, status
    from org_registration_requests
  `;
  return rows.map(mapRequest);
}

/** Desk JSON document only. Does not load chat history. */
export async function loadDeskCollectionsRow(): Promise<DeskCollections | null> {
  const db = getSql();
  const rows = await db<{ data: DeskCollections | null }[]>`
    select data from desk_collections where id = 'default'
  `;
  return rows[0]?.data ?? null;
}

/** Auth, orgs, sessions — skip chat + desk JSON (loaded on demand). */
export async function loadDbCoreFromPostgres(): Promise<Omit<Db, "conversations" | "messages" | "deskCollections"> & {
  conversations: Conversation[];
  messages: ChatMessage[];
  deskCollections: DeskCollections | null;
}> {
  await ensureSchemaPatches();
  const db = getSql();
  const [users, credentials, superAdmins, orgRows, staff, requests, sessions] =
    await Promise.all([
      db<UserRow[]>`select id, email, name, activated, created_at from app_users`,
      db<{ user_id: string; password_hash: string }[]>`
      select user_id, password_hash from app_credentials
    `,
      db<{ user_id: string }[]>`
      select user_id from platform_super_admins
    `,
      db<{ id: string; data: Org }[]>`
      select id, data from organisations
    `,
      db<StaffRow[]>`
      select id, org_id, name, email, role, scope, status, status_note
      from org_memberships
    `,
      db<RequestRow[]>`
      select id, company, contact, email, phone, country, branch, about,
             member_years, member_count, min_properties, status
      from org_registration_requests
    `,
      db<SessionRow[]>`
      select token, user_id, created_at, expires_at, refresh_token
      from app_sessions
    `,
    ]);

  return {
    version: 3,
    users: users.map(mapUser),
    credentials: credentials.map(
      (c): Credential => ({
        userId: c.user_id,
        passwordHash: c.password_hash,
      }),
    ),
    superAdmins: superAdmins.map((r) => r.user_id),
    orgs: orgRows.map((r) => r.data),
    staff: staff.map(mapStaff),
    requests: requests.map(mapRequest),
    localSessions: sessions.map(mapSession),
    conversations: [],
    messages: [],
    deskCollections: null,
  };
}

export async function loadDbHeavyFromPostgres(): Promise<{
  conversations: Conversation[];
  messages: ChatMessage[];
  deskCollections: DeskCollections | null;
}> {
  await ensureSchemaPatches();
  const db = getSql();
  const [conversations, messages, deskRow] = await Promise.all([
    db<ConversationRow[]>`
      select id, kind, title, member_emails, created_by, created_at, updated_at
      from chat_conversations
    `,
    db<MessageRow[]>`
      select id, conversation_id, sender_email, body, sent_at, receipts
      from chat_messages
    `,
    db<{ data: DeskCollections | null }[]>`
      select data from desk_collections where id = 'default'
    `,
  ]);
  return {
    conversations: conversations.map(mapConversation),
    messages: messages.map(mapMessage),
    deskCollections: deskRow[0]?.data ?? null,
  };
}

/** Full load (local parity / rare admin export). Prefer core + heavy on demand. */
export async function loadDbFromPostgres(): Promise<Db> {
  const core = await loadDbCoreFromPostgres();
  const heavy = await loadDbHeavyFromPostgres();
  return { ...core, ...heavy };
}

export async function persistDbToPostgres(db: Db): Promise<void> {
  await ensureSchemaPatches();
  const pg = getSql();
  const userIds = db.users.map((u) => u.id);
  const orgIds = db.orgs.map((o) => o.id);
  const staffIds = db.staff.map((s) => s.id);
  const requestIds = db.requests.map((r) => r.id);
  const sessionTokens = db.localSessions.map((s) => s.token);
  const conversationIds = db.conversations.map((c) => c.id);
  const messageIds = db.messages.map((m) => m.id);

  await pg.begin(async (tx) => {
    for (const user of db.users) {
      await tx`
        insert into app_users (id, email, name, activated, created_at)
        values (
          ${user.id},
          ${user.email},
          ${user.name},
          ${user.activated},
          ${user.createdAt}::timestamptz
        )
        on conflict (id) do update set
          email = excluded.email,
          name = excluded.name,
          activated = excluded.activated
      `;
    }
    /* Never delete app_users here — invites/auth use direct SQL; stale cache
       must not wipe real users from Postgres. */

    for (const cred of db.credentials) {
      await tx`
        insert into app_credentials (user_id, password_hash)
        values (${cred.userId}, ${cred.passwordHash})
        on conflict (user_id) do update set password_hash = excluded.password_hash
      `;
    }
    /* Local-mode credentials only; supabase auth lives in GoTrue. */

    for (const userId of db.superAdmins) {
      await tx`
        insert into platform_super_admins (user_id) values (${userId})
        on conflict do nothing
      `;
    }

    for (const org of db.orgs) {
      await tx`
        insert into organisations (id, data, updated_at)
        values (${org.id}, ${tx.json(org)}, now())
        on conflict (id) do update set data = excluded.data, updated_at = now()
      `;
    }
    if (orgIds.length > 0) {
      await tx`delete from organisations where id not in ${tx(orgIds)}`;
    } else {
      await tx`delete from organisations`;
    }

    for (const row of db.staff) {
      await tx`
        insert into org_memberships (
          id, org_id, name, email, role, scope, status, status_note
        )
        values (
          ${row.id},
          ${row.orgId},
          ${row.name},
          ${row.email},
          ${row.role},
          ${row.scope},
          ${row.status},
          ${row.statusNote}
        )
        on conflict (id) do update set
          org_id = excluded.org_id,
          name = excluded.name,
          email = excluded.email,
          role = excluded.role,
          scope = excluded.scope,
          status = excluded.status,
          status_note = excluded.status_note
      `;
    }
    if (staffIds.length > 0) {
      await tx`delete from org_memberships where id not in ${tx(staffIds)}`;
    } else {
      await tx`delete from org_memberships`;
    }

    for (const row of db.requests) {
      await tx`
        insert into org_registration_requests (
          id, company, contact, email, phone, country, branch, about,
          member_years, member_count, min_properties, status
        )
        values (
          ${row.id},
          ${row.company},
          ${row.contact},
          ${row.email},
          ${row.phone},
          ${row.country},
          ${row.branch},
          ${row.about},
          ${row.memberYears},
          ${row.memberCount},
          ${row.minProperties},
          ${row.status}
        )
        on conflict (id) do update set
          company = excluded.company,
          contact = excluded.contact,
          email = excluded.email,
          phone = excluded.phone,
          country = excluded.country,
          branch = excluded.branch,
          about = excluded.about,
          member_years = excluded.member_years,
          member_count = excluded.member_count,
          min_properties = excluded.min_properties,
          status = excluded.status
      `;
    }
    if (requestIds.length > 0) {
      await tx`
        delete from org_registration_requests where id not in ${tx(requestIds)}
      `;
    } else {
      await tx`delete from org_registration_requests`;
    }

    for (const session of db.localSessions) {
      await tx`
        insert into app_sessions (
          token, user_id, created_at, expires_at, refresh_token
        )
        values (
          ${session.token},
          ${session.userId},
          ${session.createdAt}::timestamptz,
          ${session.expiresAt}::timestamptz,
          ${session.refreshToken ?? null}
        )
        on conflict (token) do update set
          user_id = excluded.user_id,
          created_at = excluded.created_at,
          expires_at = excluded.expires_at,
          refresh_token = excluded.refresh_token
      `;
    }
    if (sessionTokens.length > 0) {
      await tx`
        delete from app_sessions where token not in ${tx(sessionTokens)}
      `;
    } else {
      await tx`delete from app_sessions`;
    }

    for (const row of db.conversations) {
      await tx`
        insert into chat_conversations (
          id, kind, title, member_emails, created_by, created_at, updated_at
        )
        values (
          ${row.id},
          ${row.kind},
          ${row.title},
          ${row.memberEmails},
          ${row.createdBy},
          ${row.createdAt}::timestamptz,
          ${row.updatedAt}::timestamptz
        )
        on conflict (id) do update set
          kind = excluded.kind,
          title = excluded.title,
          member_emails = excluded.member_emails,
          created_by = excluded.created_by,
          created_at = excluded.created_at,
          updated_at = excluded.updated_at
      `;
    }
    if (conversationIds.length > 0) {
      await tx`
        delete from chat_conversations where id not in ${tx(conversationIds)}
      `;
    } else {
      await tx`delete from chat_conversations`;
    }

    for (const row of db.messages) {
      await tx`
        insert into chat_messages (
          id, conversation_id, sender_email, body, sent_at, receipts
        )
        values (
          ${row.id},
          ${row.conversationId},
          ${row.senderEmail},
          ${row.body},
          ${row.sentAt}::timestamptz,
          ${tx.json(row.receipts ?? [])}
        )
        on conflict (id) do update set
          conversation_id = excluded.conversation_id,
          sender_email = excluded.sender_email,
          body = excluded.body,
          sent_at = excluded.sent_at,
          receipts = excluded.receipts
      `;
    }
    if (messageIds.length > 0) {
      await tx`delete from chat_messages where id not in ${tx(messageIds)}`;
    } else {
      await tx`delete from chat_messages`;
    }

    await tx`
      insert into desk_collections (id, data, updated_at)
      values (
        'default',
        ${tx.json(db.deskCollections ?? {})},
        now()
      )
      on conflict (id) do update set data = excluded.data, updated_at = now()
    `;

    await tx`
      insert into app_meta (id, schema_version, updated_at)
      values ('singleton', 3, now())
      on conflict (id) do update set schema_version = 3, updated_at = now()
    `;
  });
}

/** Fast path: add one platform super-admin row (session bootstrap). */
export async function persistSuperAdminToPostgres(userId: string): Promise<void> {
  await ensureSchemaPatches();
  const db = getSql();
  await db`
    insert into platform_super_admins (user_id)
    values (${userId})
    on conflict do nothing
  `;
}

/** Fast path: seed GoTrue mirror user + super-admin on first run. */
export async function persistBootstrapSuperAdmin(user: AppUser): Promise<void> {
  await ensureSchemaPatches();
  const db = getSql();
  await db`
    insert into app_users (id, email, name, activated, created_at)
    values (
      ${user.id},
      ${user.email},
      ${user.name},
      ${user.activated},
      ${user.createdAt}::timestamptz
    )
    on conflict (id) do update set
      email = excluded.email,
      name = excluded.name,
      activated = excluded.activated
  `;
  await db`
    insert into platform_super_admins (user_id)
    values (${user.id})
    on conflict do nothing
  `;
}

/** Fast path: desk JSON only (avoids rewriting every table on each autosave). */
export async function persistDeskCollectionsToPostgres(
  data: DeskCollections,
): Promise<void> {
  await ensureSchemaPatches();
  const db = getSql();
  await db`
    insert into desk_collections (id, data, updated_at)
    values ('default', ${db.json(data)}, now())
    on conflict (id) do update set data = excluded.data, updated_at = now()
  `;
}

/** Fast path: receipt ticks only (message send still uses full persist). */
export async function persistMessageReceiptsToPostgres(
  messages: ChatMessage[],
): Promise<void> {
  if (messages.length === 0) return;
  await ensureSchemaPatches();
  const db = getSql();
  for (const row of messages) {
    await db`
      update chat_messages
      set receipts = ${db.json(row.receipts ?? [])}
      where id = ${row.id}
    `;
  }
}

/** Fast path: one new message + conversation bump (not full DB rewrite). */
export async function persistChatMessageToPostgres(
  message: ChatMessage,
  conversationUpdatedAt: string,
): Promise<void> {
  await ensureSchemaPatches();
  const db = getSql();
  await db`
    insert into chat_messages (
      id, conversation_id, sender_email, body, sent_at, receipts
    )
    values (
      ${message.id},
      ${message.conversationId},
      ${message.senderEmail},
      ${message.body},
      ${message.sentAt}::timestamptz,
      ${db.json(message.receipts ?? [])}
    )
    on conflict (id) do update set
      conversation_id = excluded.conversation_id,
      sender_email = excluded.sender_email,
      body = excluded.body,
      sent_at = excluded.sent_at,
      receipts = excluded.receipts
  `;
  await db`
    update chat_conversations
    set updated_at = ${conversationUpdatedAt}::timestamptz
    where id = ${message.conversationId}
  `;
}
