-- Premium Two v1.0 internal test support.
-- Public schedule remains unchanged. Level 30 is test-only.

alter table public.bcks_substansi_attempts
  drop constraint if exists bcks_substansi_attempts_session_level_check;
alter table public.bcks_substansi_attempts
  add constraint bcks_substansi_attempts_session_level_check
  check ((session_level between 0 and 3) or session_level=30);

alter table public.bcks_substansi_test_access
  drop constraint if exists bcks_substansi_test_access_session_level_check;
alter table public.bcks_substansi_test_access
  add constraint bcks_substansi_test_access_session_level_check
  check ((session_level between 1 and 3) or session_level=30);

alter table public.bcks_substansi_answer_keys
  drop constraint if exists bcks_substansi_answer_keys_question_no_check;

alter table public.bcks_substansi_answer_keys
  add constraint bcks_substansi_answer_keys_question_no_check
  check (
    (question_no between 1 and 70)
    or (question_no between 101 and 170)
    or (question_no between 201 and 270)
    or (question_no between 1001 and 1070)
    or (question_no between 2001 and 2070)
  );

create or replace function private.bcks_thinking_questions(level_no smallint)
returns smallint[]
language sql
immutable
set search_path to ''
as $function$
 select case level_no
 when 1 then array[101,102,103,104,105,106,107,2,4,5,6,8,9,202,115,116,117,118,119,120,121,15,17,18,19,21,22,216,129,130,131,132,133,134,135,31,32,33,34,35,37,229,143,144,145,146,147,148,149,43,44,45,46,47,243,244,157,158,159,160,161,162,163,58,60,61,62,63,257,258]::smallint[]
 when 2 then array[1001,1002,1003,1004,1005,1006,1007,1008,1009,1010,1011,1012,1013,1014,1015,1016,1017,1018,1019,1020,1021,1022,1023,1024,1025,1026,1027,1028,1029,1030,1031,1032,1033,1034,1035,1036,1037,1038,1039,1040,1041,1042,1043,1044,1045,1046,1047,1048,1049,1050,1051,1052,1053,1054,1055,1056,1057,1058,1059,1060,1061,1062,1063,1064,1065,1066,1067,1068,1069,1070]::smallint[]
 when 3 then array[112,113,114,210,213,208,209,211,212,214,1,3,7,10,126,127,128,218,220,222,225,226,227,228,16,20,24,26,140,141,142,233,238,242,237,239,240,241,29,30,36,40,154,155,156,248,252,256,251,253,254,255,48,50,53,55,169,170,264,267,269,263,265,266,268,270,57,59,66,70]::smallint[]
 when 30 then array[2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026,2027,2028,2029,2030,2031,2032,2033,2034,2035,2036,2037,2038,2039,2040,2041,2042,2043,2044,2045,2046,2047,2048,2049,2050,2051,2052,2053,2054,2055,2056,2057,2058,2059,2060,2061,2062,2063,2064,2065,2066,2067,2068,2069,2070]::smallint[]
 else array(select generate_series(1,70)::smallint) end;
$function$;

insert into public.bcks_substansi_answer_keys
  (question_no, competency, subcompetency, correct_option)
values
  (2001, 'KEPRIBADIAN', 'integritas_keadilan', 'E'),
  (2002, 'KEPRIBADIAN', 'keputusan_berbasis_bukti', 'D'),
  (2003, 'KEPRIBADIAN', 'evaluasi_program', 'B'),
  (2004, 'KEPRIBADIAN', 'keputusan_berbasis_bukti', 'C'),
  (2005, 'KEPRIBADIAN', 'integritas_keadilan', 'B'),
  (2006, 'KEPRIBADIAN', 'evaluasi_program', 'A'),
  (2007, 'KEPRIBADIAN', 'integritas_keadilan', 'C'),
  (2008, 'KEPRIBADIAN', 'dialog_orang_tua', 'A'),
  (2009, 'KEPRIBADIAN', 'orientasi_murid', 'D'),
  (2010, 'KEPRIBADIAN', 'tindak_lanjut', 'C'),
  (2011, 'KEPRIBADIAN', 'integritas_keadilan', 'D'),
  (2012, 'KEPRIBADIAN', 'manajemen_risiko', 'E'),
  (2013, 'KEPRIBADIAN', 'manajemen_risiko', 'B'),
  (2014, 'KEPRIBADIAN', 'integritas_keadilan', 'D'),
  (2015, 'SOSIAL', 'kolaborasi_inovasi', 'A'),
  (2016, 'SOSIAL', 'dialog_orang_tua', 'C'),
  (2017, 'SOSIAL', 'analisis_akar_masalah', 'D'),
  (2018, 'SOSIAL', 'dialog_orang_tua', 'B'),
  (2019, 'SOSIAL', 'analisis_akar_masalah', 'D'),
  (2020, 'SOSIAL', 'integritas_keadilan', 'C'),
  (2021, 'SOSIAL', 'prioritas_anggaran', 'E'),
  (2022, 'SOSIAL', 'kolaborasi_inovasi', 'D'),
  (2023, 'SOSIAL', 'evaluasi_program', 'A'),
  (2024, 'SOSIAL', 'evaluasi_program', 'D'),
  (2025, 'SOSIAL', 'kolaborasi_inovasi', 'B'),
  (2026, 'SOSIAL', 'kolaborasi_inovasi', 'C'),
  (2027, 'SOSIAL', 'kolaborasi_inovasi', 'A'),
  (2028, 'SOSIAL', 'kolaborasi_inovasi', 'E'),
  (2029, 'MANAJERIAL', 'evaluasi_program', 'B'),
  (2030, 'MANAJERIAL', 'belajar_dari_kegagalan', 'D'),
  (2031, 'MANAJERIAL', 'evaluasi_program', 'E'),
  (2032, 'MANAJERIAL', 'belajar_dari_kegagalan', 'C'),
  (2033, 'MANAJERIAL', 'evaluasi_program', 'D'),
  (2034, 'MANAJERIAL', 'prioritas_anggaran', 'B'),
  (2035, 'MANAJERIAL', 'keputusan_berbasis_bukti', 'A'),
  (2036, 'MANAJERIAL', 'belajar_dari_kegagalan', 'C'),
  (2037, 'MANAJERIAL', 'evaluasi_program', 'E'),
  (2038, 'MANAJERIAL', 'keputusan_berbasis_bukti', 'B'),
  (2039, 'MANAJERIAL', 'manajemen_risiko', 'E'),
  (2040, 'MANAJERIAL', 'tindak_lanjut', 'A'),
  (2041, 'MANAJERIAL', 'keputusan_berbasis_bukti', 'C'),
  (2042, 'MANAJERIAL', 'keputusan_berbasis_bukti', 'A'),
  (2043, 'MANAJERIAL', 'keputusan_berbasis_bukti', 'E'),
  (2044, 'MANAJERIAL', 'manajemen_risiko', 'D'),
  (2045, 'MANAJERIAL', 'manajemen_risiko', 'E'),
  (2046, 'MANAJERIAL', 'orientasi_murid', 'C'),
  (2047, 'KEWIRAUSAHAAN', 'belajar_dari_kegagalan', 'A'),
  (2048, 'KEWIRAUSAHAAN', 'integritas_keadilan', 'B'),
  (2049, 'KEWIRAUSAHAAN', 'prioritas_anggaran', 'C'),
  (2050, 'KEWIRAUSAHAAN', 'keputusan_berbasis_bukti', 'B'),
  (2051, 'KEWIRAUSAHAAN', 'tata_kelola_sumber_daya', 'C'),
  (2052, 'KEWIRAUSAHAAN', 'prioritas_anggaran', 'E'),
  (2053, 'KEWIRAUSAHAAN', 'kolaborasi_inovasi', 'A'),
  (2054, 'KEWIRAUSAHAAN', 'belajar_dari_kegagalan', 'E'),
  (2055, 'SUPERVISI', 'umpan_balik_berbasis_bukti', 'D'),
  (2056, 'SUPERVISI', 'umpan_balik_berbasis_bukti', 'B'),
  (2057, 'SUPERVISI', 'tindak_lanjut', 'D'),
  (2058, 'SUPERVISI', 'evaluasi_program', 'B'),
  (2059, 'SUPERVISI', 'keputusan_berbasis_bukti', 'A'),
  (2060, 'SUPERVISI', 'keputusan_berbasis_bukti', 'E'),
  (2061, 'SUPERVISI', 'tindak_lanjut', 'A'),
  (2062, 'SUPERVISI', 'umpan_balik_berbasis_bukti', 'C'),
  (2063, 'SUPERVISI', 'analisis_akar_masalah', 'A'),
  (2064, 'SUPERVISI', 'tindak_lanjut', 'B'),
  (2065, 'SUPERVISI', 'belajar_dari_kegagalan', 'C'),
  (2066, 'SUPERVISI', 'umpan_balik_berbasis_bukti', 'E'),
  (2067, 'SUPERVISI', 'keputusan_berbasis_bukti', 'A'),
  (2068, 'SUPERVISI', 'tindak_lanjut', 'B'),
  (2069, 'SUPERVISI', 'keputusan_berbasis_bukti', 'D'),
  (2070, 'SUPERVISI', 'evaluasi_program', 'E')
on conflict(question_no) do update set
  competency=excluded.competency,
  subcompetency=excluded.subcompetency,
  correct_option=excluded.correct_option;
