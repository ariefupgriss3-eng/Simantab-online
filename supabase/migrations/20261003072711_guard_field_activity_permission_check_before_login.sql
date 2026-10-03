-- The public capability check is called before login by the activity UI.
-- Anonymous calls must return false without touching the private role helper.
-- Keep the existing authenticated role and delegated staff checks unchanged.
create or replace function public.can_current_user_input_field_activity()
returns boolean
language plpgsql
stable
security invoker
set search_path = public, private, auth, pg_temp
as $function$
begin
  if auth.uid() is null then
    return false;
  end if;

  return coalesce(
    private.current_role() in ('SUPER_ADMIN','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK')
    or exists (
      select 1
      from public.team_task_assignments t
      where t.user_id = auth.uid()
        and t.capability = 'ADMIN_KEGIATAN_BIDANG'
        and t.is_active = true
    ),
    false
  );
end
$function$;
