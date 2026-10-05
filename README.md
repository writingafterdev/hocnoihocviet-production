# hocnoihocviet

Next.js 15 (App Router) + React 19 + TypeScript, deployed on **Cloudflare Workers** through the
[OpenNext adapter](https://opennext.js.org/cloudflare). The screens are ported 1:1 from the Claude Design
prototype (`ui_kits/hocnoihocviet` in the design handoff), with one product decision applied everywhere:
**the page surface is white**, not the cream `--surface-base` from the token file.

```bash
npm install
npm run dev        # http://localhost:3000 (regular Next.js dev server)
npm run build      # Next.js production build (also type-checks)
npm run preview    # build for Cloudflare and run it locally on the Workers runtime (http://localhost:8787)
npm run deploy     # build and deploy to Cloudflare from your machine (needs `npx wrangler login` first)
```

## Deploying on Cloudflare

Config lives in `wrangler.jsonc` (Worker name `hocnoihocviet`) and `open-next.config.ts`.

To deploy on every push, connect this repo once in the Cloudflare dashboard:

1. **Workers & Pages → Create → Import a repository**, then pick `hocnoihocviet-production`.
2. Set **Project name** to `hocnoihocviet`. It must match `name` in `wrangler.jsonc`.
3. Leave **Root directory** as `/`.
4. Set **Build command** to `npx opennextjs-cloudflare build`.
5. Set **Deploy command** to `npx opennextjs-cloudflare deploy`.
6. Click **Deploy**. The app is served at `https://hocnoihocviet.<your-subdomain>.workers.dev`.

Since sign-in landed, the deploy command is **`npm run deploy:ci`**. It applies any new files in `migrations/` to the
D1 database, then deploys.

**Keep it private while testing:** open the Worker, go to **Settings → Domains & Routes**, find the `workers.dev` row, and enable
**Cloudflare Access**. Only the emails you allow can then open the site.

## Sign-in and data

- **Auth:** [Better Auth](https://www.better-auth.com) with Google sign-in (`src/lib/auth.ts`, `/api/auth/*`).
  - Sessions are stored in D1 and last 30 days.
  - `src/middleware.ts` sends signed-out visitors on app pages to `/login?next=…`.
  - Every API route checks the session itself.
- **Database:** D1, bound as `DB`; the schema lives in `migrations/`.
  - `attempt` rows belong to one user, and the API never reads or writes another user's rows.
  - `vocab_progress` stores each student's saved phrases and practice counts (`/api/vocab`).
- **Secrets:** set these in the Worker's Variables and Secrets, all as type *Secret*:
  - `BETTER_AUTH_SECRET`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - optional `ALLOWED_EMAILS`: a comma-separated list that limits who can sign up.
  - `ANTHROPIC_API_KEY`: turns on the AI review, scoring and translation. Without it the app uses the rule-based mocks.
  - optional `AI_BASE_URL` + `AI_MODEL` (plain variables): use another Anthropic-compatible endpoint. Two uses:
    - **Testing on ModelScope's free quota:** `AI_BASE_URL=https://api-inference.modelscope.cn`, `AI_MODEL=<a ModelScope
      model ID>`, and the ModelScope access token as `ANTHROPIC_API_KEY`. Non-Claude models get plain Messages API calls:
      no thinking, no fallbacks, and the JSON shape is requested in the prompt instead of enforced.
    - **Cloudflare AI Gateway:** `AI_BASE_URL=https://gateway.ai.cloudflare.com/v1/<account>/<gateway>/anthropic`, with
      `AI_MODEL` unset, for logs and caching.
- **Setup check:** `/api/health` lists the D1 tables and which secrets are present (never their values).
- **Google OAuth client:** authorised redirect URI `https://<host>/api/auth/callback/google`.

**Running it locally on the Workers runtime:**
1. Create a `.dev.vars` file (gitignored) with the same secrets.
2. Optionally add `DEV_PASSWORD_LOGIN=1` to it, which enables email + password sign-in for testing without Google. Never set this in production.
3. Run `npm run db:migrate:local`, then `npm run preview`.

## Routes

| Route | Screen |
| --- | --- |
| `/` | Public landing (IELTS Writing) |
| `/login` | Split-screen Google sign-in |
| `/home` | Dashboard: Guidebooks, Writing, Vocab; Speaking and Reading disabled |
| `/writing` | Prompt library: Task 2 / Task 1 switch, type and topic filters, mode picker (with "resume") |
| `/write/[attemptId]/chains` | **Viết tự do**, screen 1: ChainLab for one attempt |
| `/write/[attemptId]/essay` | **Viết tự do**, screen 2: Writing Desk for the same attempt |
| `/writing/[promptId]/free` | Shareable link that starts a new attempt for a prompt |
| `/writing/[promptId]/guided` | **Chép mẫu**: rebuild a sample essay sentence by sentence |
| `/vocab` | Vocab cards: skill → topic table → tick phrases → rewrite a paragraph |
| `/guidebooks`, `/guidebooks/engine` | Guidebook list and reader |

## Prompts

All Task 2 prompts live in `src/content/prompts.ts`. Each prompt is a list of questions, and each question has a
type (`verdict`, `cause`, `problem`, `planproblem`, `effect`, `solution`). The type decides what ChainLab shows:
- the default lens chips
- the rope and stance, which appear for verdict questions only, with the rope ends taken from `sides`
- the "Xử lý" link that solution chains use

Each prompt also carries the hint panel's data (`reqs`, `driver`, `stakeholders`). A new prompt needs data only,
never code. Question text must be copied verbatim from the prompt.

## Attempts

An attempt is one go at one prompt: its chains, stance, the latest "Soát toàn bài" result, and the essay drafts,
timer and submission result. It's stored as JSON in the D1 `attempt` table, through `/api/attempts`.

- **Shared workspace:** `/write/[id]` keeps a single workspace mounted across `/chains` and `/essay`, using a layout,
  so nothing reloads between the two screens.
- **Autosave:** it saves 1.5 s after the last edit, and again when the tab is hidden. The Desk timer alone doesn't
  trigger a save.
- **History:** `/attempts` lists the student's attempts.

## Layout

```
src/
  app/                    routes only; each page renders one feature component
  content/prompts.ts      the Task 2 prompt bank with per-question metadata
  lib/ai/                 Claude calls: method text, prompts + schemas, daily limits
  styles/                 design tokens copied from the handoff's tokens/ (font families remapped in globals.css)
  components/ds/          design-system components (ProductCard, Button, Badge, ScoreBar, NavDock, …)
  components/shell/       brand header (logo tile + wordmark + avatar)
  features/
    chainlab/             ChainLab: types, constants, pure model helpers, review, UI
    desk/                 Writing Desk + essay scoring
    ai/                   client for /api/ai/* and its error messages
    guided/               Chép mẫu engine (also used by vocab practice)
    vocab/                vocab sets + builder
    attempts/             attempt model, API-backed store, workspace that autosaves, history page
    library/              prompt library, filters, mode picker
    dashboard/ guidebooks/ auth/ landing/
```

The current prompt (its questions and their types) is passed through `SpecContext`, and every helper in
`chainlab/model.ts` takes the prompt explicitly.

## AI review, scoring and translation

Three features call Claude (`claude-opus-5-5`) from the Worker. The two reviews are grounded in the book's method,
distilled in `src/lib/ai/method.ts`. That text is identical in every request, so it is prompt-cached.

| Feature | Route | Server | Output |
| --- | --- | --- | --- |
| "Soát toàn bài" (ChainLab) | `POST /api/ai/chain-review` | `lib/ai/chain-review.ts` | Questions grouped as Mắt xích, Độ sâu, Trường hợp, Sợi dây, Lập trường, Độ phủ đề bài, Trùng ý. Logical Jumps and vague words are pinned to chain steps. |
| "Nộp bài" (Writing Desk) | `POST /api/ai/essay-review` | `lib/ai/essay-review.ts` | Band plus TR / CC / LR / GRA. Each criterion has why it got that band and how to go higher, then detailed comments. There is also an overall assessment. |
| "Tạo đoạn mẫu" (Vocab) | `POST /api/ai/vocab-paragraph` | `lib/ai/vocab-paragraph.ts` | Up to 30 ticked phrases. More than 6 are split into paragraph-sized groups by each phrase's theme (`VB_THEMES` in `features/vocab/data.ts`, no AI call), then each group gets its own paragraph, practised one after another. Each sentence comes with its Vietnamese translation. Only phrases from the app's own sets are accepted. Falls back to the pre-written paragraphs. |
| "Dịch" (both screens) | `POST /api/ai/translate` | `lib/ai/translate.ts` | Vietnamese ↔ English translation of up to 800 characters, nothing else. |

- **Score bar = navigation:** Band shows the overall assessment and one line per criterion. TR / CC / LR / GRA show
  that criterion's "Vì sao" and "Để lên", then its comments, and the essay shows only that criterion's highlights.
  Clicking a highlight opens its criterion.
- **Translator and prompt injection:**
  - The request carries no book text, prompt or essay, only a short system prompt.
  - The student's text sits between random per-request markers and is always treated as text to translate.
  - The reply must be a JSON object with one `translation` field, and replies far longer than the input are rejected.

- **Highlights:** every essay comment quotes the exact words it is about. The server finds each quote in the text,
  ignoring case and spacing, and drops any comment whose quote is not in the essay. After submitting, each paragraph
  shows its quotes highlighted in the criterion's colour. Clicking a highlight selects its comment, and clicking a
  comment scrolls to its highlight. LR and GRA comments, and small TR/CC fixes, carry a drop-in fix. A comment shows
  as "Đã sửa?" once its quoted words are gone.
- **Grounding:** `method.ts` covers Phase 0–2, the nine question types and Module 2 (coherence and cohesion). The
  essay prompt reads Task Response in fixed steps, then Coherence (whole essay → paragraph → sentence), then Cohesion
  (sentence openings → reference words → connectors).
- **Daily limits per student:** 10 chain reviews, 5 essay scorings, 60 translations and 30 vocab paragraphs (`DAILY_LIMIT` in
  `lib/ai/claude.ts`). Days follow Vietnam time. Usage and token counts go in the D1 `ai_usage` table, and a failed
  call doesn't count. `GET /api/ai/usage` shows what's left today.
- **Safety:** refusals fall back to another model on the server (`fallbacks: "default"`). Student text is treated as
  data, never as instructions.
- **Without `ANTHROPIC_API_KEY`:** the client falls back to the prototype's rule-based checks, and the score box says
  "bản thử".

## What is still mocked

| Feature | File | Replace with |
| --- | --- | --- |
| Adding prompts | `content/prompts.ts` (edited by hand) | Admin import page: AI fills the metadata, you approve |
| Chép mẫu sample essay | `features/guided/data.ts`, `GuidedFlow.tsx` | Several tagged sample essays per prompt |
| Vocab sets | `features/vocab/data.ts` | Imported sets |

## Open items carried over from the design chats

- Task 1 has filters but no prompts yet, and the writing modes are Task 2 only.
- The vocab card on `/home` uses mint (the Reading colour) while Reading is closed.
- The Task 1 vocab set uses orange, which the brand rules reserve for Sources.
- The home card titles no longer use the rhetorical-question voice that the design system readme describes.
