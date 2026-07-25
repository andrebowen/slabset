# v15 IA brief

Doctrine: **LCD is the app. Pad is the keyboard. Summary is checkout.**

## Phone Measure

```
Mast
LCD receipt (Shape · dims · Wastage · Volume)
[ wastage chips | See summary → ]   ← CTA only when complete (hidden until then)
Dock: 4-col pad (⌫ top-right, darker-grey Next spans 3 below)
Shape list overlays pad (temporary)
```

## Rules

- Tap LCD line → edit that thing
- Selected row: amber wash + leading ▸ cursor + blinking caret (dims)
- Outside tap clears highlight; pad stays mounted
- Shape list overlays keypad. Dimension diagram: trailing **info.circle** on the Shape LCD row (always available while measuring; not in the shape list)
- wastage chips sit in the CTA slot under the LCD
- First open: Shape row pulses amber once
- Untyped dims show `—` + unit (muted); typed values full LCD ink
- LCD height is locked (312px); extra rows on stairs/gutter scroll inside the panel
- Long-press a dim value → clear that field
- Soft vibrate on key / Next / clear / shape pick / wastage / CTA (when supported)
- Type → value + m³ update live
- **Next** advances fields; after last field opens wastage (does not wrap)
- Pick wastage when complete → clear LCD highlight → **See summary →** (pulses once on first appear)
- Draft persists silently (shape, dims, waste, bag size, step)
- Cold start: Shape pulses alone (no dim selected yet); digits still wake the first field
- Pad Next / ⌫ work after clearing highlight (resume first incomplete field)
- Complete → **See summary →** → checkout sheet **below logo** (covers LCD)
- No Measure/Summary tabs
- No early / disabled Summary CTA

## Summary (checkout)

Sheet sits below the SlabSet mast. Back via **‹ Edit** (left), not an × under the theme toggle.

1. Order recommendation (one surface card: amber **Recommended** label, muted **Other options**, hairline between)
2. Job sheet: Job name (top) → Date → dims / order / extras
3. Copy / Share (after the docket, so name-then-share works)
4. One-line disclaimer, collapsed Help & links, footer

## Desktop

Not in scope for this pass. v15 is the **iPhone app** surface (phone layout). `desktop.html` is a side sketch only; do not block ship on desktop measure parity.

## Later production (nice-to-haves)

- Home-screen PWA / install polish for on-site use
- Native wrapper later if needed (same phone IA)

## Reference mock

`references/ia-lcd-receipt.html`

## Preview

`python3 dev-server.py --port 8828` → http://127.0.0.1:8828/
