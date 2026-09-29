-- EZZI console — Supabase Postgres schema (relational, no duplicate stores)
--
-- Auth identities live in auth.users (GoTrue). Application tables mirror the
-- console Db shape used by apps/console/src/server (one row per entity).
--
-- Apply once: pnpm --filter @ezzi/console db:apply
-- Requires SUPABASE_DB_URL (direct or pooler connection string).

-- Remove legacy single-document store if present.
drop table if exists public.app_state;

-- ---------------------------------------------------------------------------
-- Identity mirror (links to auth.users.id when using Supabase Auth)
-- ---------------------------------------------------------------------------

create table if not exists public.app_users (
  id          text primary key,
  email       text not null unique,
  name        text not null,
  activated   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.app_credentials (
  user_id       text primary key references public.app_users (id) on delete cascade,
  password_hash text not null
);

create table if not exists public.platform_super_admins (
  user_id text primary key references public.app_users (id) on delete cascade
);

-- ---------------------------------------------------------------------------
-- Organisations & memberships
-- ---------------------------------------------------------------------------

create table if not exists public.organisations (
  id         text primary key,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.org_memberships (
  id          text primary key,
  org_id      text not null references public.organisations (id) on delete cascade,
  name        text not null,
  email       text not null,
  role        text not null,
  scope       text not null,
  status      text not null,
  status_note text not null default '',
  unique (org_id, email)
);

create index if not exists org_memberships_org_id_idx on public.org_memberships (org_id);
create index if not exists org_memberships_email_idx on public.org_memberships (lower(email));

-- ---------------------------------------------------------------------------
-- Public registration requests (super-admin review)
-- ---------------------------------------------------------------------------

create table if not exists public.org_registration_requests (
  id             text primary key,
  company        text not null,
  contact        text not null,
  email          text not null,
  phone          text not null default '',
  country        text not null default '',
  branch         text not null default '',
  about          text not null default '',
  member_years   integer not null default 0,
  member_count   integer not null default 0,
  min_properties integer not null default 0,
  status         text not null,
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Server sessions (opaque cookie → row)
-- ---------------------------------------------------------------------------

create table if not exists public.app_sessions (
  token         text primary key,
  user_id       text not null references public.app_users (id) on delete cascade,
  created_at    timestamptz not null,
  expires_at    timestamptz not null,
  refresh_token text
);

create index if not exists app_sessions_user_id_idx on public.app_sessions (user_id);

-- ---------------------------------------------------------------------------
-- Messaging
-- ---------------------------------------------------------------------------

create table if not exists public.chat_conversations (
  id            text primary key,
  kind          text not null check (kind in ('direct', 'group')),
  title         text not null,
  member_emails text[] not null,
  created_by    text not null,
  created_at    timestamptz not null,
  updated_at    timestamptz not null
);

create table if not exists public.chat_messages (
  id              text primary key,
  conversation_id text not null references public.chat_conversations (id) on delete cascade,
  sender_email    text not null,
  body            text not null,
  sent_at         timestamptz not null,
  receipts        jsonb not null default '[]'::jsonb
);

alter table public.chat_messages
  add column if not exists receipts jsonb not null default '[]'::jsonb;

create index if not exists chat_messages_conversation_id_idx on public.chat_messages (conversation_id);

-- ---------------------------------------------------------------------------
-- Demo desk collections (properties, jobs, finance, …) — not orgs/users/requests
-- ---------------------------------------------------------------------------

create table if not exists public.desk_collections (
  id         text primary key default 'default',
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Schema metadata
-- ---------------------------------------------------------------------------

create table if not exists public.app_meta (
  id             text primary key default 'singleton',
  schema_version integer not null default 3,
  updated_at     timestamptz not null default now()
);

insert into public.app_meta (id, schema_version)
values ('singleton', 3)
on conflict (id) do update set schema_version = excluded.schema_version;

-- RLS: enabled, no policies — only service role / direct DB URL from the server.
alter table public.app_users enable row level security;
alter table public.app_credentials enable row level security;
alter table public.platform_super_admins enable row level security;
alter table public.organisations enable row level security;
alter table public.org_memberships enable row level security;
alter table public.org_registration_requests enable row level security;
alter table public.app_sessions enable row level security;
alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;
alter table public.desk_collections enable row level security;
alter table public.app_meta enable row level security;
