-- Hotfix: allow Premium Two question numbers in participant answer rows.
-- Root cause of Level 30 "internal question NaN": the attempt/package was created,
-- but answer-row inserts for 2001-2070 were rejected by this table constraint.

alter table public.bcks_substansi_answers
  drop constraint if exists bcks_substansi_answers_question_no_check;

alter table public.bcks_substansi_answers
  add constraint bcks_substansi_answers_question_no_check
  check (
    (question_no between 1 and 70)
    or (question_no between 101 and 170)
    or (question_no between 201 and 270)
    or (question_no between 1001 and 1070)
    or (question_no between 2001 and 2070)
  );
