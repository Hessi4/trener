-- Run this migration in the Supabase SQL editor after confirming that all four
-- tables use a UUID `user_id` column populated with auth.users.id.

alter table public.plany enable row level security;
alter table public.treningi enable row level security;
alter table public.posilki enable row level security;
alter table public.pomiary enable row level security;

drop policy if exists "Users manage own plans" on public.plany;
create policy "Users manage own plans" on public.plany
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own workouts" on public.treningi;
create policy "Users manage own workouts" on public.treningi
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own meals" on public.posilki;
create policy "Users manage own meals" on public.posilki
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own measurements" on public.pomiary;
create policy "Users manage own measurements" on public.pomiary
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
