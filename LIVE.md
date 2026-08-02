# Live version

**Live on slabset.online = V18** (`app-v18/`).

Confirmed 2026-07-31 against the deployed service worker: `VERSION = 'v18-preview-2'`,
which matches `app-v18/sw.js`. Promoted from v15 (`v15-preview-33`) on Andre's sign-off;
bumped to `-preview-2` on this deploy to bust caches for the session's fixes (Quantity
field, diagram centring/sizing, warning copy, badge colour, scroll-area overflow-x).

Bumped to `-preview-3` on 2026-08-01: GA4 event instrumentation added (`shape_select`,
`calc_complete`, `spec_copy`, `spec_share` in `shared/app.js`, per `EVENTS.md`'s
analytics notes) - previously only the default `page_view` fired. No UI change.

Bumped to `-preview-4` on 2026-08-01: Wastage pulldown's closed-state value now reads
`+10%` instead of `10%`, matching the `+` already used in the spec sheet output
(`specText()`'s `Wastage: +10%` line). Dropdown option labels unchanged.

Bumped to `-preview-5` on 2026-08-01: Wastage presets dropped from five (0/5/10/15/20%)
to four (0/5/10/15%) - the 20% / "Rough ground" option removed from `WASTE_OPTS` and
`WASTE_NOTES` in `shared/app.js`. A draft with 20% saved snaps to the 10% default via the
existing out-of-range check in `loadDraft()` - no extra migration needed.

Bumped to `-preview-6` on 2026-08-01: `specText()`'s docket now states both figures -
`Net Volume: X m³` (raw pour, no wastage) then `Total Volume (incl. +10% Wastage): X m³`
- replacing the old separate `Wastage: +10%` / `Order volume: X m³` lines. Spec sheet
only; the pinned answer bar is unchanged (still one figure, per doctrine 1b).

Bumped to `-preview-7` on 2026-08-01: Wastage preset descriptors expanded in
`WASTE_NOTES`: 0% "No allowance for wastage", 5% "Smooth site and formwork", 10% "Uneven
ground. Recommended for most sites", 15% "Rough ground". Note the site-condition mapping
moved - "Uneven ground" now sits on the 10% (recommended) preset rather than 15%, and
"Rough ground" moved from the old 20% preset (dropped last session) down to 15%.

Bumped to `-preview-8` on 2026-08-01: 10% preset's descriptor shortened to "Uneven
ground, recommended" (was "Uneven ground. Recommended for most sites"). At 47 characters
the two-sentence version risked truncating in iOS's native picker-wheel `<select>`, which
clips with an ellipsis rather than wrapping - trimmed to a single clause, 27 characters,
matching the terser style of the other three options.

Bumped to `-preview-9` on 2026-08-01: 10% preset's descriptor changed again to
"Recommended for standard site" (was "Uneven ground, recommended"). Drops the "uneven"
framing, which sat too close to 15%'s "Rough ground" and made the two presets easy to
confuse - "standard" reads as the plain default, distinct from both "smooth" (5%) and
"rough" (15%).

Bumped to `-preview-10` on 2026-08-01: Pinned bar's volume readout gained a "Total
Volume" eyebrow caption above the figure (`.vbar-eyebrow` in `shared/styles.css`, styled
like `.section-label` further down the stack - same caption language, not a new one).
`.vbar` switched from `align-items: baseline` to `center` so the single-line shape name
sits centred against the now two-line value group instead of aligning to its top line.
Bar height grows by roughly one caption line + gap. Try, not yet confirmed against the
device.

Bumped to `-preview-11` on 2026-08-01: `.order-row-name` ("Bags" / "Ready-mix") bumped
from `--text-s` (14px) to `--text-m` (17px) to match `.order-row-value`'s size - layout
stays single-line (name left, value right), only the name's size changed.

Bumped to `-preview-12` on 2026-08-01: `.order-unit-box` (the 20/25/30kg bag-size
button) horizontal padding tightened from `10px` to `6px` a side, to sit closer to
`.unit-badge`'s (the m/mm toggle) tighter, more compact chip feel.

Bumped to `-preview-13` on 2026-08-01: Pinned bar restacked - `.vbar` switched from a
row (shape left, volume right) to a column: Total Volume block on top, shape pulldown
below it. Both now left-aligned (`.vbar-value` text-align flipped from right to left,
`.vbar-value-group` from flex-end to flex-start) since the volume no longer has a
counterpart on the right to sit opposite. Try - bar height grows again on top of
`-preview-10`'s eyebrow addition; worth checking it still reads fine against the "answer
never off-screen" doctrine.

Bumped to `-preview-14` on 2026-08-01: Reworked per Andre's sketch. `.vbar` is back to a
single-line row - `Total Volume` label left, value right (`.vbar-eyebrow`/
`.vbar-value-group` from `-preview-10`/`-13` removed, `.vbar-label` added) - and the
shape pulldown moved out of the pinned bar entirely, into `#scroll-area` as its own row
directly above `.diagram-area`. The shape name now scrolls away with the rest of the
stack instead of staying pinned; only `Total Volume` stays fixed at the top.

Bumped to `-preview-15` on 2026-08-01: `.field-val` and `.unit-badge` (the dimension
value box and its m/mm toggle) get a `1px solid var(--border)` outline back - they'd
been border-free "recessed chip" styling with no visible edge since before this session,
which read as missing once compared side-by-side with earlier bordered wireframes.
`.vbar` also switched from `align-items: baseline` to `center`, so `Total Volume` (17px)
and its value (28px) sit vertically centred on each other instead of sharing a text
baseline.

Bumped to `-preview-16` on 2026-08-01: Same `1px solid var(--border)` outline extended
to `.wastage-value-box` and `.wastage-chevron-box` - they mirror `.field-val`/
`.unit-badge` exactly (same dimensions, same recessed-chip fill) and had been missed
when the border went back on in `-preview-15`.

Bumped to `-preview-17` on 2026-08-01: Two changes. (1) Shape pulldown moved back into
the pinned `.vbar`, under a new `.vbar-volume-row` wrapper holding `Total Volume` +
value - `.vbar` is a two-row pinned column again (volume row, shape row), same
reasoning as before it moved out in `-preview-14`: it needs to stay visible with the
keypad covering the bottom third of the screen. Shape no longer scrolls away.
(2) `.wastage-pulldown:focus-within`'s `2px solid var(--border-accent)` outline removed
- it stacked a darker ring on top of the `-preview-16` light-grey border when the native
`<select>` opened; the light-grey border alone stays, no separate focus treatment.

Bumped to `-preview-18` on 2026-08-01: `Total Volume` label removed. Pinned bar is back
to a single merged row - shape pulldown (e.g. "Slab / Pad") left, volume value right -
same shape as the very first pinned bar this session started from, just with today's
border/centring work carried over. `.vbar-label`/`.vbar-volume-row` (added in
`-preview-14`/`-17`) removed as dead code.

Bumped to `-preview-19` on 2026-08-01: Two changes. (1) `Total Volume` eyebrow restored
above the volume figure (`.vbar-value-group`/`.vbar-eyebrow` back, same shape as
`-preview-10`), sitting beside the shape pulldown on the same pinned row. (2) Diagram
moved out of `#scroll-area` into its own pinned block between `.vbar` and the scroll
area (try) - it no longer scrolls away, so it stays lit for whichever field is focused
even on five-dimension shapes (Stairs, Gutter) once the fields have scrolled out of
view. Adds a fixed ~100px to the always-visible chrome; worth checking how much scroll
window that leaves on the shorter shapes' keypad-up state.

Bumped to `-preview-20` on 2026-08-01: Diagram unpinned again - moved back into
`#scroll-area` as its first child, `.diagram-area` back to its original unbordered,
transparent-background style. `-preview-19`'s pinning tried real fixed screen cost
(~170px of permanent chrome above the keypad) against a real problem (diagram scrolling
away on five-dimension shapes); reverted without a device check, so the five-dimension
scroll-away behaviour is back too. `Total Volume` eyebrow (also from `-preview-19`)
kept - only the diagram's position changed.

Bumped to `-preview-21` on 2026-08-02: Wastage pulldown merged from two bordered boxes
(`.wastage-value-box` + `.wastage-chevron-box`, 72px + 34px with a 6px gap between) into
one 112px button (`.wastage-pulldown` itself now the visible control, value left,
chevron right via `justify-content: space-between`). Same total width, so it still
lines up with `field-val` + `unit-badge` above - just one border instead of two boxes
sitting side by side.

**This is the live tree.** Edit here only for hotfixes, and bump `sw.js` VERSION when you do.
