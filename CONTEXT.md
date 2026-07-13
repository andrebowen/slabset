# SlabSet website v6 — CONTEXT

## Status

| Field | Value |
|-------|-------|
| status | active |
| role | Deployable job-sheet website with guided field UX |
| parent | `Calculator-Studio/slab-set/` |

## Intent

Single folder containing **all files the public website needs**. v6 keeps the mockup 04 instrument feel, then adds the UX pass:

- explicit missing-field guidance (thickness starts empty)
- LCD + Job sheet order recommendations (bags vs ready-mix)
- one-tap correction for likely millimetre unit mistakes
- sticky Job actions (copy / PDF / share)
- collapsed help/SEO content so the job sheet stays task-focused

## Relationship

```
slab-set/
├── app-v6/           ← this folder; deploy candidate
├── app-v5/           ← previous version
├── field-tool/       ← numpad + Spec panel mockup
└── mockups/          ← design exploration
```

## Preview

- **Website:** `python3 dev-server.py` from this folder → `http://127.0.0.1:8800/`
- **Field tool:** `field-tool/dev-server.py` → port 8811
- **Mockups catalogue:** `mockups/index.html` via slab-set mockup server → port 8810

## Outputs

Deploy `app-v6/` as static site to slabset.online (or successor host).
