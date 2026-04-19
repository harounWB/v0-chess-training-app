create table if not exists public.user_games (
  user_id uuid primary key references auth.users(id) on delete cascade,
  games jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  selected_game_id text,
  move_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_games enable row level security;
alter table public.user_progress enable row level security;

drop policy if exists "Users can read their own games" on public.user_games;
create policy "Users can read their own games"
on public.user_games
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own games" on public.user_games;
create policy "Users can insert their own games"
on public.user_games
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own games" on public.user_games;
create policy "Users can update their own games"
on public.user_games
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can read their own progress" on public.user_progress;
create policy "Users can read their own progress"
on public.user_progress
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own progress" on public.user_progress;
create policy "Users can insert their own progress"
on public.user_progress
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own progress" on public.user_progress;
create policy "Users can update their own progress"
on public.user_progress
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
