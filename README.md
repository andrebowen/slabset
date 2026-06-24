# SlabSet — Concrete Calculator

The free Australian metric concrete calculator. Work out volume, bags, cost and
reinforcement for slabs, footings and cylinders (columns/posts) — with state-based
local pricing and wastage built in.

- **Live:** https://slabset.online/ (custom domain via GitHub Pages)
- **Stack:** plain HTML/CSS/JS, no build step, no dependencies (Google Fonts only).
- **Units:** metric, all dimensions entered in millimetres.

## Structure
```
index.html            ← the calculator (site root)
robots.txt            ← crawler directives
sitemap.xml           ← URL list for search engines
shared/styles.css     ← design system ("site-grade instrument")
shared/slabset-mark.svg ← logo mark / favicon
shared/og-image.png   ← social preview (1200×630)
shared/og-render.html   ← source template to regenerate og-image.png
```

Built with the Calculator Studio pipeline. Estimates only — confirm critical
quantities and costs with your supplier or engineer.
