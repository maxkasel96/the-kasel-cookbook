-- Enable RLS on publicly exposed tables and add explicit policies
-- so authenticated users can continue reading recipe/meal data.

alter table public.meals enable row level security;
alter table public.meal_recipes enable row level security;
alter table public.recipe_revisions enable row level security;
alter table public.recipe_instruction_step_ingredients enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.categories enable row level security;
alter table public.recipe_instruction_steps enable row level security;
alter table public.recipe_categories enable row level security;

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

drop policy if exists "Authenticated users can read recipe revisions" on public.recipe_revisions;
create policy "Authenticated users can read recipe revisions"
  on public.recipe_revisions
  for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can read recipe step ingredients" on public.recipe_instruction_step_ingredients;
create policy "Authenticated users can read recipe step ingredients"
  on public.recipe_instruction_step_ingredients
  for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can read recipe ingredients" on public.recipe_ingredients;
create policy "Authenticated users can read recipe ingredients"
  on public.recipe_ingredients
  for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can read categories" on public.categories;
create policy "Authenticated users can read categories"
  on public.categories
  for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can read recipe instruction steps" on public.recipe_instruction_steps;
create policy "Authenticated users can read recipe instruction steps"
  on public.recipe_instruction_steps
  for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can read recipe categories" on public.recipe_categories;
create policy "Authenticated users can read recipe categories"
  on public.recipe_categories
  for select
  to authenticated
  using (true);
