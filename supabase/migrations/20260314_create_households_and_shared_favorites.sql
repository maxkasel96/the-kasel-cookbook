create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table if not exists public.household_favorites (
  household_id uuid not null references public.households(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  added_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (household_id, recipe_id)
);

create index if not exists household_members_user_id_idx
  on public.household_members (user_id);

create index if not exists household_favorites_household_id_idx
  on public.household_favorites (household_id);

create or replace function public.set_households_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.ensure_household_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.household_members (household_id, user_id, role)
  values (new.id, new.created_by, 'owner')
  on conflict (household_id, user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_households_updated_at on public.households;
create trigger trg_households_updated_at
before update on public.households
for each row
execute function public.set_households_updated_at();

drop trigger if exists trg_household_members_updated_at on public.household_members;
create trigger trg_household_members_updated_at
before update on public.household_members
for each row
execute function public.set_households_updated_at();

drop trigger if exists trg_household_owner_membership on public.households;
create trigger trg_household_owner_membership
after insert on public.households
for each row
execute function public.ensure_household_owner_membership();

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_favorites enable row level security;

create policy "Household members can view households"
on public.households
for select
to authenticated
using (
  exists (
    select 1
    from public.household_members hm
    where hm.household_id = households.id
      and hm.user_id = auth.uid()
  )
);

create policy "Authenticated users can create households"
on public.households
for insert
to authenticated
with check (created_by = auth.uid());

create policy "Household owners can update households"
on public.households
for update
to authenticated
using (
  exists (
    select 1
    from public.household_members hm
    where hm.household_id = households.id
      and hm.user_id = auth.uid()
      and hm.role = 'owner'
  )
)
with check (
  exists (
    select 1
    from public.household_members hm
    where hm.household_id = households.id
      and hm.user_id = auth.uid()
      and hm.role = 'owner'
  )
);

create policy "Household members can view members"
on public.household_members
for select
to authenticated
using (
  exists (
    select 1
    from public.household_members hm
    where hm.household_id = household_members.household_id
      and hm.user_id = auth.uid()
  )
);

create policy "Household owners and admins can add members"
on public.household_members
for insert
to authenticated
with check (
  exists (
    select 1
    from public.household_members hm
    where hm.household_id = household_members.household_id
      and hm.user_id = auth.uid()
      and hm.role in ('owner', 'admin')
  )
);

create policy "Household owners and admins can update members"
on public.household_members
for update
to authenticated
using (
  exists (
    select 1
    from public.household_members hm
    where hm.household_id = household_members.household_id
      and hm.user_id = auth.uid()
      and hm.role in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.household_members hm
    where hm.household_id = household_members.household_id
      and hm.user_id = auth.uid()
      and hm.role in ('owner', 'admin')
  )
);

create policy "Household owners and admins can delete members"
on public.household_members
for delete
to authenticated
using (
  exists (
    select 1
    from public.household_members hm
    where hm.household_id = household_members.household_id
      and hm.user_id = auth.uid()
      and hm.role in ('owner', 'admin')
  )
);

create policy "Household members can view household favorites"
on public.household_favorites
for select
to authenticated
using (
  exists (
    select 1
    from public.household_members hm
    where hm.household_id = household_favorites.household_id
      and hm.user_id = auth.uid()
  )
);

create policy "Household members can add household favorites"
on public.household_favorites
for insert
to authenticated
with check (
  exists (
    select 1
    from public.household_members hm
    where hm.household_id = household_favorites.household_id
      and hm.user_id = auth.uid()
  )
  and added_by = auth.uid()
);

create policy "Household members can remove household favorites"
on public.household_favorites
for delete
to authenticated
using (
  exists (
    select 1
    from public.household_members hm
    where hm.household_id = household_favorites.household_id
      and hm.user_id = auth.uid()
  )
);
