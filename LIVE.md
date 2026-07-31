# Live version

**Live on slabset.online = V15** (`app-v15/`).

Confirmed 2026-07-28 against the deployed service worker: `VERSION = 'v15-preview-33'`,
which matches `app-v15/sw.js`. Earlier copies of this file across every `app-v*/` said
V12; that was stale from the 2026-07-24 promote and is superseded.

v18 is preview only. Do not promote without Andre sign-off.

On promote: bump `sw.js` VERSION (currently `v18-preview-1`), refresh `sitemap.xml`
lastmod, push to `andrebowen/slabset`, then update this file in every `app-v*/` and the
live row in the root `CONTEXT.md`.
