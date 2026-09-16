# Material folder redesign and landing illustration

## What will change

- Replace the current growing silhouettes on the landing page with the supplied parent-and-child line illustration.
- Remove the illustration’s white background, preserve the black linework, and position it as the main landing visual between the Dossier wordmark and sign-in controls.
- Redesign the document archive as overlapping blue file folders inspired by the reference: alternating left/right label tabs, uppercase labels, layered depth, and a selected folder that opens forward to reveal the original document and extracted details.
- Apply a cohesive Material Design 3 system across the whole app while preserving the warm `#f4f2eb` page background and child-specific accent colors.

## Material system

- Define shared Material roles for surfaces, containers, outlines, elevation, focus, pressed states, and typography in the global design tokens.
- Update shared buttons to Material filled, tonal, outlined, text, and icon treatments with consistent heights, touch targets, state layers, and accessible focus rings.
- Restyle the header, child selector, “Add today” actions, bottom navigation, forms, dialogs, archive panels, timeline cards, check-in, capture, Ask, calendar, and Dossier+ surfaces using those shared roles.
- Keep the visual tone calm and premium rather than using generic bright Material colors; the reference’s dusty blue folder family will provide the archive hierarchy.

## Folder interaction

- Render each document as a full-width folder layer with its label tab alternating sides.
- Use a controlled lift/slide transition when selecting a folder, then reveal its document preview and extracted fields in the opened folder body.
- Preserve image/PDF upload, camera shortcut, signed previews, empty state, and keyboard accessibility.
- Keep the layout stable and touch-friendly on the current mobile viewport, with a wider two-column document/detail view when space allows.

## Validation

- Verify the transparent illustration has clean edges and no visible white rectangle on `#f4f2eb`.
- Check landing sign-in and guest access, document selection/upload controls, all five navigation destinations, and active-child recoloring.
- Validate mobile and desktop layouts, reduced-motion behavior, focus states, text contrast, and the production build.
