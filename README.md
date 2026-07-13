# SlabSet website v6

Deployable SlabSet candidate with the v6 UX pass: guided field entry, order recommendations, unit correction, and Job sheet actions.

> **Editing pages?** `index.html` and the six `*-calculator.html` landing pages are **generated** — edit `build.py` (templates + PAGES data), then run `python3 build.py`. Content ships as static HTML for SEO; `shared/calc.js` only hydrates it. Keep SHAPES/ICONS in `build.py` and `calc.js` in sync. On deploy, bump `VERSION` in `sw.js`.

## Layout (mockup 04)

| Mode | Contents |
|------|----------|
| **Calc** | Volume readout · shape dropdown · dimension inputs · wastage dropdown |
| **Job** | Job sheet — result, order options, dims, quantities, copy/PDF |

- **04 light** (`t4`) / **04 dark** (`t4d`) — sun/moon toggle in app bar
- Web form inputs instead of on-screen keypad
- Six shapes: Slab, Strip footing, Pier footing, Column, Round pad, Stairs
- Thickness starts empty (no smart default)
- Missing fields name the next required input instead of silently returning zero
- Large millimetre mistakes offer a one-tap correction
- LCD shows recommended order line + price; Job sheet has full bags vs ready-mix compare

## What lives here

| Path | Role |
|------|------|
| `index.html` | Main app — shape + dimensions form, inline results, copy-ready spec |
| `privacy.html`, `terms.html` | Legal |
| `shared/calc.js`, `shared/styles.css` | Calculator + spec-sheet styling |
| `manifest.webmanifest`, `sw.js` | PWA shell |
| `dev-server.py` | Local preview (port **8800**, no-cache headers) |

## vs other folders

| Folder | Purpose |
|--------|---------|
| **`app-v6/`** (here) | Public web app candidate — guided native inputs, spec document output |
| **`app-v5/`** | Previous website version before the 10/10 UX pass |
| **`field-tool/`** | Field instrument mockup — numpad + LCD + Spec panel toggle |
| **Root `slab-set/`** | Legacy production copy; prefer `app-v6/` for new deploys |

Design reference for spec layout: `field-tool/index.html` `#specPanel` and `mockups/claude/keypad-directions.html`.

## Local preview

```bash
cd app-v6
python3 dev-server.py
# → http://127.0.0.1:8800/
```

Root production preview remains on port **8799** (`slab-set/dev-server.py`).

## Deploy

Point your static host at **`app-v6/`** as the document root (not the parent `slab-set/`).
