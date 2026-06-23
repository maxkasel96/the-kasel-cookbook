-- Repair the meal policies with a unique migration version.
--
-- The original policy migration shares its 20260314 version prefix with
-- other migrations, so it may not have been applied to every remote database.

alter table public.meals enable row level security;
alter table public.meal_recipes enable row level security;

drop policy if exists "Authenticated users can read meals" on public.meals;
create policy "Authenticated users can read meals"
  on public.meals
  for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can create meals" on public.meals;
create policy "Authenticated users can create meals"
  on public.meals
  for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated users can update meals" on public.meals;
create policy "Authenticated users can update meals"
  on public.meals
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated users can delete meals" on public.meals;
create policy "Authenticated users can delete meals"
  on public.meals
  for delete
  to authenticated
  using (true);

drop policy if exists "Authenticated users can read meal recipes" on public.meal_recipes;
create policy "Authenticated users can read meal recipes"
  on public.meal_recipes
  for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can create meal recipes" on public.meal_recipes;
create policy "Authenticated users can create meal recipes"
  on public.meal_recipes
  for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated users can update meal recipes" on public.meal_recipes;
create policy "Authenticated users can update meal recipes"
  on public.meal_recipes
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated users can delete meal recipes" on public.meal_recipes;
create policy "Authenticated users can delete meal recipes"
  on public.meal_recipes
  for delete
  to authenticated
  using (true);
