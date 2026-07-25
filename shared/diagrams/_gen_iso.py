#!/usr/bin/env python3
"""Generate true isometric dimension diagrams for SlabSet.

Rules (see app-v12/references/diagram-iso/RULES.md):
- Dim / extension lines ONLY at 30°, 150°, or 90° - no other angles
- Text labels always horizontal 0° (never rotated)
- Dim lines, ticks, and labels must NOT overlay the solid volume
- Solid opaque volumes - 3 faces, no back edges
"""
from __future__ import annotations

import math
import re
from pathlib import Path

OUT = Path(__file__).resolve().parent
C30 = math.cos(math.radians(30))
S30 = math.sin(math.radians(30))

INK = "#18181b"
FILL = "#ffffff"
LABEL = "#18181b"
FONT = "system-ui,sans-serif"
SW = 2.25
SW_DIM = 1.2
SW_EXT = 0.9
OFF = 34
GAP = 24
DIM_GAP = 36   # preferred dim distance from solid (sandbox Gap)
LABEL_GAP = 16  # label distance from dim line (sandbox Label)
LABEL_SIZE = 14  # all diagram labels - dim names, Steps, step numbers
EXT_GAP = 8     # screen-px gap: extension lines never touch the solid
ALLOWED_ANGLES = (0.0, 30.0, 90.0, 150.0)  # 0° allowed for cylinder project/dims
TICK_SW = 1.4
EXT_OP = 0.35



def iso(x: float, y: float, z: float) -> tuple[float, float]:
    """SVG isometric (y down). Ground edges at 30° / 150°, vertical at 90°."""
    return ((y - x) * C30, -(x + y) * S30 - z)


def axis_angle(a, b) -> float:
    """Screen angle in degrees (y-up from +X), folded into [0, 180)."""
    deg = math.degrees(math.atan2(-(b[1] - a[1]), b[0] - a[0]))
    return deg % 180


def assert_axis(a, b, what: str = "line") -> None:
    deg = axis_angle(a, b)
    if not any(abs(deg - t) < 0.6 for t in ALLOWED_ANGLES):
        raise ValueError(f"{what} at {deg:.1f}° - only 0/30/90/150 allowed")


def _cross(o, a, b) -> float:
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])


def point_in_poly(p, poly, tol=0.75) -> bool:
    for i in range(len(poly)):
        if _cross(poly[i], poly[(i + 1) % len(poly)], p) < -tol:
            return False
    return True


def seg_hits_poly(a, b, poly, n=48) -> bool:
    for i in range(1, n):
        t = i / n
        if point_in_poly((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t), poly):
            return True
    return False


def _convex_hull(pts):
    """Andrew's monotone chain - screen-space convex silhouette for clearance."""
    s = sorted(pts, key=lambda p: (p[0], p[1]))
    if len(s) <= 2:
        return s

    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

    lower: list = []
    for p in s:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
    upper: list = []
    for p in reversed(s):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    return lower[:-1] + upper[:-1]


def label_lines(name: str) -> list[str]:
    return [ln for ln in (name or "").split("\n")] or [""]


def label_size(name: str) -> tuple[float, float]:
    """BBox used for overlap checks (dim lines / solid). Supports multiline."""
    lines = label_lines(name)
    w = max(28.0, 0.58 * LABEL_SIZE * max(len(ln) for ln in lines))
    h = (LABEL_SIZE + 2.0) * len(lines)
    return w, h


def label_fit_size(name: str) -> tuple[float, float]:
    """Generous bbox for viewBox padding so glyphs never clip."""
    lines = label_lines(name)
    w = max(36.0, 0.78 * LABEL_SIZE * max(len(ln) for ln in lines))
    h = (LABEL_SIZE + 6.0) * len(lines)
    return w, h


def label_corners(xy, name: str):
    w, h = label_size(name)
    x, y = xy
    return (
        (x - w / 2, y - h / 2), (x + w / 2, y - h / 2),
        (x - w / 2, y + h / 2), (x + w / 2, y + h / 2),
    )


def label_hits_poly(xy, name: str, poly) -> bool:
    return any(point_in_poly(c, poly) for c in label_corners(xy, name))


def _pt_in_aabb(p, xmin, xmax, ymin, ymax, pad=1.5) -> bool:
    return xmin - pad <= p[0] <= xmax + pad and ymin - pad <= p[1] <= ymax + pad


def label_hits_seg(xy, name: str, a, b, pad=2.0) -> bool:
    """True if horizontal label bbox overlaps a dimension (or extension) segment."""
    w, h = label_size(name)
    x, y = xy
    xmin, xmax = x - w / 2, x + w / 2
    ymin, ymax = y - h / 2, y + h / 2
    for i in range(41):
        t = i / 40
        p = (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)
        if _pt_in_aabb(p, xmin, xmax, ymin, ymax, pad):
            return True
    return False


def label_hits_segs(xy, name: str, segs) -> bool:
    return any(label_hits_seg(xy, name, a, b) for a, b in segs)


def assert_clear(a, b, label_xy, name: str, poly) -> None:
    if seg_hits_poly(a, b, poly):
        raise ValueError(f"{name} dim overlays solid")
    if label_hits_poly(label_xy, name, poly):
        raise ValueError(f"{name} label overlays solid")
    if label_hits_seg(label_xy, name, a, b):
        raise ValueError(f"{name} label overlaps dimension line")


def clear_offset(maker, poly, name: str, prefer: float | None = None, limit=400, avoid_segs=None):
    """Grow axis-aligned offset until dim + label clear solid and dim lines; then honor prefer."""
    want = DIM_GAP if prefer is None else prefer
    avoid = list(avoid_segs or [])
    g = 12.0
    min_g = None
    while g <= limit:
        a, b, lab = maker(g)
        segs = avoid + [(a, b)]
        if (
            not seg_hits_poly(a, b, poly)
            and not label_hits_poly(lab, name, poly)
            and not label_hits_segs(lab, name, segs)
        ):
            min_g = g
            break
        g += 4.0
    if min_g is None:
        raise ValueError(f"could not clear solid/dim lines for {name}")
    use = max(min_g, want)
    a, b, lab = maker(use)
    # Prefer may reintroduce label-on-line - bump label gap along out axis via maker's lab
    if label_hits_segs(lab, name, avoid + [(a, b)]):
        # Remake with larger offset until label clears (dim moves with g)
        g2 = use
        while g2 <= limit:
            a, b, lab = maker(g2)
            if not label_hits_segs(lab, name, avoid + [(a, b)]) and not label_hits_poly(lab, name, poly):
                use = g2
                break
            g2 += 4.0
        else:
            raise ValueError(f"could not clear label off dim lines for {name}")
        a, b, lab = maker(use)
    return a, b, lab, use


def _unit(v):
    n = math.hypot(v[0], v[1]) or 1.0
    return (v[0] / n, v[1] / n)


def lab_at(a, b, out_axis, name: str = "", gap=LABEL_GAP):
    """Label at 0°; offset from dim mid along project axis until clear of the dim line."""
    u = _unit(out_axis)
    mx, my = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
    label = name or "Dim"
    g = gap
    while g <= gap + 64:
        if abs(a[0] - b[0]) < 0.01:  # vertical dim - keep mid-height
            lab = (mx + u[0] * g, my)
        else:
            lab = (mx + u[0] * g, my + u[1] * g)
        if not label_hits_seg(lab, label, a, b):
            return lab
        g += 2.0
    return lab


V30 = None
V150 = None
V30OUT = None


def _axes():
    global V30, V150, V30OUT
    if V30 is None:
        V30, V150, V30OUT = iso(0, 1, 0), iso(1, 0, 0), iso(0, -1, 0)
    return V30, V150, V30OUT


def f(n: float) -> str:
    return f"{n:.2f}"

def edge(a, b, *, sw=SW, op=1.0, check=True) -> str:
    if check:
        assert_axis(a, b)
    o = f' opacity="{op}"' if op < 1 else ""
    return (
        f'<line x1="{f(a[0])}" y1="{f(a[1])}" x2="{f(b[0])}" y2="{f(b[1])}"'
        f' stroke="{INK}" stroke-width="{sw}" stroke-linecap="round"{o}/>'
    )


def face(pts, *, sw=SW, stroke=True) -> str:
    d = "M " + " L ".join(f"{f(p[0])} {f(p[1])}" for p in pts) + " Z"
    st = f' stroke="{INK}" stroke-width="{sw}"' if stroke else ' stroke="none"'
    return (
        f'<path d="{d}" fill="{FILL}"{st}'
        f' stroke-linejoin="round" stroke-linecap="round"/>'
    )


def face_fill(pts) -> str:
    return face(pts, stroke=False)


def path_open(pts, *, sw=SW) -> str:
    d = "M " + " L ".join(f"{f(p[0])} {f(p[1])}" for p in pts)
    return (
        f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="{sw}"'
        f' stroke-linejoin="round" stroke-linecap="round"/>'
    )


def tick(p, axis_vec, length=7.0) -> str:
    """End tick along an allowed axis (30/90/150) - never an arbitrary angle."""
    dx, dy = axis_vec
    L = math.hypot(dx, dy) or 1
    ux, uy = dx / L * length / 2, dy / L * length / 2
    return edge((p[0] - ux, p[1] - uy), (p[0] + ux, p[1] + uy), sw=TICK_SW)


def text(x, y, s, *, size=LABEL_SIZE, weight=600) -> str:
    """Label at 0° - never rotate. Size defaults to LABEL_SIZE (14). Supports \\n."""
    lines = label_lines(s)
    attrs = (
        f'x="{f(x)}" text-anchor="middle" dominant-baseline="middle"'
        f' font-family="{FONT}" font-size="{size}" font-weight="{weight}" fill="{LABEL}"'
    )
    if len(lines) == 1:
        return f'<text {attrs} y="{f(y)}">{lines[0]}</text>'
    line_h = size * 1.2
    y0 = y - (len(lines) - 1) * line_h / 2
    parts = [f'<text {attrs} y="{f(y0)}">{lines[0]}']
    for ln in lines[1:]:
        parts.append(f'<tspan x="{f(x)}" dy="{f(line_h)}">{ln}</tspan>')
    parts.append("</text>")
    return "".join(parts)


def ext_start(feature, dim_end, gap=EXT_GAP):
    """Inset from the solid along the extension so the line never touches the shape."""
    dx = dim_end[0] - feature[0]
    dy = dim_end[1] - feature[1]
    length = math.hypot(dx, dy) or 1.0
    t = min(gap / length, 0.45)
    return (feature[0] + dx * t, feature[1] + dy * t)


def dim(p0, p1, name, label_xy, ext=None, tick_axis=None, poly=None) -> str:
    """Dimension line on one iso axis; label horizontal at label_xy; no solid overlay."""
    assert_axis(p0, p1, name)
    if poly is not None:
        assert_clear(p0, p1, label_xy, name, poly)
    parts = ['<g class="dim">']
    if ext:
        for a, b in ext:
            # a = feature on solid, b = dim-line end - trim so extension leaves a gap
            start = ext_start(a, b)
            assert_axis(start, b, f"{name} ext")
            parts.append(edge(start, b, sw=SW_EXT, op=EXT_OP))
    parts.append(edge(p0, p1, sw=SW_DIM))
    # Length (150°) → ticks at 30°; Width (30°) → ticks at 150°; Depth (90°) → ticks at 30°
    if tick_axis is not None:
        ta = tick_axis
    else:
        ang = axis_angle(p0, p1)
        if abs(ang - 90) < 1:
            ta = iso(0, 1, 0)  # 30°
        elif abs(ang - 30) < 1:
            ta = iso(1, 0, 0)  # 150°
        else:
            ta = iso(0, 1, 0)  # 30° (for 150° dim lines)
    parts.append(tick(p0, ta))
    parts.append(tick(p1, ta))
    parts.append(text(label_xy[0], label_xy[1], name))
    parts.append("</g>")
    return "\n".join(parts)


def fit(title: str, body: str, pad=22.0) -> str:
    """Build SVG; viewBox is centred on the solid shape (labels may be asymmetric)."""
    xs, ys = [], []
    solid_xs, solid_ys = [], []

    def add_pt(x: float, y: float, *, solid=False) -> None:
        xs.append(x)
        ys.append(y)
        if solid:
            solid_xs.append(x)
            solid_ys.append(y)

    for m in re.finditer(r'(?:x1|x2|x)="([-\d.]+)"\s+(?:y1|y2|y)="([-\d.]+)"', body):
        add_pt(float(m.group(1)), float(m.group(2)))
    for m in re.finditer(r'<path d="([^"]+)"([^>]*)>', body):
        d, attrs = m.group(1), m.group(2)
        is_solid = 'fill="none"' not in attrs and "fill=" in attrs
        for pm in re.finditer(r"[ML]\s*([-\d.]+)\s+([-\d.]+)", d):
            add_pt(float(pm.group(1)), float(pm.group(2)), solid=is_solid)
    # Include label glyph boxes so text isn't clipped (supports multiline / tspan)
    for m in re.finditer(r"<text ([^>]+)>(.*?)</text>", body, re.S):
        attrs, inner = m.group(1), m.group(2)
        xm = re.search(r'\bx="([-\d.]+)"', attrs)
        ym = re.search(r'\by="([-\d.]+)"', attrs)
        if not xm or not ym:
            continue
        tx, ty = float(xm.group(1)), float(ym.group(1))
        name = "\n".join(p for p in re.sub(r"<[^>]+>", "\n", inner).split("\n") if p)
        w, h = label_fit_size(name)
        nlines = len(label_lines(name))
        cy = ty + (nlines - 1) * (LABEL_SIZE * 1.2) / 2 if nlines > 1 else ty
        xs.extend([tx - w / 2, tx + w / 2])
        ys.extend([cy - h / 2, cy + h / 2])
    if not xs:
        xs, ys = [0, 300], [0, 220]

    # Tight outer margin - label_fit_size already reserves glyph room
    content_minx, content_maxx = min(xs) - pad, max(xs) + pad
    content_miny, content_maxy = min(ys) - pad, max(ys) + pad

    if solid_xs:
        cx = (min(solid_xs) + max(solid_xs)) / 2
        cy = (min(solid_ys) + max(solid_ys)) / 2
    else:
        cx = (content_minx + content_maxx) / 2
        cy = (content_miny + content_maxy) / 2

    half_w = max(cx - content_minx, content_maxx - cx)
    half_h = max(cy - content_miny, content_maxy - cy)
    minx, miny = cx - half_w, cy - half_h
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{f(minx)} {f(miny)} {f(2 * half_w)} {f(2 * half_h)}"'
        f' aria-hidden="true">\n  <title>{title}</title>\n{body}\n</svg>\n'
    )


def write(name, title, body):
    (OUT / name).write_text(fit(title, body), encoding="utf-8")
    print("wrote", name)


# ── BOX (Slab / Pad first - keep this dead simple) ───────────────────────────

def box(L, W, H, *, vertical_name: str = "Depth"):
    """Solid isometric box: 3 visible faces, dims outside. No hidden edges.

    Length + Width project off the two TOP edges that meet at peak TB
    (TR-TB and TL-TB) - never off the bottom edges.
    Offsets grow until dim lines + labels clear the silhouette.
    Slab / Pad uses vertical_name=\"Thickness\"; footing / pier keep \"Depth\".
    """
    N, R, Lf = iso(0, 0, 0), iso(0, W, 0), iso(L, 0, 0)
    T, TR, TL, TB = iso(0, 0, H), iso(0, W, H), iso(L, 0, H), iso(L, W, H)
    poly = [TB, TR, R, N, Lf, TL]
    parts = [
        face([N, Lf, TL, T]),
        face([N, R, TR, T]),
        face([T, TL, TB, TR]),
    ]
    v30, v150, v30out = _axes()
    vname = vertical_name

    def depth_at(g):
        a, b = iso(L, -g, H), iso(L, -g, 0)
        return a, b, lab_at(a, b, v30out, vname)

    def length_at(g):
        a, b = iso(0, W + g, H), iso(L, W + g, H)
        return a, b, lab_at(a, b, v30, "Length")

    def width_at(g):
        a, b = iso(L + g, 0, H), iso(L + g, W, H)
        return a, b, lab_at(a, b, v150, "Width")

    d0, d1, dlab, _ = clear_offset(depth_at, poly, vname)
    segs = [(d0, d1)]
    l0, l1, llab, _ = clear_offset(length_at, poly, "Length", avoid_segs=segs)
    segs += [(l0, l1)]
    w0, w1, wlab, _ = clear_offset(width_at, poly, "Width", avoid_segs=segs)

    Ht = TR  # iso(0, W, H)
    parts.append(dim(d0, d1, vname, dlab, [(TL, d0), (Lf, d1)], poly=poly))
    parts.append(dim(l0, l1, "Length", llab, [(Ht, l0), (TB, l1)], poly=poly))
    parts.append(dim(w0, w1, "Width", wlab, [(TL, w0), (TB, w1)], poly=poly))
    return parts


def gen_slab():
    write("slab.svg", "Slab / Pad - isometric dimensions", "\n".join(box(160, 100, 36, vertical_name="Thickness")))


def gen_footing():
    write("footing.svg", "Strip footing - isometric dimensions", "\n".join(box(188, 42, 36)))


def gen_pier():
    write("pierfooting.svg", "Pier footing - isometric dimensions", "\n".join(box(74, 74, 116)))


# ── COLUMN ───────────────────────────────────────────────────────────────────

def gen_column():
    r, H = 34, 136
    rx, ry = r, r * S30
    top, bot = iso(0, 0, H), iso(0, 0, 0)

    def ell(cx, cy, t0, t1, n=42):
        return [
            (cx + rx * math.cos(t0 + (t1 - t0) * i / n),
             cy + ry * math.sin(t0 + (t1 - t0) * i / n))
            for i in range(n + 1)
        ]

    # Full silhouette: top diameter + bottom half-ellipse (no grey hole under curve)
    silhouette = [
        (top[0] - rx, top[1]),
        (top[0] + rx, top[1]),
        *ell(bot[0], bot[1], 0, math.pi),
    ]
    parts = [
        face(silhouette, stroke=False),
        face(ell(top[0], top[1], 0, 2 * math.pi)),
        path_open(ell(bot[0], bot[1], 0, math.pi)),
        edge((top[0] - rx, top[1]), (bot[0] - rx, bot[1]), check=False),
        edge((top[0] + rx, top[1]), (bot[0] + rx, bot[1]), check=False),
    ]

    g_h = max(DIM_GAP, ry + 12)
    g_d = max(DIM_GAP, 20)
    e_l, e_r = (top[0] - rx, top[1]), (top[0] + rx, top[1])
    da, db = (e_l[0], top[1] - g_h), (e_r[0], top[1] - g_h)
    d_lab = lab_at(da, db, (0, -1), "Diameter")
    parts.append(dim(da, db, "Diameter", d_lab, [(e_l, da), (e_r, db)], tick_axis=(0, -1)))

    hx = top[0] - rx - g_d
    ha, hb = (hx, top[1]), (hx, bot[1])
    h_lab = lab_at(ha, hb, (-1, 0), "Height")
    # Keep Height label clear of Diameter line too
    while label_hits_segs(h_lab, "Height", [(da, db), (ha, hb)]) and g_d < 120:
        g_d += 4
        hx = top[0] - rx - g_d
        ha, hb = (hx, top[1]), (hx, bot[1])
        h_lab = lab_at(ha, hb, (-1, 0), "Height")
    parts.append(dim(
        ha, hb, "Height", h_lab,
        [((top[0] - rx, top[1]), ha), ((bot[0] - rx, bot[1]), hb)],
        tick_axis=(1, 0),
    ))
    write("column.svg", "Column - isometric dimensions", "\n".join(parts))


def gen_stairs():
    # Signed-off proportions (sandbox export)
    n = 4
    going, rise, width = 35, 26, 98
    total = n * going
    z_top = n * rise
    parts = []

    near = [iso(0, 0, 0)]
    far = [iso(0, width, 0)]
    for i in range(n):
        x0, x1 = i * going, (i + 1) * going
        z1 = (i + 1) * rise
        near += [iso(x0, 0, z1), iso(x1, 0, z1)]
        far += [iso(x0, width, z1), iso(x1, width, z1)]
    near.append(iso(total, 0, 0))
    far.append(iso(total, width, 0))

    parts.append(face_fill(near))
    # Left + bottom of side face under steps
    parts.append(edge(iso(total, 0, 0), iso(total, 0, z_top)))
    parts.append(edge(iso(0, 0, 0), iso(total, 0, 0)))
    parts.append(face_fill([
        iso(total, 0, z_top), iso(total, width, z_top),
        iso(total, width, z_top - rise), iso(total, 0, z_top - rise),
    ]))

    for i in range(n - 1, -1, -1):
        x0, x1 = i * going, (i + 1) * going
        z0, z1 = i * rise, (i + 1) * rise
        parts.append(face([
            iso(x0, width, z0), iso(x0, width, z1),
            iso(x0, 0, z1), iso(x0, 0, z0),
        ]))
        parts.append(face([
            iso(x0, 0, z1), iso(x1, 0, z1),
            iso(x1, width, z1), iso(x0, width, z1),
        ]))

    for i in range(n):
        x0, x1 = i * going, (i + 1) * going
        z0, z1 = i * rise, (i + 1) * rise
        parts.append(edge(iso(x0, 0, z0), iso(x0, 0, z1)))
        parts.append(edge(iso(x0, 0, z1), iso(x1, 0, z1)))
    parts.append(edge(iso(total, 0, z_top), iso(total, 0, 0)))
    parts.append(edge(iso(0, 0, 0), iso(going, 0, 0)))

    for i in range(n):
        x0 = i * going
        mid = iso(x0 + going * 0.35, width + OFF * 0.55, (i + 0.5) * rise)
        parts.append(text(mid[0], mid[1], str(i + 1), weight=700))

    v30, v150, _v30out = _axes()
    g = DIM_GAP + 12

    # Going off step 2; Rise off step 3/4 riser
    i_go = 1  # step 2 (1-indexed)
    xg0, xg1, zg = i_go * going, (i_go + 1) * going, (i_go + 1) * rise
    xr, zr1, zr0 = (n - 1) * going, n * rise, (n - 1) * rise

    ga, gb = iso(xg0, width + g, zg), iso(xg1, width + g, zg)
    ra, rb = iso(xr, width + g, zr1), iso(xr, width + g, zr0)
    glab = lab_at(ga, gb, v30, "Going")
    rlab = lab_at(ra, rb, v30, "Rise")
    # Keep Rise label off Going's dim line (and vice versa) by pushing Rise further out
    g_rise = g
    while (
        label_hits_seg(rlab, "Rise", ga, gb) or label_hits_seg(glab, "Going", ra, rb)
    ) and g_rise < 160:
        g_rise += 4
        ra, rb = iso(xr, width + g_rise, zr1), iso(xr, width + g_rise, zr0)
        rlab = lab_at(ra, rb, v30, "Rise")

    parts.append(dim(
        ga, gb, "Going", glab,
        [(iso(xg0, width, zg), ga), (iso(xg1, width, zg), gb)],
        tick_axis=v30,
    ))
    parts.append(dim(
        ra, rb, "Rise", rlab,
        [(iso(xr, width, zr1), ra), (iso(xr, width, zr0), rb)],
        tick_axis=v30,
    ))
    wa, wb = iso(total + DIM_GAP, 0, z_top), iso(total + DIM_GAP, width, z_top)
    parts.append(dim(
        wa, wb, "Width", lab_at(wa, wb, v150, "Width"),
        [(iso(total, 0, z_top), wa), (iso(total, width, z_top), wb)],
        tick_axis=v150,
    ))
    # Steps label near step 1, clear of the "1" numeral
    lab = iso(going * 0.15, width + DIM_GAP * 1.55, rise * 0.35)
    parts.append(text(lab[0], lab[1], "Steps"))

    write("stairs.svg", "Stairs - isometric dimensions", "\n".join(parts))


def gen_gutter():
    # Signed-off proportions (sandbox export) - thicker L profile, clearer dims
    L = 152
    KD, KH, GW, FT = 50, 67, 94, 30
    HT = KH + FT
    XF = KD + GW
    YO, YJ, YF = 0, GW, XF
    P = lambda x, y, z: iso(x, y, z)
    parts = []

    def end_l(x):
        return [
            P(x, YO, 0), P(x, YO, FT), P(x, YJ, FT), P(x, YJ, HT),
            P(x, YF, HT), P(x, YF, 0), P(x, YJ, 0),
        ]

    def stroke_end_l(x):
        # Full L silhouette including ground bottom (YO→YJ→YF at z=0)
        parts.extend([
            edge(P(x, YO, 0), P(x, YO, FT)),
            edge(P(x, YO, FT), P(x, YJ, FT)),
            edge(P(x, YJ, FT), P(x, YJ, HT)),
            edge(P(x, YJ, HT), P(x, YF, HT)),
            edge(P(x, YF, HT), P(x, YF, 0)),
            edge(P(x, YF, 0), P(x, YJ, 0)),
            edge(P(x, YJ, 0), P(x, YO, 0)),
        ])

    # End plugs + outlines first; long faces last so they occlude ghosts
    parts.append(face_fill(end_l(L)))
    stroke_end_l(L)
    parts.append(face_fill(end_l(0)))
    stroke_end_l(0)
    parts.append(face([P(0, YO, 0), P(L, YO, 0), P(L, YO, FT), P(0, YO, FT)]))
    parts.append(face([P(0, YO, FT), P(L, YO, FT), P(L, YJ, FT), P(0, YJ, FT)]))
    parts.append(face([P(0, YJ, HT), P(L, YJ, HT), P(L, YF, HT), P(0, YF, HT)]))
    parts.append(face([P(0, YJ, FT), P(L, YJ, FT), P(L, YJ, HT), P(0, YJ, HT)]))
    # Re-stroke outer bottom so the front face baseline stays crisp on top
    parts.append(edge(P(0, YO, 0), P(L, YO, 0)))

    v30, v150, v30out = _axes()
    corners = [
        P(0, YO, 0), P(L, YO, 0), P(0, YO, FT), P(L, YO, FT),
        P(0, YJ, FT), P(L, YJ, FT), P(0, YJ, HT), P(L, YJ, HT),
        P(0, YF, HT), P(L, YF, HT), P(0, YF, 0), P(L, YF, 0),
    ]
    poly = _convex_hull(corners)

    def mk_len(g):
        # From lowest edge of the solid (z=0 ground), not flag top
        a, b = iso(0, YO - g, 0), iso(L, YO - g, 0)
        return a, b, lab_at(a, b, v30out, "Length")

    FT_LAB = "Flag\nthickness"
    GW_LAB = "Gutter\nwidth"

    def mk_ft(g):
        a, b = iso(L, YO - g, FT), iso(L, YO - g, 0)
        return a, b, lab_at(a, b, v30out, FT_LAB)

    def mk_kh(g):
        # Off kerb front face (upright at YJ), not rear at YF
        a, b = iso(L + g, YJ, HT), iso(L + g, YJ, FT)
        return a, b, lab_at(a, b, v150, "Kerb height")

    def mk_kd(g):
        a, b = iso(L, YF, HT + g), iso(L, YJ, HT + g)
        return a, b, lab_at(a, b, (0, -1), "Kerb depth")

    def mk_gw(g):
        # Off back end of extrusion (x=L), not front (x=0)
        a, b = iso(L + g, YJ, FT), iso(L + g, YO, FT)
        return a, b, lab_at(a, b, v150, GW_LAB)

    lna, lnb, lnlab, _ = clear_offset(mk_len, poly, "Length")
    segs = [(lna, lnb)]
    fta, ftb, ftlab, _ = clear_offset(mk_ft, poly, FT_LAB, prefer=DIM_GAP, avoid_segs=segs)
    segs += [(fta, ftb)]
    gwa, gwb, gwlab, _ = clear_offset(mk_gw, poly, GW_LAB, prefer=DIM_GAP + 12, avoid_segs=segs)
    segs += [(gwa, gwb)]
    kha, khb, khlab, _ = clear_offset(mk_kh, poly, "Kerb height", prefer=DIM_GAP + 14, avoid_segs=segs)
    segs += [(kha, khb)]
    kda, kdb, kdlab, _ = clear_offset(mk_kd, poly, "Kerb depth", prefer=DIM_GAP + 14, avoid_segs=segs)

    parts.append(dim(lna, lnb, "Length", lnlab, [(P(0, YO, 0), lna), (P(L, YO, 0), lnb)], tick_axis=v30, poly=poly))
    parts.append(dim(fta, ftb, FT_LAB, ftlab, [(P(L, YO, FT), fta), (P(L, YO, 0), ftb)], tick_axis=v30, poly=poly))
    parts.append(dim(gwa, gwb, GW_LAB, gwlab, [(P(L, YJ, FT), gwa), (P(L, YO, FT), gwb)], tick_axis=v150, poly=poly))
    parts.append(dim(kha, khb, "Kerb height", khlab, [(P(L, YJ, HT), kha), (P(L, YJ, FT), khb)], tick_axis=v150, poly=poly))
    parts.append(dim(kda, kdb, "Kerb depth", kdlab, [(P(L, YF, HT), kda), (P(L, YJ, HT), kdb)], tick_axis=(0, -1), poly=poly))

    write("gutter.svg", "Gutter / Kerb - isometric dimensions", "\n".join(parts))



if __name__ == "__main__":
    gen_slab()
    gen_footing()
    gen_pier()
    gen_column()
    gen_stairs()
    gen_gutter()
