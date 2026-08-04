# SlabSet v20 - the 10/10 pass

## Status

| Field | Value |
|-------|-------|
| status | preview |
| role | **v19, deliberately pushed further.** Andre asked for a fork with explicit license to override prior decisions ("break my rules if you need to") and ten self-directed rounds of critique-and-fix. Ten rounds ran: accessibility, colour-signal cleanup, motion, performance/assets, copy, edge-case testing, boot-state UX, code-quality sweep, full regression, and this doc rewrite. See "Delta from v19" below for what actually changed. |
| parent | `Calculator-Studio/slab-set/` |
| base | `app-v19/` at the point Andre requested the v20 fork (2026-08-05) |
| preview | `python3 dev-server.py` → `http://127.0.0.1:8833/` |
| live | not promoted - **live is v18** (`v18-preview-21`) |
| verified | Full Playwright regression: all 6 shapes × both themes, zero console errors, zero horizontal overflow, zero diagram/field overlap. Keyboard-only entry path (Tab → Enter → type via keypad → Tab away) verified end to end. Contrast-checked against WCAG AA numerically, not by eye. **Not yet checked on a real physical device.** |

## Doctrine

**It is an iPhone app that happens to have a URL. The answer is never off-screen.**

1. **No modes, no tabs, no checkout sheet.** Shape → dimensions → order → Copy/Share,
   top to bottom in one scroll.
2. **The answer is pinned.** `.volume-card` sits fixed above the scroll area,
   `flex-shrink: 0` outside `#scroll-area`'s scrolling flex child. Tried unpinned
   (scrolling with the rest of the stack) mid-v19 and reverted - the keypad covers
   roughly a third of the screen while typing, so an unpinned answer routinely sat
   below the visible viewport on exactly the shapes with the most fields.
3. **Three cards, one language.** `.volume-card` (the answer), `.inputs-card` (Shape +
   Diagram + Dimensions + Wastage - the diagram lives here because it's a live
   description of the Shape selection, not decoration), `.order-block` (the decision).
   All three: `--surface-1` background, `--radius` (10px) corners, 12px padding. This is
   a deliberate partial departure from v18's "no card containers" doctrine - v18 was
   fully flat, v19/v20 use cards specifically where something deserves visual emphasis
   (the answer, the decision) and stay flat everywhere else (header, Shape heading,
   Diagram, Copy/Share, footer).
4. **One control language for "pick one of a few."** Shape, Wastage, the m⇄mm toggle,
   and Order's bag-size toggle all use the same native-picker pattern: current value +
   chevron, an invisible `<select>` overlaying the whole control, tapping opens the
   OS's real picker wheel. Settled on this over a segmented control and a
   contextual-menu popover (both built and compared side by side) specifically for this
   consistency - one interaction idiom, not three.
5. **No hairlines.** Every row-to-row divider was removed. Separation comes from bold
   labels/values, whitespace, and (in Order) the row's own bold name + subtitle. Chrome
   boundaries (header, keypad) read off background-colour changes alone.
6. **The keypad is real, not decorative.** `<button>` elements in normal tab order
   (a v19 fix, carried in unchanged - was `tabindex="-1"` divs, completely unreachable
   without touch). v20 added the next step: activating a field via keyboard (Enter/Space)
   now shifts focus straight into the keypad,
   so a keyboard-only user doesn't have to tab through the entire rest of the page to
   reach a key to type with.
7. **Boots neutral.** No field pre-focused, keypad hidden, until the user actually taps
   something (v20 fix - previously the first field of the default shape was
   pre-focused with the keypad already up on every fresh load, a known mobile
   anti-pattern that hid the app's own overview behind unrequested UI).
8. **One deliberate colour, one meaning.** `--diagram-accent` (iOS system blue) marks
   "you are editing this dimension right now" - the diagram's highlighted line and the
   focused field's ring, fired at the same moment by the same event. Nothing else uses
   it. (v20 reverted a v19 change that had also used it for the "Recommended" label -
   see delta table.)
9. **A caution is a nudge, not a gate.** Implausible values get an inline warning and a
   repeat of it on Copy/Share, but Copy/Share stay enabled regardless - the trade knows
   their own job better than a range table does.
10. **Nothing is prefilled.** Dimensions start empty; Wastage (10%) and bag size (20kg)
    are defaults, not measurements, so they're the exception.

## Type scale

Six steps, job-site legibility sizing (each roughly 35-45% larger than v18's HIG
defaults, tuned for outdoor/arm's-length reading):

| Token | Size | Role |
|---|---|---|
| `--text-xxs` | 11px | Captions: section labels, "Recommended", field-optional notes, warnings |
| `--text-xs` | 14px | Unit-picker current-value text |
| `--text-s` | 17px | Row names (Bags/Ready-mix), Copy/Share buttons, header title |
| `--text-m` | 20px | Field values, field labels, shape heading, keypad |
| `--text-l` | 26px | Keypad digit glyphs, chevrons |
| *(literal)* | 30px | The volume hero (`.volume-value`) - deliberately off-scale so the answer stays visually distinct from everything else |

## Delta from v19

Only what actually changed in the ten rounds - see `app-v19/CONTEXT.md` for the much
longer history of how v19 itself got built.

| Area | What changed | Why |
|---|---|---|
| **Contrast** | `--text-muted` darkened (light: `#79797d`→`#6c6c70`; dark: `#7c7c80`→`#939396`) | Measured 3.89:1/4.34:1 against its actual backgrounds - fails WCAG AA (4.5:1) at every size this token is used at (11-17px, none large/bold enough for the reduced 3:1 threshold). New values clear 4.5:1 against both `--bg` and card surfaces in both themes. |
| **"Recommended" colour** | Tried `--diagram-accent-text` (a darkened blue, to fix a similar AA failure), then reverted to `--text-secondary` entirely | Blue was already doing two jobs (diagram highlight + focus ring, legitimately paired) - reusing it a third time for an unrelated meaning ("this is recommended") diluted what the colour signals. The word "Recommended" already carries the meaning; a third colour role didn't add clarity. |
| **Keyboard access to the keypad** | *(Not a v20 change - the `.key` div→`<button>` conversion happened in v19 already, verified still present. Listed here only because it's easy to conflate with the v20 fix below.)* | — |
| **Keyboard focus flow** | Activating a field via Enter/Space now moves focus straight into the keypad's first key | The keypad sits last in DOM order (it's pinned outside `#scroll-area`), so before this fix, tabbing forward from a focused field required walking through every remaining field, Wastage, Order, Copy/Share and the footer links before ever reaching a key. |
| **Boot state** | `state.focus` now starts `null` (was the shape's first field); `#keypad-wrap` starts with `is-hidden` in the static markup | Auto-focusing a field and raising the keypad before any user action is a known mobile anti-pattern - it hid the app's own overview (diagram, other fields, Order, Copy/Share) behind unrequested UI on every fresh load. `highlightDim()` already had a dedicated "nothing focused" branch for this state; it just was never reachable at boot. |
| **Keypad show/hide** | `display: none` toggle replaced with a `max-height` + `padding` transition (0.25s, respects `prefers-reduced-motion`) | Snapped instantly before; now slides, closer to how a real keyboard raises/dismisses. |
| **Theme switch** | Added a scoped `background-color`/`color`/`border-color`/`box-shadow` transition (0.15s) across the page | Previously every colour on the page flipped instantly on toggle - the most jarring single interaction in the app. |
| **Keypad press feedback** | `.key` gained an actual `transition` (`transform 0.1s`, `background-color 0.1s`) | There was a `prefers-reduced-motion` override already written for `.key:active`'s transform, but no transition had ever been wired for it to override - press feedback was a hard snap. Kept fast/punchy, distinct from the slower ambient theme-fade. |
| **Diagram sizing** | (Carried in from a v19 hotfix, confirmed still correct) `.diagram-area` has no fixed height, only `min-height: 60px` | A fixed box shorter than `sizeDiagram()`'s actual max render height (120-150px depending on shape) let some diagrams visually bleed into the field rows below. |
| **Dead assets removed** | `bags-stack-crop.png` (36K), `truck-filled-crop.png` (12K) deleted from `shared/icons/` | Leftover from an earlier design (Order rows once had bag/truck icons, dropped in v18) - unreferenced anywhere, not even in the service worker's cache list. |
| **Perf** | Added `<link rel="preconnect">` for the GA4 script's domain | Small, safe win - nothing else in the asset/loading pass needed changing (file sizes were already all reasonable; the service worker's network-first caching strategy was deliberately left alone - it's a considered choice for a project under this much active daily iteration, not an oversight). |
| **Code quality** | Full sweep: zero unused CSS classes, zero unused JS functions, zero TODO/FIXME markers found | Confirms the codebase was already clean going into v20 - nothing to remove. |

## What was checked and found already correct (not changed)

- Accessible names on every interactive element (verified via a full ARIA-tree dump, not spot checks).
- Tab order (logical, complete, every control reachable).
- Multiple-decimal-point input handling (`"1.2.3"` → `"1.23"`, second `.` silently ignored).
- Extreme values (999999m) - no layout overflow, plausibility warning fires correctly once the field is settled.
- `isComplete()`'s handling of a literal `"0"` in a required field (explicitly guarded via `parseFloat(...) <= 0`, doesn't fall through as a truthy-string bug).
- Rapid shape switching, theme toggle mid-edit (blurs the active field - confirmed this matches the app's own documented "tap outside dismisses" philosophy, not a bug), draft persistence across reload.
- Theme toggle's `aria-label` updates dynamically per-state (says what tapping it will *do*, not what it currently *is* - correct pattern).

## Known gaps

- **No job-name field.** `CONTEXT.md` history inherited from earlier versions describes
  a "job docket: job name + date" feature - that never made it into v18/v19/v20's
  actual build. Only the date auto-stamps. Not built here either; flagged as a doc/reality
  mismatch, not treated as missing scope for this pass.
- **Not verified on a real device.** Every check this round was a real headless-Chromium
  render (not just CSS reasoning), which is a meaningfully stronger guarantee than v19
  had for most of its build - but glare, actual touch feel, and real VoiceOver/TalkBack
  behavior still need a physical device.
- **`.theme-toggle`'s full-circle shape was reverted to square early in v19** (Andre's
  call) and stayed square through v20 - not an open item, just noting the shape
  language is intentionally consistent with the rest of the app's squircle radius now.

## Deploy

Preview only. On promote: bump `sw.js` VERSION, refresh `sitemap.xml` lastmod, sync to
the deploy repo, update `LIVE.md` here, at `app-v19/`, and at the deploy-repo root.
