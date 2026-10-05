-- One use of the daily allowance that covers several AI requests (an essay review = scores + one call per
-- criterion, sent by the browser as separate requests). "used" lists the parts already claimed.
create table "ai_ticket" (
  "id" text not null primary key,
  "userId" text not null references "user"("id") on delete cascade,
  "day" text not null,
  "kind" text not null,
  "created" integer not null,
  "used" text not null default ''
);
create index "ai_ticket_created" on "ai_ticket" ("created");
