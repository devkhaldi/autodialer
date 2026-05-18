-- Run this SQL in your Supabase SQL Editor to create the leads table

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  "phoneNumber" text not null,
  "googleMapsUrl" text default '',
  "hasWebsite" text default 'No',
  timezone text default '',
  niche text default '',
  notes text default '',
  status text not null default 'Uncalled',
  created_at timestamptz not null default now()
);

-- Enable Row Level Security (optional, recommended for production)
alter table public.leads enable row level security;

-- Allow all operations for now (tighten in production)
create policy "Allow all" on public.leads for all using (true) with check (true);
