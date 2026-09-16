# Split Ask into Timeline and Archive

## Goal
Remove the standalone Ask destination and make search available where people already browse: memories in Timeline and facts/documents in Archive. Keep four bottom destinations: Timeline, Archive, Capture, and Dossier+.

## Changes

### Bottom navigation
- Remove **Ask** from the bottom bar.
- Keep four evenly spaced destinations: **Timeline**, **Archive**, **Capture**, and **Dossier+**.
- Remove the standalone Ask page after its useful behavior has been moved into the two destination pages.

### Timeline search
- Add a search field beneath the Timeline heading.
- Filter visible memory cards immediately while the parent types, matching titles, body text, categories, and dates.
- On submit, run the existing smart archive question flow and show a concise answer with the matching memory cards.
- Include clear loading, no-match, clear-search, and normal timeline states.

### Archive search
- Add a search field beneath the Archive heading.
- Filter visible profile facts and document folders immediately, matching labels, values, document types, dates, and extracted document details.
- On submit, generate a concise answer from the selected child's matching facts and documents, then show the relevant source items.
- Preserve photo/PDF upload, folder selection, and profile sections when no search is active.

### URL and interaction behavior
- Store each page's query in its own validated `q` search parameter so searches survive refresh and browser navigation.
- Keep Timeline and Archive searches independent.
- Preserve child switching; results always belong to the currently selected child.

## Technical details
- Refactor the current Ask UI into reusable search controls/results rather than duplicating it.
- Extend the server-side smart search so Timeline searches memory cards, while Archive searches profile facts and extracted document metadata.
- Pass the live query into Timeline, Profile, and Document Archive views for immediate filtering.
- Remove obsolete Ask imports/navigation references and ensure all remaining routes retain unique page metadata.

## Verification
- Verify the bottom bar has exactly four items on mobile and desktop.
- Verify keyword filtering, smart submitted answers, clearing, no-results, child switching, and URL persistence on both pages.
- Verify uploads, Capture, Dossier+, and existing Timeline rendering still work.
- Run type checking, production build, and browser interaction checks.
