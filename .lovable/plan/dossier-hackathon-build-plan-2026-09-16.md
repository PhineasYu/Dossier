# Dossier — hackathon build plan

An AI family archive: parents talk freely, and everything is sorted into each child's growth timeline (memories) and profile (allergies, height, food, interests, friends, documents).

Demo children: **Luca** and **Lucy**, each with their own theme colour.

## Build order

### 1. Pick the look
Three rendered design directions for the note-app aesthetic (warm, Bear/Craft style). You pick one, then everything is built in it.

### 2. Backend + demo data
Turn on Lovable Cloud (database, file storage, server code) and create:
children, entries, memory cards, profile facts, documents.
Seed Luca and Lucy with birthdays, theme colours, a handful of memories spread over past years, allergies, height/weight history, foods, interests and friends — enough that the timeline, curve, Ask and stats line all look alive on stage.

### 3. Home + child switching
Two avatars at the top; tapping one recolours the whole app to that child's colour. Reverse-chronological timeline of memory cards underneath.

### 4. Profile / Archive
Allergies and medical, height/weight curve, food likes and dislikes, interests, friends. Document area where a PDF or photo is uploaded and shown next to the fields pulled out of it.

### 5. Voice Brain Dump (the hero)
Hold the mic, talk 30–60 seconds. Live transcript while speaking (ElevenLabs Scribe). On stop, the text is split into atomic items, each sentence highlights and flies into the right child's lane in that child's colour. Memories land as cards; profile facts update with a "new" glow on the changed row. A sentence about both kids makes two items. Summary line: "3 memories · 2 profile updates · 2 children". Undo, no confirmation step. A hidden text box runs the exact same pipeline as a stage fallback.

### 6. Daily two questions
"What did you do for your child today?" and "What did your child do today that you'll remember?" — same pipeline.

### 7. Ask
Type a question; matching cards float up one at a time, newest first, 0.4s apart.

### 8. Stats line
Templated from the data, e.g. "In 1,095 days, you were there for four changes of dream and twelve small acts of courage."

### 9. Splash + Polar card
Splash: parent and child silhouettes, the child growing taller until it passes the parent, looping for the booth.
Shimmering card with a QR code to the Polar subscription checkout — built early so scans accumulate all day.

## Technical notes

- Stack: TanStack Start + Lovable Cloud (Postgres, storage, server functions). Tables per the PRD: `children`, `entries`, `cards`, `profile_facts`, `documents`, with public-schema grants; no auth/RLS today (explicit WON'T).
- Extraction and Q&A run server-side against Lovable AI, returning strict JSON items (`child_ids`, `kind`, `category`/`field`, `title`, `text`, `value`); code fences stripped, one retry on parse failure.
- Transcription: ElevenLabs Scribe. The connector must be linked to this project first — I will open the connect card. Realtime streaming for the live transcript, batch as a safety net. No voice playback anywhere.
- Theme colour drives CSS variables so recolouring is one state change, not per-component overrides.
- Animations with Motion (sorting flight, card float-up, shimmer, splash growth).
- Each page gets its own title/description and social preview tags.

## Open items

- **Polar checkout URL** — I will ship the QR card pointing at a placeholder until you paste the real subscription link.
- Avatar images for Luca and Lucy: illustrated placeholders unless you upload photos.
- Headline on the Polar card (gift framing vs waitlist) — currently subscription framing.

## Not in today's build

Accounts and login, permissions, multi-parent families, Polar webhooks, privacy/compliance work, widgets, smartwatch messages, gift mode, live scan counter.
