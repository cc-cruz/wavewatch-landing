create extension if not exists pgcrypto;

create schema if not exists wavewatch;

do $$
begin
  create type wavewatch.marine_activity as enum ('surf', 'boating', 'diving', 'fishing');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type wavewatch.briefing_call as enum ('go', 'maybe', 'skip', 'watch');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type wavewatch.delivery_channel as enum ('sms', 'imessage', 'web');
exception
  when duplicate_object then null;
end $$;

create table if not exists wavewatch.user_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id text not null unique,
  display_name text,
  phone_number text,
  phone_verified_at timestamptz,
  home_region_id text not null default 'northern-california',
  risk_tolerance text not null default 'balanced',
  briefing_tone text not null default 'concise',
  briefing_length text not null default 'standard',
  quiet_hours_start time not null default '21:30',
  quiet_hours_end time not null default '05:00',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_profiles_risk_tolerance_check
    check (risk_tolerance in ('conservative', 'balanced', 'aggressive')),
  constraint user_profiles_briefing_length_check
    check (briefing_length in ('short', 'standard', 'detailed'))
);

create table if not exists wavewatch.saved_spots (
  id uuid primary key default gen_random_uuid(),
  user_profile_id uuid not null references wavewatch.user_profiles(id) on delete cascade,
  activity wavewatch.marine_activity not null,
  label text not null,
  region_id text not null,
  latitude double precision,
  longitude double precision,
  notes text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists saved_spots_user_profile_id_idx
  on wavewatch.saved_spots(user_profile_id);

create table if not exists wavewatch.briefing_rituals (
  id uuid primary key default gen_random_uuid(),
  user_profile_id uuid not null references wavewatch.user_profiles(id) on delete cascade,
  type text not null,
  label text not null,
  schedule text not null,
  timezone text not null default 'America/Los_Angeles',
  delivery_channel wavewatch.delivery_channel not null default 'sms',
  only_if_worth_it boolean not null default true,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists briefing_rituals_user_profile_id_idx
  on wavewatch.briefing_rituals(user_profile_id);

create table if not exists wavewatch.forecast_runs (
  id uuid primary key default gen_random_uuid(),
  user_profile_id uuid not null references wavewatch.user_profiles(id) on delete cascade,
  ritual_id uuid references wavewatch.briefing_rituals(id) on delete set null,
  spot_id uuid references wavewatch.saved_spots(id) on delete set null,
  activity wavewatch.marine_activity,
  status text not null default 'queued',
  call wavewatch.briefing_call,
  briefing_window text,
  risk text,
  confidence text,
  why text,
  source_families text[] not null default '{}',
  worker_request_id text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists forecast_runs_user_profile_id_created_at_idx
  on wavewatch.forecast_runs(user_profile_id, created_at desc);

create table if not exists wavewatch.message_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_profile_id uuid not null references wavewatch.user_profiles(id) on delete cascade,
  forecast_run_id uuid references wavewatch.forecast_runs(id) on delete set null,
  channel wavewatch.delivery_channel not null,
  recipient text not null,
  body text not null,
  status text not null default 'queued',
  provider_message_id text,
  sent_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now()
);

create index if not exists message_deliveries_user_profile_id_created_at_idx
  on wavewatch.message_deliveries(user_profile_id, created_at desc);
