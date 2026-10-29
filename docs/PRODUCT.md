# Dossier: product

**One line:** Dossier is an AI family archive that turns everyday moments into each
child's lifelong story.

**Value proposition:** AI reaches families not by teaching parents a tool, but by showing
up where they already care. Two questions a night help a parent notice their children;
the answers become every child's memories and records, and over the years Dossier holds
the family's whole context.

## The core loop

1. **Ask.** Every evening Dossier asks two questions, out loud or on screen:
   - Q1: "What did you do for your kids today?" (the parent's presence)
   - Q2: "What did your kids do today that you want to remember?" (the child's growth)
2. **Talk.** The parent answers for a minute, mixing all the children together.
3. **Sort (AI).** One input, two outputs, for every child mentioned:
   - memory cards on the child's timeline, with a category
     (courage, dream, fear, friendship, first time, interest, other);
   - profile facts (allergy, medical, height, weight, food likes and dislikes,
     interests, friends).
   A sentence about two children becomes one item per child. No confirmation step;
   one-tap undo.
4. **Keep.** Years later: search or ask ("What was Luca afraid of at four?",
   "What should a babysitter know?"). Answers come only from what was saved.

The archive is the byproduct. The habit, a parent noticing their child, is the product.

## Who it is for

Parents of two to four children, short on time in the evening. Secondary: friends and
grandparents who give Dossier+ to new parents.

## Screens (current build)

| Route | Name in nav | What it holds |
| --- | --- | --- |
| `/` | n/a | Landing: wordmark, doorframe illustration, headline, Google sign-in, "Look around first" (guest demo) |
| `/app` | Timeline | Splash, child switcher, tonight's check-in card (voice agent), search/ask, memory timeline, stats line |
| `/capture` | Today | Streak, the two questions (record or type), "say everything at once" brain dump with sorting lanes and undo, activity calendar |
| `/profile` | Archive | Allergies and medical, pencil-mark growth doorframe, food, interests, friends, document folders (original next to AI-read fields) |
| `/dossier-plus` | Ask Dossier | Chat over one child's whole record, Dossier+ subscription card (Polar QR) |

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
- Lead the story with emotion, then show the structured archive; both halves matter.
- Multi-child from day one; every child has a crayon and a buddy.
- Allergies and medical are must-haves and always visually flagged.
- Voice is input only; Dossier never reads memories back aloud.
- Search lives inside Timeline and Archive; the AI chat lives on Ask Dossier.

## Not built yet

Family accounts and privacy, onboarding (add your children), waitlist page, evening
reminders, partner and grandparent sharing, export and delete, photos on memory cards,
home-screen widget, kids' smartwatch voice notes, gifting, yearly printed book.
