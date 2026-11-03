-- ==========================================
-- OmniFocus Idea OS - Supabase Database Schema & RLS
-- ==========================================

-- 1. Ideas Table
create table if not exists ideas (
  id text primary key,
  user_id text not null,
  title text,
  raw_input text,
  domain text,
  status text,
  priority text,
  tags text[],
  action_plan jsonb,
  grounded_research jsonb,
  sub_ideas jsonb,
  etsy_listing jsonb,
  visual_concepts jsonb,
  design_brief jsonb,
  maturity_score integer,
  is_favorite boolean default false,
  parent_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Keywords Table
create table if not exists keywords (
  id text primary key,
  user_id text not null,
  keyword text not null,
  search_volume integer,
  search_result integer,
  conversion_rate numeric,
  uploaded_at timestamptz default now(),
  weight numeric default 1.0
);

-- 3. Pipeline Logs Table
create table if not exists pipeline_logs (
  id text primary key,
  idea_id text not null,
  user_id text not null,
  step text not null,
  status text not null,
  error text,
  created_at timestamptz default now()
);

-- 4. Seasonal Automation Log Table
create table if not exists seasonal_automation_log (
  id text primary key,
  user_id text not null,
  event_name text not null,
  triggered_at timestamptz default now()
);

-- ==========================================
-- Row Level Security (RLS)
-- ==========================================

alter table ideas enable row level security;
drop policy if exists "Kullanici kendi verisini gorur" on ideas;
create policy "Kullanici kendi verisini gorur" on ideas
  for all
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

alter table keywords enable row level security;
drop policy if exists "Kullanici kendi verisini gorur" on keywords;
create policy "Kullanici kendi verisini gorur" on keywords
  for all
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

alter table pipeline_logs enable row level security;
drop policy if exists "Kullanici kendi verisini gorur" on pipeline_logs;
create policy "Kullanici kendi verisini gorur" on pipeline_logs
  for all
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

alter table seasonal_automation_log enable row level security;
drop policy if exists "Kullanici kendi verisini gorur" on seasonal_automation_log;
create policy "Kullanici kendi verisini gorur" on seasonal_automation_log
  for all
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);
