import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { backendMode, bootstrapSuperAdmin } from "./config";
import { hashPassword, newId } from "./crypto";
import {
  loadDbCoreFromPostgres,
  loadDbFromPostgres,
  loadDbHeavyFromPostgres,
  persistDbToPostgres,
  persistChatMessageToPostgres,
  persistDeskCollectionsToPostgres,
  persistMessageReceiptsToPostgres,
  persistSuperAdminToPostgres,
} from "./supabase-persist";
import {
  type AppUser,
  type ChatMessage,
  type Db,
  type DeskCollections,
  emptyDb,
} from "./types";

const DATA_FILE = join(process.cwd(), ".data", "ezzi-db.json");

let cache: Db | null = null;
let loading: Promise<Db> | null = null;
let heavyLoaded = false;
let heavyLoading: Promise<void> | null = null;
/** Serialises writes so concurrent route handlers never clobber storage. */
let writeChain: Promise<void> = Promise.resolve();

/** Keep in-memory cache aligned after direct Postgres user writes. */
export function mergeUserIntoCache(user: AppUser): void {
  if (!cache) return;
  const idx = cache.users.findIndex((u) => u.id === user.id);
  if (idx >= 0) cache.users[idx] = user;
  else cache.users.push(user);
}

export function patchCachedIdentity(patch: {
  orgs?: Db["orgs"];
  staff?: Db["staff"];
  requests?: Db["requests"];
  deskCollections?: Db["deskCollections"];
}): void {
  if (!cache) return;
  if (patch.orgs) cache.orgs = patch.orgs;
  if (patch.staff) cache.staff = patch.staff;
  if (patch.requests) cache.requests = patch.requests;
  if (patch.deskCollections !== undefined) {
    cache.deskCollections = patch.deskCollections;
  }
}

export function patchUserInCache(
  userId: string,
  patch: Partial<Pick<AppUser, "activated" | "name" | "email">>,
): void {
  if (!cache) return;
  const user = cache.users.find((u) => u.id === userId);
  if (user) Object.assign(user, patch);
}

function normalizeUsers(db: Db): Db {
  for (const user of db.users) {
    if (user.activated === undefined) {
      user.activated = db.credentials.some((c) => c.userId === user.id);
    }
  }
  return db;
}

async function readState(): Promise<Db> {
  if (backendMode === "supabase") {
    return normalizeUsers(await loadDbCoreFromPostgres());
  }
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<Db>;
    return normalizeUsers({ ...emptyDb(), ...parsed });
  } catch {
    return emptyDb();
  }
}

/** Seed bootstrap platform super-admin in local mode (file store). */
function bootstrapLocal(db: Db): boolean {
  if (backendMode !== "local") return false;
  const email = bootstrapSuperAdmin.email;
  if (db.users.some((u) => u.email === email)) return false;
  const id = newId("usr");
  db.users.push({
    id,
    email,
    name: bootstrapSuperAdmin.name,
    createdAt: new Date().toISOString(),
    activated: true,
  });
  db.credentials.push({
    userId: id,
    passwordHash: hashPassword(bootstrapSuperAdmin.password),
  });
  db.superAdmins.push(id);
  return true;
}

async function persist(db: Db): Promise<void> {
  if (backendMode === "supabase") {
    await persistDbToPostgres(db);
    return;
  }
  await mkdir(dirname(DATA_FILE), { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(db, null, 2), "utf8");
}

async function bootstrap(db: Db): Promise<boolean> {
  if (backendMode === "supabase") return false;
  return bootstrapLocal(db);
}

/** Chat + desk tables (large JSON). Call before messages/desk APIs. */
export async function ensureHeavyDbLoaded(): Promise<Db> {
  const db = await loadDb();
  if (heavyLoaded) return db;
  if (!heavyLoading) {
    heavyLoading = (async () => {
      if (backendMode === "supabase") {
        const heavy = await loadDbHeavyFromPostgres();
        db.conversations = heavy.conversations;
        db.messages = heavy.messages;
        db.deskCollections = heavy.deskCollections;
      }
      heavyLoaded = true;
    })().catch((err) => {
      heavyLoading = null;
      throw err;
    });
  }
  await heavyLoading;
  return db;
}

/** Load the database into memory (once), applying bootstrap if needed. */
export async function loadDb(): Promise<Db> {
  if (cache) return cache;
  if (!loading) {
    loading = (async () => {
      const db = await readState();
      const seeded = await bootstrap(db);
      cache = db;
      if (seeded) await persist(db);
      return db;
    })().catch((err) => {
      loading = null;
      throw err;
    });
  }
  return loading;
}

/**
 * Read-modify-write helper. The mutator runs against the in-memory db; the
 * result is persisted. Writes are serialised.
 */
export async function mutate<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
  const db = await loadDb();
  const run = writeChain.then(async () => {
    const result = await fn(db);
    await persist(db);
    return result;
  });
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

/** Update desk collections in memory + targeted Postgres write (not full DB). */
/** Promote a user to platform super-admin without rewriting the whole DB. */
export async function promoteSuperAdmin(userId: string): Promise<void> {
  await loadDb();
  const run = writeChain.then(async () => {
    const db = await loadDb();
    if (!db.superAdmins.includes(userId)) {
      db.superAdmins.push(userId);
    }
    if (backendMode === "supabase") {
      await persistSuperAdminToPostgres(userId);
    } else {
      await persist(db);
    }
  });
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  await run;
}

export async function saveDeskCollectionsCached(
  data: DeskCollections,
): Promise<DeskCollections> {
  await loadDb();
  const run = writeChain.then(async () => {
    const db = await loadDb();
    db.deskCollections = data;
    if (backendMode === "supabase") {
      await persistDeskCollectionsToPostgres(data);
    } else {
      await persist(db);
    }
    return data;
  });
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

/** Append one chat message without rewriting the whole database. */
export async function appendMessageCached(
  fn: (db: Db) => ChatMessage,
): Promise<ChatMessage> {
  await loadDb();
  const run = writeChain.then(async () => {
    const db = await loadDb();
    const message = fn(db);
    if (backendMode === "supabase") {
      const conversation = db.conversations.find(
        (c) => c.id === message.conversationId,
      );
      await persistChatMessageToPostgres(
        message,
        conversation?.updatedAt ?? message.sentAt,
      );
    } else {
      await persist(db);
    }
    return message;
  });
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

/** Apply message receipt changes without rewriting the whole database. */
export async function patchMessageReceiptsCached(
  fn: (db: Db) => ChatMessage[],
): Promise<ChatMessage[]> {
  await loadDb();
  const run = writeChain.then(async () => {
    const db = await loadDb();
    const updated = fn(db);
    if (updated.length === 0) return updated;
    if (backendMode === "supabase") {
      await persistMessageReceiptsToPostgres(updated);
    } else {
      await persist(db);
    }
    return updated;
  });
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}
