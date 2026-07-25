# Iso dimension diagram sandbox

Lives in **slab-set** - not throwaway.

**Rules:** [`RULES.md`](RULES.md)

| File | Role |
|------|------|
| `RULES.md` | Locked isometric diagram rules |
| `sandbox.html` | Iterate all 6 shapes + dims (Gap / Label) |
| `ref-box.png` | Reference convex iso box |

```bash
cd Workspaces/Calculator-Studio/slab-set/app-v12/references/diagram-iso
python3 -m http.server 8835
# http://127.0.0.1:8835/sandbox.html
```

Shapes: **Slab · Footing · Pier · Column · Stairs · Gutter**

Signed-off SVG → copy into `app-v12/shared/diagrams/` (and align `_gen_iso.py`).
