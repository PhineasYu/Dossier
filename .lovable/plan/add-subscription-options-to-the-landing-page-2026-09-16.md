# Add subscription options to the landing page

## Goal
Add three Polar-backed subscription choices at the bottom of the public landing page so judges can tap a plan and reach a real checkout. Keep the existing Google sign-in and guest link below the pricing section.

## Plan

### 1. Polar product setup
Create three Polar subscription products via MCP:
- **Left — "1 month free"**: Monthly subscription with a 1-month free trial, then $10/month recurring.
- **Middle — "$10/month"**: Standard monthly subscription, $10/month.
- **Right — "$100/year"**: Annual subscription, $100/year (equivalent yearly savings).

Each product will include a short description and a single feature-flag benefit ("Dossier+ access") so future paywall gating is possible.

### 2. Backend checkout helper
Add a server function that:
- Accepts a `price_id`.
- Creates a Polar checkout session via `POST https://api.polar.sh/v1/checkouts/`.
- Uses the current signed-in user's UUID as `external_customer_id` when available; falls back to a generated anonymous UUID for guest users so the booth flow never blocks.
- Returns the checkout URL; the client redirects.

Also create a 100% off discount code through Polar so the team can test the live checkout flow without spending real money during the hackathon.

### 3. Landing page pricing section
Replace the existing single Polar QR card with a clean 3-column pricing grid above the Google sign-in card:
- Each card shows plan name, price/trial terms, 2–3 bullets, and a CTA button.
- The left card highlights the free trial; the middle card is the plain monthly; the right card is the yearly plan with a savings note.
- On mobile the grid stacks vertically.
- Buttons call the checkout helper and open the returned Polar URL.

### 4. Polishing
- Update the landing page meta title/description to mention Dossier+ pricing.
- Keep the transparent wordmark and the GrowingFamily animation untouched.
- Ensure the Google sign-in and "Just look around" links remain visible below the new section.

## Open questions
- Should the free trial require a payment method up front (Polar checkout default) or be truly card-free? Polar supports both; the default trial checkout will collect card details.
- What payment provider do you want live purchases to settle through (Polar is already wired in)?
