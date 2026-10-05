-- Per-student vocab progress: bookmarked phrases and how many practice paragraphs used each phrase.
create table "vocab_progress" (
  "userId" text not null references "user"("id") on delete cascade,
  "phrase" text not null,
  "saved" integer not null default 0,
  "practiced" integer not null default 0,
  "updatedAt" integer not null,
  primary key ("userId", "phrase")
);
