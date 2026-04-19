create table if not exists public.user_saved_pgn_files (
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  source text not null default 'upload',
  games jsonb,
  imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, file_name)
);

create table if not exists public.user_pgn_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  explored_games text[] not null default '{}'::text[],
  trained_games text[] not null default '{}'::text[],
  is_done boolean not null default false,
  imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, file_name)
);

create table if not exists public.user_dashboard_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  collections jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_saved_pgn_files enable row level security;
alter table public.user_pgn_progress enable row level security;
alter table public.user_dashboard_state enable row level security;

drop policy if exists "Users can read their saved pgn files" on public.user_saved_pgn_files;
create policy "Users can read their saved pgn files"
on public.user_saved_pgn_files
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their saved pgn files" on public.user_saved_pgn_files;
create policy "Users can insert their saved pgn files"
on public.user_saved_pgn_files
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their saved pgn files" on public.user_saved_pgn_files;
create policy "Users can update their saved pgn files"
on public.user_saved_pgn_files
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their saved pgn files" on public.user_saved_pgn_files;
create policy "Users can delete their saved pgn files"
on public.user_saved_pgn_files
for delete
using (auth.uid() = user_id);

drop policy if exists "Users can read their pgn progress" on public.user_pgn_progress;
create policy "Users can read their pgn progress"
on public.user_pgn_progress
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their pgn progress" on public.user_pgn_progress;
create policy "Users can insert their pgn progress"
on public.user_pgn_progress
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their pgn progress" on public.user_pgn_progress;
create policy "Users can update their pgn progress"
on public.user_pgn_progress
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their pgn progress" on public.user_pgn_progress;
create policy "Users can delete their pgn progress"
on public.user_pgn_progress
for delete
using (auth.uid() = user_id);

drop policy if exists "Users can read their dashboard state" on public.user_dashboard_state;
create policy "Users can read their dashboard state"
on public.user_dashboard_state
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their dashboard state" on public.user_dashboard_state;
create policy "Users can insert their dashboard state"
on public.user_dashboard_state
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their dashboard state" on public.user_dashboard_state;
create policy "Users can update their dashboard state"
on public.user_dashboard_state
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
