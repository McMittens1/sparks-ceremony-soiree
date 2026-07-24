create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  event_data jsonb not null default '{}'::jsonb,
  source_url text,
  created_at timestamptz not null default now(),
  constraint analytics_events_event_name_check check (
    event_name in ('rsvp_submit', 'photo_upload', 'calendar_click', 'registry_click')
  )
);

grant all on public.analytics_events to service_role;

alter table public.analytics_events enable row level security;