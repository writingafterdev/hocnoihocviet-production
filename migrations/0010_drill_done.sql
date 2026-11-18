-- Chứng minh nhanh: the statements a student has finished (mạch ý passed Kiểm tra), for the library's ticks and filter.
create table "drill_done" (
  "userId" text not null references "user"("id") on delete cascade,
  "statementId" text not null,
  "doneAt" integer not null,
  primary key ("userId", "statementId")
);
