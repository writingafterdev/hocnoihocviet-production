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


## Essay review: every part still exceeds the CPU limit (seen 2026-10-05 14:48, Workers Free)

**What happens.** "Nộp bài" → "Máy chủ AI đang bận". Each of the five `POST /api/ai/essay-review` parts ends
with "Worker exceeded CPU time limit" (twice per request), all within ~60 ms of each other, so the work before
the AI call is what runs out, not the streaming. The scores shown are the old review's.

**Likely cause.** Even with streaming pass-through, each part still does, inside Next.js: the request routing,
Better Auth's session check (cookie signature), parsing and validating the body (essay + chains), a D1 claim,
and building the prompt (describePrompt/describeChains, the ~20 KB method text, JSON.stringify of the schema).
Five of these start at the same moment in one isolate, so they also compete for the same CPU.

**Ways to fix (not done yet).**
1. Handle `/api/ai/*` before Next.js: a small custom Worker entry that checks the session cookie against D1
   directly and calls the AI, falling through to OpenNext for everything else.
2. Build the prompt once in the "start" request and keep it in D1 under the ticket, so each part only claims
   and forwards; prebuild constant strings (method + task + schema text) at module load.
3. Send the parts one after another instead of all five at once (slower).
4. Workers Paid ($5/month).


## Discussion prompts still on the single-driver map (set aside 2026-10-06) · OPEN

**What happens.** 14 "Discuss both views" prompts have one driver and no rival, so their idea map explores
only one side of the debate (what the driver does to each stakeholder). The other view has no cells, and the
comparison flow (A/B chains in one cell, verdict, claim check) is not available to them. They work; they just
don't help the student compare.

**Why they were left alone.** Each needs a judgment call: is it really two options, or one option judged from
two angles? Two-driver prompts (21 Discussion prompts, `driver2`) and best/only prompts (9, `claim`) are done.

**To decide later, prompt by prompt** (sides written left / right of the rope):
- Probably real comparisons, need a `driver2`: `taxes-enough` (taxes are enough / other responsibilities),
  `art-talent` (everyone can / only the talented), `dependent-vs-independent`, `technology-isolation`.
- Probably one option with two verdicts (yes / no on the same thing), may stay single-driver:
  `international-news-subject`, `signals-to-aliens`, `minerals-in-space`, `single-global-language`,
  `criticising-teachers`, `free-libraries`.
- One thing judged from two angles, stays single-driver: `remote-work-who-benefits`,
  `climate-change-business`, `elderly-life-now`, `advertising-economy-society`.

**How to fix one.** Add `driver2: '…'` (a real second option, written like `driver`) to the prompt in
`src/content/prompts.ts`; add `claim: 'best' | 'only'` as well if the text says "the best" or "the only".
No code change is needed.
