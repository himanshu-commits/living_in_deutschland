-- Server-owned purchase entitlements. The mobile client may read its own row
-- but can never grant, modify, or revoke Premium. A later RevenueCat webhook
-- will write these rows with the service-role key.
create table if not exists public.entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  entitlement text not null default 'premium' check (entitlement = 'premium'),
  active boolean not null default false,
  product_id text,
  store text check (store in ('app_store', 'play_store', 'promotional', 'test')),
  purchased_at timestamptz,
  last_verified_at timestamptz not null default now()
);

alter table public.entitlements enable row level security;

drop policy if exists "select own entitlement" on public.entitlements;
create policy "select own entitlement"
  on public.entitlements for select
  using (auth.uid() = user_id);

revoke all on public.entitlements from anon, authenticated;
grant select on public.entitlements to authenticated;
