-- Viết có hướng dẫn · Chọn hướng bài: the wording of each prompt's direction cards (what each mạch ý does, in the prompt's
-- own words), written once by the AI and shared by every student.
create table "direction_wording" (
  "promptId" text primary key,
  "data" text not null,
  "createdAt" integer not null
);
