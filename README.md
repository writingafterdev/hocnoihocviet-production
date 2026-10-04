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

**Keep it private while testing:** open the Worker, go to **Settings → Domains & Routes**, find the `workers.dev` row, and enable
**Cloudflare Access**. Only the emails you allow can then open the site.

Backend pieces will be added to `wrangler.jsonc` as bindings when they land: D1 (database), R2 (files) and AI Gateway (AI calls).

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
timer and submission result. `src/features/attempts/store.ts` defines the `AttemptStore` interface. **For now,
attempts are saved in the browser's localStorage, which is temporary.** Once sign-in exists, implement the same
interface against D1 and swap `attemptStore`; the screens don't change.

## Layout

```
src/
  app/                    routes only; each page renders one feature component
  content/prompts.ts      the Task 2 prompt bank with per-question metadata
  styles/                 design tokens copied from the handoff's tokens/ (font families remapped in globals.css)
  components/ds/          design-system components (ProductCard, Button, Badge, ScoreBar, NavDock, …)
  components/shell/       brand header (logo tile + wordmark + avatar)
  features/
    chainlab/             ChainLab: types, constants, pure model helpers, review, UI
    desk/                 Writing Desk + essay scoring
    guided/               Chép mẫu engine (also used by vocab practice)
    vocab/                vocab sets + builder
    attempts/             attempt model, store (localStorage for now), workspace that autosaves
    library/              prompt library, filters, mode picker
    dashboard/ guidebooks/ auth/ landing/
```

The current prompt (its questions and their types) is passed through `SpecContext`, and every helper in
`chainlab/model.ts` takes the prompt explicitly.

## What is mocked (swap points)

Every smart part of the prototype is kept as-is behind a small boundary, so real services can replace it without
UI changes:

| Feature | File | Replace with |
| --- | --- | --- |
| "Soát toàn bài" chain review | `features/chainlab/review.ts` → `requestChainReview` | AI review based on the book; same `ChainReview` shape |
| Essay feedback + TR/CC/LR/GRA band | `features/desk/scoring.ts` → `requestEssayReview` | Real scoring where every comment quotes the essay |
| "Hỏi" tutor replies | `features/chainlab/tutor.ts` | Tutor endpoint that reads prompt, chains and paragraph |
| Adding prompts | `content/prompts.ts` (edited by hand) | Admin import page: AI fills the metadata, you approve |
| Chép mẫu sample essay | `features/guided/data.ts`, `GuidedFlow.tsx` | Several tagged sample essays per prompt |
| Vocab sets + practice paragraphs | `features/vocab/data.ts` | Imported sets; paragraphs generated on demand |
| Sign-in | `features/auth/Login.tsx` | Google OAuth |
| Saving attempts | `features/attempts/store.ts` (localStorage) | D1, per signed-in user |
| Saved words, practice counts | component state | D1, per signed-in user |

## Open items carried over from the design chats

- Task 1 has filters but no prompts yet, and the writing modes are Task 2 only.
- The vocab card on `/home` uses mint (the Reading colour) while Reading is closed.
- The Task 1 vocab set uses orange, which the brand rules reserve for Sources.
- The home card titles no longer use the rhetorical-question voice that the design system readme describes.
