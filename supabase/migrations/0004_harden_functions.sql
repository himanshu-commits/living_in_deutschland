-- Close two advisor warnings from the initial schema:
-- 1) set_updated_at had no fixed search_path (mutable search_path risk).
-- 2) delete_own_account was implicitly callable by anon via default privileges
--    on functions in public, even though it was revoked from PUBLIC.
alter function public.set_updated_at() set search_path = '';

revoke execute on function public.delete_own_account() from anon;
