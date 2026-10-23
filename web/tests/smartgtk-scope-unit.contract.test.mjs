import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../../supabase/migrations/20261023132000_smartgtk_scope_from_unit_work.sql',import.meta.url),'utf8');

test('scope resolution uses verified NPSN before unique Master Sekolah name match',()=>{
 assert.match(sql,/join public\.school_master s on s\.npsn=o\.school_npsn and s\.is_active=true/);
 assert.match(sql,/match_count=1 and not exists\(select 1 from by_npsn\)/);
 assert.match(sql,/from public\.profiles p/);
 assert.match(sql,/i\.unit_work/);
 assert.match(sql,/smartgtk_school_name_key/);
});

test('unmapped workflow rows self-heal without changing roles or confirmed decisions',()=>{
 assert.match(sql,/where w\.scope='BELUM_TERPETAKAN'/);
 assert.match(sql,/in \('SD','SMP','TK_PAUD_PNF'\)/);
 assert.doesNotMatch(sql,/update public\.profiles/i);
 assert.match(sql,/create or replace function private\.smartgtk_workflow_sync/);
});

test('canonical school names handle common SDN and SMP 01 abbreviation variants',()=>{
 assert.match(sql,/SDN /);
 assert.match(sql,/SMPN /);
 assert.match(sql,/\[1-9\]\[0-9\]\*/);
});
