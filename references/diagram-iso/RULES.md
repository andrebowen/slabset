# Isometric diagram rules

Locked for SlabSet dimension diagrams (`sandbox.html` + `shared/diagrams/_gen_iso.py`).

## Axes

Box edges and **dimension lines** may only use these screen angles:

| Angle | Axis |
|------:|------|
| **30°** | one ground axis (up-right) |
| **150°** | other ground axis (up-left) |
| **90°** | vertical (depth / height) |

**Do not use any other angle** for dimension lines or extension lines.

## Labels

| Rule | Value |
|------|------:|
| Text glyphs | always **horizontal 0°** (never rotated) |
| Label **size** | always **14px** - one constant; do not override per dim |
| Label **position** | offset from the dim-line midpoint along the **same iso axis** the dim projects out on (30° / 150° / 90°) |
| Label vs dim line | **Labels must not overlap dimension lines** (own or other dims’) - grow the label gap until clear |

| Dim | Dim line | Projects out along | Label sits further along |
|-----|----------|--------------------|--------------------------|
| **Length** | 150° | 30° (+y) | 30° from dim midpoint |
| **Width** | 30° | 150° (+x) | 150° from dim midpoint |
| **Depth** | 90° | 30° (−y) | 30° laterally from dim midpoint (kept at mid-height so it doesn’t slide to a tick) |

Do not park labels with a random screen offset (e.g. pure horizontal/vertical) unless that direction is one of the three axes.

## Clearance (no overlay)

**Dimension lines, extension lines, ticks, and labels must not sit on or cross the solid volume.**

- Keep all dim geometry **outside** the shape’s screen silhouette
- **Extension / project lines never touch the shape** - always leave a gap (`EXT_GAP`) between the solid edge and the start of the extension; the line runs from that inset point out to the dimension line
- The **dimension line** itself sits fully clear of the solid (offset by Gap)
- Labels must not overlap faces or edges
- **Labels must not overlap dimension lines** - including their own measured segment and other dims’ lines
- Grow axis-aligned offsets / label gaps until clearance is met - never cut corners by using a non-axis angle

## Length / Width (top edges only)

**Length and Width are projected off the top two edges - not the bottom.**

They come from the two top-face edges that meet at the far peak `TB`:

| Dim | Top edge | Offset outward | Axis |
|-----|----------|----------------|------|
| **Length** | `TR-TB` (+x) | +y | 150° |
| **Width** | `TL-TB` (+y) | +x | 30° |
| **Depth** / **Thickness** | beside a vertical (e.g. `Lf-TL`) | - | 90° |

**Slab / Pad** labels the vertical dim **Thickness**. Strip footing and pier footing keep **Depth**.

## End ticks

End ticks stay on allowed axes only:

| Dim line | Tick angle |
|----------|------------|
| **Length** (150°) | **30°** |
| **Width** (30°) | **150°** |
| **Depth** (90°) | **30°** (or 150°) |

Length/Width ticks are **not** vertical (90°).

Never place Length or Width on bottom edges `N-Lf` / `N-R` or under the solid.

## Solid

- Exactly **3 visible faces** (convex iso hexagon)
- Opaque faces - no back / hidden edges

## Cylinder (column)

Exception - cylinder dims project on screen axes (not 30°/150°):

| Dim | Dim line | Projects off | Label offset |
|-----|----------|--------------|--------------|
| **Height** | 90° (vertical) | **0°** (horizontal) | further on **0°** |
| **Diameter** | 0° (horizontal) | **90°** (vertical) | further on **90°** |

Dims + labels must stay **outside** the cylinder (no overlay on the body or ellipse).

## Defaults (signed off)

Sandbox → generator: **Gap = 36**, **Ext gap = 8**, **Label gap = 16**, **Label size = 14**. Box rule set locked; SVGs regenerated from `_gen_iso.py`.
