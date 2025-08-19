-- Add first_setup_required flag to clinics (default true) and optional onboarding data jsonb
alter table public.clinics add column if not exists first_setup_required boolean not null default true;
alter table public.clinics add column if not exists onboarding_data jsonb;

-- Index for quick filtering
create index if not exists clinics_first_setup_required_idx on public.clinics (first_setup_required) where first_setup_required = true;
