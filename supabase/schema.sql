-- Axon Supabase schema
-- Run this entire file in the Supabase SQL Editor (Dashboard → SQL → New query).

-- ---------------------------------------------------------------------------
-- Helper: updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles (onboarding + display)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  onboarding_seen jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Generic entity tables (payload JSONB mirrors localStorage shapes)
--
-- Primary key is (user_id, id), NOT id alone: entity ids are generated in the
-- browser and are only unique per user (e.g. every fresh install seeds the
-- same mock objective ids). A global id PK would let the first account "own"
-- an id and break every other account's sync with duplicate-key errors.
-- ---------------------------------------------------------------------------
create table if not exists public.objectives (
  id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, id)
);

create table if not exists public.flashcard_folders (
  id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, id)
);

create table if not exists public.flashcard_sets (
  id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, id)
);

create table if not exists public.pomodoro_sessions (
  id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, id)
);

create table if not exists public.pomodoro_timers (
  id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, id)
);

create table if not exists public.goals (
  id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, id)
);

create table if not exists public.goal_history (
  id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, id)
);

create table if not exists public.notifications (
  id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, id)
);

-- Migration for projects created with the old schema (id was the sole PK).
-- Rewrites each table's primary key to (user_id, id). Safe to re-run.
do $$
declare
  t text;
  pk_cols text;
begin
  foreach t in array array[
    'objectives',
    'flashcard_folders',
    'flashcard_sets',
    'pomodoro_sessions',
    'pomodoro_timers',
    'goals',
    'goal_history',
    'notifications'
  ]
  loop
    select string_agg(a.attname, ',' order by array_position(i.indkey, a.attnum))
      into pk_cols
      from pg_index i
      join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any(i.indkey)
     where i.indrelid = format('public.%I', t)::regclass
       and i.indisprimary;

    if pk_cols is distinct from 'user_id,id' then
      execute format('alter table public.%I drop constraint if exists %I', t, t || '_pkey');
      execute format('alter table public.%I add primary key (user_id, id)', t);
    end if;

    -- Old single-column-PK schema also created a separate user_id index,
    -- now redundant because the composite PK leads with user_id.
    execute format('drop index if exists public.%I', t || '_user_id_idx');
  end loop;
end $$;

-- Singleton-style rows (one per user)
create table if not exists public.progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.goals_meta (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

-- ---------------------------------------------------------------------------
-- RLS for every entity table
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'objectives',
    'flashcard_folders',
    'flashcard_sets',
    'pomodoro_sessions',
    'pomodoro_timers',
    'goals',
    'goal_history',
    'notifications'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_select_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_update_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete_own', t);
    execute format(
      'create policy %I on public.%I for select using (auth.uid() = user_id)',
      t || '_select_own', t
    );
    execute format(
      'create policy %I on public.%I for insert with check (auth.uid() = user_id)',
      t || '_insert_own', t
    );
    execute format(
      'create policy %I on public.%I for update using (auth.uid() = user_id)',
      t || '_update_own', t
    );
    execute format(
      'create policy %I on public.%I for delete using (auth.uid() = user_id)',
      t || '_delete_own', t
    );
  end loop;
end $$;

alter table public.progress enable row level security;
drop policy if exists progress_select_own on public.progress;
drop policy if exists progress_insert_own on public.progress;
drop policy if exists progress_update_own on public.progress;
drop policy if exists progress_delete_own on public.progress;
create policy progress_select_own on public.progress for select using (auth.uid() = user_id);
create policy progress_insert_own on public.progress for insert with check (auth.uid() = user_id);
create policy progress_update_own on public.progress for update using (auth.uid() = user_id);
create policy progress_delete_own on public.progress for delete using (auth.uid() = user_id);

alter table public.goals_meta enable row level security;
drop policy if exists goals_meta_select_own on public.goals_meta;
drop policy if exists goals_meta_insert_own on public.goals_meta;
drop policy if exists goals_meta_update_own on public.goals_meta;
drop policy if exists goals_meta_delete_own on public.goals_meta;
create policy goals_meta_select_own on public.goals_meta for select using (auth.uid() = user_id);
create policy goals_meta_insert_own on public.goals_meta for insert with check (auth.uid() = user_id);
create policy goals_meta_update_own on public.goals_meta for update using (auth.uid() = user_id);
create policy goals_meta_delete_own on public.goals_meta for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Storage bucket for flashcard folder images
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('flashcard-images', 'flashcard-images', true)
on conflict (id) do nothing;

drop policy if exists "flashcard_images_select" on storage.objects;
drop policy if exists "flashcard_images_insert" on storage.objects;
drop policy if exists "flashcard_images_update" on storage.objects;
drop policy if exists "flashcard_images_delete" on storage.objects;

create policy "flashcard_images_select" on storage.objects
  for select using (bucket_id = 'flashcard-images');

create policy "flashcard_images_insert" on storage.objects
  for insert with check (
    bucket_id = 'flashcard-images' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "flashcard_images_update" on storage.objects
  for update using (
    bucket_id = 'flashcard-images' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "flashcard_images_delete" on storage.objects
  for delete using (
    bucket_id = 'flashcard-images' and auth.uid()::text = (storage.foldername(name))[1]
  );
