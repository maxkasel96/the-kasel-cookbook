create table if not exists public.shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  ingredient_text text not null,
  recipe_id uuid references public.recipes (id) on delete set null,
  recipe_title text,
  is_checked boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists shopping_list_items_user_id_idx
  on public.shopping_list_items (user_id);

alter table public.shopping_list_items enable row level security;

create policy "Shopping list items are readable by owner"
  on public.shopping_list_items
  for select
  using (auth.uid() = user_id);

create policy "Shopping list items are insertable by owner"
  on public.shopping_list_items
  for insert
  with check (auth.uid() = user_id);

create policy "Shopping list items are updatable by owner"
  on public.shopping_list_items
  for update
  using (auth.uid() = user_id);

create policy "Shopping list items are deletable by owner"
  on public.shopping_list_items
  for delete
  using (auth.uid() = user_id);
