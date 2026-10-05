-- Saved phrases get the same columns as the built-in sets (IPA, word type, usage notes, collocations, examples), written by the AI as JSON.
alter table "vocab_custom" add column "detail" text;
