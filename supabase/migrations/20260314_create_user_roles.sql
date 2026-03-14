create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create or replace function public.set_user_roles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_roles_updated_at on public.user_roles;
create trigger trg_user_roles_updated_at
before update on public.user_roles
for each row
execute function public.set_user_roles_updated_at();

alter table public.user_roles enable row level security;

create policy "Authenticated users can view user roles"
on public.user_roles
for select
to authenticated
using (true);

create policy "Only service role can write user roles"
on public.user_roles
for all
to authenticated
using (false)
with check (false);
