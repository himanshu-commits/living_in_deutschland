-- One row per signed-in user, holding the same shape as the local
-- AsyncStorage state (see mobile/src/storage.ts). RLS restricts every
-- row to its own owner; "Automatically expose new tables" was left off
-- when the project was created, so grants are explicit below.

create table if not exists public.progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  progress jsonb not null default '{}'::jsonb,
  marked jsonb not null default '[]'::jsonb,
  mistakes jsonb not null default '[]'::jsonb,
  last_test jsonb,
  updated_at timestamptz not null default now()
);

alter table public.progress enable row level security;

create policy "select own progress"
  on public.progress for select
  using (auth.uid() = user_id);

create policy "insert own progress"
  on public.progress for insert
  with check (auth.uid() = user_id);

create policy "update own progress"
  on public.progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on public.progress to authenticated;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger progress_set_updated_at
  before update on public.progress
  for each row execute function public.set_updated_at();
