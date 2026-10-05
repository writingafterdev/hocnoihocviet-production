-- Saved phrases belong to a skill (task2 | task1 | speaking) and have a topic (assigned by the translator, editable).
alter table "vocab_custom" add column "skill" text not null default 'task2';
alter table "vocab_custom" add column "topic" text not null default 'Other Topics';
drop index "vocab_custom_en";
create unique index "vocab_custom_en" on "vocab_custom" ("userId", "skill", lower("en"));
