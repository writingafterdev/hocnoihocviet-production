# Known issues

## Essay review: comment calls fail with 524 (seen 2026-10-05, Model Studio + qwen3.8-flash)

**What happens.** "Nộp bài" returns scores, but all four criteria show "Ổn" with no detailed comments.
Cloudflare logs show `ai_call_failed essay 524 error code: 524` for each criterion request, and the review
takes several minutes.

**Why.** 524 is the "origin timed out" error from the proxy in front of the Model Studio endpoint: it drops a
request when no response byte arrives for about 100 seconds. Since the CPU-limit fix, AI calls are
non-streaming, so nothing is sent until the whole reply is written. The scores reply is short and finishes in
time; a criterion's full comment list is long and doesn't. (Before the fix, streaming kept the connection busy.)
The client treats a failed criterion as "no comments", which is why the cards say "Ổn" with low scores.

**Ways to fix (not done yet).**
1. Stream again, but forward the provider's stream to the browser untouched (`return new Response(upstream.body)`),
   so the Worker does no per-event parsing; the browser parses the stream and the JSON. Keeps CPU low and the
   connection alive. Quota and token logging would move to a short follow-up request or be estimated.
2. Split each criterion further (e.g. TR by body paragraph, CC by layer) so each reply stays well under ~100 s.
3. Workers Paid ($5/month): go back to server-side streaming.

**Also.** A criterion whose call failed should say so ("Chưa lấy được nhận xét, thử lại") instead of "Ổn",
with a retry for just that criterion under the same ticket.
