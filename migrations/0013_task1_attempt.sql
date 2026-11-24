-- Task 1 (charts): one student's work on one prompt (findings, paragraphs, essay, review). Kept apart from Task 2 attempts.
create table "task1_attempt" (
  "id" text primary key,
  "userId" text not null,
  "promptId" text not null,
  "data" text not null,
  "createdAt" integer not null,
  "updatedAt" integer not null
);
create index "task1_attempt_user" on "task1_attempt" ("userId", "updatedAt");
