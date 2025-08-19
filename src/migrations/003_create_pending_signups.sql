-- Migration: create pending_signups table for two-step email verification signup
create table if not exists public.pending_signups (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  clinic_name text not null,
  password_hash text not null,
  code_hash text not null,
  attempts int not null default 0,
  last_code_sent_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Optional index for cleanup queries
create index if not exists pending_signups_expires_at_idx on public.pending_signups (expires_at);

-- If RLS is enabled globally, keep this table admin-only (service role only)
alter table public.pending_signups enable row level security;

create policy "pending_signups_service_role_select" on public.pending_signups for select using (
  auth.role() = 'service_role'
);
create policy "pending_signups_service_role_all" on public.pending_signups for all using (
  auth.role() = 'service_role'
) with check (auth.role() = 'service_role');
