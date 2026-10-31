# Dossier design system: "Buddies"

Settled on 2026-10-29 with Yunfei and refined in Lovable on 2026-10-30 (warm palette, apricot action, readable sizes); consolidated on 2026-10-31. Replaces the earlier tech-white /
Atlassian system entirely; nothing from it should come back. Tokens live in
`src/styles.css`; child colours and shapes in `src/lib/palette.ts`; characters in
`src/components/dossier/buddy.tsx`; the doorframe in `src/components/dossier/doorframe.tsx`.

References it was drawn from: Dear Monday (type, poster headlines, line drawings),
Family wallet onboarding (white space, flat characters, pill buttons), Headspace
(warm flat shapes) and a fitness app with soft grey cards and characters.

## Principles

1. **Colour always means something.** Five meanings: something you can tap (and AI),
   which child, which kind of moment or fact, which question, danger. Everything else
   is ink on white.
2. **One bold thing per screen.** The condensed caps title is the loud element. Cards,
   chips and buttons stay quiet.
3. **The family is the interface.** Every child is a character (a buddy). Dossier's AI
   appears as the active child's buddy, so talking to the AI feels like talking about
   that child, not to a machine.
4. **Thin lines, flat fills.** One gradient in the whole product: the Dossier+ card's
   sunset blend. No gloss, no sheen, no reflections; the taped "Back then" photo is the
   only card with a shadow.
5. **Warm, not beige.** White canvas, warm tints (butter, peach, coral, rosy lilac) and
   an apricot action colour; the neutral card colour has a breath of pink.

## Colour

Tokens live in `src/styles.css`. `CRAYON_HEX` in `src/lib/palette.ts` repeats the child
and sun values for SVG fills and must stay identical to the CSS.

| Meaning           | Token                                                        | Value                                                       | Where                                                                                                |
| ----------------- | ------------------------------------------------------------ | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Tap me / AI       | `--action` (`--action-button`)                               | `oklch(0.8 0.145 62)` apricot                               | Every primary and AI button, the memory-lane thumb, "New" chip                                       |
|                   | `--action-hover`                                             | `oklch(0.75 0.155 56)`                                      | Hover and pressed                                                                                    |
|                   | `--action-soft`                                              | `oklch(0.965 0.04 72)`                                      | AI cards: talk-to-Dossier card, AI answers, Ask Dossier                                              |
|                   | `--action-ink`                                               | `oklch(0.45 0.13 48)`                                       | Waveforms and icons on action-soft                                                                   |
|                   | `--on-action`                                                | `#1A1A1A`                                                   | Text on apricot (ink, never white)                                                                   |
| AI mark           | `--ai-spark` / `--ai-spark-line`                             | `oklch(0.91 0.17 102)` lemon                                | The two sparkles beside `AiBuddy` only                                                               |
| Child crayons     | `--sky` `--lilac` `--aqua` `--bubblegum` `--sage` `--tomato` | `#4F9DF7` `#E0A2CF` `#4FC2B9` `#F59AC6` `#5FA98A` `#F2643A` | Buddies, child switcher pill, memory lane, growth card (`--child`, `--child-soft`)                   |
| Warm tints        | `--sun` (butter) `--peach` `--coral`                         | `#F2C94C` `#F5A46B` `#EE8A7F`, each with `-soft` and `-ink` | Moment and fact tints, Q1, decorations                                                               |
| Moments           | `CATEGORY_TINT`                                              |                                                             | Courage sage, dream lilac, fear sky, friendship coral, first time peach, interest butter, other mist |
| Facts in the file | `tint` in `profile-panel.tsx`                                |                                                             | Feelings lilac, From school sky, Food peach, Interests butter, Friends coral                         |
| Questions         | `--q1` / `--q2`                                              | butter / sky                                                | Prompt cards use the `-soft` tint; memory-card chips show a dot                                      |
| Membership        | `--premium`, `.premium-card`                                 | apricot base with butter, coral and pink                    | The Dossier+ card only; its badge is a white pill                                                    |
| Danger            | `--danger` / `--danger-soft`                                 | `#D92D20` / `#FEEBE9`                                       | Allergies and medical only, always with an alert icon                                                |
| Neutrals          | `--paper` `--cloud` (mist) `--cloud-2` `--line`              | `#FFFFFF` `#F6F3F4` `#ECE6E8` `#E8E2E4`                     | Page, neutral cards and inputs, empty calendar cells, borders                                        |
| Ink               | `--ink` `--ink-2` `--ink-3`                                  | `#1A1A1A` `#55565C` `#8B8C93`                               | Text, line drawings, pencil marks                                                                    |

Rules:

- Apricot is never a child's colour (it is not in `CRAYONS`), and lemon appears only in
  the AI sparkles. Legacy stored colours map to the nearest crayon in `palette.ts`; Luca
  stays blue (sky), Lucy rosy lilac.
- The active child's crayon is exposed as `--child`, `--child-soft`, `--child-ink` by
  `ChildProvider`. Use those, never a hard-coded child colour.
- Each kind of moment has its own tint; a fact card and a moment that mean the same thing
  (interests, friends) share one. Do not introduce new hues; use size or weight.
- Red is for allergies and medical only. Decorative cards avoid tomato.

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
| `default`   | action apricot, ink text                                                              | The main action of a view                                                                                  |
| `ai`        | identical to default (kept as a name so AI actions can be found and changed together) | Anything that hands words to the AI: Talk now, Ask, Sort it for me, Answer this, record buttons, chat send |
| `outline`   | white, 1.5px `--line` border                                                          | Secondary actions, especially on tinted cards                                                              |
| `ghost`     | text only, ink-2                                                                      | Quiet actions: Later, Skip, Type instead                                                                   |
| `secondary` | mist fill                                                                             | Icon buttons in the header                                                                                 |

One `default`/`ai` button per card. Never black buttons, never white text on apricot.

**Chips**: one shape only, a white pill (`bg-paper`, regular weight, ink-2, 28px visual height within 44px interaction rows). Interactive categories and question labels use identical visual dimensions. A question
chip adds a 8px dot in `--q1`/`--q2`. The only filled chip is "New" (action apricot). A selected category filter takes the vivid version of its tint (`CATEGORY_ACTIVE`).

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
- `AiBuddy` = the active child's buddy + two lemon sparkles (`--ai-spark`, thin
  `--ai-spark-line` outline). No glow, no halo, no gradient. Use it for every AI surface; never draw the AI any other way.
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
- Ink on action apricot is about 9:1. Ink-2 on mist cards passes AA for body text.
- Every buddy is decorative unless it carries state; then it gets an `aria-label`.
- Tap targets are at least 44px.

## Not designed yet

Dark mode (the app is light-only for now), tablet/desktop layouts beyond a centred
phone column, the onboarding "add your children" flow, the waitlist page, the yearly book.
