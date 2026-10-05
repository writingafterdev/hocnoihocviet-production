-- Failed AI requests, for the admin page (kept 30 days). Worker CPU-limit kills can't be logged from inside the Worker.
create table "ai_error" (
  "id" integer primary key autoincrement,
  "at" integer not null,
  "userId" text,
  "route" text,
  "code" text not null,
  "detail" text
);
create index "ai_error_at" on "ai_error" ("at");
