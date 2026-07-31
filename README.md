# SlabSet v18

v17's iPhone app with the card stack flattened. Same shell, same doctrine, same
information in the same order - Shape, Dimensions, Order, Spec sheet - but each group is
now a plain section on the page background, told apart by a caption and a hairline
instead of a background/border/shadow. The answer stays pinned above the stack, now as a
plain "Total Volume" label/value row instead of oversized hero digits.

```bash
cd Workspaces/Calculator-Studio/slab-set/app-v18
python3 dev-server.py
# http://127.0.0.1:8831/
```

Open it at any window size. There is no desktop layout: above 480px the shell locks to
iPhone proportion (390 × 844) and centres on a plain backdrop, scaling down if the window
is shorter than ~892px. Below 480px it fills the viewport edge to edge, as on a real
phone. What you judge on a laptop is the rectangle that ships.

## Files

| Path | Role |
|------|------|
| `index.html` | The app. Mast, pinned answer row, flat sectioned stack, pinned keypad. |
| `shared/app.js` | Shapes, volume maths, units, plausibility bounds, recommendation, docket, draft. |
| `shared/styles.css` | Tokens + layout. Light first, dark counterpart. |
| `shared/diagrams/*.svg` | Isometric drawings, inlined at runtime so the focused dimension can light up (`_gen_iso.py` generates them). |
| `sw.js` | Service worker. **Bump `VERSION` on every deploy.** |
| `manifest.webmanifest` | Home-screen install. Portrait, standalone. |
| `*-calculator.html` | 7 search shells → `/?shape=<id>`. Not pages, just redirects. |
| `CONTEXT.md` | Doctrine, delta from v17, known gaps. |
| `references/IA.md` | Screen-by-screen IA + open questions. |

## Storage keys

| Key | Holds |
|-----|-------|
| `slabset-theme` | `light` / `dark`, set once the user taps the toggle |
| `slabset-draft` | shape, dimensions, units, wastage, order mode, bag size, job name + date |

Clearing `slabset-draft` gives you a cold start.

## Deploy

Not live. **Live is v15** (`v15-preview-33`, confirmed 2026-07-28) — see `LIVE.md`.
