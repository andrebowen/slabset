# Live version

**This is the live tree.** Promoted to slabset.online 2026-08-13 from `app-v23`
(`v23-20260814-8`).

IA: Job → Order → Supply → Copy/Share. Phone-first AU concrete calculator.
Wastage is a 10% default popup. Supply is equal Ready-mix / Bags (HIG grouped list +
bag-size segmented control on the card). Copy and Share are equal 44px ink CTAs.

Warm parchment page (`#DED8CB`), white cards, S mark + SlabSet Concrete header.

Web test drop (not iOS App Store). Service worker VERSION `v23-20260814-9` so caches
refresh from `v23-20260814-8`.

Hotfix 2026-08-14: removed dead CSS (unused `--diagram-accent`/`--accent-text`/
`--results-light-bg`/`--text-accent` tokens, the whole superseded `.buy-tile`
block, orphaned `.bag-size-block`/`.bag-size-caption`/`.hig-footer`), fixed
several comments in `shared/styles.css` describing behaviour the code no longer
has (leftover from the v22→v23 blue-to-monochrome palette change), bumped the
Order-quantity hero to a fixed 30px, and added `hooks/check-dead-css.py` (see
README's "Pre-commit check") so unused tokens/classes get caught going forward.
Footer version bumped to 23.3.

Preview: `python3 dev-server.py` in `app-v23`.

Promote: rsync `app-v23/` → this repo (kept `.git` / `.gitignore` / `.nojekyll`),
sitemap lastmod 2026-08-14, bump `sw.js` VERSION, push `origin/main`.

**Edit here only for hotfixes, and bump `sw.js` VERSION when you do.**
