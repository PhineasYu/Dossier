# Simplified animated Dossier landing page

## What will change

- Replace the current long landing page with a single, app-style welcome screen.
- Show the parent-and-child growing animation prominently and keep it looping.
- Use the Dossier wordmark with its cream rectangle removed, leaving only the text.
- Keep the real **Sign in with Google** button and the smaller **Just look around** link.
- Remove the promise headline, descriptive paragraph, all three feature cards, and the Polar QR card from the landing page only.
- Leave the signed-in archive and its existing pages unchanged.

## Technical details

- Create a transparent version of the supplied wordmark and use it through the existing wordmark component.
- Reuse the silhouette animation as a non-blocking landing visual rather than the timed splash overlay.
- Preserve the current Google sign-in and guest navigation behavior.
- Verify the result at the current mobile size and confirm sign-in/guest controls remain usable.
