# Dossier

The AI that knows your family: a family AI context platform. Parents tell it anything,
any time (voice, text, a photo of a document; optional prompt cards when they don't know
where to start, the two founding evening questions among them), and AI sorts it across
every child into timeline memories and profile facts (allergies, growth, food, feelings,
school, friends) next to their documents. Next: the family circle (grandparents,
babysitter, teacher share that context); later, the context every service and home device
for the family can draw on, with permission. The emotional design is the product: AI
reaches families through the thing parents already care about.

Founders: Yunfei (product, design, AI prototype) and Patrik. Yunfei writes in Chinese:
reply to him in Chinese, keep code, comments and docs in English. He works from the
Claude Desktop Code tab, so give him clicks rather than terminal commands.

## Read before you work

- `docs/BACKLOG.md`: when choosing what to do next. P0 (family isolation, auth on server
  functions) ships before any real family is invited.
- `docs/DESIGN.md`: before any visual change. The "Buddies" system replaced every
  earlier palette; follow it exactly.
- `docs/PRODUCT.md`: when changing behaviour, AI prompts or the data model.
- `docs/YC-W27.md`: when the task touches the Y Combinator application.

## Ground rules

- **Branches.** `main` syncs two ways with Lovable and redeploys the live site
  (https://dossier-parenting.lovable.app). Work on a branch (current: `yc-polish`) and
  merge to `main` only when Yunfei asks. Keep pushed history intact: no force-push,
  rebase or amend of pushed commits (Lovable loses its history otherwise).
- **Design in one sentence.** White page, pastel cards tinted by meaning, one buddy and
  one crayon per child, sunflower-yellow pill buttons with ink text for every action and
  AI, the AI drawn only as `AiBuddy`, thin ink lines.
- **Formatting.** Run prettier on the files you touch only; the rest of the repo is
  unformatted and a repo-wide format buries the real diff.
- **Types.** `exactOptionalPropertyTypes` is on: an optional prop that can receive
  `undefined` is typed `prop?: T | undefined`.
- **AI calls** live in `src/lib/dossier.functions.ts` and go through the Lovable AI
  Gateway (`LOVABLE_API_KEY`) and ElevenLabs (`ELEVENLABS_API_KEY`), both server-side
  secrets. Prompts return JSON only, never invent facts, one item per child, no medical
  advice.
- **Data** is Supabase (Lovable Cloud); schema changes are new files in
  `supabase/migrations/`. Every table is still open to everyone (see BACKLOG P0).
- **Install.** `bun install`. `bun.lock` points at Lovable's npm mirror
  (`europe-west4-npm.pkg.dev/...`), which Lovable needs. If an install outside Lovable
  gets 403s, rewrite those URLs to `https://registry.npmjs.org/` locally, install, and
  restore the mirror URLs before committing.

## Checking UI changes

`bun run dev`, then `python3 scripts/screenshots/shoot.py <out-dir>` captures every
screen (both children, full page and phone viewport) with Supabase mocked from the seed
data, so it works offline. Look at the screenshots before calling a visual change done;
`bunx tsc --noEmit` and `bun run build` must pass.
