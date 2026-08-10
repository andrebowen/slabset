# Live version

**This is the live tree.** Promoted to slabset.online 2026-08-10, confirmed via
`curl -s https://slabset.online/sw.js` serving `v21-preview-1`. This folder replaces an
earlier, unrelated `app-v21` (a from-scratch IA/visual reset that was never promoted) -
deleted at Andre's request 2026-08-10, not merged into this one.

This v21 is `app-v20` (`v20-preview-8`) copied verbatim, then reworked through several
rounds on Andre's direction:

- `.volume-card` moved out of its pinned position above `#scroll-area` into the normal
  scroll flow, between `.inputs-card` and `.order-block`.
- Total Volume's layout flipped from stacked (eyebrow above figure) to a row - label
  top-left, figure top-right, top-aligned rather than baseline-aligned so "Total Volume"
  actually sits in the card's top-left corner instead of dragging down to the big
  figure's baseline.
- The wastage footnote was pulled into a `.volume-label-col` with the eyebrow so it
  reads as sitting right under "Total Volume" instead of drifting to the bottom of the
  card once the figure made the card taller than that column's own content.
- Tried an LCD-readout look (pale yellow fill `#FFF3B0`, black text), then reverted to
  the app's own adaptive `--surface-1` card language - the app's yellow is already
  spoken for by `--caution`, and HIG treats colour as vocabulary: a saturated fill on a
  neutral result risked reading as a warning. The one deliberate accent colour stays on
  the interactive Copy/Share buttons, not the readout.
- `.volume-eyebrow` resized from a small uppercase caption to match `.field-label`
  exactly (same size/weight/colour as "Wastage" etc. above it).
- `.order-row-recommended` ("Recommended") switched back to `--diagram-accent` blue
  (reversing v20's walk-back to neutral grey) - it was easy to scroll past at
  text-secondary weight, and the collision v20 worried about (blue also marking the
  actively-edited field) is low in practice since the two never appear near each other
  on screen at once.

**Known risk, checked and accepted, not fixed:** on short phones (iPhone SE-height,
~667px), opening the keypad on Stairs' Steps/Rise/Going fields covers the Total Volume
card almost entirely (~40 of 63px visible) until you reach the last field or two.
Confirmed via Playwright before promoting. Andre's call: normal calculator/form
behaviour (result scrolls below an active keypad, resolves once you finish typing), not
a blocker.

Preview: `python3 dev-server.py` -> `http://127.0.0.1:8834/`.

Promote steps executed: `sitemap.xml` lastmod already current (2026-08-10), rsync-
mirrored `app-v21/` into `/Users/andrebowen/Documents/GitHub/slabset` (excluding
`.git`/`.gitignore`/`.nojekyll`, `--delete` so the mirror is exact), committed, pushed
to `origin/main`, verified live `sw.js` serves `v21-preview-1`.

**Edit here only for hotfixes, and bump `sw.js` VERSION when you do.**
