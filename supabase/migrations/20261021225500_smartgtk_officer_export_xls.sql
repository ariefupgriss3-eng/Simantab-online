-- SMART-GTK officer Excel recap: read-only roster with restrictive school-level scope.
-- Includes PENDING identities for internal follow-up but not as eligible completed GTK.
-- No direct grants to the audit table; the signed-in caller is audited by a SECURITY DEFINER RPC.
create table if not exists public.smartgtk_export_audit (
  id bigint generated always as identity primary key,
  officer_id uuid not null references public.profiles(id),
  officer_role text not null,
  export_scope text not null,
  row_count integer not null check(row_count between 0 and 65000),
  exported_at timestamptz not null default now()
);
alter table public.smartgtk_export_audit enable row level security;
revoke all on public.smartgtk_export_audit from PUBLIC, anon, authenticated;
grant select on public.smartgtk_export_audit to service_role;

create or replace function public.smartgtk_officer_export_data()
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_caller public.profiles%rowtype;
  v_scope text;
  v_rows jsonb;
  v_total integer;
  v_submitted integer;
  v_pending integer;
begin
  if auth.uid() is null or auth.role() <> 'authenticated' then
    raise exception 'Akses memerlukan login yang sah' using errcode='42501';
  end if;

  select * into v_caller
  from public.profiles
  where id = auth.uid() and account_channel = 'DINAS'
    and approval_status = 'APPROVED' and is_active is true
    and role in ('SUPER_ADMIN','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK');
  if not found then
    raise exception 'Akun tidak berwenang mengunduh rekap SMART-GTK' using errcode='42501';
  end if;

  v_scope := case v_caller.role
    when 'KASI_SD' then 'SD'
    when 'KASI_SMP' then 'SMP'
    when 'SUBKOOR_TK' then 'TK'
    else 'SEMUA_JENJANG'
  end;

  with nip_counts as (
    select regexp_replace(coalesce(nip,''),'[^0-9]','','g') as nip_key,
           count(*) as use_count
    from public.profiles
    where length(regexp_replace(coalesce(nip,''),'[^0-9]','','g'))=18
    group by 1
  ),
  rows_base as (
    select p.full_name as nama, coalesce(p.nip,'') as nip,
           coalesce(nullif(btrim(p.unit_gtk),''),nullif(btrim(p.unit),''),'') as unit_kerja,
           coalesce(p.school_npsn,'') as npsn,
           coalesce(m.bentuk_pendidikan,'BELUM_TERPETAKAN') as jenjang,
           coalesce(m.kecamatan,'') as kecamatan,
           p.role as peran_akun,
           p.approval_status as status_akun,
           p.is_active as akun_aktif,
           coalesce(s.profession,'') as profesi_dilaporkan,
           coalesce(s.employment,'') as status_kepegawaian,
           coalesce(s.education,q.education_initial,'') as pendidikan_terakhir,
           coalesce(s.study_status,q.study_status,'') as status_pendidikan,
           coalesce(s.jf_sk,'') as kepemilikan_sk_jf,
           coalesce(s.nomenclature_updated,'') as nomenklatur_disampaikan,
           coalesce(s.pns_jf_formation,'') as formasi_pns_jf,
           coalesce(s.data_stage,'BELUM_MENGISI') as status_pengisian,
           coalesce(doc.jumlah,0) as dokumen_tercatat,
           case when coalesce(nc.use_count,0)>1 then 'YA' else 'TIDAK' end as indikasi_nip_ganda,
           case when length(regexp_replace(coalesce(p.nip,''),'[^0-9]','','g'))=18 then 'YA' else 'TIDAK' end as nip_18_digit,
           case when coalesce(nullif(btrim(p.unit_gtk),''),nullif(btrim(p.unit),''),'')='' then 'TIDAK' else 'YA' end as unit_kerja_terisi,
           coalesce(s.updated_at,p.updated_at,p.created_at) as diperbarui_pada,
           case when s.owner_id is not null then
             public.smartgtk_mass_classify(s.profession,s.employment,s.jf_sk,
               s.nomenclature_updated,s.pns_jf_formation,s.education,s.old_position)
             else null end as analisis,
           s.owner_id is not null as smartgtk_sudah_diisi
    from public.profiles p
    left join public.school_master m on m.npsn=p.school_npsn
    left join public.smartgtk_intake s on s.owner_id=p.id
    left join public.jf2030_qualification q on q.owner_id=p.id
    left join nip_counts nc on nc.nip_key=regexp_replace(coalesce(p.nip,''),'[^0-9]','','g')
         and length(nc.nip_key)=18
    left join (
      select owner_id,count(*)::integer as jumlah
      from public.smartgtk_documents group by owner_id
    ) doc on doc.owner_id=p.id
    where p.account_channel='GTK'
      and p.role in ('GTK','KEPALA_SEKOLAH')
      and (p.approval_status='PENDING' or
           (p.approval_status='APPROVED' and p.is_active is true))
      and (v_scope='SEMUA_JENJANG' or m.bentuk_pendidikan=v_scope)
  ),
  report as (
    select b.nama,b.nip,b.unit_kerja,b.npsn,b.jenjang,b.kecamatan,
           b.peran_akun,b.status_akun,b.akun_aktif,b.profesi_dilaporkan,
           b.status_kepegawaian,b.pendidikan_terakhir,b.status_pendidikan,
           b.kepemilikan_sk_jf,b.nomenklatur_disampaikan,b.formasi_pns_jf,
           coalesce(b.analisis->>'nomenklatur','BELUM_MENGISI') as skrining_penyesuaian,
           coalesce(b.analisis->>'pengangkatan','BELUM_MENGISI') as skrining_pengangkatan,
           coalesce(b.analisis->>'kualifikasi','BELUM_MENGISI') as skrining_kualifikasi,
           b.status_pengisian,b.dokumen_tercatat,b.indikasi_nip_ganda,
           b.nip_18_digit,b.unit_kerja_terisi,b.diperbarui_pada,
           b.smartgtk_sudah_diisi
    from rows_base b
  )
  select coalesce(jsonb_agg(to_jsonb(r) order by r.jenjang,r.unit_kerja,r.nama),'[]'::jsonb),
         count(*)::integer,
         count(*) filter(where status_akun='APPROVED' and smartgtk_sudah_diisi)::integer,
         count(*) filter(where status_akun='PENDING')::integer
    into v_rows,v_total,v_submitted,v_pending
  from report r;

  if v_total > 60000 then
    raise exception 'Rekap melebihi batas aman Excel XLS; gunakan ekspor tersegmentasi';
  end if;

  insert into public.smartgtk_export_audit(officer_id,officer_role,export_scope,row_count)
  values(v_caller.id,v_caller.role,v_scope,v_total);

  return jsonb_build_object(
    'scope',v_scope,
    'role',v_caller.role,
    'generated_at',now(),
    'row_count',v_total,
    'submitted',v_submitted,
    'pending',v_pending,
    'rows',v_rows,
    'notice','Ini rekap akun SIMANTAB, bukan sensus semua GTK. Akun tanpa NPSN sekolah yang dapat dipetakan tidak masuk ekspor per jenjang. Skrining bukan verifikasi atau SK.'
  );
end;
$$;
revoke all on function public.smartgtk_officer_export_data() from PUBLIC,anon;
grant execute on function public.smartgtk_officer_export_data() to authenticated;
comment on function public.smartgtk_officer_export_data() is
'Authorized DINAS roster + SMART-GTK classification for XLS export; school NPSN scope for Kasi and Subkoor; audited.';
