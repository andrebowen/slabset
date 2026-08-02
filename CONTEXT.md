# SlabSet v18 - flat stack, no cards, iPhone first

## Status

| Field | Value |
|-------|-------|
| status | preview |
| role | **The iPhone app, flattened.** v17's card stack with every card container removed - same information, same order, told apart by captions and hairlines instead of boxes. |
| parent | `Calculator-Studio/slab-set/` |
| base | `app-v17/` verbatim: doctrine, engine, IA and shell unchanged; only the container styling and the pinned answer's presentation changed. See "Delta from v17" below. |
| preview | `python3 dev-server.py` → `http://127.0.0.1:8831/` |
| live | not promoted - **live is v15** (`v15-preview-33`, confirmed 2026-07-28) |
| ia | `references/IA.md` (inherited from v17; the screen order and rationale below still hold - only the visual container language changed) |

## Delta from v17

| v17 | v18 |
|-----|-----|
| Shape, Dimensions, Order and Spec sheet each sat in a `--surface-1` card: background, 0.5px border, radius | Same four groups as plain `.stack-section` blocks on the page background, each with an uppercase caption (`Shape`, `Dimensions`, `What to order`, `Spec sheet`) and a hairline against the section above it - no background, no border, no radius |
| Pinned answer was an oversized hero: `ORDER VOLUME · includes X% wastage` label over 32px digits + `m³` unit, stacked | Pinned answer is a plain row: `Total Volume` label left, value right-aligned, one line, `0.66m3` format (2 decimals, no space, no superscript) - still pinned above the stack, still readout-only |
| Bags/Ready-mix rows sat inside one `.order-list` card, hairline between them | Same two rows, same left-edge colour stripe, same single hairline between them - just no longer inside a boxed list |
| Spec sheet rendered inside a bordered monospace box | Same monospace block, no box |

Nothing about the doctrine, the engine, the shape maths, the recommendation logic or the
draft/persistence model changed - this is a container-styling pass, not a new IA.

## Doctrine

**It is an iPhone app that happens to have a URL. The answer is never off-screen.**

1. **No modes, no tabs, no checkout sheet.** Shape → dimensions → order → job →
   Copy/Share, top to bottom in one scroll.
1b. **The answer is pinned, and the bar holds nothing else.** One label line
   (`ORDER VOLUME · includes 10% wastage`) and the figure. No controls, and no restating
   of the dimensions - those are in the fields card a few pixels below, and repeating them
   there was noise. Visible at every scroll position on every shape, constant 60px.
   Measured before it was pinned: the number sat 37px below the fold on slab/pier and
   150px on stairs/gutter, so you could not see it while typing.
2. **The app owns the viewport.** No device bezel, no fake notch, no `9:41` status bar.
   `100dvh` shell, safe-area insets top and bottom, only the middle scrolls.
   Above 480px the shell locks to **iPhone proportion (390 × 844)** and centres, scaling
   down on short windows. A desktop window is a preview surface, not a layout to design
   for — judging the design on a 480 × *window-height* rectangle was misleading.
3. **Diagram is a standing card and it is live.** Inlined SVG, not an `<img>`: the
   dimension matching the focused field holds full ink while the rest fade to 18%. It
   answers "which is Going, which is Rise" while you stand on that field, instead of
   costing 130px to be decoration. (v16 made it a collapsible toggle; v17 drops that.)
4. **Keypad always in reach**, pinned, 4-col: digits, backspace, and a full-height
   `Next`. Gutter and stairs have five dimensions; without an advance key each one costs
   a separate trip up the stack and back. `Next` does not wrap and greys out at the end.
   The pad stands down only while iOS raises its own keyboard for the job name.
5. **Per-field m ⇄ mm badge.** Tap it to switch; the underlying metre value is preserved,
   so the volume never moves when the unit does.
6. **Nothing is prefilled.** Dimensions start empty and the hero reads a greyed `0.000`.
   Wastage (10%) and bag size (20 kg) are defaults, not measurements, so they stay.
7. **Both order options in one card, joined by a single hairline, both always expanded.**
   They are two answers to one question, so they are one inset-grouped list, not two
   competing cards. Each states its quantity and its product on one line — `66 × 20kg`,
   `1.0 m³` — with its reason line always visible underneath. There is no disclosure to
   tap open: a card you have to open to read what it is contradicts doctrine 1 (no
   modes), and it also let the joined card read as two independent widgets despite being
   one DOM list with one hairline. Bag size sits under Bags, always shown, because
   `66 × 20kg` is unreadable without it.
   **One badge, and it earns its place.** `Recommended` is advice and follows the volume —
   you could not infer it otherwise, so it gets a word, sitting directly beside the option
   name it advises, not at the trailing margin (a trailing badge reads as its own column).
   **Nothing is "chosen."** There is no selection state, no fill, no ring — Copy/Share
   simply reads the recommendation off the volume when it renders the docket. Nothing is
   marked before there is a volume, and in the 0.45–0.55 m³ dead band neither row is
   badged: too close to call, so don't call it.
   The section has been wrong four ways: a bare tick that named nothing, five redundant
   signals for one binary, two cards that read as unrelated offers, then a disclosure
   chevron that reintroduced the same "two separate things" reading by another route.
   A colour identity (blue Bags, green Ready-mix) tints each row's full background —
   decoration on top of the rule above, not a replacement for it, and not yet settled;
   see Open questions in the IA.
8. **The stack is the spec.** Copy/Share render the docket straight from live state -
   nothing to keep in sync, no preview surface repeating it back.
9. **Implausible values get a caution, not a gate - and only once you have moved on.**
   Typing `100` into Thickness while the unit reads `m` gives 660 m³ / 66,000 bags. Each
   field carries trade-plausible bounds; outside them an amber line appears under the
   field and a check-strip repeats it above Copy/Share. Both stay enabled.
   **A field is never judged while it is being edited** - typing "100" passes through
   "1", which is 1mm, so assessing mid-entry just nags. The verdict lands when you leave
   the field, clears if you go back to fix it, and everything is judged on Copy/Share so
   nothing goes out unflagged.
10. **Wastage is the last row of the Dimensions card, and it is a preset pull-down, not a
   keypad field.** It is not in the pinned bar — that is the answer, not a control surface
   — but it does belong with the fields: it changes the volume like they do. Four presets
   (0/5/10/15%), each option's label naming its own site condition inline
   (`10% — Recommended for standard site`, `15% — Rough ground`), so the
   number means something without a separate note line. It was briefly a typed keypad
   field with a note underneath; a fixed
   preset list reads faster and can't be mistyped into something implausible.
   `Next` does not reach it — a pull-down isn't keypad-editable, so the advance key stops
   at the shape's last dimension.

## Delta from v16

v17 keeps v16's card stack, tokens, unit badges and pull-down. What changed:

| v16 | v17 |
|-----|-----|
| 340px `.phone` bezel centred on a desktop backdrop | Fills the device; on desktop, an iPhone-proportioned 390×844 canvas — correct rectangle, no fake bezel |
| Single-file mockup with data-URI diagrams | Real app: `shared/app.js` + `shared/styles.css`, SVGs from `shared/diagrams/` |
| Dimensions prefilled (3 / 2 / 100) | Empty; answer greyed until every dimension is in |
| Diagram collapsible, state saved | Always shown, inlined, and the focused dimension lights up |
| No job identity - date auto-stamped only | **Job docket**: job name + date, in the stack, feeding Copy/Share |
| Theme + diagram pref persisted | Full draft persisted (`slabset-draft`): shape, dims, units, wastage, mode, bag size, job |
| Bare tick marks the selected order row | One card, one hairline, both rows always expanded: `66 × 20kg` / `1.0 m³`, reason line always visible. `Recommended` badge beside the option name it advises; nothing is otherwise "chosen" |
| No PWA, no SW, no search shells | Live shell's manifest, service worker, 7 search shells, sitemap, robots, CNAME |
| Volume in the scrolling stack | **Pinned** answer bar — was 37–150px below the fold |
| No sanity check on input | Trade-plausible bounds raise a caution once you leave a field (never a gate) |
| Unit badge looks like a caption | Raised, inked, swap glyph — reads as a control |

## Delta from v15 (live)

| v15 (live) | v17 |
|------------|-----|
| LCD receipt is the form; tap a line to edit | Plain stacked field rows |
| Summary opens as a checkout sheet below the mast | No sheet. One scroll, no modes |
| Pad `Next` advances fields | `Next` kept — five-dimension shapes need it |
| Wastage chips in the CTA slot | Wastage as the last row of the Dimensions card: a preset pull-down (0/5/10/15/20%), each option's label stating what it means inline |
| Dark zinc + amber | Light iOS grey/white + dark counterpart, no accent colour |
| Unit fixed per field | Per-field m ⇄ mm badge |
| Trade shapes overlay the pad as a list | HIG pull-down in the shape card |
| Job docket inside the checkout sheet | Job docket in the stack, above Copy/Share |
| `desktop.html` side sketch | **Dropped.** iPhone first; desktop gets the same column |

Also gone from the older v12-era build: Measure/Summary tabs, the dead greyed CTA, and
the fake phone chrome (bezel, notch, `9:41`) that shipped in production markup.

## Kept from the live shell

CNAME · manifest · service worker · `shared/icons/` · `shared/diagrams/` · privacy +
terms · robots + sitemap · GA4 (`G-PPKFHXV1DS`) · the 7 search shells, which are
`<meta refresh>` + `location.replace` into `/?shape=<id>` and cost nothing to keep.

These files are byte-identical between `app-v12/` and `app-v15/` — only `app.js`,
`styles.css` and `styles-desktop.css` diverge, and v17 replaces all three. So v17's shell
is the live shell regardless of which of the two you diff it against.

## Locked

- Light + dark, toggled from the mast, remembered in `slabset-theme`
- Six trade shapes: Slab/Pad · Pier footing · Column · Strip footing · Stairs · Gutter/Kerb
- v15 volume maths and isometric diagrams, carried over unchanged
- Metric AU engine, m³ order volume including wastage
- Bags 20 / 25 / 30 kg (default 20), bags ⇄ ready-mix at ~0.5 m³
- Copy/Share disabled until the spec is complete

## Verified

Measured on a 390×844 viewport, cold `localStorage`:

- **Answer pinned on all six shapes** at every scroll position (header 52 / bar 58 /
  note 27 / keypad 207, leaving a 501px scroll window).
- Slab 3 m × 2 m × 100 mm +10% → `0.660 m³`; `Recommended` beside Ready-mix's name, both
  rows' reason text visible with no tap required, and no marks at all on a cold screen.
- Order card holds **exactly one** full-width hairline in both themes; both rows always
  show their full detail, so there is nothing left to toggle.
- 1 m × 1 m × 100 mm at 30 kg → `8 × 30 kg Bags` recommended; 6 × 4 × 150 → `or 4.0 m³ of
  Ready-mix` recommended. Ready-mix holds its 1.0 m³ minimum load on small pours.
- Order headlines stay one line at 390px with the badge beside them, up to `or 132.0 m³ of
  Ready-mix`. They are 20px, not 22px: at 22px, two-digit volumes wrapped.
- Wastage sits as row 4 of the Dimensions card, divided from Thickness by the same
  hairline as every other row: a preset pull-down (0/5/10/15%), each option labelled
  with its site condition inline (`10% — Recommended for standard site`).
- Stairs 3 / 180 / 280 / 1000, base slab empty → `0.302 m³` at 0% wastage; Share enabled.
- Unit toggle m ⇄ mm round-trips with the volume unmoved (one click = one toggle).
- Keypad is a 4-col layout: a 3-col digit grid plus a full-height `Next` in the 4th
  column, stretched to the grid's height via flex. `Next` on gutter walks
  `gutL → gutKD → gutKH → gutFT → gutGW`, then stops and greys out — wastage is a
  pull-down, not part of the walk.
- Diagram highlighting: slab Width/Thickness light their `g.dim` group with 2 others
  muted; stairs Going/Rise light the bare label with 7 muted; stairs Base slab has no
  match, so nothing dims.
- Thickness `100` with the unit on `m` → `660.000 m³` / `66000 × 20 kg`, inline caution
  *"That is a very large thickness. Check m vs mm."* plus the check-strip, and Copy/Share
  stay enabled.
- Dark mode: diagram faces `#2c2c2e`, strokes `#f2f2f7`, no `filter` — the invert hack is
  gone.
- Draft restores across reload; `/concrete-gutter-calculator.html` → `/?shape=gutter`.
- No console errors.

## Known gaps

- **Resolved (2026-07-30): plausibility bounds.** Were placeholder guesses (500mm slab
  cap, 300m strip footing width, etc). Now anchored to NCC/BCA private-stairway geometry,
  AS 2870 residential footing/pier depth in reactive soil, AS 3600 slab thickness ranges,
  and common kerb & channel profile dimensions, see the comments above each shape in
  `shared/app.js`. Still code minimums/maximums and common practice, not a structural
  engineer's sign-off on any specific job, worth a tradesperson's read before treating it
  as gospel.
- **Resolved (2026-07-30): haptics.** Soft vibrate on key entry (digit/backspace/Next),
  shape pick, and the moment the volume first becomes computable per shape, `tick()` in
  `shared/app.js`, carried over from v15's pattern and feature-detected so it silently
  no-ops on desktop.
- No install prompt / "Add to Home Screen" coaching yet.
- **Only one draft persists, by design, not a gap (confirmed 2026-07-30).** `slabset-draft`
  is a scratchpad for the job currently on screen, not a job history. Copy/Share always
  render the docket straight from live state, so each Copy or Share is already its own
  independent snapshot, a tradie pouring several jobs a day sends each docket before
  moving on to the next job's dimensions. Nothing to fix; the workflow already covers it.
- **No way to override the docket's computed pick** (see IA open question 11). Raised
  again 2026-07-30 and declined by Andre, not being built. The spec sheet keeps leading
  with whichever option the volume recommends.

Resolved since the last pass: stairs/gutter diagrams now carry `<g class="dim">` groups
for all their dimensions, so highlighting lights leader lines, not just the label. Dynamic
Type risk is mitigated — pinch-zoom is no longer blocked (`user-scalable`/`maximum-scale`
removed from the viewport meta) and the controls that used a fixed `height` (`field-val`,
`unit-badge`, `wastage-pulldown`, the keypad `.key`) now use `min-height`, so they grow
with larger text instead of clipping it; verified at 140% root font-size with no overflow.
Large numbers (bag counts, m³ figures) now carry thousands separators everywhere they're
shown — the pinned answer, the order cards, and the spec sheet.

## Deploy

Preview only until Andre signs off. On promote: bump `sw.js` VERSION, refresh
`sitemap.xml` lastmod, sync to the deploy repo, update `LIVE.md` here and at the root.
