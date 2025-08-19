-- Ensure required onboarding fields exist on clinics
alter table public.clinics add column if not exists phone text;
alter table public.clinics add column if not exists address text;
alter table public.clinics add column if not exists logo_url text;
alter table public.clinics add column if not exists terms_and_conditions text;
-- schedule stored as jsonb for structured access
alter table public.clinics add column if not exists schedule jsonb;
alter table public.clinics add column if not exists google_calendar_reminder_minutes int not null default 1440;

-- Optional index for querying clinics needing reminder default changes later
create index if not exists clinics_schedule_gin_idx on public.clinics using gin (schedule jsonb_path_ops);
