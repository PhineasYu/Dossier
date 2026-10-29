# Backlog

Ordered. Work top to bottom; each item lists what "done" means. YC Winter 2027 on-time
deadline: 2 Nov 2026, 20:00 PT (3 Nov 05:00 Stockholm). Real families can only be
invited after every P0 item ships.

## P0: before any real family uses it

### 1. Family accounts and data isolation
Today every user reads and writes the same rows (`USING (true)` RLS, no owner column).
- Add `families (id, name, timezone, created_at)` and
  `family_members (family_id, user_id, role)`.
- Add `family_id uuid not null` to `children`, `entries`, `cards`, `profile_facts`,
  `documents`, `daily_checkins`; backfill the existing rows into one "Demo family".
- RLS on every table: allow only rows whose `family_id` is in the caller's
  `family_members`. Drop the `demo open access` policies.
- Storage: object paths start with `family_id/`; policies check membership.
- Guest mode ("Look around first") reads the demo family only and cannot write, or
  writes to a throwaway copy that is reset nightly. Pick one and document it.
Done when: two Google accounts each see only their own children; anon cannot read any
family's rows or documents; the demo still works for guests.

### 2. Authenticated server functions
`captureEntry`, `undoEntry`, `askArchive`, `chatArchive`, `extractDocument`,
`getCheckinActivity` use the service-role client with no identity check.
- Add `requireSupabaseAuth` (already in `src/integrations/supabase/auth-middleware.ts`)
  and query with the caller's client so RLS applies; keep service role only where RLS
  cannot express the rule, and check membership explicitly there.
- Validate that every `childId` / `entryId` belongs to the caller's family.
Done when: calling any function without a session fails, and with another family's id
returns nothing.

### 3. Onboarding: add your children
After the first sign-in: family name, then each child (name, birthday, pick a crayon;
shape is assigned by order). Create the family and membership in one transaction.
Done when: a new account lands on an empty, friendly timeline for its own children.

### 4. Dates in the family's time zone
Replace `new Date().toISOString().slice(0, 10)` (UTC) with the family's local date
(`families.timezone`, default `Europe/Stockholm`) for check-ins, streaks and card dates.

### 5. Production hygiene
- Hide "Ask today's questions again" unless in guest/demo mode.
- Export (JSON + documents ZIP) and delete-my-family, both from the header menu.
- Privacy note in plain words on the landing page once 1–4 are true (not before).

## P1: for the YC application and the first 20 families

6. **Waitlist page** `/waitlist`: email + number of children, live counter, stored in a
   `waitlist` table. The application quotes this number.
7. **Family circle** (multi-user): invite a partner, grandparents, a babysitter, a
   teacher. Roles decide what each sees (babysitter: allergies, food, routines; teacher:
   school notes and what the family shares; grandparents: memories). Built on P0.
8. **Real subscription**: Polar checkout and webhooks for Dossier+ (the card links to a
   placeholder today).
9. **Memory you can feel**: photos on memory cards; the memory lane with photos and the
   buddy's height per year; "on this day" moments; a refined time slider (snap to
   birthdays, haptics on iOS, scrub with momentum).
10. **Gentle nudges**, never tasks: an optional evening notification with tonight's
    prompt card. No streaks.
11. **Retention metric**: an `events` table (memory saved, question asked, circle member
    viewed) and a weekly-active-families query.
12. **Demo video data**: fictional children, or a family with written consent.

## P2: after the deadline

13. Native iOS app: home-screen and lock-screen widgets, Action Button and Siri
    "Tell Dossier" (design preview at `/design/widgets`).
14. Kids' smartwatch voice notes into the family record.
15. Teacher and school connection (a teacher link first, school systems later).
16. Weekly highlights for grandparents; yearly printed book per child; gift subscriptions.
17. Swedish localisation; GDPR data-processing agreements with Supabase, ElevenLabs and
    the model providers; EU data residency.
18. Family context API for care services and home devices, permissioned by the family.
19. Move AI calls from the Lovable AI Gateway to our own keys if we leave Lovable.

## Design follow-ups

- Check the liquid-glass nav and buddy animations on a real iPhone in Safari.
- Design the onboarding, waitlist and empty states in the Buddies system (`docs/DESIGN.md`).
- Decide whether dark mode is in scope; today the app is light-only.
