# Known issues

## Essay review: comment calls fail with 524 (seen 2026-10-05, Model Studio + qwen3.8-flash) · FIXED

**What happens.** "Nộp bài" returns scores, but all four criteria show "Ổn" with no detailed comments.
Cloudflare logs show `ai_call_failed essay 524 error code: 524` for each criterion request, and the review
takes several minutes.

**Why.** 524 is the "origin timed out" error from the proxy in front of the Model Studio endpoint: it drops a
request when no response byte arrives for about 100 seconds. Since the CPU-limit fix, AI calls are
non-streaming, so nothing is sent until the whole reply is written. The scores reply is short and finishes in
time; a criterion's full comment list is long and doesn't. (Before the fix, streaming kept the connection busy.)
The client treats a failed criterion as "no comments", which is why the cards say "Ổn" with low scores.

**Fix (2026-10-05).** Option 1 below. Each essay part streams again, and the Worker hands the provider's stream
to the browser untouched (`askStream` in `src/lib/ai/claude.ts`); the browser reads the events and builds the
review (`src/features/desk/essay-parse.ts`). A criterion whose call still fails shows "Chưa có" with a
"Thử lại" button; each part of a ticket can be claimed twice, so one retry stays within the same use.

Tradeoffs: essay token counts are no longer recorded in `ai_usage` (the Worker never reads the reply); a
stream that breaks midway isn't refunded (only a refusal before it starts is); parsing happens in the browser.
Chain review and translation still use one-piece replies; if chain review starts hitting 524, move it to
`askStream` the same way.

**Options that were considered.**
1. Stream again, but forward the provider's stream to the browser untouched (`return new Response(upstream.body)`),
   so the Worker does no per-event parsing; the browser parses the stream and the JSON. Keeps CPU low and the
   connection alive. Quota and token logging would move to a short follow-up request or be estimated.
2. Split each criterion further (e.g. TR by body paragraph, CC by layer) so each reply stays well under ~100 s.
3. Workers Paid ($5/month): go back to server-side streaming.

