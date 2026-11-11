-- What the student is aiming for, asked once when they first arrive. One row per student.
create table "user_profile" (
  "userId" text not null primary key references "user"("id") on delete cascade,
  "targetWriting" real,
  "targetSpeaking" real,
  "examDate" text,
  "createdAt" integer not null,
  "updatedAt" integer not null
);
