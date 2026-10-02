drop policy if exists bcks_access_control_deny_authenticated on public.bcks_substansi_access_control;
create policy bcks_access_control_deny_authenticated
on public.bcks_substansi_access_control for select to authenticated
using (false);

drop policy if exists bcks_access_control_deny_anon on public.bcks_substansi_access_control;
create policy bcks_access_control_deny_anon
on public.bcks_substansi_access_control for select to anon
using (false);
