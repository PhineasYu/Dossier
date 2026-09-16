# Tech-white color system refresh

## Goal
Replace the current warm Material palette with the supplied neutral tech-white system, use color only for child, question, AI, and status meaning, and reduce all frames to crisp 1px lines with minimal shadow.

## Visual system
- Define the exact light and dark neutral tokens: canvas, surface, secondary surface, line, ink, and secondary/tertiary ink.
- Define all five supplied roles for blue, purple, orange, and green, plus success, warning, and danger.
- Map the existing shared theme roles to these tokens so every page, popup, input, card, navigation bar, and empty state loses the cream/warm cast.
- Standardize cards at 12px radius, controls at 8px radius, 1px borders, and the supplied subtle `0 1px 1px` shadow; remove thick outlines, oversized rounding, paper texture, and elevated Material shadows.
- Keep Onest typography and ensure light/dark text combinations meet WCAG AA.

## Meaningful color application
- Set Luca to blue and Lucy to purple in the stored child data and use those child roles for avatar rings, selected profile treatment, timeline dots, and child-specific voice states.
- Animate child-theme token changes over 400ms.
- Give question 1 the orange system and question 2 the green system, including their progress indicators, mic state, and memory-card dot/chip treatment.
- Make every primary action use the neutral ink button treatment: dark ink with white text in light mode, light ink with dark text in dark mode.
- Use danger red plus an alert icon for allergy and medical information.

## AI signature
- Build one reusable four-segment ring with small gaps in orange, purple, green, and blue—never a blended gradient.
- Apply it to the conversational voice orb outline, rotate it slowly only while the agent speaks, use it for AI processing/classification states, and add its segmented treatment to AI answer/insight surfaces.
- Preserve the selected child color inside the voice orb while the multicolor ring identifies AI activity.

## Interface cleanup
- Update headers, bottom navigation, search controls, daily check-in, capture, timeline, profile facts, activity calendar, document folders, Dossier+, landing sign-in, dialogs, captions, and empty/loading states to the new tokens.
- Keep the premium folder interaction, but restyle folders with the new neutral surfaces and restrained semantic accents instead of the old dusty/warm palette.
- Remove remaining hard-coded warm colors, old folder colors, child-colored primary buttons, gray heavy frames, and unnecessary shadows.

## Technical details
- Extend `src/styles.css` Tailwind v4 semantic tokens and replace the old Material utility definitions rather than adding page-specific color values.
- Normalize the two existing demo child theme values to blue `#3267D4` and purple `#B368EC` in Lovable Cloud so stored data matches the visual contract.
- Add a question-origin display mapping for existing and newly generated cards based on their daily-check-in question context, without changing the capture fallback workflow.
- Verify with type checking, a production build, and desktop/mobile screenshots in light and dark modes, including child switching, daily questions, AI speaking/processing, medical alerts, and 1px borders.
