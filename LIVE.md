# Live version

**This is the live tree.** Promoted to slabset.online 2026-08-05, confirmed via
`curl -s https://slabset.online/sw.js` serving `v20-preview-1`. Forked from `app-v19`
the same day for an unconstrained "make it a 10/10" pass (ten self-directed rounds of
critique-and-fix, Andre's explicit license to override prior decisions - see
`CONTEXT.md`'s "Delta from v19"), verified with a full Playwright regression (all 6
shapes × both themes, zero errors/overflow/overlap), then promoted on Andre's go-ahead
without a prior real-device check - flagged explicitly before promoting, he chose to
push anyway.

Preview: `python3 dev-server.py` -> `http://127.0.0.1:8833/`.

Promote steps executed: bumped `sitemap.xml` lastmod, rsync-mirrored `app-v20/` into
`/Users/andrebowen/Documents/GitHub/slabset` (excluding `.git`/`.gitignore`/`.nojekyll`,
`--delete` so the mirror is exact - this also cleaned out a stray `Design/app-v18/`
folder that had been sitting in the deploy repo unrelated to any deploy), committed,
pushed to `origin/main`, verified live `sw.js` serves `v20-preview-1`.

**Hotfix 2026-08-07 (`v20-preview-7`):** header `.title` sized to match `.field-label`
("Diameter" etc.) instead of a leftover literal 17px; `--diagram-accent` split into a
dark-mode-only tint (`#5983E3`, same hue as light mode's `#3568DD`, lightness raised
54%→62%) so it clears WCAG's 3:1 non-text minimum against the dark card surface (was
2.77:1, now 3.84:1); `touch-action: manipulation` added on `body` to stop double-tap-
to-zoom on cards while leaving pinch-zoom untouched. Same promote steps as above
(bump `sw.js`, bump `sitemap.xml` lastmod, rsync, commit, push).

**Edit here only for hotfixes, and bump `sw.js` VERSION when you do.**
