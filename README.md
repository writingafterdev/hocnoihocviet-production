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

| Route | Screen | Prototype source |
| --- | --- | --- |
| `/` | Public landing (IELTS Writing) | `Landing Writing v2.html` |
| `/login` | Split-screen Google sign-in | `Login.jsx` |
| `/home` | Dashboard: Guidebooks, Writing, Vocab; Speaking and Reading disabled | `Dashboard.jsx` |
| `/writing` | Prompt library: Task 2 / Task 1 switch, type and topic filters, mode picker | `PromptLibrary.jsx`, `ModeSelector.jsx` |
| `/writing/[promptId]/free` | **Viết tự do**: ChainLab, then "Viết bài" opens the Writing Desk | `ChainLab.jsx`, `ChainDesk.jsx` |
| `/writing/[promptId]/guided` | **Chép mẫu**: rebuild a sample essay sentence by sentence | `GuidedWriting.jsx` |
| `/vocab` | Vocab cards: skill → topic table → tick phrases → rewrite a paragraph | `VocabBuilder.jsx` |
| `/guidebooks`, `/guidebooks/engine` | Guidebook list and reader | `GuidebookHome.jsx`, `DocumentViewer.jsx` |

`/writing/p0-childcare/free` shows the **Đề mẫu** switcher with all 11 sample prompt types (verdict variants,
plan problems, and two-question mixes). Other prompts open as a single verdict question with one empty chain.

## Layout

```
src/
  app/                    routes only; each page renders one feature component
  styles/                 design tokens copied from the handoff's tokens/ (font families remapped in globals.css)
  components/ds/          design-system components (ProductCard, Button, Badge, ScoreBar, NavDock, …)
  components/shell/       brand header (logo tile + wordmark + avatar)
  features/
    chainlab/             ChainLab: types, constants, sample specs, pure model helpers, review, UI
    desk/                 Writing Desk + essay scoring
    guided/               Chép mẫu engine (also used by vocab practice)
    vocab/                vocab sets + builder
    library/              prompt list, filters, mode picker
    dashboard/ guidebooks/ auth/ landing/
```

The prototype read the current prompt from a `window` global. Here the prompt's `PromptSpec` (its questions and
their types) is passed through `SpecContext`, and every helper in `chainlab/model.ts` takes the spec explicitly.

## What is mocked (swap points)

Every smart part of the prototype is kept as-is behind a small boundary, so real services can replace it without
UI changes:

| Feature | File | Replace with |
| --- | --- | --- |
| "Soát toàn bài" chain review | `features/chainlab/review.ts` → `requestChainReview` | AI review based on the book; same `ChainReview` shape |
| Essay feedback + TR/CC/LR/GRA band | `features/desk/scoring.ts` → `requestEssayReview` | Real scoring where every comment quotes the essay |
| "Hỏi" tutor replies | `features/chainlab/tutor.ts` | Tutor endpoint that reads prompt, chains and paragraph |
| Prompt list + question data | `features/library/prompts.ts`, `features/chainlab/specs.ts` | Prompt import + question extraction |
| Chép mẫu sample essay | `features/guided/data.ts`, `GuidedFlow.tsx` | Several tagged sample essays per prompt |
| Vocab sets + practice paragraphs | `features/vocab/data.ts` | Imported sets; paragraphs generated on demand |
| Sign-in | `features/auth/Login.tsx` | Google OAuth |
| Saving (chains, drafts, saved words, practice counts) | component state | Per-user persistence |

## Open items carried over from the design chats

- Task 1 has filters but no prompts yet, and the writing modes are Task 2 only.
- The vocab card on `/home` uses mint (the Reading colour) while Reading is closed.
- The Task 1 vocab set uses orange, which the brand rules reserve for Sources.
- The home card titles no longer use the rhetorical-question voice that the design system readme describes.
