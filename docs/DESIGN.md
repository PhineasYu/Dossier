# Dossier design system: "Buddies"

Settled on 2026-10-29 after four rounds with Yunfei. Replaces the earlier tech-white /
Atlassian system entirely; nothing from it should come back. Tokens live in
`src/styles.css`; child colours and shapes in `src/lib/palette.ts`; characters in
`src/components/dossier/buddy.tsx`; the doorframe in `src/components/dossier/doorframe.tsx`.

References it was drawn from: Dear Monday (type, poster headlines, line drawings),
Family wallet onboarding (white space, flat characters, pill buttons), Headspace
(warm flat shapes) and a fitness app with soft grey cards and characters.

## Principles

1. **Colour always means something.** Exactly four meanings: something you can tap
   (and AI), which child, which kind of moment / question, danger. Everything else is
   ink on white.
2. **One bold thing per screen.** The condensed caps title is the loud element. Cards,
   chips and buttons stay quiet.
3. **The family is the interface.** Every child is a character (a buddy). Dossier's AI
   appears as the active child's buddy, so talking to the AI feels like talking about
   that child, not to a machine.
4. **Thin lines, flat fills.** No gradients except one colour fading to transparent. No
   gloss, no sheen, no drop shadows on cards.
5. **Warm, not beige.** White canvas; the only neutral card colour has a breath of pink.

## Colour

| Meaning       | Token                                                        | Value                                                       | Where                                                                                                              |
| ------------- | ------------------------------------------------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Tap me / AI   | `--action`                                                   | `oklch(0.78 0.075 174)` seafoam                             | Every primary button, AI sparkles, "New" chip                                                                      |
|               | `--action-hover`                                             | `oklch(0.72 0.08 174)`                                      | Hover/pressed                                                                                                      |
|               | `--action-soft`                                              | `oklch(0.95 0.027 174)`                                     | AI cards (check-in card, AI answers), Dossier+ card                                                                |
|               | `--on-action`                                                | `#1A1A1A`                                                   | Text and icons on action (ink, never white)                                                                        |
| Child crayons | `--sky` `--lilac` `--aqua` `--bubblegum` `--sage` `--tomato` | `#4F9DF7` `#B4A2F2` `#4FC2B9` `#F59AC6` `#5FA98A` `#F2643A` | Buddies, child switcher pill (`-soft`), growth card (`--child-soft`), sorting lanes                                |
| Moment tints  | `bg-<crayon>-soft`, `bg-sun-soft`                            | see `CATEGORY_TINT`                                         | Memory cards: courage sun, dream lilac, fear sky, friendship bubblegum, first time sage, interest aqua, other mist |
| Questions     | `--q1` / `--q2`                                              | seafoam `--action` / sky `#4F9DF7`                          | Question cards use the `-soft` tint; memory-card chips show a dot                                                  |
| Danger        | `--danger` / `--danger-soft`                                 | `#D92D20` / `#FEEBE9`                                       | Allergies and medical only, always with an alert icon                                                              |
| Neutrals      | `--paper` `--cloud` (mist) `--cloud-2` `--line`              | `#FFFFFF` `#F6F3F4` `#ECE6E8` `#E8E2E4`                     | Page, neutral cards and inputs, empty calendar cells, borders                                                      |
| Ink           | `--ink` `--ink-2` `--ink-3`                                  | `#1A1A1A` `#55565C` `#8B8C93`                               | Text, line drawings, pencil marks                                                                                  |

Rules:

- Seafoam action colour is reserved for controls and AI, not assigned as a new child's colour (it is not in `CRAYONS`). Legacy stored colours map
  to the nearest crayon in `palette.ts`; Luca stays blue (sky) and Lucy purple (lilac).
- The active child's crayon is exposed as `--child`, `--child-soft`, `--child-ink` by
  `ChildProvider`. Use those, never a hard-coded child colour.
- Do not introduce new hues. If something needs emphasis, use size or weight.
- Minimize decorative red in cards: food and first-time moments use sage, document folders avoid tomato, and genuine allergy/medical alerts retain danger red.

## Type

| Role      | Family                                                                  | Use                                                                             |
| --------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Display   | Archivo, width 62%, weight 900, uppercase, line-height 0.9 (`.display`) | Page titles (`text-[44px]`), the landing headline (52px), question cards (34px) |
| Brand     | Fraunces 900, `opsz 144`, `SOFT 100` (`.brand`)                         | The wordmark "Dossier" only. No comma.                                          |
| UI / body | Figtree                                                                 | Body 15–17px; card titles 19px/700; section titles 17–18px/700; captions 13px   |

Fonts are self-hosted through `@fontsource-variable/*` (no Google Fonts request).
Sentence case everywhere except display titles. No all-caps labels, no tracked eyebrows.

## Components

**Buttons** (`src/components/ui/button.tsx`), all pills:

| Variant     | Look                                                                                  | Use                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `default`   | action seafoam, ink text                                                              | The main action of a view                                                                                  |
| `ai`        | identical to default (kept as a name so AI actions can be found and changed together) | Anything that hands words to the AI: Talk now, Ask, Sort it for me, Answer this, record buttons, chat send |
| `outline`   | white, 1.5px `--line` border                                                          | Secondary actions, especially on tinted cards                                                              |
| `ghost`     | text only, ink-2                                                                      | Quiet actions: Later, Skip, Type instead                                                                   |
| `secondary` | mist fill                                                                             | Icon buttons in the header                                                                                 |

One `default`/`ai` button per card. Never black buttons, never white text on seafoam.

**Chips**: one shape only, a white pill (`bg-paper`, regular weight, ink-2, 28px visual height within 44px interaction rows). Interactive categories and question labels use identical visual dimensions. A question
chip adds a 8px dot in `--q1`/`--q2`. The only filled chip is "New" (action seafoam).

**Cards**: `rounded-3xl` (24px), no border, no shadow. Fill = meaning (tint) or mist.
Allergy card uses `--danger-soft`.

**Navigation** (`bottom-nav.tsx`): one floating liquid-glass capsule (`.liquid-glass`),
four icons drawn the same way: Timeline, Today (waveform), Archive, Ask Dossier (AI is
last). The current page sits on a white lens (`.liquid-lens`). Icons only; names are
`aria-label`s. Pages need `pb-32` so content clears it.

**Recording**: the waveform icon (`AudioLines`), never a microphone, on an `ai` button.

**Header**: wordmark left, a mist "…" menu right, the child switcher below.

## Characters

- `Buddy` shapes: flower, star, cloud, blob, burst, bean. A child's shape comes from
  their order in the family (`SHAPES`), their colour from their crayon.
- Every buddy blinks (sometimes twice), glances around and waves; idle personality by
  shape: flower sways, star hops, cloud floats, blob and burst breathe, bean wobbles.
  Each instance gets its own timing from `useId`, so a row never moves in lockstep.
- State motions: `bob` listening, `squash` speaking, `wiggle` sorting.
- `AiBuddy` = the active child's buddy + two seafoam sparkles. No glow, no halo, no
  gradient. Use it for every AI surface; never draw the AI any other way.
- Line work: limbs 2.5px ink, landing doorframe 1.75px, landing pencil ticks 1.5px. Archive growth frames/pencil marks and straight card separators use 1px lines. Keep the growth illustration compact.

## Memory you can see

- **Memory lane** (`memory-lane.tsx`): an age slider at the top of the timeline. Dragging
  to an age shrinks the child's buddy to the size they were and shows only that year's
  memories. This is the emotional centre of the app; give it room.
- **Back then**: one older memory shown directly like a taped photo, a spontaneous reminder. Swipe or dismiss after reading; never collapse it into a drawer and never delete the saved memory.
- **Story title**: use the original Archivo display styling at 44px, matching Tell Dossier and other page titles. Fraunces is reserved for the Dossier wordmark.
- **Documents**: simple thumbnail file rows showing title and date. Open a file's details in a dialog; no decorative folder layers or stacked tabs.
- **Moments**: compact, openable previews with consistent chips and a subtle opening arrow; details show the full memory and the original note or voice transcript. Never represent a transcript as a playable recording or add invented family media.
- **Reading sizes**: authenticated screens use 17px body, 20–21px card headings and 14–16px metadata. Memory Lane uses a 34px child name and a quieter temporal state. Display titles remain 44px.
- **Prompt cards** (`prompt-deck.tsx`): an optional stack of tinted cards with a display
  question; "Another" flips to the next. A hook for evenings with nothing to say, never a
  task. The two founding questions are two of the cards.

## Widgets

Preview at `/design/widgets`: tonight's prompt card (medium), one-tap "Something about
Luca?" (small), allergies at a glance (danger tint), a memory from a year ago (photo
card), height (child tint), lock-screen capture and a gentle notification. Same tokens,
same buddies.

## The doorframe

The only recurring image: the splash (small buddy grows past the pencil marks), the
landing illustration (two buddies in the frame, slow confetti), and the growth card in
the archive (pencil marks with dates, the child's buddy with its head at the newest
mark).

## Motion and accessibility

- Motion answers an action or shows AI state; ambient motion is limited to buddies and
  confetti. `prefers-reduced-motion` stops everything (global rule in `styles.css`).
- Ink on action seafoam is about 9:1. Ink-2 on mist cards passes AA for body text.
- Every buddy is decorative unless it carries state; then it gets an `aria-label`.
- Tap targets are at least 44px.

## Not designed yet

Dark mode (the app is light-only for now), tablet/desktop layouts beyond a centred
phone column, the onboarding "add your children" flow, the waitlist page, the yearly book.

## Current refinements

- All former sunflower-yellow roles now use the seafoam action palette; legacy sun tokens alias the action colours. Other child crayons remain unchanged.
- AI mascot sparkles alone use fresh lemon yellow (`--ai-spark`) with a delicate tonal outline (`--ai-spark-line`); action buttons and other AI surfaces remain seafoam.
- Timeline tags and dates align near the top edge with quiet 28px chips and accessible interaction targets.
- Stock photos and static audio waveforms are explicitly labelled samples, never fabricated family attachments.
- Ask Dossier's conversation heading is 24px. The subscription card uses full-width copy, a readable upper-right Dossier+ badge, and a compact QR underneath rather than a narrow poster column.
- Dossier+ uses a solid deep-teal card, high-contrast pearl text and a 1px tonal edge. No card reflections, brushing, holographic effects or animation. Only the badge has a softly blended multidirectional pearl-mint gradient with subtle cool colour variation; it stays on the same row as the Archivo heading. The QR remains compact beneath full-width copy.
- Documents previews three recent files, then opens a scrollable library grouped by year, with keyword, year and type filters. The explicit 42-file simulation is separate from saved family records.
- Profile fact cards use 24px section headings, counts and thin disclosure arrows with a single-line collapsed preview. Food groups likes and dislikes in separate disclosure lists; feelings, school, interests and friends collapse within their existing tinted cards. Search opens matching content automatically; allergies and medical remain visible.
- Primary and AI buttons use the original slider seafoam (`--action-button` aliases `--action`, hover aliases `--action-hover`) with dark ink text. Brighter and lemon-yellow trials were both rejected; yellow stays reserved for the AI sparkles only. Expanded sub-drawers (e.g. Food → Loves eating / Won't eat) render their rows on a white rounded panel so the open state reads clearly against the tinted parent card.

- Warm palette pass: lilac shifted toward pink; added butter (sun), apricot (peach), coral tokens for category tints.
- Action colour is now warm apricot (buttons, slider, AI surfaces) to warm the whole page.
- Dossier+ membership card is solid deep plum; badge foil blends champagne, rose and apricot.
