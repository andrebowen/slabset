# SlabSet v22 - Grey field boxes removed, HIG grouped-list hairlines between rows

## Status

| Field | Value |
|-------|-------|
| status | preview |
| role | `app-v21` copied verbatim, then a visual pass on the Inputs/Outputs card rows only (Andre's explicit ask). Engine (`app.js`), IA, and everything outside the two cards' row styling are unchanged. v22.1 (same preview, see delta below) redid the Outputs card's volume line as a ledger. v22.2 (same preview, see delta below) moved Wastage's control from the Inputs card into that ledger. IA is touched for the first time here (Wastage no longer one of #fields' rows), everything else about card structure is still unchanged. |
| parent | `Calculator-Studio/slab-set/` |
| base | `app-v21/` at `v21-preview-1` (2026-08-11) |
| preview | `python3 dev-server.py` → `http://127.0.0.1:8835/` |
| live | not promoted - live is v21 (`v21-preview-1`) |
| risk | Playwright-verified for the v22.1 ledger and v22.2 relocation only (below) - the rest of v22 (Inputs card hairlines, black-on-white field values) is still CSS-only reasoning, not Playwright-checked or on a real device. |

## Delta: v22.1 - Outputs card redone as a ledger (2026-08-11)

Andre's explicit ask, written out line by line:

```
Base volume           2.0 m3
+ 10% Wastage        0.2 m3
--------------------------
Order quantity    2.2 m3
--------------------------
200 x 20kg bags
```

The old single sentence ("2.20 m³ (incl. +10% wastage)") is gone. `#volume-breakdown`
(was `#volume-val`) now renders up to three `.ledger-row`s in `renderResults()`: Base
volume, `+ N% Wastage` (the actual m³ it adds, not just the percentage), then Order
quantity as the bold total (`.ledger-total`, reuses `.qty-figure`). At the time this
shipped, the whole breakdown collapsed to the Order quantity row alone whenever
Wastage was 0% or the shape wasn't complete yet - **superseded by v22.2 below**, which
had to change this once Wastage's own control moved into this card. Buying options
(Ready-mix + bags, both listed with `(Recommended)` on the winner) are unchanged in
content/logic - confirmed with Andre this stays as-is, not cut down to the mockup's
single bags line.

Card styling dropped back to one flat `--surface-1` surface (v22's two-tone dark-blue/
lavender fill is reversed - confirmed with Andre, "flat ledger" over "keep the colour
band"). Every seam - row-to-row in the breakdown, row-to-row in Buying options, and the
breakdown→Buying-options boundary - is now the same `0.5px` hairline used elsewhere in
v22 (`#fields`, `.buy-line`), so colour no longer carries any of the seams. Removed the
now-unused `--results-light-bg` token (both themes) along with it.

Playwright-verified (`node --check` on `app.js`, then a scripted fill of Length 5m /
Width 2m / Thickness 200mm / Wastage 10% - the exact numbers in Andre's mockup):
renders `Base volume 2.0 m³` / `+ 10% Wastage 0.2 m³` / `Order quantity 2.2 m³`
verbatim, in both light and dark theme, plus the 0%-wastage collapse (single "Order
quantity 2.0 m³" row) and the pre-completion empty state (single greyed-out row).
Screenshots only, no automated regression suite for this app yet.

## Delta: v22.2 - Wastage's control moved from Inputs into the Outputs ledger (2026-08-11)

Andre noticed the v22.1 ledger repeated Wastage: an editable pulldown in the Inputs
card, and a plain value echoing it a few rows below in Outputs. Confirmed with Andre
(two questions - keep the row at 0%, and yes, actually move the control, not just
trim the label) before touching behaviour, since this moves a live control, not just
restyles a display row.

Reasoning: Wastage isn't a physical dimension of the shape like Length/Width/
Thickness - it's an adjustment to the order quantity, so its control now lives right
next to the number it changes (the "+ N% Wastage" ledger row) instead of being set in
Inputs and redisplayed in Outputs. `wastageRow()` (the old Inputs-card row, fixed
162px wide, matching a dimension row's value+unit-picker width) is gone; `#fields` is
Length/Width/Thickness (or the shape's equivalent) only now, the first change to the
Inputs card's actual row *count* since the merge into `.inputs-card`.

The picker itself (`#wastage-select`/`#wastage-current`/`.wastage-chevron`, same
`WASTE_OPTS`/`WASTE_NOTES` preset list as before) now sits inline mid-label -
`wastageLedgerRow()` builds "+ [10% ▾] Wastage" as one `.ledger-row`, the chip
content-sized rather than a fixed block, the same technique `.unit-picker--inline`
(the Buying-options bag-size chip) already used. `renderWastagePulldown()`'s wiring
moved from being called out of `renderFields()` to being called out of
`renderResults()` (every render, same frequency as before, just triggered from the
other card now) since the `<select>` it wires lives in `#volume-breakdown`'s markup.

The Wastage row **cannot** collapse away the way v22.1 had it doing at 0% - a control
that vanishes at its own lowest setting is unreachable from there. It's now
unconditional: renders in both the complete and incomplete states, with a muted "—"
in its value column pre-completion (nothing computed yet, but the control itself
doesn't need a finished shape to be usable) instead of an amount. Base volume is the
one row that still only shows once the shape is complete - unlike Wastage it isn't a
control, so a "0.0 m³" placeholder there pre-completion would just be one more
number nobody could act on, on top of the placeholder Order quantity already below it.

Playwright-verified (scripted, both light/dark not re-shot since only the ledger rows
changed, not the card's colour/theme handling from v22.1): confirmed `#fields`
contains no "Wastage" text and no `data-row="wastage"` after this change; confirmed
`#wastage-select` exists and is changeable *before* any dimension is typed (pre-
completion reachability, the whole point of this round); confirmed selecting 0%, 10%,
15% from it live-updates Base volume/Wastage-amount/Order quantity correctly (2.0/0.0/
2.0, 2.0/0.2/2.2, 2.0/0.3/2.3 respectively) without a page reload.

## Delta: v22.3 - Wastage row reorder + count-field right-edge fix (2026-08-11)

Two fixes from one screenshot Andre sent (Column shape, Diameter/Height/Quantity):

**Wastage row order.** Was `wastageLedgerRow()` building "+ [10% ▾] Wastage" as the
row's label, with only the m³ amount in the value slot. Andre's ask, written out
("Wastage +10% 0.2 m3"): label-first like every other row in the app (`Wastage`,
plain, matching `Base volume`/`Order quantity`'s own label style), with the control
and the resulting amount both moved into the row's value slot - control first, then
amount (`.ledger-val--wastage`, new modifier class holding both as one right-aligned
flex cluster). `#wastage-current`'s leading "+" moved back into the chip itself
(`+10%`) since the row's static text in front of it is gone. **Superseded within the
hour by v22.4 below** - Andre wanted the control on the label side after all, not the
value side.

**Count-field right-edge fix.** Andre's screenshot showed Quantity's "17" stopping
well short of the row's right edge, while Diameter/Height's "600 mm ⌄"/"500 mm ⌄"
reached it - all three rows are pixel-identical in height (44px, confirmed via
`getBoundingClientRect()` before touching anything), so the "uneven" read was
horizontal, not vertical. Cause: count fields (`f.count`, e.g. Quantity, Steps) kept
an invisible `visibility:hidden` unit-picker placeholder in `renderFields()` so their
value box lined up on the same *left* edge as a real dimension's number - which left
their *right* edge 66px short of every other row's. Placeholder dropped entirely for
count fields; `.field-controls` now holds only `.field-val`, and `.field-line`'s own
`justify-content: space-between` pushes it flush to the row's true right edge
instead, same as every other row.

Playwright-verified: reproduced Andre's exact scenario (Column, Diameter 600mm/Height
500mm/Quantity 17) - `.field-controls`' right edge is now `366px` for all three rows,
confirmed identical (was `366`/`366`/`300` before, i.e. Quantity 66px short). Same
check on Stairs (5 fields, one of them a count field, Steps) - all five right edges
match. Confirmed the Wastage row's new text order (`Wastage` → `+10%` → `0.2 m³`) in
both the pre-completion and 0%-wastage states, and screenshotted both light and dark
theme.

## Delta: v22.4 - Wastage's control moved back onto the label side (2026-08-11)

Andre's follow-up on v22.3: "+10% should go to the left, after Wastage" - the control
belongs grouped with the word "Wastage" on the row's left side, not paired with the
amount on the right. `wastageLedgerRow()` reverted to a plain single-figure value slot
(no more `.ledger-val--wastage` - removed, along with `.wastage-amount`, now unused);
the `+10% ▾` chip moved back into `.ledger-label`, trailing right after the text
"Wastage". Net result reads "Wastage +10% ▾ ... 0.2 m³" - label and control together
on the left, the resulting amount alone on the right, matching every other ledger
row's label-left/value-right shape exactly (the control is now just part of what the
label *is*, not a second thing living in the value slot).

Playwright-verified: confirmed the row's text order (`Wastage` → `+10%` → `0.2 m³`,
same order as v22.3 but now split left/right differently) at 10% and 0% wastage, and
screenshotted both light and dark theme against the same Column/600mm/500mm/17
scenario from Andre's original report.

## Delta: v22.5 - Buying options reordered to label-left/value-right, plus two type fixes (2026-08-11)

**Buying options.** Andre's ask, written out:

```
Buying options

Ready-mix                               2.2 m³
(Recommended)

Number of [20kg] bags            220
```

Was quantity-leading prose ("2.2 m³ of Ready-mix (Recommended)", "220 × 20kg bags") -
this is the third time this exact question (label-first vs quantity-first) has been
decided in this card's history, previous rounds landing on quantity-first each time
(see `.buy-line`'s CSS comment for the fuller back-and-forth) - reversed here at
Andre's own explicit, written-out request, so noting the reversal rather than
silently dropping the earlier reasoning. Now matches the ledger rows above it
(`Base volume`, `Wastage`, `Order quantity`) and the Inputs card's dimension rows -
every row in the app reads label-left/value-right the same way now.

Structurally: each option (Ready-mix, bags) is now a `.buy-item`, the same shape as
`.field-row` - a fixed 44px `.buy-line` (label + value) plus an optional line below
it. `"(Recommended)"` moved off the end of the old sentence into that optional line
(`.buy-rec-line`, the same slot `.field-warn` occupies under a dimension row) instead
of trailing inline in parens - it only adds height under whichever option actually
earns it, the other option's row stays a clean 44px. The row-to-row hairline moved
from `.buy-line + .buy-line` to `.buy-item + .buy-item`, same reason `#fields`'
top-edge comment gives: it has to land above the whole item including any
`.buy-rec-line` under it, and not double up when there isn't one. The bag-size picker
(`.unit-picker--inline`) is unchanged in behaviour, just relocated from mid-sentence
("44 × [20kg ▾] bags") to mid-label ("Number of [20kg ▾] bags").

**Wastage row typography** (Andre, mid-round: "same font and size"). `#wastage-current`
(the `+10%` chip) was weight 700 against `.ledger-label`'s plain 400 for the word
"Wastage" right next to it - same point size already, but the weight mismatch read as
two different treatments instead of one phrase. Dropped to 400 to match exactly.

**Native `<select>` font.** Andre also flagged the open preset list itself ("10% —
Recommended for standard site") reading in a different font to the rest of the row -
form controls don't inherit `body`'s font-family by default in most UA stylesheets.
Added one rule, `select { font-family: inherit; }`, covering every native `<select>`
in the app (shape, m/mm, bag size, wastage all use the same invisible-overlay-select
technique) rather than repeating it per component. Effective on desktop browsers that
render a `<select>`'s dropdown from CSS; iOS's own picker wheel is OS-drawn and out of
CSS's reach regardless, but it already renders in SF Pro there (what `body`'s own font
stack asks for anyway) - no mismatch on the actual target hardware either way.

Playwright-verified: confirmed the new text order (`Ready-mix` → `2.2 m³` →
`(Recommended)` → `Number of` → `20kg` → `bags` → `220`) against Andre's exact mockup
numbers (Length 5m / Width 2m / Thickness 200mm / 10% wastage → matches his `2.2 m³`
example precisely); confirmed `(Recommended)` correctly follows whichever option wins
by testing a small-volume case (bags recommended instead of Ready-mix) and seeing the
tag move to the bottom of the bags row instead. Screenshotted both light and dark
theme for both scenarios.

## Delta: v22.6 - "Base volume" renamed to "Base quantity" (2026-08-12)

Andre's ask: does `Base quantity` read better than `Base volume`? Agreed and applied -
`Order quantity` (the row it builds up to) already uses "quantity", not "volume", so
`Base volume` was the one row using different terminology for the same kind of
number. Now both ends of the ledger share the word: `Base quantity` → `+ N% Wastage`
→ `Order quantity` reads as one continuous equation instead of two different nouns
for figures measured the same way (m³). Text-only change (`ledgerRow('Base volume',
...)` → `ledgerRow('Base quantity', ...)` in `renderResults()`), no structural/CSS
change. Historical references to "Base volume" describing what shipped at the time
(e.g. v22.1's own delta note above, quoting Andre's original written-out mockup) were
left as-is; comments describing current behaviour were updated to match.

## Delta: v22.7 - Bottom-hairline attempt on the last row, reverted (2026-08-12)

Andre's report, from a screenshot: "the last row in the dimensions card... doesn't
matter what it's called, we need to fix the last row of any card." Tried closing off
the last row of `#fields`/`#options` with a hairline on each list's own bottom edge
(mirroring the existing top-edge one), on the theory that every row genuinely measures
44px and the last one just reads bigger from having no line below it to close it off.
**Reverted** - Andre's follow-up was explicit: he didn't ask for a line under
Thickness, and wants the row's actual height reduced, not a new divider added. Root
cause still not found as of this entry - two rounds of code-level checking (CSS specs,
`renderFields()`, no last-child special-casing anywhere) turned up nothing that would
make the last row taller, but Andre's own preview (VSCode's built-in preview, not this
app's own `dev-server.py`) is showing something this session hasn't reproduced or
explained yet. Left as an open item rather than guessed at further.

## Delta: v22.8 - "Perfect IA" pass on the results card (2026-08-12)

Andre asked for an IA rating of the results card, then a flat-image mockup of what
"perfect" would look like, then "do it." Three changes, addressing the weakest points
from that rating:

**Symmetric section captions.** The ledger half of the card (`Base quantity`/
`Wastage`/`Order quantity`) had no eyebrow caption of its own while `Buying options`
did - one half of the card named itself, the other didn't. Added `Volume` as a static
caption above `#volume-breakdown`, same `.tv-label` treatment, same relationship
`.output-order` already has with its own caption. `index.html` restructured so
`#volume-breakdown` is a child of `.tv-section` rather than *being* `.tv-section` -
the id used to sit on the outer div (fully replaced by `renderResults()` each render,
which would have wiped a static caption placed inside it); now the caption is a
sibling that survives every re-render, exactly how `Buying options`/`#options`
already relate.

**"Number of [20kg] bags" trimmed to "Bags [20kg]".** The one sentence-fragment label
left over from the pre-v22.5 prose version - every other row in the card is a short
noun phrase (`Ready-mix`, `Wastage`, `Order quantity`). No behaviour change, same
picker, shorter wrapper text.

**Editable controls coloured `--diagram-accent` blue.** The rating's biggest flagged
gap: Wastage's `+10%` chip and the bag-size `20kg` chip were plain black text,
distinguished from the card's static figures (`Base quantity`, `Order quantity`,
`Ready-mix`) only by a small chevron glyph - nothing told a first-time reader which
numbers were theirs to change. Both chips (and their chevrons) now use the app's one
existing accent colour - the same "you're editing this" signal the diagram highlight
and focused-field ring already use - so a control reads as a control at a glance, the
same way a hyperlink reads inside a sentence. `.unit-picker-chevron`'s colour change
was scoped to `.unit-picker--inline` specifically (not the base rule), since that
class is shared with the Inputs card's m/mm toggle, which was out of scope here and
keeps its existing `--text-secondary` chevron.

Playwright-verified: screenshotted the exact scenario from the rating (Length 5m /
Width 2m / Thickness 200mm / 10% wastage) against the mockup, both light and dark
theme - caption, label, and colour all match. Confirmed the pre-completion state
(fresh load, no draft) still renders correctly: `Wastage` control present and
reachable, `Order quantity` placeholder greyed, `Buying options` showing its
empty-state message - none of the three changes altered that path.

## Delta: v22.9 - "(Recommended)" now gives a reason (2026-08-12)

Andre's point: that line already spends a whole row on itself, so it should say why,
not just repeat the tag ("ie Recommended. Much less labour and.... etc"). `getRec()`'s
0.5 m³ threshold has a genuine reason on each side of it - a ready-mix truck has a
practical minimum load (uneconomical to send a truck for a tiny pour), hand-mixing
bags has a practical labour ceiling (nobody wants to hand-mix a truck's worth) - so
`recLine()` now looks the reason up per option (`REC_REASON = { ready: ..., bags: ...
}`) instead of taking a plain boolean. Line reads `Recommended. Far less labour than
mixing bags.` or `Recommended. No minimum order to meet.` depending which option won.
Same `.buy-rec-line` slot/colour as before; added `line-height: 1.35` and confirmed no
`white-space: nowrap` is set, since the longer text can now wrap to two lines on a
narrow phone without a nowrap rule fighting it - `.buy-item` isn't height-constrained
(only `.buy-line`'s own 44px is fixed), so a second line just grows the item, same as
`.field-warn` growing `.field-row` under a caution.

Playwright-verified: confirmed both reasons render and each follows the option that
actually earns it - a large-volume slab (5m/2m/200mm) shows `Recommended. Far less
labour than mixing bags.` under Ready-mix; a small one (1m/1m/100mm) shows
`Recommended. No minimum order to meet.` under Bags instead. Screenshotted both.

## Delta: v22.10 - Focus ring clipped on count fields, fixed (2026-08-12)

Andre's report: "quantity focus ring is being clipped on right side." Regression
from v22.3's count-field right-edge fix (above) - `.field-val.focused::after`'s ring
was drawn `left:0; right:0` relative to `.field-val`'s own box, then a 2px
`box-shadow` spread bled 2px past that box on every side. Invisible on a normal
dimension row, where the neighbouring unit-picker/wastage-pulldown (6px gap plus its
own width) easily absorbed 2px before `.field-line`'s own `overflow: hidden` boundary
- but v22.3 dropped a count field's old invisible unit-picker placeholder specifically
so its value sits flush against the row's *true* right edge, which also removed the
buffer the ring's bleed had been relying on. Result: the ring's right edge landed
exactly on `.field-line`'s clip boundary and got cut flat, no rounded corner, visible
on Quantity (Column/Pier) and Steps (Stairs) - any count field, any shape.

Fix: inset the `::after` by 2px on `left`/`right` too (was already 4px top/bottom, for
the ring's height), so the box-shadow's 2px outward spread lands back exactly on
`.field-val`'s own edges - net zero bleed - rather than past them. Ring's own visible
size is unchanged (91×36px content-box collapsing to the same ~96×40px outer edge as
before, just now genuinely contained inside `.field-val` instead of relying on
whatever sat next to it for room). No longer depends on a neighbour existing to have
somewhere to bleed into.

Playwright-verified: reproduced on Column's Quantity field (the original report),
confirmed the ring now shows a proper rounded corner on all four sides instead of a
flat-cut right edge; confirmed Diameter's ring (a normal dimension row, had a
unit-picker neighbour, was never actually clipped) is visually unchanged since the 2px
shift nets to zero; re-checked on Stairs' Steps field in dark theme for a second shape/
theme combination.

## Delta: v22.11 - Trying Buying options with a lavender fill again (2026-08-12)

Andre was mid-way through a bigger question (whether to collapse the whole Buying
options section to one plain sentence - see the cancelled question above) and
pivoted: "try buying options with the lavender background" instead. An experiment,
not a settled call - noting that explicitly since it reverses v22.1's "flat ledger"
decision for this one section.

Brought back `--results-light-bg` (pale lavender `#EEF2FF` light theme, dark
desaturated blue-violet `#211F3D` dark theme - same token, same values v22 shipped
with originally, removed in v22.1) and applied it to `.output-order` only - the
ledger above (`Volume`/`Base quantity`/`Wastage`/`Order quantity`) stays flat
`--surface-1`, this wasn't a return to v22's two-tone dark-blue-top treatment, just
the Buying options half getting a fill again. Dropped `.output-order`'s hairline
while the fill's active, same reasoning v22 used the first time: a colour change and
a hairline marking the same boundary is double signage.

Playwright-verified: screenshotted both light and dark theme against the
`Base quantity 2.0/Wastage +10%/Order quantity 2.2` scenario used throughout this
round's other deltas - fill renders, seam reads clearly without the hairline, blue
control/recommended text (Wastage's `+10%`, Bags' `20kg`, `Recommended. Far less
labour...`) still reads against the new background in both themes at a glance.

## Delta: v22.12 - Buying options split horizontally (2026-08-12)

Andre's ask, after the lavender-fill try above: "split buying options horizontally."
Ready-mix and Bags stop stacking as two label-left/value-right rows (`.buy-item`) and
sit side by side instead, one `.buy-col` each inside a new `.buy-split` flex row,
divided by a vertical hairline (`.buy-col + .buy-col`, same 0.5px weight as every
other hairline in the app, just on the `left` edge instead of `top`) instead of the
horizontal one `.buy-item` used.

Each column is label-above-value now, not label-left/value-right - there's no room
for that inside a ~170px-wide half of the card. `justify-content: center` on each
`.buy-col` so the two columns land on the same visual centre regardless of content
length - Ready-mix usually carries a `.buy-rec-line` reason under it and Bags usually
doesn't (or vice versa, whichever wins), so without centring the shorter column would
sit top-anchored with dead space under it while the taller one filled the row.
`.buy-rec-line` unchanged in content, just re-anchored (`margin-top` replacing the old
`padding-bottom`) and left to wrap naturally in the narrower column - confirmed on
both scenarios (Ready-mix recommended, Bags recommended) that it still reads clearly
and the columns still balance around the same centre either way.

Playwright-verified: screenshotted both the Ready-mix-recommended scenario (Length 5m/
Width 2m/Thickness 200mm) and the Bags-recommended one (1m/1m/100mm), both light and
dark theme - split renders, vertical hairline sits cleanly, `(Recommended)` text
follows the correct column and wraps without breaking the layout.

## Delta: v22.13 - Wastage row baseline fix, then corrected same day (2026-08-12)

Andre's report: "all on same base line: Wastage +10% x.x m3" - the row's three pieces
(the plain text "Wastage", the `+10%` chip, and the `0.2 m³` value) weren't sharing a
text baseline. First attempt touched two rules:

- `.ledger-row`: `align-items: center` → `align-items: baseline`, reasoning that
  baseline is the rule actually meant for lining up text, center just happens to look
  right when both sides are the same size.
- `.wastage-pulldown` (the `+10% ▾` chip): `vertical-align: middle` →
  `vertical-align: baseline`, so the chip stops floating at the line's vertical centre
  and shares "Wastage"'s baseline instead.

**The `.ledger-row` half was wrong and got reverted within the hour** - Andre's
follow-up: "you messed up the vertical spacing," with a screenshot showing uneven
gaps around each row. Cause: `align-items: baseline` on a *fixed*-height (44px) flex
row doesn't centre content the way `center` did - it positions each row's content
based on where *that row's own* baseline falls, which depends on that row's own
content (Order quantity's bold, larger `--text-m` value gives it a different baseline
position than Base quantity's/Wastage's plain `--text-s` text), so the three rows
stopped lining up with *each other* even though each one's own text was now
internally coherent. Reverted `.ledger-row` back to `align-items: center` - confirmed
by measuring each row's label/value padding above and below their own text (12px/
12px, 12px/12px, 10.5px/10.5px for the three rows respectively - all symmetric, i.e.
all centred consistently, the `Order quantity` row's smaller number reflecting its
bigger text taking more of the same 44px, not an alignment difference).

**The `.wastage-pulldown` half was correct and stayed** - `vertical-align` on an
inline-flex box works against the surrounding *text's* baseline directly, inside
`.ledger-label`'s own inline formatting context, entirely independent of how
`.ledger-row` (a different, outer flex context) aligns its two top-level children.
Fixing the Wastage-internal alignment never actually needed the `.ledger-row` change
alongside it - one rule was solving the real problem, the other was solving a problem
that didn't exist yet and created one that did.

Playwright-verified (both rounds): first confirmed "Wastage"/"+10%"/"0.2 m³" sitting
level via a tight 3x-scale crop; after the revert, re-measured all three ledger rows'
internal padding (symmetric, confirming row-to-row rhythm restored) and re-shot the
Wastage row crop again to confirm the internal baseline fix survived the revert -
both hold at once. Checked in both light and dark theme.

## Delta: v22.14 - Buying options become two tiles, number-first, no reasoning line (2026-08-12)

Andre's ask, written out - "1.0 m3 / Ready-mix", "16 / 25kg bags", "make the blue
cards within the larger white card", "remove recommended line". Three changes:

- **Number leads each tile**, label follows below it - reverses v22.5's label-first
  call for Buying options specifically (third reversal of this exact question this
  round; noting it, not re-litigating it).
- **Each option is its own card** (`.buy-tile`, lavender fill, own rounded corners)
  sitting inside `.output-order`, which reverted to flat `--surface-1` (its hairline
  seam came back too) - "blue cards within the larger white card." `.buy-split`'s
  vertical hairline between the two halves is gone, replaced by an 8px gap between
  the two tiles, since they're discrete cards now, not one background split by a line.
- **`(Recommended)` and its reason line are gone entirely.** Both tiles present
  neutrally; `getRec()` itself is untouched (docket text, `calc_complete` analytics
  still use it), only its visible reasoning in this card is gone.

Playwright-verified: screenshotted both recommendation scenarios, both themes -
tiles render, number-first order confirmed, no reasoning text anywhere in the DOM.

## Delta: v22.15 - "Dimensions" eyebrow caption added, then moved to the card's top-left (2026-08-12)

Shipped in two steps same round. First: added a `.tv-label` "Dimensions" caption
directly above `#fields` (mirroring "Volume"/"Buying options" in the Outputs card),
wrapped in a new `.fields-section` so it sat tight against the field list the same
way those captions sit tight against their own content, and dropped `#fields`' own
top-edge hairline (the caption did that seam-marking job instead).

Andre's follow-up, same round: "Dimensions eyebrow at top left of card" - moved out
of `.fields-section` entirely, to the very top of `.inputs-card`, above even the
Shape heading. It's a card-level title now (matching how "Volume"/"Buying options"
each name their whole section), not scoped to the dimension rows specifically.
`.fields-section` wrapper removed (no longer needed - the caption isn't adjacent to
`#fields` any more), and `#fields`' top-edge hairline came back, since nothing now
sits directly above it to mark the Diagram→dimension-list seam on its own.

Playwright-verified: confirmed `.inputs-card`'s child order is `tv-label` →
`shape-heading` → `diagram-area` → `#fields`, both themes screenshotted.

## Delta: v22.16 - Inputs card type size matched to Outputs card (2026-08-12)

Andre's ask: "make the text and numbers in the top dimensions card the same as the
lower card i.e. type small." `.field-label`, `.field-val`, `.unit-picker-current`,
and `.unit-picker-chevron` all stepped down from `--text-m` (20px) to `--text-s`
(17px) - matching `.ledger-row`'s size in the Outputs card below, so both cards read
at one consistent body size instead of the Inputs card's rows sitting a visible step
larger. Weight (600) untouched - only size was named ("text and numbers"), and
label/value staying bolder than the Outputs ledger's plain 400 still marks these as
the editable fields they are. Box dimensions (96px value width, 44px row height)
left alone - only the type itself shrank, not the layout around it.

Playwright-verified: screenshotted both themes, confirmed the focus ring (see
v22.10's fix) still renders correctly at the smaller text size.

## Delta: v22.17 - Bag size becomes three buttons; 2-decimal ledger precision (2026-08-12)

Two asks in one round:

**Bag size buttons.** "75 bags / 20kg 25kg 30kg - these are buttons (20 default)."
The native-select `.unit-picker--inline` chip ("[20kg ▾] bags", sat inline in the
tile's label) is gone, along with that now-fully-unused class and its two sub-rules.
Bag count and the word "bags" now read as one phrase in the tile's number slot
("220 bags"), and three real `<button>`s sit underneath (`.bag-size-buttons`,
toggle semantics via `aria-pressed`, not `role="radio"` - simpler, doesn't imply
arrow-key nav between them, each stays its own Tab stop). Selected size fills solid
`--diagram-accent` blue. This is the segmented-control approach v21 tried once as
"all three sizes as their own row" and reverted for the one-pill picker - reversing
that reversal here at Andre's own explicit request.

**2-decimal ledger.** "2 dec places for these rows: Base quantity / Wastage / Order
quantity." Was `toFixed(1)`, which collapsed genuinely-different small volumes to
the same displayed figure (0.05 m³ and 0.14 m³ both read "0.1 m³"). Now
`toFixed(2)` on all three ledger rows (and the pre-completion placeholder, "0.00 m³"
not "0.0 m³"). Ready-mix/bags in Buying options untouched - Andre named these three
rows specifically, and `readyOrder()` already rounds to its own 0.1 m³ delivery
increment, so a second decimal there wouldn't reflect anything a truck can actually
deliver.

Playwright-verified: clicked each bag-size button, confirmed `state.bagSize`/count/
`aria-pressed` all update correctly and only one button carries `.is-selected` at a
time; confirmed ledger renders `2.00 m³`/`0.20 m³`/`2.20 m³` for the round's test
scenario. Both themes screenshotted.

## Delta: v22.18 - Whitespace under Buying options (2026-08-12)

Andre: "need to have some whitespace under Buying options to the card below." The
two `.buy-tile`s carry their own lavender fill (v22.14), which reads visually
heavier than a plain text row, so `.output-order`'s uniform 12px padding started
feeling tight specifically underneath them, right before Copy/Share. Bumped to
`padding: 12px 12px 20px` - only the bottom edge changed; top/left/right stay 12px,
matching every other section's padding elsewhere in the app.

## Delta: v22.19 - Share button no longer says "Copied" (2026-08-12)

Andre: "Share button should not say Copied when pressed." On desktop (no
`navigator.share` support), Share falls back to copying the docket text to the
clipboard - an honest fallback, but the flash-label confirmation reused the literal
word "Copied," which read like the Copy button's own confirmation landing on the
wrong button rather than an explanation of what Share just did. Changed to
"✓ Ready to paste" - still accurate (the content is on the clipboard), no longer
confusable with Copy's own message. The `navigator.share` success path is unchanged
(no flash label there at all, just `track()` - the OS's own share sheet is
confirmation enough).

Playwright-verified: forced the no-`navigator.share` fallback path and confirmed
`#shareLabel` reads "✓ Ready to paste" after click; confirmed `#copyLabel` still
reads "✓ Copied" via the Copy button, unaffected.

## Delta: v22.20 - Share stays silent; more Buying-options whitespace (2026-08-12)

Two follow-ups on v22.19/v22.18:

**Share drops its flash label entirely.** Andre: "Share doesn't need anything said,
as it will pop up a share options screen. That is enough for confirmation." The
`navigator.share` success path already had no flash label (v22.19); the desktop
clipboard-fallback path (no Web Share API) still had "✓ Ready to paste" from that
same round - removed now too, so Share is silent either way rather than being the
one case where the button says something a working share sheet never gets to say.
Desktop clipboard fallback still happens, just without a text confirmation of it.

**Buying options' bottom padding, second pass.** v22.18's bump to 20px still read as
"sits directly on the card below" (Andre's repeat of the same complaint). Bumped
again to 28px - a clearly bigger step this time rather than another small nudge.
Noted in the CSS comment: if 28px still isn't enough, the next lever isn't a bigger
number here, it's the "should Buying options be its own card" question from the
chat immediately before this - that would add a full ~36px of chrome in one
structural move rather than continuing to tune one edge's padding.

Playwright-verified: confirmed `#shareLabel` reads unchanged ("Share") after a
forced fallback-path click; screenshotted the card in both themes to eyeball the
28px gap against the 12px used everywhere else in the app.

## Delta: v22.21 - Light theme: page/card relationship reversed to white bg, off-white cards - reverted same round (2026-08-12)

**Reverted in full** ("undo that") shortly after shipping - `--bg`/`--surface-1`/
`--surface-2` back to `#f2f2f7`/`#ffffff`/`#f2f2f7`, and every `theme-color`/manifest
reference back to `#f2f2f7`, undoing all of the below. Left as a record of what was
tried, same as this file's other reverted attempts (v22.7, v22.13's first pass).

Andre's ask, with a reference screenshot of a different app's card style: "make BG
white and the cards off white. This image has the color refs." Light theme's
`--bg`/`--surface-1` relationship flips - was a light cool-grey page (`#f2f2f7`)
with pure white cards on top (cards read brighter than the page); now the page is
white and cards are a warm, slightly toned-down off-white sitting on it (cards read
as a soft layer under full white, not a bright one lifted off grey). `--surface-1`'s
new value (`#F7F5F1`) is a visual estimate read off the reference screenshot, not
colour-picked from a file - worth a side-by-side check against the actual source if
a real swatch turns up later. `--surface-2` (the header's own background, meant to
sit seamless with the page) moved to match the new `--bg` for the same reason it
matched the old one. `--surface-3` and the border tokens (still the app's old cool
greys) weren't touched - not part of what was asked, but worth a look if they start
reading mismatched against the new warm tones.

Also updated: the `theme-color` meta tag (static + the inline light/dark switch
script) in `index.html`, all seven shape-redirect stub pages
(`concrete-slab-calculator.html` etc.), and `manifest.webmanifest`'s
`background_color`/`theme_color` - so the browser chrome, home-screen icon
background, and splash screen all match the new white instead of the old grey.

Dark theme untouched - Andre's ask and reference image were both light-theme
specific, and dark theme already has this same directional relationship (`--bg`
black, `--surface-1` a lighter `#2c2c2e` card on top of it), just never phrased that
way before.

Playwright-verified: screenshotted light and dark theme against the round's usual
test scenario - light theme shows the new white page/off-white card relationship
correctly, dark theme render is pixel-identical to before (only `:root` tokens
touched, not `[data-theme="dark"]`).

## Delta: v22.22 - Light theme colours inverted: white bg, grey cards (2026-08-12)

Andre's ask, right after v22.21's revert: "invert colours. make bg white and the
cards the grey." Simpler than v22.21's attempt - no new colour, the two existing
tokens just swap values outright: `--bg: #ffffff`, `--surface-1: #f2f2f7` (was the
other way around). `--surface-2` (the header's own background) follows `--bg` down
to white, same "stays seamless with the page" relationship it's always had.
`theme-color` meta (index.html + all seven shape-redirect stubs) and
`manifest.webmanifest`'s `background_color`/`theme_color` updated to match, same set
of files v22.21 touched. Dark theme untouched (only `:root` edited).

Playwright-verified: `getComputedStyle` confirmed `body` background is now
`rgb(255,255,255)` and `.inputs-card` background is `rgb(242,242,247)` - the exact
swap, not a new colour. Screenshotted both themes.

## Delta: v22.23 - Buying options tiles flattened; hairline divider instead (2026-08-12)

Andre's ask: "remove the blue cards in buying options. Just have divider between the
options." The lavender fill and rounded corners on `.buy-tile` (added v22.14, "blue
cards within the larger white card") are gone - each tile is a plain block again.
The 8px gap between the two tiles is gone too, replaced by a real hairline
(`.buy-tile + .buy-tile`, the same `0.5px` `--border` weight every other row-to-row
seam in the app already uses - `#fields`, `.ledger-row`, `.field-row`). `.buy-tile`'s
own horizontal padding dropped to `0` (was `12px`, doubling up with `.output-order`'s
own 12px side padding now that there's no card box needing its own inset) - vertical
padding (`12px`) stayed, giving the divider some breathing room on both sides.
Buying options now reads as the same kind of grouped list the rest of the card
already settled on, rather than the one part still using colour-blocking.
`--results-light-bg` is unused again as of this change (third time this token's gone
idle - v22.1, and now this) - left defined rather than stripped again, given how
often "give Buying options a fill" keeps coming back up.

Playwright-verified: screenshotted both themes - flat rows, hairline divider between
Ready-mix and the Bags line, bag-size buttons and their blue selected state
unaffected (those were never part of `.buy-tile`'s own fill).

## Delta: v22.24 - UI tighten pass (Designer) (2026-08-12)

Andre asked Designer to fix the highest-impact tighten list without a full layout
rewrite. Six small hierarchy/contrast fixes; Share clipboard flash left alone
(v22.20 already chose silent fallback after trying "✓ Ready to paste").

**Wastage control quieted.** Idle "+10% Wastage" was entire-phrase `--diagram-accent`
blue and outshouted Order quantity. Row is label-first again (`Wastage` plain
`.ledger-label` text, control shows `+10% ▾` only). Idle colours match unit pickers
(`--text-primary` + `--text-secondary` chevron) - accent reserved for real focus
rings elsewhere, not this chip's resting state.

**Recommendation restored on Buying options.** `getRec()` was still deciding for
docket/analytics; the visible reason line from v22.9 is back on the winning tile
only (`Recommended. Far less labour than mixing bags.` / `Recommended. No minimum
order to meet.`). Dead band (~0.5 m³, `getRec()` null) keeps both tiles neutral.
Non-winner gets a light demote (muted text / softer weight) - still hairline
grouped-list language, no lavender fill return.

**Bag-size chips contrast on grey cards.** Unselected `.bag-size-btn` was
`--surface-1`, same as the card after the v22.22 invert - blended away. Now
`--bg` (white light / black dark) so chips read on the card; selected stays filled
accent.

**Empty Order quantity** shows `—` (with `is-empty`), not `0.00 m³`.

**theme-color** in `applyTheme()` light path matches current `--bg` (`#ffffff`),
not the pre-invert grey `#f2f2f7`. Static meta in `index.html` was already white.

## Delta: v22.25 - Recommendation copy (Andre) (2026-08-12)

Winning Buying-options tile reason lines revised to Andre's chosen copy; the
`.buy-rec` line is the reason alone (drop the old `Recommended.` prefix — the
winning tile already carries the decision via `is-recommended`):

- Ready-mix: `Less mixing. One pour.`
- Bags: `No truck minimum.`

`getRec()` / dead-band / demote behaviour unchanged from v22.24.

## Delta: v22.26 - IA pass: Job / Order / Buy + pinned Order strip (2026-08-12)

Designer / Andre target IA implemented on app-v22:

**Card eyebrows renamed.** Inputs `Dimensions` → **Job**; volume ledger `Volume` → **Order**; `Buying options` → **Buy**. Matching `aria-label`s updated on those cards / `#options`.

**Pinned Order strip.** Thin strip between `.header` and `#scroll-area` (shell flex: header / pin / scroll / keypad — not inside the scroll area), always showing the current order answer while the keypad is open:
- Primary: `Order X.XX m³`, or `Order —` when incomplete
- Secondary (quiet): recommended buy from `getRec()` — e.g. `2.2 m³ ready-mix` or `220 × 20kg bags`; dead-band / null uses the ready-mix figure (first Buy option) as a quiet cue
- Updated from `renderResults()` alongside the Order ledger and Buy tiles

This is the platform-oriented **"answer visible while editing"** implementation via a top pin under the header (rather than pinning the full Order card).

**Hero Order quantity.** `.ledger-total` / Order quantity figure bumped toward `--text-l` so it reads stronger than Base / Wastage. Wastage control stays quiet (v22.24).

**Buy card** recommendation behaviour and v22.25 copy unchanged (`Less mixing. One pour.` / `No truck minimum.`; no `Recommended.` prefix; rec under bags figure, then bag size buttons). Empty-state copy still works; names the first missing field when easy.

No lavender buy tiles, no Share flash, no volume maths / `getRec()` threshold changes.

## Delta: v22.27 - Pinned mini Order ledger; scroll Order card removed (2026-08-12)

Pinned section becomes the **mini Order ledger** (Base / Wastage control + amount / Order quantity), not the one-line "Order X.XX m³ + buy cue" strip from v22.26.

- `#order-pin` hosts `.pin-ledger` (`#pin-ledger`) with the same ledger rows / `wastageLedgerRow()` / `renderWastagePulldown()` wiring that used to fill `#volume-breakdown`
- Scroll **Order** `.output-card` removed so there is only one wastage `<select>` in the DOM
- Buy cue removed from the pin; **Job** and **Buy** stay in `#scroll-area`
- `role="status" aria-atomic` moved onto `#pin-ledger`
- Pin is a compact grey card (can grow past 44px for 3 mini rows); Order quantity stays the hero of the mini stack

Structure: header → `#order-pin` (mini Order) → `#scroll-area` (Job, Buy, check-strip, Copy/Share, footer) → keypad.

No `getRec` maths or Share behaviour changes.

## Delta: v22.28 - Order card back under Job; pin one-line only (2026-08-12)

Andre: the v22.27 mini ledger in the pin was too big. Restore preferred IA:

- **Order card returned** in `#scroll-area` under Job (Base quantity, Wastage control, Order quantity) via `#volume-breakdown` — full ledger, not mini-in-pin.
- **Pinned top stays one line** — `#order-pin` primary `Order X.XX m³` (incomplete: `Order —`) plus optional quiet secondary buy cue when complete; ~44px feel. No Base/Wastage/Order mini stack in the pin.
- `renderResults()` fills `#volume-breakdown` again (single `#wastage-select`) and updates pin primary/secondary from the same results.
- Tall `.pin-ledger` styles removed; slim `.order-pin` / `.order-pin-primary` / `.order-pin-secondary` restored.

Structure: header → `#order-pin` (one-line summary) → `#scroll-area` (Job, Order, Buy, …) → keypad.

Job/Buy names, recommendation copy, hero Order quantity in the Order card, quiet wastage — kept. No `getRec` maths changes.

## Delta: v22.29 - Pin is Order quantity only (2026-08-12)

Pin primary only: `Order X.XX m³` or `Order —`. Ready-mix/bags cue removed from `#order-pin` (was duplicate of Buy and showed a conflicting rounded ready-mix figure next to Order). Order card + Buy card unchanged.

## Delta: v22.30 - Top Order pin removed (2026-08-12)

Pin removed; Order card under Job is the sole order readout (Andre: repeated top answer was distracting). Users scroll to the Order ledger. Job / Order / Buy cards, ledger, wastage, Buy recommendations unchanged.

## Delta: v22.31 - Designer 9/10 pass (UI / IA / UX; no pin return) (2026-08-12)

Tightening pass toward Designer 9/10. **No top Order pin restored** — Order card under Job remains the sole ledger (v22.30 stands).

**UI**
- Order hero punch: Order quantity (`.ledger-total .qty-figure`) keeps `--text-l`, heavier weight + tracking; Base/Wastage rows quieted to `--text-secondary`.
- Bag chips contrast: unselected `.bag-size-btn` stronger 1px `--border-strong` on `--bg`; dark theme lifts unselected chips with `--surface-3` + `--border-accent` so they read on dark cards.
- Keypad backspace: system `⌫` outline box replaced with light Tabler-style `#i-backspace` SVG (`.key-back-ico`).
- Dark card separation: `--surface-1` nudged to `#303033`; calm 0.5px hairline shadow on `.inputs-card` / `.output-card` in dark only.

**IA**
- Buy empty copy shorter/friendlier: `Add length to see Buy.` (sentence case; names first missing required field for every shape).
- Bag size sub-control: muted `Bag size` caption above chips + extra margin so chips read under Bags, not as part of the rec reason.
- SEO stubs honesty: `round-pad-calculator.html` no longer claims a real Round Pad calculator — clarifies it opens Slab / Pad (no round/pad shape in `shapes`; redirect stays `?shape=slab`). Other `*-calculator.html` stubs already matched shape ids.

**UX (no top pin)**
- ~~When the custom keypad is open, `ensureOrderVisibleAboveKeypad()` keeps the Order card peeking above the keypad…~~ **Superseded by v22.46** — that auto-scroll hid the Job diagram while editing dimensions; removed.


## Delta: v22.32 - Buy eyebrow → Supply (Andre) (2026-08-12)

Andre's choice: card eyebrow **Buy** → **Supply**. Updated `.tv-label`, matching `aria-label`s on the Supply `.output-card` / `#options`, and empty-state copy (`Add … to see Supply.`). Job / Order unchanged; internal CSS class names (`.output-order` etc.) unchanged.

## Delta: v22.33 - Supply marks (Andre) (2026-08-12)

Supply Ready-mix / Bags tiles: **blue check** (`#i-check`, `.buy-mark--win` → `--diagram-accent`) on the recommended option; **empty circle** (`#i-circle`, `.buy-mark--alt` → `--text-muted`) on the other. Dead band (`getRec` null ~0.5 m³): empty circle on **both** (neither wins). Icon + val on one flex row; reason / bag-size full-width under. Marks `aria-hidden`; winning tile gets optional `aria-label`. Sprite adds `#i-circle`. No order-pin restore; Supply eyebrow kept.

## Delta: v22.34 - removed check/circle marks; 9pt Recommended badge + reason on winner (Andre) (2026-08-12)

Removed `buyMark()`, `.buy-tile-head`, `.buy-mark` / `.buy-mark--win` / `.buy-mark--alt`, and unused sprite symbols `#i-check` / `#i-circle`. Flat Supply tile again: `buy-tile-val`, then (winner only) a tiny `.buy-rec-badge` ("Recommended", ~9px / 9pt, weight 600, slight letter-spacing, `var(--diagram-accent)`, title case) then existing `.buy-rec` reason. Dead band / loser: no badge, no reason. Layout on winner: val → badge → reason (→ bag chips on Bags). Supply eyebrow kept; no order-pin.

## Delta: v22.35 - bordered Supply cards; accent border + edge Recommended badge on winner; reason kept (Andre) (2026-08-12)

Ready-mix and Bags are discrete `.buy-tile` cards again: `1px` `var(--border)` + `border-radius: var(--radius-sm)`, padding ~10–12px, `8px` gap between tiles. Removed the `.buy-tile + .buy-tile` inset hairline separator (fought card borders). Winner (`is-recommended`): stronger accent border `var(--diagram-accent)` at ~1.5px (selected card — not a focus-visible / a11y-focus ring). `.buy-rec-badge` moved to the **top edge** of the winning card (`position: absolute; top: 0; transform: translateY(-50%); left: 12px` on a `position: relative` winner) as a light pill (`--bg` + accent outline/text) that interrupts the border. Reason line stays under the figure in content flow. Loser / dead band: equal hairline borders, no badge, no reason. Bag size block still inside Bags tile. Supply eyebrow kept; no order-pin.

## Delta: v22.36 - Recommended badge top-right, inverted white-on-blue (Andre) (2026-08-12)

`.buy-rec-badge` on winning Supply card: **top-right** (`left: auto; right: 12px; top: 0; transform: translateY(-50%)`), inverted pill — fill `var(--diagram-accent)`, text `var(--accent-text)`, accent border; ~9px / pill shape unchanged. No other IA changes.

## Delta: v22.37 - badge removed; Recommended. restored in reason line; accent outline kept (Andre) (2026-08-12)

Removed `.buy-rec-badge` render + CSS. Winner reason is again `Recommended. ` + `REC_REASON` in `.buy-rec` (Ready: `Recommended. Less mixing. One pour.` / Bags: `Recommended. No truck minimum.`). Kept Supply eyebrow, demoted loser, borders on both tiles, and accent outline on `.buy-tile.is-recommended`. Dropped `.buy-split` padding-top hack that only existed for the edge badge.

## Delta: v22.38 - ready-mix no longer floors at 1.0 m³; ceil to 0.1 only (Andre) (2026-08-12)

`readyOrder()` previously ceiled to the nearest 0.1 m³ then floored any result under 1.0 up to 1.0 m³. That 1.0 minimum is gone — order volume is now only `Math.ceil(withWaste / 0.1) * 0.1` (e.g. 0.11 → 0.2, 0.95 → 1.0, 1.38 → 1.4). `getRec` threshold unchanged at 0.5.

## Delta: v22.39 - bags recommendation reason (Andre — positive bags framing) (2026-08-12)

`REC_REASON.bags` live copy: `No truck minimum.` → `Easy on a small job.` Winner line reads `Recommended. Easy on a small job.` Ready-mix reason unchanged (`Less mixing. One pour.`).

## Delta: v22.41 - bag size chips selected state greyscale (Andre) (2026-08-13)

`.bag-size-btn.is-selected` no longer uses `--diagram-accent` / `--accent-text` (filled blue). Greyscale now: `background`/`border-color: var(--text-primary)`, `color: var(--bg)` so selected chips read dark-on-light / light-on-dark with theme tokens. Supply winner accent outline (`.buy-tile.is-recommended`) left alone. Unselected chip styles unchanged.

## Delta: v22.42 - bag size selected chip middle grey (Andre) (2026-08-13)

Selected bag-size chip was near-black (`--text-primary`) / near-white text from v22.41 — too heavy. Now mid grey: `background`/`border-color: var(--border-accent)` (`#8e8e93` both themes), `color: #ffffff`. Clear middle-grey selected segment; Supply winner outline still `--diagram-accent`.


## Delta: v22.43 - bag size iOS HIG segmented control (Andre) (2026-08-13)

Bag-size chips (20/25/30kg) restyled as an iOS HIG segmented control in `shared/styles.css` only:

- `.bag-size-buttons` is the recessed track: `display: flex; gap: 0; padding: 2px; border-radius: var(--radius-sm); background: var(--surface-3)` (light). Dark track override `#2c2c2e` so the selected thumb can use `--surface-3` as the elevated segment.
- Unselected `.bag-size-btn`: transparent fill, no border, `color: var(--text-secondary)`, `flex: 1`, `border-radius: 6px` (tighter than track).
- Selected `.bag-size-btn.is-selected`: light `background: var(--bg)` (white thumb) + `color: var(--text-primary)` + `box-shadow: 0 1px 2px rgba(0,0,0,.12)`. Dark: `background: var(--surface-3)` + primary text + slightly stronger shadow (not mid-grey fill / not blue).
- `.buy-tile.is-demoted .bag-size-btn:not(.is-selected)` kept, muted further to `--text-muted`.
- Supply accent outline (`.buy-tile.is-recommended` → `--diagram-accent`) unchanged.

## Delta: v22.44 - Supply equalized — no recommended reasons/outline; user decides (Andre via Writer) (2026-08-13)

Supply Ready-mix / Bags tiles no longer show recommendation UI. Removed from
`renderResults` buy-tile markup: `recLine`, `.buy-rec` / buy-rec-badge, 
`is-recommended` / `is-demoted` classes, and aria-labels that say Recommended.
Both tiles keep the same quiet `1px solid var(--border)` card chrome (radius +
padding + gap). Each tile is name + quantity only (e.g. `1.0 m³ Ready-mix`,
`66 × 20kg bags`); bag-size HIG segmented chips stay under Bags.
`getRec()` / `REC_REASON` remain in JS for docket/analytics but are not rendered
on tiles — user decides.

## Delta: v22.45 - Designer review fixes; Supply stays equal / user decides (Andre) (2026-08-13)

Designer review follow-ups. **Recommendation UI not restored** (no reasons, accent winner, demote, or “Recommended.” on Supply tiles) — intentional product call; Supply stays equal.

1. **Docket / Copy-Share text** (`specText()`): stop using `orderPrimary` / primary-vs-alt for the shared sheet. List both supply options neutrally under `Supply options:` (Ready-mix then Bags via `readyLine` / `bagsLine`); remove the ranking “or”. Volumes / shape / date unchanged. `getRec` / `orderPrimary` remain for analytics only (`calc_complete`, `specTrackParams.recommended`).
2. **Bag-size chrome**: `.bag-size-block` `margin-top: 8px`; caption quieter — `margin-bottom: 4px`, `text-transform: none`, no heavy letter-spacing (sentence case “Bag size”).
3. **Empty Supply copy**: superseded by v22.60 — was `Enter {field} for supply figures.` / `Enter dimensions for supply figures.`; now `Add {field} to see supply.` / `Add dimensions to see supply.`
4. **Copy / Share hierarchy**: Copy stays filled accent; Share gets `spec-btn--secondary` (outline / `--border-strong`, `--bg` fill, `--text-primary`). Disabled states still readable.
5. **Supply tiles**: both `.buy-tile` get `background: var(--bg)` so they lift equally off the grey Supply card; equal `1px solid var(--border)` — no winner chrome.
6. **Keypad / Supply UX**: ~~keep `ensureOrderVisibleAboveKeypad`…~~ **Superseded by v22.46** (auto-scroll removed). No top pin.

## Delta: v22.46 - removed Order auto-scroll above keypad — was hiding Job diagram while editing dimensions (Andre) (2026-08-13)

`ensureOrderVisibleAboveKeypad()` (and callers on field focus / `renderResults` while the keypad was open / first `isComplete`) adjusted `#scroll-area` so Order peeked above `.keypad-wrap`. That push scrolled the Job axon diagram off-screen while editing Length/Width/Thickness.

**Change:** disable Order auto-scroll entirely. Functions left as unused no-ops; call sites removed from `focusField`, `renderResults`, `showKeypad`, and the complete-time path. Keypad itself unchanged. No top pin restored. User scrolls to Order.

### v22.46.1 follow-up — also drop `scrollIntoView` on field focus (Andre)

`focusField` still called `box.scrollIntoView({ block: 'nearest' })`, which could nudge the Job card when the keypad opened. Removed; focus/keypad logic unchanged.

## Delta: v22.47 - clean Copy/Share docket (Andre sketch, Designer polish) (2026-08-13)

`specText()` rewritten to a clean SPEC SHEET that mirrors the on-screen Order
ledger, then lists supply neutrally:

- Header `SPEC SHEET` once; `by SlabSet.online` only at the end (no brand under header).
- Date via `prettyDate`; Shape + fields loop unchanged; disclaimer kept.
- Volume block: `Base quantity` / `+{pct}% Wastage` / `Order quantity` at 3 decimals
  (sheet honesty for small pads; on-screen ledger stays 2). Wastage 0% still prints
  `+0% Wastage: 0.000 m³`.
- Supply: `readyOrder` + `toFixed(1)` ready-mix, then `Bags:` with real
  `bagCount(withWaste, 20|25|30)` lines using `×` (matches Bags tile). No
  primary/or/recommended ranking.
- Dropped unused `bagsLine` (single selected size); kept `readyLine`.
- `node --check` clean.

## Delta: v22.48 - wastage HIG segments + caption (Andre) (2026-08-13)

Order-card wastage control is no longer a native `<select>` pulldown
(`.wastage-pulldown` / `#wastage-select`). Replaced with an iOS HIG segmented
control in the same language as bag-size chips:

- Ledger header row: `Wastage` left, amount (`0.02 m³` or `—`) right.
- Full-width segment track under it: **0% / 5% / 10% / 15%** from `WASTE_OPTS`.
- Muted caption under the track: `WASTE_NOTES[pct]` for the selected value
  (e.g. "Recommended for standard site" at default 10%). Notes stay out of
  the segments.
- Click / `aria-pressed` wiring via `renderWastageSegments()` — same
  `vals.wastage` → `renderResults()` + `saveDraft()` path as the old select
  `onchange`. Incomplete state: amount still `—`; segments still usable.
- Markup originally used parallel `.wastage-segments` / `.wastage-seg` class
  names; the intended track/thumb CSS for those classes never landed in
  `styles.css` (dead `.wastage-pulldown` rules remained). Superseded by v22.49,
  which reuses Bags' shared classes instead of mirroring CSS.
- Live path no longer depends on `#wastage-select` / `.wastage-pulldown`.
- `node --check` clean.

## Delta: v22.49 - wastage reuses Bags HIG segment classes (Andre) (2026-08-13)

Wastage segments now literally reuse Bags' `.bag-size-buttons` / `.bag-size-btn`
(CSS for track/thumb shared). JS markup switched; intended layout-only rules via
`.wastage-block` / `.wastage-note` **did not stick in `styles.css`** (dead
`.wastage-pulldown` rules remained until v22.50).

- `wastageLedgerRow()`: segment container `bag-size-buttons`; each button
  `bag-size-btn` (keeps `is-selected`, `data-waste`, `aria-pressed`). Wrapper
  `.wastage-block`, header `.ledger-row.wastage-header`, caption `.wastage-note`
  (three-band stack — superseded by v22.50 compact row).
- `renderWastageSegments()` queries `.wastage-block .bag-size-btn` only so
  Supply bag-size chips are not double-wired. Click → `vals.wastage` from
  `data-waste` → `renderResults()` + `saveDraft()`.
- `node --check` clean.

## Delta: v22.50 - compact wastage one-row + caption (Andre) (2026-08-13)

Wastage picker used too much vertical space (44px header + full Bags track +
note). Collapsed to one dense row + caption. Also lands the missing v22.49 CSS
(superseded) and deletes dead pulldown rules.

- Markup: `.wastage-block[data-row=wastage]` → `.wastage-main` (flex: label |
  `.bag-size-buttons` flex:1 | amount) + `.wastage-note` caption. No
  `.ledger-row.wastage-header`.
- CSS: remove `.wastage-pulldown` / `#wastage-current` / `.wastage-chevron` /
  `.wastage-pulldown select`. Add `.wastage-block` / `.wastage-main` /
  `.wastage-note`; slightly denser `.wastage-block .bag-size-btn` only (Supply
  Bags unchanged). Hairlines via `.ledger-row + .wastage-block` /
  `.wastage-block + .ledger-row`. No extra horizontal inset beyond `.tv-section`.
- Kept: Bags HIG segment classes, default 10%, `WASTE_NOTES`, incomplete `—`,
  `renderWastageSegments()` on `.wastage-block .bag-size-btn`.
- `node --check` clean.

## Delta: v22.51 - wastage back to popup select (Andre) (2026-08-13)

Reverts v22.48–50 HIG segments. Restores the Order-ledger native `<select>`
pulldown (label-first row: `Wastage +10% ▾` … amount).

- Restores `.wastage-pulldown` / `#wastage-select` / `#wastage-current` /
  `.wastage-chevron` and `renderWastagePulldown()` (called from `renderResults()`
  each render; `#wastage-select` is rebuilt fresh).
- `wastageLedgerRow()` is a single 44px `.ledger-row` again: plain "Wastage"
  label + mid-label content-sized `+N% ▾` chip | amount (or `—`). Not v21's
  162px Inputs-card chip; idle colour matches `.unit-picker` (not accent).
- Default still **10%** (`WASTE_DEFAULT = 10`); options **0 / 5 / 10 / 15** with
  `WASTE_NOTES` in the `<option>` labels.
- Deletes `.wastage-block` / `.wastage-main` / `.wastage-note` and
  `renderWastageSegments()`. Hairlines via `.ledger-row + .ledger-row` again.
- `node --check` clean.

## Delta: v22.52 - ledger ink primary; weight for emphasis (Andre) (2026-08-13)

Order ledger Base / Wastage / Order all use `--text-primary` (no secondary grey on
the first two). Emphasis is font-weight only: `.ledger-total` Order label stays
bold (`700`); Base/Wastage remain `400`. Removed v22.31
`.ledger-row:not(.ledger-total) { color: var(--text-secondary); }`.
Empty `—` placeholders still use `--text-muted`. Order figure size/weight
(`.ledger-total .qty-figure`) unchanged.

## Delta: v22.53 - wastage closed state is `10%` not `+10%` (Andre) (2026-08-13)

Wastage closed-state chip (`#wastage-current` in `renderWastagePulldown()`) shows
`10%` not `+10%`. Menu `<option>` labels unchanged. Copy docket still uses
`+' + wastePct` for the wastage line.

## Delta: v22.54 - Copy/Share 44px; Supply ledger rows (Andre) (2026-08-13)

Copy/Share `.spec-btn` height **56px → 44px**. Supply try: replace bordered
`.buy-tile` cards with Order-ledger-style rows — label left / value right:
`Ready-mix | 0.3 m³` and `{n}kg bags | x N` (lowercase `x`, not ×). Bag-size
HIG chips kept under the bags row. Empty Supply state unchanged. Dead
`.buy-tile.is-recommended` rules left unused.

## Delta: v22.56 - bags Supply value is count only (no leading `x`); label stays `{n}kg bags` (Andre) (2026-08-13)

Supply bags row value is the count only (`withCommas(bags)`), without a leading `x`. Label remains `{n}kg bags`.

## Delta: v22.57 - Share secondary; dead Supply recommend CSS removed (Andre) (2026-08-13)

Audit leftovers 2–3 (item 1 bags count / no `x` already in v22.56).

- **Share secondary:** `#btnShare` is `spec-btn spec-btn--secondary`; Copy stays
  `spec-btn` only. `.spec-btn--secondary` is outline on `--bg` with
  `--border-strong` (not a second filled accent CTA).
- **Dead CSS removed** (unused since equal Supply / ledger rows):
  `.buy-tile.is-recommended` (+ nested), `.buy-tile.is-demoted` (+ nested /
  `.bag-size-btn` demoted), `.buy-rec`, unused `.buy-tile-val` /
  `.buy-tile-val strong`. Live `.buy-tile` border card + `.buy-row-*` kept.
  `getRec` / `REC_REASON` kept in `app.js` (analytics).
- Comment fix: bag-size block no longer claims Supply winner outline unchanged.

`node --check shared/app.js` clean.

## Delta: v22.58 - UI density / menu language / dark Share+tiles (Andre) (2026-08-13)

CSS-only Designer pass (`shared/styles.css`). No `app.js` changes.

- **Supply density matches Order; quieter bag chips:** `.buy-tile` padding `10px 12px` → `8px 12px` (keep `1px solid var(--border)`, `radius-sm`). `.buy-row` / label / val stay `--text-s` primary ink, ledger-like (no min-height bloat). `.bag-size-block` `margin-top` `12` → `8`; `.bag-size-caption` `margin-bottom` `6` → `4` (xxs muted uppercase). `.bag-size-btn` padding `6px 0` → `4px 0` (keep `--text-xs` / 600 / secondary unselected). `.buy-split` gap stays `8px`.
- **One menu language (Shape, m/mm, Wastage):** plain value + chevron, primary 600 value, secondary chevron, gap `2px`, no chip fill. `.shape-heading` / `.shape-heading-chevron` `--text-m` → `--text-s` (Job eyebrow already titles the card). Unit/wastage already `--text-s` — left alone. Stale comments updated (wastage is not a "chip"; shape no longer claimed at `--text-m`). No grey fills reintroduced.
- **Dark-mode Share + Supply tiles:** `[data-theme="dark"] .buy-tile { border-color: var(--border-strong); }` (faint `--border` on `--surface-1`). `[data-theme="dark"] .spec-btn--secondary` uses `--surface-1` fill + `--border-strong` + primary ink (light Share stays `--bg` white outline on grey page). Bag-size dark track rules untouched.

## Delta: v22.59 - unify right-column number weight (Andre / Designer) (2026-08-13)

CSS-only (`shared/styles.css`). No `app.js` changes — Supply markup already uses
`.buy-row-val strong`, not `.qty-figure`.

Unify supporting right-column figures to match Job `.field-val`: **`--text-s` / `600`**.
Order quantity remains the sole hero: **`--text-l` / `800`**.

- **Job** `.field-val`: unchanged `--text-s` / `600`.
- **Order Base + Wastage** `.ledger-row:not(.ledger-total) .ledger-val`: `font-weight: 600`
  (was inherit `400` from `.ledger-row`).
- **Order quantity** `.ledger-total .qty-figure`: keep `--text-l` / `800`.
- **Supply** `.buy-row-val` / `strong`: `--text-s` / `600` (was strong `700`).
- Empty `—` stays muted via `.is-empty` / `.ledger-val.is-empty`.
- Comment cleanup: `.qty-figure` is Order-only; Supply does not share that treatment.

## Delta: v22.60 - incomplete Order full skeleton; calmer Supply empty copy (Andre) (2026-08-13)

UX item 2 — empty Order/Supply should feel "not ready," not broken.

**Order incomplete** (`!complete` in `renderResults`): now renders the full three-row
skeleton with calm `—` placeholders — Base quantity, Wastage (control still usable via
`wastageLedgerRow(null)`), Order quantity (`ledger-total` + `is-empty`). Previously
omitted Base, which could read as a missing/broken row. Comment updated: incomplete
shows Base so the ledger reads as not-ready, not missing a row.

**Supply incomplete**: empty hint copy tightened (no "figures," no fault tone):
`Add {field} to see supply.` / fallback `Add dimensions to see supply.` Still names
the first missing required field; keeps `.order-empty` muted `--text-s` styling.

## Delta: v22.61 — #scroll-area padding-top 20px (was 12) between header and Job card.

CSS-only: `#scroll-area` padding `12px` → `20px 12px 12px` so there is 20px gap below the top header icons before the first card.

## Delta: v22.62 — #scroll-area padding-top 0 (was 20).

CSS-only: `#scroll-area` padding `20px 12px 12px` → `0 12px 12px` (top gap between header icons and first card is 0).

## Delta: v22.63 — theme toggle optical right align with brand mark (-4px).

CSS-only: `.theme-toggle` gets `margin-right: -4px` so the visible 36×36 `::before` tile
matches the brand-mark’s left inset against `.header` padding (`10px 14px`). Hit target
stays 44×44; header padding unchanged.

## Delta: v22.64 — Supply Ready-mix / Bags tiles flatten to HIG solid fill (Andre) (2026-08-13)

CSS-only (`shared/styles.css`). No `app.js` changes.

Supply Ready-mix / Bags tiles drop 1px outlines; HIG solid fill (`--bg` light, `--surface-3` dark) + radius; no border.

## Delta: v22.65 — Copy/Share `.spec-btn` height restored to 44px (Andre) (2026-08-13)

CSS-only. Copy/Share `.spec-btn` height restored to **44px** (was 56 after a CSS revert; v22.54 Andre ask).

## Delta: v22.66 — restick supporting number weight 600 (Andre) (2026-08-13)

CSS-only (`shared/styles.css`). No `app.js` / markup changes. Copy/Share stay equal
filled `.spec-btn` CTAs (do not add `spec-btn--secondary`). `.spec-btn` height untouched.

Restick supporting right-column figures to match Job `.field-val`: **`--text-s` / `600`**.
Order quantity remains the sole hero: **`--text-l` / `800`**. Also restores primary ink
on Base/Wastage (drops drifted v22.31 secondary grey; emphasis is weight, per v22.52).

- **Job** `.field-val`: unchanged `--text-s` / `600`.
- **Order Base + Wastage** `.ledger-row:not(.ledger-total) .ledger-val`: `font-weight: 600`
  (was inherit `400` from `.ledger-row`).
- **Order quantity** `.ledger-total .qty-figure`: keep `--text-l` / `800`.
- **Supply** `.buy-row-val` / `strong`: `--text-s` / `600` (was val `400` / strong `700`).
- Dropped drifted `.ledger-row:not(.ledger-total) { color: var(--text-secondary); }`.
  `.ledger-row` already paints `--text-primary`; `.ledger-total .ledger-label` keeps
  `font-weight: 700` (redundant `color: var(--text-primary)` dropped).
- Empty `—` stays muted via `.ledger-val.is-empty`.
- Copy/Share remain equal filled CTAs.

## Delta: v22.67 - Copy/Share height 44px (56 reverted again).

CSS-only. Copy/Share `.spec-btn` height **56px → 44px** (reverted again after v22.54 / v22.65). Guard comment on the rule: do not restore 56.

## Delta: v22.68 — top gap 0; theme icon right aligns with cards.

CSS-only (`shared/styles.css`). Surgical in-place; do not restore padding-top 20.

- `#scroll-area` padding `20px 12px 12px` → `0 12px 12px` (top gap 0; side/bottom 12px).
- `.theme-toggle` `margin-right: -6px` so the visible 36px tile aligns with card 12px inset
  (header pad 14px + 4px extra from 44 vs 36 hit/tile = 18; pull 6 → 12). Hit target stays 44×44.

## Delta: v22.69 — top gap 0 restuck; header bottom pad 0; theme icon -4px (Andre) (2026-08-13)

v22.68 did not land on disk (still v22.61 `20px 12px 12px`, header `10px 14px` with 10px bottom, no theme-toggle margin). CSS-only restick. Do not restore padding-top 20. `.spec-btn` height untouched.

- `.header` padding `10px 14px` → `10px 12px 0` (sides 12px match cards; bottom 0 so icons sit on Job card). Keep `padding-top: calc(10px + env(safe-area-inset-top))`.
- `#scroll-area` padding `20px 12px 12px` → `0 12px 12px`.
- `.theme-toggle` `margin-right: -4px` (36px tile to 12px card edge; header pad 12 + 4 optical = 16; pull 4).

## Delta: v22.70 — 12px above Job (Andre) (2026-08-13)

CSS-only (`shared/styles.css`). `#scroll-area` padding → `12px` (12px above Job — same as card-to-card gap / side padding). Header, theme-toggle, spec-btn untouched.

## Delta: v22.71 — supporting figures match Job 600 (Andre) (2026-08-13)

CSS-only. Base/Wastage `.ledger-val` and Supply `.buy-row-val` / `strong` at 600 (primary ink). Order quantity stays hero. Header, theme-toggle, #scroll-area, spec-btn untouched.

## Delta: v22.72 — bag-size: dropped track+white thumb (Andre) (2026-08-13)

CSS-only. Bag-size selector no longer stacks tile + grey track + white elevated thumb. Track is transparent (tile is the well); selected is one grey fill (`--surface-3` / dark `#3a3a3c`), no box-shadow. Header, theme-toggle, #scroll-area, spec-btn, ledger/buy weights untouched.

## Delta: v22.73 — HIG bag-size track + white thumb (Andre) (2026-08-13)

CSS-only. Real iOS HIG segmented control: recessed track (`--surface-3`, darker than the Bags tile) + white elevated thumb (`--bg`). Dark: track `#2c2c2e`, thumb `--surface-3`. `.hig-group--control` no longer forces the track transparent. Header, theme-toggle, #scroll-area, spec-btn, ledger/buy weights untouched.

## Delta: v22.74 — bag-size segment on the grey Supply card (Andre) (2026-08-13)

HIG would put the bag-size segment directly on the Supply card, not inside an extra white card. Removed the `.hig-group.hig-group--control` wrapper around `.bag-size-buttons` so the HIG track (`--surface-3`, 2px pad, white selected thumb) sits on the grey Supply card. Caption `margin: 12px 16px 6px` lines up with list row pad; `.hig-stack .bag-size-buttons { margin: 0 }` spans the same width as the white Ready-mix/Bags group. Header, theme-toggle, `#scroll-area`, spec-btn untouched.

## Delta from v21





Two cards, same as v21 (Inputs: Shape + Diagram + Dimensions + Wastage; Outputs: Total
Volume + Buying options) - that part of the layout didn't change. What changed is how
the rows inside each card are drawn:

| Area | v21 | v22 |
|---|---|---|
| Dimension field value (`.field-val`) | Recessed grey chip (`--surface-3` fill, `--radius-sm` corners) | No fill, no corners - plain black (`--text-primary`) text on the card's white surface |
| Unit toggle (`.unit-picker`, m⇄mm and inline bag-size) | Same grey chip fill; text coloured `--text-accent` | No fill; text `--text-primary` (black) |
| Wastage pulldown (`.wastage-pulldown`) | Same grey chip fill, left-padded box | No fill; value + chevron right-aligned by the row itself, no box. **Superseded by v22.2** below - the row itself (and the control) no longer lives in the Inputs card at all. |
| Row-to-row separation, Inputs card | None - v19's "no hairlines" doctrine (whitespace + bold labels only) | HIG's own grouped-list separator: a true `0.5px` hairline (`--border`) between one `.field-row` and the next, plus one above the first row (`#fields`'s own top edge) marking the Diagram → dimension-list seam |
| Row-to-row separation, Outputs card | None between Ready-mix/bags lines (only the Total-Volume→Order category hairline existed) | Same `0.5px` hairline between `.buy-line` rows |
| Row height | `.field-line`/`.buy-line` sized by padding | Both now `min-height: 44px`, no vertical padding - HIG's tap-target minimum sets the row height directly, so it's also exactly the spacing between one hairline and the next |
| Unit-toggle text size | `.unit-picker-current` at `--text-xs` (14px), smaller than the row's label/value | Bumped to `--text-m` (20px) - Andre's ask, "Length 25 m ▾" now reads as one uniform size across the row |
| Focused field's ring height | `box-shadow` on `.field-val.focused` itself, ring = full 44px tap-target height | Moved to `.field-val.focused::after`, inset 4px top/bottom - ring now reads 40px tall (Andre's ask); the 44px tap target itself is unchanged, only the visible ring shrank |
| Output card colour | One flat `--surface-1` white, same as `.inputs-card` | Two-tone (Andre's ask, reference: a screenshotted blue card), theme-aware: `.tv-section` (Total Volume) filled `var(--diagram-accent)` - "our original dark blue" (Andre's words), the app's existing accent, already tuned per theme (light `#3568DD` / dark `#5983E3`) - with `var(--accent-text)` for its own text (the same already-contrast-checked pairing Copy/Share uses). `.output-order` (Buying options) filled a new `--results-light-bg` token (light lavender `#EEF2FF` / dark desaturated blue-violet `#211F3D`, added to `:root`/`[data-theme="dark"]`), page's normal text tokens unchanged since they already flip correctly for a light-bg/dark-bg pair. First pass at this used flat literal hex on both sections, not theme tokens - reworked immediately after (Andre's ask) to be theme-aware. The old Total-Volume→Order hairline is gone - the colour change itself is now the seam. This revisits and reverses v21's own explicit "adaptive surface, not a navy fill" call (see the comment it replaced in `styles.css`) |
| Diagram fill (`.diagram-svg [fill="#ffffff"]`) | `--surface-3`, matched the field-chip grey | Unchanged - it's an illustration, not a row control, so left alone even though the chip it used to match is gone |
| Keypad keys, Copy/Share, theme toggle | Grey/filled treatments | Unchanged - out of scope, not "dimension field boxes" |

Net effect: the Inputs and Outputs cards now read as a single HIG-style grouped list
each - one white card (unchanged from v21) holding every row, thin hairlines marking
the seam between rows instead of a filled box behind them. A per-row grey card was
tried and rejected mid-round (Andre's call - read as a card nested inside a card, not a
pattern HIG actually uses) before settling on the hairline version above. Tap targets
(44px min-height, same widths) are unchanged throughout - only fill/border/divider
treatment changed, not hit area.

## Doctrine changes

This reverses v19's doctrine point 5 ("No hairlines - every row-to-row divider was
removed") for the Inputs and Outputs cards specifically, at Andre's explicit request -
using HIG's actual grouped-list separator weight (`0.5px`, not a full `1px` line) to do
it. It does **not** revert v19/v20's card-container doctrine (point 3 in `app-v20`'s
CONTEXT.md) - Inputs and Outputs are still cards; what changed is the treatment of the
rows *inside* them. See `app-v21/CONTEXT.md` and `app-v20/CONTEXT.md` for the rest of
the doctrine, unchanged here.

## Known gaps

- `--results-light-bg`'s dark-theme value (`#211F3D`) is an aesthetic judgement call,
  not derived from any reference screenshot (there wasn't a dark-theme one to work
  from) - worth a look in actual dark mode.
- `.buy-rec`'s "(Recommended)" tag still uses `var(--diagram-accent)` for its text,
  sitting on `.output-order`'s new light-bg token - contrast reasoned through, not
  numerically re-measured against the new dark-theme background specifically.
- `.buy-line + .buy-line`'s `0.5px` hairline (`--border`) against `.output-order`'s new
  background not checked by eye yet in either theme - a light grey line over a
  lavender/dark-indigo fill (rather than the app's usual white/dark-grey surfaces) may
  read fainter than elsewhere.
- Bug fix (Andre's own device screenshot, not caught by a Chromium/Playwright check
  first): `.field-line`/`.wastage-pulldown`/`.field-val`/`.unit-picker`/`.buy-line` all
  used `min-height: 44px`, not `height`. Per spec, a percentage-height absolutely
  positioned child (every hidden `<select>` overlay in this app) resolves against an
  indefinite/content-driven container as `auto`, not the percentage - `min-height`
  alone doesn't count as "explicitly specified" for that resolution. Engines disagree
  on the fallback here; whichever one rendered Andre's screenshot was visibly inflating
  the Wastage row well past 44px from it, while Chromium wasn't. Switched all five to a
  hard `height` (plus `overflow: hidden` on `.field-line`/`.buy-line`) so the
  containing block is always definite and every row is 44px regardless of engine.
  `.unit-picker--inline` (the inline bag-size chip) explicitly un-sets this back to
  `height: auto` - it's not a 44px row, it sits mid-sentence.
- Not yet Playwright-regressed (all 6 shapes × both themes, keyboard-only path).
- Not checked on a real device.
- Contrast of the new black-on-white row text not numerically re-measured (expected to
  clear WCAG AA comfortably better than the old grey-chip treatment, since black on
  white has more contrast than black on `--surface-3`, but not confirmed with a tool).
- `0.5px` borders render correctly on real Retina/Super Retina displays (2x/3x device
  pixel ratio) but degrade to a rounded ~1px on device-pixel-ratio 1 screens (rare on
  actual iPhones, more likely in a desktop browser's un-scaled preview) - not an issue
  on the target hardware, worth knowing if it looks slightly heavier in a laptop
  preview than on an actual phone.

## Deploy

Preview only. On promote: bump `sw.js` VERSION, refresh `sitemap.xml` lastmod, sync to
the deploy repo, add a `LIVE.md` here documenting the promotion.
