-- Phrases a student saved from the translator ("Dịch"): their own word book, separate from the vocab sets.
create table "vocab_custom" (
  "userId" text not null references "user"("id") on delete cascade,
  "id" text not null,
  "en" text not null,
  "vi" text not null,
  "createdAt" integer not null,
  primary key ("userId", "id")
);
create unique index "vocab_custom_en" on "vocab_custom" ("userId", lower("en"));
