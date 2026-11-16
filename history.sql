-- Version history for the tracker (run once in the Supabase SQL Editor)
create table public.tracker_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.tracker_history enable row level security;
grant select, insert, delete on public.tracker_history to authenticated;
create policy "own history select" on public.tracker_history for select using (auth.uid() = user_id);
create policy "own history insert" on public.tracker_history for insert with check (auth.uid() = user_id);
create policy "own history delete" on public.tracker_history for delete using (auth.uid() = user_id);
