# Ask Dossier chat + landing logo spacing

## 1. AI chat on the Dossier+ page

Add a chat panel above the subscription QR card so a parent can ask anything about their child and get answers drawn from everything already saved.

- New chat card sits at the top of the Dossier+ page, QR card stays directly below it.
- Empty state: short line ("Ask anything about Luca and Lucy") plus 3 tappable example questions (e.g. "What allergies should a babysitter know?", "What has Lucy been afraid of lately?", "How much has Luca grown this year?").
- Messages stream in; the assistant answer renders as formatted text. Parent messages sit in a filled bubble, assistant answers on the plain surface.
- While the AI is working, the segmented four-colour AI ring indicator is shown (same signature already used in the app).
- The conversation covers the whole archive for the selected child: memory cards, profile facts (allergies, medical, growth, food, interests, friends) and uploaded documents.
- History is kept for the session only — no new stored conversation table. A "New chat" action clears it.
- Failures (no credits, rate limit, network) surface as a readable message in the chat instead of a silent stall.

## 2. Landing logo spacing

Move the Dossier wordmark on the sign-in page 24px further down so it sits closer to the line illustration.

## Technical details

- New server function `chatArchive` in `src/lib/dossier.functions.ts`, reusing the existing context-gathering shape from `askArchive` (child row, cards, profile_facts, documents via `supabaseAdmin`) but streaming a conversational reply instead of returning JSON with source ids. It accepts the prior messages plus the new question and the active `childId`.
- Model call goes through the Lovable AI gateway with the current chat default; the streamed text is consumed inside the handler so long answers do not stall.
- New `src/components/dossier/archive-chat.tsx` composed from AI Elements primitives (conversation, message, prompt-input, shimmer), installed from the AI Elements registry. Active child comes from `useChildren()`.
- `src/routes/_authenticated/dossier-plus.tsx` renders `<ArchiveChat />` above `<PolarCard />`.
- `src/routes/index.tsx`: add `pt-6` worth of extra top offset to the wordmark heading (24px).
- Verify with `bunx tsgo --noEmit`, `bun run build`, and a Playwright pass on the Dossier+ page and the landing page at mobile and desktop widths.
