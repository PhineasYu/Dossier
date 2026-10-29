<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

- Authenticated screens share a centred `max-w-xl` column with `px-5 sm:px-6` gutters in both the header and page content, keeping all visual edges aligned.
- Visual refinements preserve the Buddies tokens and characters in `docs/DESIGN.md`; the display page title is the primary typographic emphasis.

- Memory category filtering uses the shared pure filter in `src/lib/memory-filters.ts` so category, age, keyword and AI results intersect consistently; filter state belongs to the timeline page.
- Authenticated reading sizes are scoped by `dossier-readable` in global CSS, including portaled document dialogs, so larger typography does not change landing pages or display-title hierarchy.
- Documents render simple file rows with an on-demand detail dialog, avoiding decorative stacking and keeping all documents accessible.
