# Live version

**This is the live tree.** Promoted to slabset.online 2026-08-13 from `app-v22`
(`v22-20260813`).

IA: Job → Order → Supply → Copy/Share. Phone-first AU concrete calculator.
Wastage is a 10% default popup. Supply is equal Ready-mix / Bags (HIG grouped list +
bag-size segmented control on the card). Copy and Share are equal 44px accent CTAs.

Web test drop (not iOS App Store). Service worker VERSION `v22-20260813` so caches
refresh from `v21-preview-1`.

Preview: `python3 dev-server.py` in `app-v22`.

Promote: rsync `app-v22/` → this repo (kept `.git` / `.gitignore` / `.nojekyll`),
sitemap lastmod 2026-08-13, bump `sw.js` VERSION, push `origin/main`.

**Edit here only for hotfixes, and bump `sw.js` VERSION when you do.**
