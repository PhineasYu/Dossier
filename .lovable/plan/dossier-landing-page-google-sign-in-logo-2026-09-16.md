# Dossier landing page + Google sign-in + logo

## What changes for a visitor

1. Opening the site now shows a **landing page**: the Dossier wordmark you just uploaded, a one-line promise ("Turn everyday moments into your child's lifelong story"), three short feature blocks (Voice brain dump → sorted memories; Living profile: allergies, growth, friends; Ask your archive anything), the Polar subscription card, and a **Sign in with Google** button.
2. After signing in, the parent lands on the archive at `/app` — the timeline page exactly as it works today, with all the current tabs (Archive, Capture, Ask, Dossier+) moving under the signed-in area.
3. A small **"Just look around"** link sits under the sign-in button and opens the archive without an account, so a judge walking by is never stopped by a login screen.
4. The wordmark replaces the small "DOSSIER" text at the top of every app screen and becomes the browser tab icon.

## Sign-in behaviour

- Real Google sign-in, managed by Lovable Cloud — no keys to set up.
- Signing in does not split the data: everyone still sees Luca and Lucy's shared archive (accounts per family are out of scope for today).
- Signed in, the landing page sends you straight to the archive, and the app header gets a sign-out option.

## Technical notes

- Logo: upload `截屏2026-09-16_12.51.43.png` through `lovable-assets` and reference the pointer JSON; separately downscale a padded square copy to `public/favicon.png`, point `__root.tsx` `links` at it, and delete `public/favicon.ico`.
- Routes: new public `src/routes/index.tsx` (landing) with its own `head()` meta and og/twitter tags. Existing app pages move to `src/routes/_authenticated/{app,profile,capture,ask,dossier-plus}.tsx` using the integration-managed `_authenticated/route.tsx` gate; update `bottom-nav.tsx`, `AddTodayBar`, and every `Link`/`navigate` literal to the new paths in the same edit.
- Guest access: the "Just look around" link sets a local guest flag the gate honours, so the protected subtree stays reachable for the demo without weakening the real sign-in path.
- Google: call `supabase--configure_social_auth` with `google` in the same change, and sign in with `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`. `/auth` becomes a thin public route in case the gate redirects there.
- Header affordance reads session state (avatar/sign-out when signed in, nothing when guest); sign-out cancels + clears queries, then navigates home.
- Verify with `bunx tsgo --noEmit`, `bun run build`, and a Playwright pass over landing → app → each tab at 393px.

## Not included

- Per-family data separation, invites, or roles.
- Email/password sign-up.
