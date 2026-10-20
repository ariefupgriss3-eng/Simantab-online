-- JF Guru 2026 security hardening. Additive migration, no data rewrite.
-- Backend guard: DINAS accounts may monitor and transition cases only, not create/submit applicant cases.
-- Check channel via authenticated session in security-definer RPC context.
create or replace function private.jf2026_applicant_channel_guard()
returns trigger language plpgsql security definer set search_path=''
as $$
declare v_channel text;
begin
  if tg_op='INSERT' or (
    tg_op='UPDATE'
    and old.owner_id=auth.uid()
    and old.status in ('DRAFT','PERBAIKAN')
    and new.status in ('DRAFT','PERBAIKAN','SUBMITTED')
  ) then
    select prof.account_channel into v_channel
    from public.profiles prof
    where prof.id=auth.uid() and prof.is_active=true and prof.approval_status='APPROVED';
    if v_channel is distinct from 'GTK' then
      raise exception 'Hanya akun GTK yang dapat mengajukan JF Guru 2026';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists jf2026_applicant_channel_guard on public.jf2026_cases;
create trigger jf2026_applicant_channel_guard
before insert or update on public.jf2026_cases
for each row execute function private.jf2026_applicant_channel_guard();
