# SlabSet website

Deployable site rebuilt from **`mockups/claude/keypad-directions.html` mockup 04** — monospace field log, light/dark theme, Field ⇄ Spec toggle.

> **Editing pages?** `index.html` and the five `*-calculator.html` landing pages are **generated** — edit `build.py` (templates + PAGES data), then run `python3 build.py`. Content ships as static HTML for SEO; `shared/calc.js` only hydrates it. Keep SHAPES/ICONS in `build.py` and `calc.js` in sync. On deploy, bump `VERSION` in `sw.js`.

## Layout (mockup 04)

| Mode | Contents |
|------|----------|
| **Field** | Volume readout · shape dropdown · dimension inputs · wastage dropdown |
| **Spec** | Full spec sheet — to order, inputs, cost cards, materials, working, copy/PDF |

- **04 light** (`t4`) / **04 dark** (`t4d`) — sun/moon toggle in app bar
- Web form inputs instead of on-screen keypad
- Five shapes: Slab, Footing, Column, Round pad, Stairs

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
| **`website/`** (here) | Public web app — native inputs, spec document output |
| **`field-tool/`** | Field instrument mockup — numpad + LCD + Spec panel toggle |
| **Root `slab-set/`** | Legacy production copy; prefer `website/` for new deploys |

Design reference for spec layout: `field-tool/index.html` `#specPanel` and `mockups/claude/keypad-directions.html`.

## Local preview

```bash
cd website
python3 dev-server.py
# → http://127.0.0.1:8800/
```

Root production preview remains on port **8799** (`slab-set/dev-server.py`).

## Deploy

Point your static host at **`website/`** as the document root (not the parent `slab-set/`).
