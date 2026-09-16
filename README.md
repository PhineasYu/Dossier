# Childhood Chapters

Dossier — PRD (Hackathon build)

One-liner

Dossier: an AI family archive that turns everyday moments into each child's lifelong story.

Context

Science-fair judging: judges walk the room until 15:30 → top 8 present at 16:00.

Goal before 15:30: a product that explains itself in a 90-second walk-by.

Sponsor: Polar. We end with a shimmering QR card to measure real interest.

Feature freeze: 14:45. After that: bug fixes, rehearsal, backup screen recording.

Core idea: one input, two outputs

Parents speak freely. AI sorts everything into:

Emotional output → memory cards on each child's growth timeline

Structured output → each child's profile (allergies, height/weight, food, interests, friends, documents)
 Pitch leads with emotion and briefly shows the structured side.
 Metaphor: the doorframe pencil marks = height/weight curve; the timeline = the other 90% of growing up.

HERO INTERACTION: Voice Brain Dump (highest priority)

The parent holds the mic and talks for 30–60 seconds, mixing everything, e.g.:
 "Leo tried mango today and his lips got a bit swollen. He said hi to a new kid all by himself. Mia is 112 cm now, and she wants to be an astronaut this week..."

Flow:

Live transcript appears while speaking (or waveform, then transcript if live isn't feasible).

On stop: AI splits the transcript into atomic items.

Sorting animation: each sentence highlights and flies into the right child's lane, colored with that child's theme color.

Memory items become cards on the timeline.

Profile items update fields (e.g., the allergy row glows "new").

One sentence about two kids ("Mia taught Leo to ride a bike") becomes two cards.

Summary line: "3 memories · 2 profile updates · 2 children".

Undo available; no confirmation step (keeps the demo fast).
 Fallback: hidden text input that runs the exact same pipeline, in case voice fails on stage.

Screens

Splash: silhouette of parent and child; the child slowly grows taller until matching and passing the parent. Can loop at the booth.

Home: two child avatars at the top, tap to switch left/right. The whole UI recolors to that child's theme color (based on their favorite color).

Timeline: note-app aesthetic (Bear/Craft style), memory cards in reverse chronological order.

Profile / Archive:

Allergies & medical, height/weight curve, food likes/dislikes, interests, friends

Document archive: upload PDFs/photos (reports, checkups); original shown side by side with AI-extracted fields

Capture: daily two questions + Voice Brain Dump

Q1: What did you do for your child today?

Q2: What did your child do today that you'll remember?

Ask: type a question ("What was he afraid of when he was 3?") → matching cards float up one by one, reverse chronological, 0.4s apart.

Stats line: templated from DB queries, shown as silent text, e.g. "In 1,095 days, you were there for four changes of dream and twelve small acts of courage."

Polar card: shimmering card with QR code → Polar checkout / waitlist. Headline TBD (gift framing vs waitlist).

Priorities

MUST

Data model + seed data for 2 children (1 real with permission, 1 fictional), each with a theme color

Avatar switching + theme recolor

Timeline + Profile/Archive pages

Voice Brain Dump → AI split → cards + profile updates + sorting animation (with text fallback)

Allergies/medical + height/weight in profile

Document archive (PDF/photo upload, original + extracted) — already built, connect to child_id

Ask → floating cards

Stats line

Polar QR card (set up early so scans accumulate all day)
 WILL

Animated splash (static illustration placeholder first)

Photos attached to memory cards
 BETTER (mention in pitch only)

Home-screen widget for one-tap capture

Kids' smartwatch voice messages to parents

Gift mode (friends give Dossier to new parents)

Live scan counter on the Polar card
 WON'T (today)

Login/accounts, permissions/RLS, family multi-user collaboration, Polar webhooks, full privacy/compliance

Data model (Supabase)

children: id, name, avatar_url, theme_color, birthdate

entries: id, created_at, raw_text, source (voice | text)

cards: id, child_id, entry_id, date, title, body, category (courage | dream | fear | friendship | first-time | interest | other)

profile_facts: id, child_id, entry_id, field (allergy | height | weight | food_like | food_dislike | interest | friend | medical), value, date

documents: id, child_id, file_url, doc_type, extracted_json, uploaded_at

AI extraction (OpenAI via Supabase Edge Function)

Input: raw transcript + list of children (id, name).
 Output: JSON only, no prose:
 { "items": [
 { "child_ids": ["..."], "kind": "card" | "profile_fact",
 "category": "...", "field": "...", "title": "...", "text": "...", "value": "..." }
 ]}
 Rules: split into atomic items; an item mentioning 2 kids → one item per child; strip code fences, then parse; retry once on failure.

Tech & build rules

Lovable for initial UI, then hard handoff (never edit the same codebase from two tools at once)

Supabase: DB + storage; all AI calls go through Edge Functions

OpenAI: extraction + Q&A

ElevenLabs Scribe: speech-to-text only (no voice playback anywhere)

Before judging: export all demo data and record a backup screen video






90-second judge path

0–10s Splash: child grows taller
 10–25s Tap avatars → theme color switches
 25–45s Voice Brain Dump → items fly into each child's lane, allergy row glows
 45–65s Ask a question → cards float up
 65–75s Stats line appears
 75–90s Shimmering Polar QR card: "Scan it"

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9f6ccdff-86fd-46f8-b302-4baa1fc639cc).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
