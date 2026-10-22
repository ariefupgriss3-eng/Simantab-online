-- Dedicated holding tables for PPPK and PPPK_PW, separate from PNS three-track screening.
-- No removal of original smartgtk_intake, educational records, documents, or audit.
CREATE TABLE IF NOT EXISTS private.smartgtk_pppk_buffer (
 owner_id uuid PRIMARY KEY,
 nip text NOT NULL DEFAULT '',
 full_name text NOT NULL,
 unit_work text NOT NULL,
 profession text NOT NULL,
 education text NOT NULL,
 data_stage text NOT NULL,
 source_snapshot jsonb NOT NULL,
 source_updated_at timestamptz NOT NULL,
 is_current boolean NOT NULL DEFAULT true,
 inactive_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS private.smartgtk_pppk_pw_buffer (
 LIKE private.smartgtk_pppk_buffer INCLUDING ALL
);
ALTER TABLE private.smartgtk_pppk_buffer ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.smartgtk_pppk_pw_buffer ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.smartgtk_pppk_buffer,private.smartgtk_pppk_pw_buffer FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION private.smartgtk_contract_buffer_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $fn$
BEGIN
 IF TG_OP='DELETE' THEN
  UPDATE private.smartgtk_pppk_buffer SET is_current=false,inactive_at=now(),updated_at=now() WHERE owner_id=OLD.owner_id AND is_current=true;
  UPDATE private.smartgtk_pppk_pw_buffer SET is_current=false,inactive_at=now(),updated_at=now() WHERE owner_id=OLD.owner_id AND is_current=true;
  RETURN OLD;
 END IF;

 IF NEW.employment IS DISTINCT FROM 'PPPK' THEN
  UPDATE private.smartgtk_pppk_buffer SET is_current=false,inactive_at=now(),updated_at=now() WHERE owner_id=NEW.owner_id AND is_current=true;
 END IF;
 IF NEW.employment IS DISTINCT FROM 'PPPK_PW' THEN
  UPDATE private.smartgtk_pppk_pw_buffer SET is_current=false,inactive_at=now(),updated_at=now() WHERE owner_id=NEW.owner_id AND is_current=true;
 END IF;
 IF NEW.employment='PPPK' THEN
  INSERT INTO private.smartgtk_pppk_buffer(
    owner_id,nip,full_name,unit_work,profession,education,data_stage,source_snapshot,source_updated_at,is_current,inactive_at
  ) VALUES (
    NEW.owner_id,NEW.nip,NEW.full_name,NEW.unit_work,NEW.profession,NEW.education,
    NEW.data_stage,to_jsonb(NEW),NEW.updated_at,true,NULL
  )
  ON CONFLICT(owner_id) DO UPDATE SET
    nip=EXCLUDED.nip,full_name=EXCLUDED.full_name,unit_work=EXCLUDED.unit_work,
    profession=EXCLUDED.profession,education=EXCLUDED.education,data_stage=EXCLUDED.data_stage,
    source_snapshot=EXCLUDED.source_snapshot,source_updated_at=EXCLUDED.source_updated_at,
    is_current=true,inactive_at=NULL,updated_at=now();
 ELSIF NEW.employment='PPPK_PW' THEN
  INSERT INTO private.smartgtk_pppk_pw_buffer(
    owner_id,nip,full_name,unit_work,profession,education,data_stage,source_snapshot,source_updated_at,is_current,inactive_at
  ) VALUES (
    NEW.owner_id,NEW.nip,NEW.full_name,NEW.unit_work,NEW.profession,NEW.education,
    NEW.data_stage,to_jsonb(NEW),NEW.updated_at,true,NULL
  )
  ON CONFLICT(owner_id) DO UPDATE SET
    nip=EXCLUDED.nip,full_name=EXCLUDED.full_name,unit_work=EXCLUDED.unit_work,
    profession=EXCLUDED.profession,education=EXCLUDED.education,data_stage=EXCLUDED.data_stage,
    source_snapshot=EXCLUDED.source_snapshot,source_updated_at=EXCLUDED.source_updated_at,
    is_current=true,inactive_at=NULL,updated_at=now();
 END IF;
 RETURN NEW;
END;
$fn$;
REVOKE ALL ON FUNCTION private.smartgtk_contract_buffer_sync() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS trg_smartgtk_contract_buffer_sync ON public.smartgtk_intake;
CREATE TRIGGER trg_smartgtk_contract_buffer_sync
AFTER INSERT OR UPDATE OR DELETE ON public.smartgtk_intake
FOR EACH ROW EXECUTE FUNCTION private.smartgtk_contract_buffer_sync();

-- Backfill current PPPK/PPPK-PW reports without changing original intake states.
INSERT INTO private.smartgtk_pppk_buffer(owner_id,nip,full_name,unit_work,profession,education,data_stage,source_snapshot,source_updated_at)
SELECT owner_id,nip,full_name,unit_work,profession,education,data_stage,to_jsonb(i),updated_at
FROM public.smartgtk_intake i WHERE i.employment='PPPK'
ON CONFLICT(owner_id) DO UPDATE SET
 nip=EXCLUDED.nip,full_name=EXCLUDED.full_name,unit_work=EXCLUDED.unit_work,
 profession=EXCLUDED.profession,education=EXCLUDED.education,data_stage=EXCLUDED.data_stage,
 source_snapshot=EXCLUDED.source_snapshot,source_updated_at=EXCLUDED.source_updated_at,
 is_current=true,inactive_at=NULL,updated_at=now();
INSERT INTO private.smartgtk_pppk_pw_buffer(owner_id,nip,full_name,unit_work,profession,education,data_stage,source_snapshot,source_updated_at)
SELECT owner_id,nip,full_name,unit_work,profession,education,data_stage,to_jsonb(i),updated_at
FROM public.smartgtk_intake i WHERE i.employment='PPPK_PW'
ON CONFLICT(owner_id) DO UPDATE SET
 nip=EXCLUDED.nip,full_name=EXCLUDED.full_name,unit_work=EXCLUDED.unit_work,
 profession=EXCLUDED.profession,education=EXCLUDED.education,data_stage=EXCLUDED.data_stage,
 source_snapshot=EXCLUDED.source_snapshot,source_updated_at=EXCLUDED.source_updated_at,
 is_current=true,inactive_at=NULL,updated_at=now();

CREATE OR REPLACE FUNCTION public.smartgtk_contract_buffer_list(
 p_jenis text, p_page integer DEFAULT 0
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO '' AS $fn$
DECLARE a public.profiles%ROWTYPE;v_count integer;v_items jsonb;v_scope text;
BEGIN
 SELECT * INTO a FROM public.profiles WHERE id=auth.uid()
 AND account_channel='DINAS' AND is_active=true AND approval_status='APPROVED'
 AND role IN ('KABID','SUPER_ADMIN','KASI_SD','KASI_SMP','SUBKOOR_TK');
 IF NOT FOUND THEN RAISE EXCEPTION 'Tidak berwenang melihat tampungan PPPK'; END IF;
 IF p_jenis NOT IN ('PPPK','PPPK_PW') OR p_jenis IS NULL THEN RAISE EXCEPTION 'Jenis tampungan tidak valid'; END IF;
 IF p_page IS NULL OR p_page NOT BETWEEN 0 AND 10000 THEN RAISE EXCEPTION 'Halaman tidak valid'; END IF;
 v_scope:=CASE a.role WHEN 'KASI_SD' THEN 'SD' WHEN 'KASI_SMP' THEN 'SMP'
  WHEN 'SUBKOOR_TK' THEN 'TK_PAUD_PNF' ELSE NULL END;
 IF p_jenis='PPPK' THEN
  WITH allowed AS (
    SELECT b.owner_id,b.nip,b.full_name,b.unit_work,b.profession,b.education,b.data_stage,
      b.source_updated_at,private.smartgtk_scope_for_owner(b.owner_id) AS scope
    FROM private.smartgtk_pppk_buffer b
    JOIN public.profiles p ON p.id=b.owner_id AND p.is_active=true AND p.approval_status='APPROVED'
    WHERE b.is_current AND (v_scope IS NULL OR private.smartgtk_scope_for_owner(b.owner_id)=v_scope)
  ), total AS (SELECT count(*)::integer AS n FROM allowed),
  paged AS (SELECT * FROM allowed ORDER BY source_updated_at DESC,owner_id LIMIT 50 OFFSET p_page::bigint*50)
  SELECT (SELECT n FROM total), COALESCE((SELECT jsonb_agg(to_jsonb(paged)) FROM paged),'[]'::jsonb)
  INTO v_count,v_items;
 ELSE
  WITH allowed AS (
    SELECT b.owner_id,b.nip,b.full_name,b.unit_work,b.profession,b.education,b.data_stage,
      b.source_updated_at,private.smartgtk_scope_for_owner(b.owner_id) AS scope
    FROM private.smartgtk_pppk_pw_buffer b
    JOIN public.profiles p ON p.id=b.owner_id AND p.is_active=true AND p.approval_status='APPROVED'
    WHERE b.is_current AND (v_scope IS NULL OR private.smartgtk_scope_for_owner(b.owner_id)=v_scope)
  ), total AS (SELECT count(*)::integer AS n FROM allowed),
  paged AS (SELECT * FROM allowed ORDER BY source_updated_at DESC,owner_id LIMIT 50 OFFSET p_page::bigint*50)
  SELECT (SELECT n FROM total), COALESCE((SELECT jsonb_agg(to_jsonb(paged)) FROM paged),'[]'::jsonb)
  INTO v_count,v_items;
 END IF;
 RETURN jsonb_build_object('employment',p_jenis,'page',p_page,'total',v_count,
   'items',v_items,'read_only',true,'eligible_for_pns_three_tracks',false,
   'notice','Tampungan administrasi PPPK/PPPK PW terpisah; bukan daftar usulan/analisis JF atau S-1/D-IV bagi PNS.');
END;
$fn$;
REVOKE ALL ON FUNCTION public.smartgtk_contract_buffer_list(text,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.smartgtk_contract_buffer_list(text,integer) TO authenticated;
