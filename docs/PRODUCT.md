# Dossier: product

**One line:** Dossier is the AI that knows your family.

**Positioning (2026-10-30):** a family AI context platform. Parents tell Dossier anything,
any time; AI keeps each child's body, mind and memories in one living record; everyone who
cares for the children (partner, grandparents, babysitter, teacher) works from the same
context, each seeing what they need.

**Vision:** every service that will help a family (schools, doctors, childcare, and the AI
assistants and home-care robots now arriving) fails for the same reason a new babysitter
does: it doesn't know this family. Dossier holds that knowledge, with the family's
permission, and lets the right people and machines use it.

**Emotional design is the product.** People keep feeding a record because of what it gives
back: dragging the memory lane to "Luca at 3" and seeing how small he was and what he was
afraid of. Design every surface for that moment first; usefulness (the allergy list for
the babysitter) is why it gets opened on an ordinary Tuesday.

## The core loop

1. **Tell.** By voice, text, a photo of a document, a widget or the Action Button. Mix all
   the children together. If a parent doesn't know what to say, an optional prompt card
   suggests something (the two founding questions are two of those cards). Nothing is a
   daily task; there are no streaks.
2. **Sort (AI).** One input, many outputs, for every child mentioned:
   - memory cards on the child's timeline, with a category
     (courage, dream, fear, friendship, first time, interest, other);
   - profile facts: allergy, medical, height, weight, food likes and dislikes,
     interests, friends, **wellbeing** (feelings lately) and **school** (what a teacher
     reported).
   A sentence about two children becomes one item per child. No confirmation step;
   one-tap undo.
3. **Share.** The family circle: each carer sees what they need (planned).
4. **Remember.** Memory lane by age, a memory from back then, search, and Ask Dossier,
   which answers only from what the family saved.

## Who it is for

Parents of two to four children, and the people around them: grandparents, babysitters,
teachers. Secondary: friends who give Dossier+ to new parents.

## Screens (current build)

| Route | Name in nav | What it holds |
| --- | --- | --- |
| `/` | n/a | Landing: wordmark, doorframe illustration, headline, Google sign-in, "Look around first" (guest demo) |
| `/app` | Timeline | Splash, child switcher, memory lane (age slider), a memory from back then, talk-to-Dossier card (voice agent), search/ask, memory timeline, stats line |
| `/capture` | Today | Tell Dossier (record or type) with sorting lanes and undo, optional prompt-card deck, days-with-a-memory calendar |
| `/profile` | Archive | Allergies and medical, pencil-mark growth doorframe, feelings lately, from school, food, interests, friends, document folders (original next to AI-read fields), family circle preview |
| `/dossier-plus` | Ask Dossier | Chat over one child's whole record, Dossier+ subscription card (Polar QR) |
| `/design/widgets` | n/a | Design preview of iPhone home-screen and lock-screen widgets |

## AI pieces (all in `src/lib/dossier.functions.ts`)

| Function | Model | Job |
| --- | --- | --- |
| `captureEntry` | Gemini Flash via Lovable AI Gateway | Split a transcript into cards and facts per child, store them |
| `undoEntry` | n/a | Remove everything one entry created |
| `askArchive` | Gemini Flash | Search the timeline or archive; return an answer plus matching ids |
| `chatArchive` | GPT via Lovable AI Gateway (Responses API, streamed server-side) | Conversation over everything stored for one child |
| `extractDocument` | Gemini Flash (multimodal) | Read a check-up or school document into fields |
| `getScribeToken` | ElevenLabs Scribe v2 realtime | Live transcription token |
| `getCheckinConversationToken` | ElevenLabs Conversational AI | WebRTC token for the voice agent that asks the two questions; client tools `save_moment` and `end_checkin` |

Prompt rules that must survive refactors: JSON only; never invent facts; one item per
child; heights in cm and weights in kg as bare numbers; never give medical advice;
flag allergies when relevant.

## Data model (Supabase)

`children`, `entries`, `cards`, `profile_facts`, `documents`, `daily_checkins`, storage
bucket `documents`. See `supabase/migrations/`. There is no family or owner column yet:
every user sees the same demo family (Luca and Lucy). Fixing this is P0 in
`docs/BACKLOG.md`.

## Decided

- Name: Dossier (formerly The Living Doorframe). Wordmark has no comma.
- Positioning: family AI context platform. The two evening questions are optional prompt
  cards, never a required task.
- Lead the story with emotion, then show the structured archive; both halves matter.
- Multi-child from day one; every child has a crayon and a buddy.
- Allergies and medical are must-haves and always visually flagged.
- Voice is input only; Dossier never reads memories back aloud.
- Search lives inside Timeline and Archive; the AI chat lives on Ask Dossier.

## Not built yet

Family accounts and privacy, onboarding (add your children), the family circle (partner,
grandparents, babysitter, teacher), full GDPR compliance, real subscription, native
widgets and Action Button capture, kids' smartwatch voice notes, photos on memory cards,
export and delete, gifting, yearly printed book.
