# Copy Audit: dsa-tracker

## Issues found and changes made

- **index.html (missing meta and bare title):** Expanded `<title>` to `DSA Push · 28-Day DSA Prep Tracker` and added meta description, Open Graph, and Twitter tags summarizing what the app tracks.
- **src/App.jsx (passphrase gate):** Aligned the label casing to `SYNC PASSPHRASE`, added a placeholder and `aria-label` to the passphrase input, and renamed `Save` to `Open tracker` so the action is clear.
- **src/App.jsx (demo notice):** Pointed read-only demo users to the `Use private tracker` control in the footer instead of assuming a passphrase prompt appears directly.
- **src/App.jsx (primary CTA and form labels):** Renamed `Log it` to `Log problem`, expanded `min` to `Minutes`, and added `aria-label` attributes to the problem name, minutes, and pattern fields.
- **src/App.jsx (accurate stat label):** Changed `solved total` to `problems logged` because the counter includes `missed` problems.
- **src/App.jsx (tooltips and action labels):** Clarified grid cell titles with day number and problem count, added problem names to delete and `Re-solved cold` button `aria-label` attributes, and updated rep steppers to `Decrease`/`Increase`.
- **src/App.jsx (empty, confirm, and error states):** Rewrote the review queue empty state, the `Reset everything` confirmation dialog, and the invalid JSON import alert so each states clearly what happens next.
- **src/App.jsx (em dashes and sync status):** Replaced em dashes in the header week label, drill prefix, empty median stats (`--`), and footer sync notes (`Offline. Will sync.` and `Save failed. Retrying.`).
- **src/derive.js (nudge copy):** Added nouns (`problems`) to daily count and queue nudges, added minute units (`m`), and changed `Both under.` to `Both on target.` to match the `<=` check.
- **src/plan.js (em dashes only):** Replaced four em dashes in objective and ladder labels with colons, commas, or parentheses without altering Stephanie's study plan wording.
- **README.md (headings, em dashes, sync docs):** Tightened setup section headings, removed all em dashes, noted the demo-first entry before the passphrase prompt, and aligned quoted sync status strings with the UI.

## Left alone on purpose

- **Personal study plan prose (`src/plan.js`):** Left all weekly goals, drills, objective wording, scheduling ladder items, and machine-coding prompts untouched aside from removing four em dashes, to preserve Stephanie's authored plan.
- **Pattern, difficulty, and result keys/labels (`src/plan.js`):** Left `PATTERNS` untouched because those strings are stored in persisted state; left `DIFFICULTIES` and `RESULTS` labels intact as concise domain terms.
- **Demo problem entries (`src/state.js`):** Left sample problem names and log data untouched.
- **Core brand and domain labels (`src/App.jsx`):** Kept `DSA PUSH · 28 DAYS`, `Re-solved cold`, `human mocks`, `contests`, `Export JSON`, `Import JSON`, and `Reset everything` to preserve the app's voice.

## Not done (next pass)

- **Initial sync loading state (`src/App.jsx`):** `App` renders `null` while the private Supabase row loads; adding a visible loading message requires new markup and styling rather than a string-only edit.
