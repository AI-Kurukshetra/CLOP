begin;

create or replace function public.is_staff_user()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role in ('officer','admin')
  );
$$;

grant execute on function public.is_staff_user() to authenticated;

drop policy if exists "officers_view_all_profiles" on public.profiles;
create policy "officers_view_all_profiles" on public.profiles
  for select using (public.is_staff_user());

drop policy if exists "borrowers_own_applications" on public.loan_applications;
create policy "borrowers_own_applications" on public.loan_applications
  for all using (
    auth.uid() = borrower_id or
    public.is_staff_user()
  );

drop policy if exists "documents_access" on public.documents;
create policy "documents_access" on public.documents
  for all using (
    auth.uid() = borrower_id or
    public.is_staff_user()
  );

drop policy if exists "officers_read_audit" on public.audit_logs;
create policy "officers_read_audit" on public.audit_logs
  for select using (public.is_staff_user());

commit;
