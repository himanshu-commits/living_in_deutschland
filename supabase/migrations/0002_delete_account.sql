-- Let an authenticated user delete only their own Auth account. Deleting the
-- auth.users row also removes public.progress through its ON DELETE CASCADE.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
