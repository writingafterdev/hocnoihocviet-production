-- Chứng minh nhanh: every mạch ý that passed Kiểm tra, kept as an attempt (one row per pass), with the mistakes found on the
-- way (the notes of each Kiểm tra) and, when the student went on to write it, the paragraph and its review's comments.
-- Replaces drill_done (which only knew "finished"); its rows are dropped, as agreed: they carried no mạch ý to show.
drop table if exists "drill_done";
create table "drill_attempt" (
  "id" text primary key,
  "userId" text not null references "user"("id") on delete cascade,
  "statementId" text not null,
  "createdAt" integer not null,
  "steps" text not null,
  "errs" text not null,
  "paragraph" text,
  "paraErrs" text
);
create index "drill_attempt_user" on "drill_attempt" ("userId", "createdAt");
