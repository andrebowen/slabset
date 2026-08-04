# Live version

**Not live.** Live on slabset.online is still **V18** (`v18-preview-21`) - see
`app-v18/LIVE.md` for that history. This copy is a fork of `app-v19`, forked 2026-08-05
at Andre's request for an unconstrained "make it a 10/10" pass (ten self-directed rounds
of critique-and-fix - see `CONTEXT.md`'s "Delta from v19").

Preview: `python3 dev-server.py` -> `http://127.0.0.1:8833/` (next free port after v19's
8832).

Promote steps when Andre signs off: bump `sw.js` VERSION off `v20-preview-1`, refresh
`sitemap.xml` lastmod, sync to the deploy repo, update `LIVE.md` here and at the
deploy-repo root, update `app-v18/LIVE.md` and `app-v19/LIVE.md` to point at v20 as the
new live tree. Recommend a real-device check first - this round's verification was all
headless-Chromium (thorough, but not a substitute for actual touch/glare/screen-reader
testing).
