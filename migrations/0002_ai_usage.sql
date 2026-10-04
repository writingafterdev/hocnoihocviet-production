-- Per-user daily AI usage (Vietnam calendar day), for limits and cost tracking.
create table "ai_usage" (
  "userId" text not null references "user"("id") on delete cascade,
  "day" text not null,
  "kind" text not null,
  "count" integer not null default 0,
  "inputTokens" integer not null default 0,
  "outputTokens" integer not null default 0,
  primary key ("userId", "day", "kind")
);
