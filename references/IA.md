# v17 IA brief

**Carried into v18 unchanged.** v18 is v17 with every card container flattened to a plain
section (caption + hairline, no background/border/shadow) and the pinned answer restyled
from oversized hero digits to a plain `Total Volume` label/value row - see
`../CONTEXT.md`'s "Delta from v17" for the specifics. The screen order, the doctrine below
and every rationale on this page still hold; none of it was an argument for boxing
content in cards, so none of it needed to change when the boxes came out.

Doctrine: **It is an iPhone app that happens to have a URL. The answer is never off-screen.**

## The one screen

```
Mast          SlabSet Concrete Calculator            [theme]  ← pinned
─────────────────────────────────────────────────────────────
Answer        ORDER VOLUME · includes 10% wastage    ← PINNED, readout only
              0.455 m³
─────────────────────────────────────────────────────────────
Shape card    [ Stairs ⌄ ]
                  isometric diagram — the focused dimension
                  is inked, the rest fade back
Fields        Steps       [    4 ]
              Rise        [  175 ] [ mm ⇄ ]
              Going       [  280 ] [ mm ⇄ ]   ← focused
              Width       [ 1200 ] [ mm ⇄ ]
              Base slab   [    — ] [ mm ⇄ ]
              ⚠ caution appears under a field once you move on from it
              Wastage     [ 10% — Recommended    ⌄ ]  ← same card, last row, preset pull-down
Order         ┌─────────────────────────────────────┐
              │ Bags                                │
              │ 66 × 20kg                            │
              │ Bagged dry concrete mix. Best under  │  ← always visible, no disclosure
              │ 0.5 m³, or wherever truck delivery… │
              │ Bag size          20kg  25kg  30kg  │  ← always visible, whichever is recommended
              │ ─────────────────────────────────── │  ← the only rule in the card
              │ Ready-mix              [Recommended] │  ← badge beside the name it advises
              │ 1.0 m³                                │
              │ Concrete delivered by mixer truck…  │
              └─────────────────────────────────────┘
Job           Job name    14 Wattle St
              Date        28/07/2026
              ⚠ check-strip repeats any caution here
              Docket will say 66 x 20 kg bags, other option noted
              [ Copy ]  [ Share ]
              estimate disclaimer · Privacy · Terms
─────────────────────────────────────────────────────────────
Keypad        1 2 3 ⌫                                ← pinned
              4 5 6 ┐
              7 8 9 │ Next
              0   . ┘
```

Mast, answer and keypad never move. Only the card stack scrolls.

**Canvas.** On a phone the shell is the viewport. Above 480px it locks to iPhone
proportion — `height: min(844px, 100dvh - 48px)` with `aspect-ratio: 390/844`, so the
whole canvas scales down on a short window instead of distorting — and centres on a plain
backdrop. No bezel, no notch, no fake status bar; just the correct rectangle.

## Why the answer is pinned

Measured on a 390×844 iPhone with the volume in the scroll stack: the number sat **37px
below the fold on slab and pier, 150px on stairs and gutter**, and the order cards
108–221px below. The header takes 52px and the keypad 207px, so the scrolling middle is
only ~500px — the shape card (191px) plus five field rows will always outrun it.

So while you typed, the number this app exists to produce was off-screen. The doctrine
said "everything visible at once"; the layout didn't deliver it.

v13, v14 and v15 each **locked** "volume at the top". v16 was a static mockup with
prefilled values viewed as an image, so the flaw never surfaced there, and v17 inherited
it. It is now a pinned bar between the mast and the stack, ~58px, and the number is
visible on every shape at every scroll position.

**No controls live in that bar.** Wastage was briefly put there on the argument that "the
control belongs with the number it changes" — but that over-applies the rule. It is true
for bag size, because `66 × 20 kg` is *unreadable* without knowing the bag size. It is not
true for wastage: `0.660 m³` reads fine alone, and the bar's own label already discloses
"includes 10% wastage". By that looser logic every dimension belongs in the bar too.

Worse, the pinned bar is the scarcest space on the screen — permanently visible, never
scrolled. Wastage is set once per job, if ever. Spending always-on pixels on a rarely
touched input is backwards, and it turned the readout into a form row.

## Where wastage does live

It is the **last row of the Dimensions card**, not a card of its own. It was given one
briefly, on the reasoning that it is not a dimension — but that is a taxonomy argument,
and the screen is not a taxonomy. What matters is that it changes the volume exactly like
the rows above it.

It is a **preset pull-down**, not a typed keypad field — that was tried first and dropped.
Four presets, each option's label naming its own site condition inline instead of a
separate note underneath:

| value | option label |
|-------|------|
| 0% | 0% — No allowance for wastage |
| 5% | 5% — Smooth site and formwork |
| 10% | 10% — Recommended for standard site |
| 15% | 15% — Rough ground |

10% is the trade default, so it is the one told it is fine; everything else is placed
relative to it. A pull-down can't be mistyped into an implausible value the way a keypad
field could, and it collapses two taps (tap field, type digits) into one. The cost: it is
not reachable by `Next`, since a pull-down isn't keypad-editable — the advance key stops at
the shape's last dimension instead of walking into wastage. The strings are mine, not trade
data; they place each preset against the 10% norm and nothing more.

## Why the order options are one card

Bags and ready-mix are two answers to a single question — *how does this arrive* — so they
are one inset-grouped list with **one hairline** between them, the same shape as the
Dimensions card. Two separate cards read as two unrelated offers, and the eye had to work
out that they were alternatives rather than a list.

Each row states its **name and quantity**, because "sixty-six twenty-kilo bags" is the
sentence you say down the phone to a supplier. No rule is allowed inside a block: a
hairline above the bag-size row made three rows of equal weight and destroyed the
grouping the single divider exists to create.

**Both rows' detail is always visible — there is no disclosure to tap open.** An earlier
pass made each row a collapsible header with a chevron, on the reasoning that the
supplier caveat is secondary text you don't always need. That over-applied the same logic
that once put wastage in the pinned bar: it turned a card you're meant to read at a glance
into a card you have to interact with first, which is a mode (doctrine 1), and — worse —
gave each row its own independently-operable affordance, so the joined card read as two
separate widgets again despite the DOM still being one list with one hairline. The detail
text is short enough to just sit there.

**Nothing is "chosen."** There is no selection state, no fill, no ring on either row.
`Recommended` sits directly beside the option name it advises rather than at the right
margin, so at arm's length it reads as a label on that option instead of a column of its
own — and it is the *only* mark either row carries. Copy/Share compute which option leads
the docket straight from the volume when they render it (see Rules); the screen never
asks the user to pick one over the other. Whether that is the right call — a tradie might
want ready-mix despite the advice, with no way to tell the docket so — is an open question.

## Why there is a Next key

Gutter/Kerb and Stairs have five dimensions plus wastage. With no advance key, each field
costs a separate trip: look up the stack, tap the field, look back down, type. v16 dropped
v15's `Next` in favour of "tap the field you want", which is right for *correcting* one
value and wrong for *entering* six.

`Next` walks the shape's dimensions in order, then stops — it does not wrap, and it greys
out on the last field. Wastage is a preset pull-down, not a keypad field, so it is not
part of the walk. Tapping any field directly still works.

## Why the diagram is inlined

It was an `<img>` costing ~130px of the fold to be decoration. It is now inline SVG, and
the dimension matching the focused field holds full ink while the others drop to 18%
opacity. The drawing answers "which one is Going and which is Rise" at the moment you are
standing on that field.

`_gen_iso.py` wraps each dimension in `<g class="dim">` with its label, now for all six
shapes including stairs and gutter — resolved 2026-07-30 (was: only slab, pierfooting,
column and footing had groups, so stairs/gutter fell back to lighting the bare `<text>`
label without its leader lines). If a focused field has no match in the drawing at all
(stairs' base slab), nothing dims — better a normal drawing than a uniformly grey one.

Inlining also retired v16's `filter: invert(1)` dark-mode hack: CSS beats the SVG's baked
presentation attributes, so strokes and faces now come from `--text-primary` and
`--surface-1` directly.

## Why implausible values get a caution

Typing `100` into Thickness while the unit reads `m` gives a 100-metre-thick slab:
**660 m³ → 66,000 bags**, previously with nothing on screen to question it. Goal 2 says
numbers "must feel safe to act on".

Each field carries trade-plausible `lo`/`hi` bounds in metres. Outside them you get an
amber line under the field, and a check-strip above Copy/Share repeating it (a caution
that scrolled away is a caution nobody read).

**Timing matters more than the bounds.** A field is only assessed once you have moved on
from it. Typing `100` into Thickness passes through `1` — 1mm, well under the 50mm floor —
so judging mid-entry meant the caution fired on the first keystroke and nagged the whole
way in. Now: silent while you type, verdict on leaving the field (by tap or by `Next`),
and the verdict clears the moment you tap back in to fix it. Copy/Share judge everything
first, so a bad value in a field you never left cannot go out unflagged — the send still
proceeds.

**It is a caution, not a gate.** Copy and Share stay enabled — the trade knows its own job
better than a range table does. Note the unit *badge* is safe on its own: toggling m ⇄ mm
converts the stored metre value, so the volume never moves. The risk is typing a magnitude
against a unit you didn't notice.

## Where bag size sits

**Bag size stays in the Bags block whether or not Bags is selected.** It is an input to the
figure printed directly above it — `8 × 30 kg` is unreadable without it, and you may want
to try 25 kg while comparing. The number and the control that moves it must not be
separable.

It gets no divider of its own. An earlier pass gave every block a uniform hairline, which
put the bag-size row behind the same rule that separated Bags from Ready-mix: identical
dividers signalling a sibling relationship where the real one is nested. The selector read
as an orphan strip owned by neither option. One rule in the card, and it is the one between
the two options.

## Why nothing is marked "chosen"

v16 marked the chosen supply row with a bare checkmark in the gutter. That one glyph was
carrying three jobs — which figure becomes the docket's `Order:` line, which row expands
its detail, and de-facto "what we recommend", because selection auto-followed the 0.5 m³
rule until you touched it. It named none of them, and its only real consequence was
invisible until you pressed Share.

Two failures made it concrete: on a cold start it ticked a row while both figures still
read `—`, and inside the 0.45–0.55 m³ dead band it ticked a row with no badge to explain
it, having silently moved there as you typed.

Later passes tried a selection ring plus a full-ink fill on the chosen block plus an
`Ordering` pill opposite `Recommended` plus a summary sentence above Copy/Share — five
signals for one binary, all of it machinery for a "choice" that was never actually a user
action: selection auto-followed the volume the whole time, so there was nothing to
distinguish from the recommendation in the first place.

**So there is no selection concept at all now.** One job, one mechanism:

| What | Carried by |
|------|-----------|
| What SlabSet advises | `Recommended` badge, beside the option name |
| Nothing else | — both rows always show their full figure and detail; the docket computes its own lead from the volume when it renders |

Nothing is marked before there is a volume, and in the 0.45–0.55 m³ dead band `Recommended`
appears on neither row.

**Open question, not yet resolved:** because there is no selection, there is also no way
for the user to tell the docket "send ready-mix even though bags is what's recommended."
`specText()` always leads with whichever option `getRec()` picks. A tradie with a reason to
override the advice currently can't — worth deciding whether that needs a mechanism back,
now that the five-signal version has been cut for being over-built.

## Why the unit badge looks like a button

Per-field m ⇄ mm is the strongest idea in the direction and it was invisible — a label
with a slightly darker border. It is now raised, inked, and carries a swap glyph, so it
reads as a control rather than a caption.

## Why the diagram is a card, not a toggle

v16 made it collapsible with a saved preference. But the diagram answers "which one is
Going and which is Rise" — a question you have *while* typing, not before. A disclosure
you have to open to answer the question you are currently holding is a mode. It stays open.

## Why the docket is in the stack

v15 put job name + date behind a checkout sheet. v16 dropped both and auto-stamped the
date. Neither is right: a poured slab gets ordered by someone, on a day, and a docket
without them isn't sendable — but it also doesn't deserve its own screen. Two rows in the
stack, directly above the buttons that send them.

## Rules

- Tap a value to focus it; the focused pill is raised and ringed. `Next` advances; it does
  not wrap and greys out on the last field.
- Tap a unit badge to switch m ⇄ mm. The measurement converts through metres, so the
  volume does not move when the unit does.
- Steps (stairs) is a count: no unit badge, and the `.` key is rejected.
- Untyped dimensions show `—`. The pinned answer shows a greyed `0.000` and "Enter every
  dimension to get a volume" until the shape's required fields are all in.
- Stairs' base slab is optional — leaving it empty pours no base and does not block.
- Wastage defaults to 10%, bag size to 20 kg. These are defaults, not measurements.
- Both order rows always show their full detail (reason text, and bag size for Bags) -
  there is no disclosure to open. Neither row is ever marked "chosen"; `Recommended`
  is the only badge either can carry, and Copy/Share compute which option leads the
  docket straight from the volume, independent of anything on screen.
- Between 0.45 and 0.55 m³ neither row is badged `Recommended`. Too close to call, so
  don't call it.
- `Recommended` does not appear until the volume is computable.
- Copy/Share are disabled until the spec is complete, but **not** disabled by a caution.
- Typing a job name raises the iOS keyboard; our pad stands down until the field blurs.
- Everything persists to `slabset-draft` on every change.
- A `?shape=` deep link beats the saved draft.

## Open questions

1. **Resolved (2026-07-30): wastage as a field vs chips.** Was briefly a numeric keypad
   field with a note underneath; is now a preset pull-down (0/5/10/15/20%), each option's
   label stating its site condition inline. It is the one row in the Dimensions card that
   `Next` does not reach, since a pull-down isn't keypad-editable.
2. **Resolved (2026-07-30): stairs + gutter diagrams.** `_gen_iso.py` now wraps every
   dimension in both shapes in `<g class="dim">`, so highlighting lights leader lines the
   same way it does on slab/pierfooting/column/footing. All six shapes now behave
   identically.
3. **Resolved (2026-07-30): haptics.** v15's soft vibrate on key entry, shape pick and
   complete is carried over as `tick()` in `shared/app.js`: digit/backspace/Next presses,
   picking a shape, and the moment a shape's volume first becomes computable. Feature
   detected, so it is silent on desktop.
4. **Install coaching.** Nothing prompts "Add to Home Screen". For an app used on site with
   poor signal, the SW only helps if it's actually installed.
5. **Resolved (2026-07-30): are the plausibility bounds right?** Were placeholder guesses.
   Now anchored to NCC/BCA stair geometry, AS 2870 footing/pier depth, AS 3600 slab
   thickness ranges and common kerb/channel dimensions, see the per-shape comments in
   `shared/app.js`. Still worth a tradesperson's eye before treating as gospel, these are
   code minimums/maximums and common practice, not a job-specific engineering sign-off.
7. **Resolved (2026-07-30): Dynamic Type risk.** A web page can't hook native iOS Dynamic
   Type directly, so the mitigation is the standard mobile-web equivalent: the viewport
   meta no longer blocks pinch-zoom (`user-scalable`/`maximum-scale` removed), and the
   controls that had a fixed `height` (`field-val`, `unit-badge`, `wastage-pulldown`, the
   keypad `.key`) now use `min-height`, so if text does need more room they grow instead of
   clipping it. Verified at 140% root font-size with no overflow.
8. **Tried and dropped: restating the dimensions in the readout**
   (`1.2 m × 2.3 m × 150 mm = 0.455 m³`). It reads well and catches a wrong unit early,
   but it repeats the fields card sitting directly beneath it, and gutter's five bare
   numbers were noise. If it comes back, it needs to earn space the fields do not already
   hold — and note only slab/pier/strip footing are true products, so `×` and `=` cannot
   be used on column, stairs or gutter without stating something false.
9. **Tried and dropped (2026-07-30): a disclosure chevron on each order row.** Each row was
   made a collapsible header (`aria-expanded`, an animated detail panel) so the reason text
   and bag-size picker only showed once tapped. It contradicted doctrine 1 (no modes) and,
   worse, gave the two rows independent interactivity, which made a single DOM list with one
   hairline read as two separate cards again — the exact failure the joined card was built
   to fix. Detail is now always rendered; there is nothing to tap open.
10. **Resolved (2026-07-30): the blue/Bags, green/Ready-mix tint.** Was a full-bleed
    background fill on the header and detail, which used the same visual grammar
    (filled rounded rect) this app already uses for actual controls (`field-val`,
    `bag-size` chips, the wastage pull-down) — a row filled edge-to-edge in colour read as
    a large tappable surface rather than a result. Rows are now plain `--surface-1`; the
    identity survives as a 3px left-edge stripe (`--accent-blue`/`--accent-green`) on
    `.order-row`, the idiom read as "category" (calendar events, kanban tags) rather than
    "button."
11. **Declined (2026-07-30, Andre's call): no way to override the docket's computed
    pick.** `specText()` always leads with whichever option `getRec()` recommends off the
    volume. Raised again after the colour pass and declined, not being built. See "Why
    nothing is marked 'chosen.'"

## Reference

- v16 mockup: `app-v16/concrete_calc_improved_mockup_9.html`
- v15 IA (LCD receipt, superseded): `app-v15/references/IA.md`
- Events + analytics: `../../EVENTS.md`
