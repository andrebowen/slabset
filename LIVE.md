# Live version

**This is the live tree.** Promoted to slabset.online 2026-08-13 from `app-v23`
(`v23-20260814`).

IA: Job → Order → Supply → Copy/Share. Phone-first AU concrete calculator.
Wastage is a 10% default popup. Supply is equal Ready-mix / Bags (HIG grouped list +
bag-size segmented control on the card). Copy and Share are equal 44px ink CTAs.

Warm parchment page (`#DED8CB`), white cards, S mark + SlabSet Concrete header.

Web test drop (not iOS App Store). Service worker VERSION `v23-20260814` so caches
refresh from `v23-20260813-3`.

Preview: `python3 dev-server.py` in `app-v23`.

Promote: rsync `app-v23/` → this repo (kept `.git` / `.gitignore` / `.nojekyll`),
sitemap lastmod 2026-08-14, bump `sw.js` VERSION, push `origin/main`.

**Edit here only for hotfixes, and bump `sw.js` VERSION when you do.**
