-- Expand to three distinct 70-item packages; answer-key values remain private.
alter table public.bcks_substansi_answer_keys drop constraint bcks_substansi_answer_keys_question_no_check;
alter table public.bcks_substansi_answer_keys add constraint bcks_substansi_answer_keys_question_no_check check(question_no between 1 and 70 or question_no between 101 and 170 or question_no between 201 and 270);
alter table public.bcks_substansi_answers drop constraint bcks_substansi_answers_question_no_check;
alter table public.bcks_substansi_answers add constraint bcks_substansi_answers_question_no_check check(question_no between 1 and 70 or question_no between 101 and 170 or question_no between 201 and 270);
create or replace function private.bcks_thinking_questions(level_no smallint)
returns smallint[] language sql immutable security invoker set search_path='' as $$
 select array(select generate_series(case level_no when 1 then 101 when 3 then 201 else 1 end,case level_no when 1 then 170 when 3 then 270 else 70 end)::smallint);
$$;
alter table public.bcks_substansi_attempts drop constraint bcks_substansi_attempt_shape;
alter table public.bcks_substansi_attempts add constraint bcks_substansi_attempt_shape check(
 (mode='SIMULASI' and target_competency is null and total_questions=70)
 or (mode='COACH' and target_competency in ('KEPRIBADIAN','SOSIAL','MANAJERIAL','KEWIRAUSAHAAN','SUPERVISI') and total_questions=10));
