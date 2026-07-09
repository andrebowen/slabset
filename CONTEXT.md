# SlabSet website — CONTEXT

## Status

| Field | Value |
|-------|-------|
| status | active |
| role | Deployable spec-sheet website (no field-tool numpad) |
| parent | `Calculator-Studio/slab-set/` |

## Intent

Single folder containing **all files the public website needs**. UX follows **mockup 04** from `mockups/claude/keypad-directions.html` — monospace field log, light/dark theme, Field ⇄ Spec toggle, full costed spec sheet. Web inputs replace the on-screen keypad.

## Relationship

```
slab-set/
├── website/          ← deploy root (this folder)
├── field-tool/       ← numpad + Spec panel mockup
├── mockups/          ← design exploration
└── index.html        ← legacy production mirror
```

## Preview

- **Website:** `python3 dev-server.py` from this folder → `http://127.0.0.1:8800/`
- **Field tool:** `field-tool/dev-server.py` → port 8811
- **Mockups catalogue:** `mockups/index.html` via slab-set mockup server → port 8810

## Outputs

Deploy `website/` as static site to slabset.online (or successor host).
