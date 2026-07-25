# SlabSet website v15 - LCD receipt calculator

## Status

| Field | Value |
|-------|-------|
| status | preview |
| role | LCD is the form; pad is the keyboard; Summary is checkout. **iPhone app** (phone layout). Desktop not in focus. |
| parent | `Calculator-Studio/slab-set/` |
| base | `app-v14/` engine + LCD-receipt IA |
| preview | `python3 dev-server.py` → `http://127.0.0.1:8828/` |
| desktop | `http://127.0.0.1:8828/desktop.html` |
| live | not promoted - live remains v12 |

## Doctrine

**The LCD is the app. The pad is the keyboard. Summary is the checkout.**

1. **LCD receipt** - Shape, dims, wastage, Volume. Fixed height (312px); taller shapes scroll inside. Tap a line to edit. Selected row: ▸ + amber wash + caret. Untyped dims show —. Cold start: shape row pulses once (no dim selected yet). Draft restores silently.
2. **Context dock** - 4-col pad (⌫ top-right, darker-grey Next spans 3 below). Next advances fields then opens wastage. Shape overlays pad; waste chips under LCD. Dimension diagram: trailing **info.circle** on the Shape LCD row (44px hit).
3. **See summary →** - only when complete; opens checkout sheet **below the logo/mast** (covers LCD). Close via **‹ Edit**.
4. **Checkout order** - Order → job sheet (Job name → Date → spec) → Copy/Share → disclaimer / Help. Share is the amber primary.
5. **No Measure/Summary tabs.** No dead CTA. No field strip.

## Later production

See `references/IA.md` (PWA/install polish). Desktop is out of focus. Draft + last shape now persist.

## Locked

- Top Volume / LCD display
- Always-reachable entry (pad or context picker)
- Metric AU engine, shapes, order card, Copy / Share
- Summary as sheet below mast/logo (covers LCD; Edit to return)
- Checkout hierarchy: order → docket → share

## Deploy

Preview only until Andre signs off.
