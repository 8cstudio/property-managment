import "server-only";
import type {
  DeskState,
  Office,
  Org,
  OrgRequest,
  StaffUser,
} from "@/features/workspace/data";

export type { Office, Org, OrgRequest, StaffUser };

/**
 * Non-identity desk collections (properties, work, listings, jobs, finance,
 * migration, documents, integrations, audit, etc.). Organisations, users,
 * and org registration requests are excluded — those use dedicated APIs.
 */
export type DeskCollections = Omit<DeskState, "orgs" | "users">;

import type { OrgRole } from "@/features/workspace/staff-roles";

export type { OrgRole };
export {
  DISPLAY_TO_SLUG,
  SLUG_TO_DISPLAY,
  displayRoleToSlug,
  isAssignableOrgRole,
  resolveStaffAccessRole,
} from "@/features/workspace/staff-roles";

export type MembershipStatus = "active" | "invited" | "deactivated";

/** An EZZI identity. Mirrors a Supabase Auth user in supabase mode. */
export type AppUser = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  /**
   * False for invited users who have not yet set their own password. They
   * activate by entering their email on the sign-in form (no email is sent).
   */
  activated: boolean;
};

/** Local-mode password record. Never used in supabase mode. */
export type Credential = {
  userId: string;
  passwordHash: string;
};

/** Server session record, keyed by an opaque cookie token (both modes). */
export type LocalSession = {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  /** Supabase refresh token, kept so we can revoke the GoTrue session. */
  refreshToken?: string;
};

/** Per-recipient delivery/read state (every member except the sender). */
export type MessageReceipt = {
  email: string;
  deliveredAt?: string;
  readAt?: string;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderEmail: string;
  body: string;
  sentAt: string;
  receipts?: MessageReceipt[];
};

/** Conversation without embedded messages (messages live in Db.messages). */
export type Conversation = {
  id: string;
  kind: "direct" | "group";
  title: string;
  memberEmails: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

/** Conversation with its messages embedded, as returned to the client. */
export type ConversationWithMessages = Conversation & {
  messages: ChatMessage[];
};

export type Db = {
  version: number;
  /** Auth identities (login accounts). */
  users: AppUser[];
  /** Local-mode password hashes. */
  credentials: Credential[];
  /** User ids with the platform super-admin role. */
  superAdmins: string[];
  /** Organisations (rich desk shape). */
  orgs: Org[];
  /** Organisation memberships (one row per user per org). */
  staff: StaffUser[];
  /** Public organisation requests awaiting a super-admin decision. */
  requests: OrgRequest[];
  localSessions: LocalSession[];
  conversations: Conversation[];
  messages: ChatMessage[];
  /** Shared demo desk collections, persisted as one document. */
  deskCollections: DeskCollections | null;
};

export function emptyDb(): Db {
  return {
    version: 3,
    users: [],
    credentials: [],
    superAdmins: [],
    orgs: [],
    staff: [],
    requests: [],
    localSessions: [],
    conversations: [],
    messages: [],
    deskCollections: null,
  };
}

/** Public shape of a user returned by the API (no secrets). */
export type PublicUser = {
  id: string;
  email: string;
  name: string;
};

/** The authenticated caller resolved from a request. */
export type Viewer = {
  user: PublicUser;
  isSuperAdmin: boolean;
  /** Org memberships (one row per org; role is portal slug). */
  memberships: { orgId: string; role: OrgRole; status: MembershipStatus }[];
  /** Union of portal areas this user may open (from super-admin + memberships). */
  roles: string[];
};

export function toPublicUser(user: AppUser): PublicUser {
  return { id: user.id, email: user.email, name: user.name };
}
