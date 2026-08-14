# SlabSet v20

The "make it a 10/10" pass off v19: same three-card layout (Volume/Inputs/Order), same
job-site type scale, same one-control-language picker system - refined through ten
self-directed rounds (accessibility, colour, motion, performance, copy, edge cases,
boot-state UX, code quality, full regression, docs). See `CONTEXT.md`'s "Delta from
v19" table for exactly what changed and why.

```bash
cd Workspaces/Calculator-Studio/slab-set/app-v20
python3 dev-server.py
# http://127.0.0.1:8833/
```

Open it at any window size. There is no desktop layout: above 480px the shell locks to
iPhone proportion (390 × 844) and centres on a plain backdrop, scaling down if the window
is shorter than ~892px. Below 480px it fills the viewport edge to edge, as on a real
phone. What you judge on a laptop is the rectangle that ships.

## Files

| Path | Role |
|------|------|
| `index.html` | The app. Header, pinned Volume card, Inputs card, Order card, Copy/Share, footer, keypad. |
| `shared/app.js` | Shapes, volume maths, units, plausibility bounds, recommendation, docket, draft. |
| `shared/styles.css` | Tokens + layout. Light first, dark counterpart. |
| `shared/diagrams/*.svg` | Isometric drawings, inlined at runtime so the focused dimension can light up (`_gen_iso.py` generates them). |
| `sw.js` | Service worker. **Bump `VERSION` on every deploy.** Network-first (not cache-first/stale-while-revalidate) - a deliberate choice given how actively this project iterates; installed clients should get the latest deploy immediately, not lag a version behind. |
| `manifest.webmanifest` | Home-screen install. Portrait, standalone. |
| `*-calculator.html` | 7 search shells → `/?shape=<id>`. Not pages, just redirects. |
| `CONTEXT.md` | Doctrine, delta from v19, known gaps. |
| `references/IA.md` | Screen-by-screen IA + open questions (inherited from v17 - describes the pre-card, pre-picker shell in places; the "Doctrine" section and delta tables in `CONTEXT.md` are the current source of truth over it). |

## Storage keys

| Key | Holds |
|-----|-------|
| `slabset-theme` | `light` / `dark`, set once the user taps the toggle |
| `slabset-draft` | shape, dimensions, units, wastage, bag size |

No job-name field exists in this build (older docs describe one; it never made it past
an earlier version - see `CONTEXT.md`'s "Known gaps"). Clearing `slabset-draft` gives
you a cold start.

## Pre-commit check

`hooks/check-dead-css.py` flags custom properties and classes defined in
`shared/styles.css` with no live reference left anywhere in the site - the way a
removed feature's CSS (and the comments describing it) can survive silently in a
plain HTML/CSS/JS project with no build step to catch it. Runs automatically on
`git commit` once hooksPath is pointed at the tracked hook (one-time, per clone):

```bash
git config core.hooksPath hooks
```

A real false positive (a class deliberately unused for now) can bypass it with
`git commit --no-verify`, or get added to `CLASS_ALLOWLIST` in the script if it's
going to stay that way (see `.sr-only`'s entry for the pattern).

## Deploy

Not live. **Live is v18** (`v18-preview-21`) — see `LIVE.md`.
