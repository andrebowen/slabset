/* SlabSet v20 - the "make it a 10/10" pass off v19. Engine and shape maths carried
   from v15/v16/v17 unchanged; everything else is fair game this round. */
(function () {
  'use strict';

  // Field ids are namespaced per shape so a shared label like "Width" can't carry a wrong
  // unit across shapes. vol() receives every field already normalised to metres; counts
  // stay raw.
  //
  // `lo`/`hi` are trade-plausible bounds in metres (raw for counts). They gate nothing -
  // they raise a caution. One mis-tap on a unit badge used to turn a 3 x 2 x 100mm slab
  // into 79,939 m3 and cheerfully recommend 7,993,986 bags in total silence.
  //
  // Anchored to published figures, not guesses (2026-07-30 pass): NCC/BCA stair geometry
  // (riser/going/width minimums for a private stairway), AS 2870 residential footing depth
  // and pier-bore practice in reactive soil, AS 3600 slab thickness ranges from screed to
  // heavy industrial floors, and common kerb & channel profile dimensions. Each shape's
  // fields note their source below. Still worth a tradesperson's read before this is
  // treated as gospel - these are code minimums/maximums and common practice, not a
  // structural engineer's sign-off on any specific job.
  var shapes = [
    {id:'slab', label:'Slab / Pad', diagram:'slab',
     // Thickness: 75mm covers a light path/screed slab; 350mm spans ordinary residential
     // through heavy-duty industrial floors (AS 3600). A "slab" under 300mm on a side reads
     // more like a stepping pad than a poured slab, hence the length/width floor.
     fields:[{id:'slabL',label:'Length',lo:0.3,hi:100},
             {id:'slabW',label:'Width',lo:0.3,hi:100},
             {id:'slabT',label:'Thickness',lo:0.075,hi:0.35}],
     vol:function(v){ return v.slabL * v.slabW * v.slabT; }},

    {id:'pierfooting', label:'Pier footing', diagram:'pierfooting',
     // Domestic pier/pad footings run roughly 300-600mm square; depth follows AS 2870 -
     // deeper in reactive clay, but a bored pier past ~4m is unusual for this class of pour.
     // Count field carried over from v15/live - a job pours a set of identical piers, not
     // one. Labeled 'Piers' (2026-08-12, was 'Quantity') to match Steps' own pattern
     // (the item name itself, not a generic count noun) and to stop colliding with the
     // Outputs ledger's "Base quantity"/"Order quantity" rows added later in v22.1 -
     // same word, unrelated meaning (a count here, a volume there), easy to misread as
     // one deriving from the other when they sit on the same screen.
     fields:[{id:'pierL',label:'Length',lo:0.2,hi:3},
             {id:'pierW',label:'Width',lo:0.2,hi:3},
             {id:'pierD',label:'Depth',lo:0.2,hi:4},
             {id:'pierQty',label:'Piers',count:true,lo:1,hi:60}],
     vol:function(v){ return v.pierL * v.pierW * v.pierD * v.pierQty; }},

    {id:'column', label:'Column', diagram:'column',
     // Verandah posts start around 75-90mm; structural columns for a two-storey pour rarely
     // exceed ~1.2m diameter or 8m height in residential/light-commercial work. Count
     // field carried over from v15/live, same reasoning as pier footing - labeled
     // 'Columns' (2026-08-12, was 'Quantity'), same fix and same reasoning as pierQty
     // above.
     fields:[{id:'colDia',label:'Diameter',lo:0.075,hi:1.2},
             {id:'colH',label:'Height',lo:0.3,hi:8},
             {id:'colQty',label:'Columns',count:true,lo:1,hi:40}],
     vol:function(v){ return Math.PI * Math.pow(v.colDia/2, 2) * v.colH * v.colQty; }},

    {id:'footing', label:'Strip footing', diagram:'footing',
     // 250mm is close to the narrowest strip footing code allows; wider than ~1.2m starts
     // reading as a raft, not a strip. Depth 200mm-1.5m covers standard to reactive-soil runs.
     fields:[{id:'ftgL',label:'Length',lo:0.5,hi:300},
             {id:'ftgW',label:'Width',lo:0.25,hi:1.2},
             {id:'ftgD',label:'Depth',lo:0.2,hi:1.5}],
     vol:function(v){ return v.ftgL * v.ftgW * v.ftgD; }},

    {id:'stairs', label:'Stairs', diagram:'stairs',
     // Rise/going/width follow NCC private-stairway geometry (max riser ~190mm, min going
     // ~240mm, min width ~700mm) with a small margin either side for garden/outdoor steps.
     // A single continuous flight past ~30 risers with no landing is worth a second look.
     fields:[{id:'stN',label:'Steps',count:true,lo:1,hi:30},
             {id:'stR',label:'Rise',lo:0.1,hi:0.22},
             {id:'stG',label:'Going',lo:0.2,hi:0.4},
             {id:'stW',label:'Width',lo:0.7,hi:3},
             {id:'stBT',label:'Base',optional:true,lo:0,hi:0.3}],
     vol:function(v){
       var wedge = v.stW * v.stG * v.stR * (v.stN * (v.stN + 1) / 2);
       return wedge + v.stW * (v.stG * v.stN) * v.stBT;
     }},

    {id:'gutter', label:'Gutter / Kerb', diagram:'gutter',
     // Kerb & channel profile dims from common civil practice: upstand height ~50-300mm
     // (mountable to barrier kerb), full profile depth 150-450mm, flag/invert 75-200mm,
     // channel width 150mm domestic to ~1.2m arterial.
     fields:[{id:'gutL',label:'Length',lo:0.5,hi:500},
             {id:'gutKD',label:'Kerb depth',lo:0.15,hi:0.45},
             {id:'gutKH',label:'Kerb height',lo:0.05,hi:0.3},
             {id:'gutFT',label:'Flag thickness',lo:0.075,hi:0.2},
             {id:'gutGW',label:'Gutter width',lo:0.15,hi:1.2}],
     vol:function(v){ return v.gutL * (v.gutKD * (v.gutKH + v.gutFT) + v.gutGW * v.gutFT); }}
  ];

  // Dimensions start empty. A prefilled measurement reads as an answer, and v12 shipped
  // that problem as "0.99 example only" - a number nobody should act on, sitting where
  // the real one goes. Wastage and bag size are defaults, not measurements, so they stay -
  // Quantity joins them: a single pier/column is the common case, not a measurement to
  // force typing every time.
  var vals = { wastage: '10', pierQty: '1', colQty: '1' };

  var DEFAULT_UNITS = {
    slabL:'m', slabW:'m', slabT:'mm',
    pierL:'mm', pierW:'mm', pierD:'mm',
    colDia:'mm', colH:'mm',
    ftgL:'m', ftgW:'m', ftgD:'mm',
    stR:'mm', stG:'mm', stW:'mm', stBT:'mm',
    gutL:'m', gutKD:'mm', gutKH:'mm', gutFT:'mm', gutGW:'mm'
  };
  var units = {};
  for (var k in DEFAULT_UNITS) { units[k] = DEFAULT_UNITS[k]; }

  var UNIT_OPTS = ['m', 'mm'];
  var UNIT_FACTOR = { m: 1, mm: 0.001 };

  // Wastage is a fixed preset list via native <select> popup - carried over from v17.
  // Notes live in option labels (e.g. "10% Recommended for standard site").
  // v22.48–50 HIG segments reverted (v22.51 Andre): back to Order-ledger pulldown.
  var WASTE_OPTS = [0, 5, 10, 15];
  var WASTE_DEFAULT = 10;
  var WASTE_NOTES = {
    0: 'No allowance for wastage',
    5: 'Smooth site and formwork',
    10: 'Recommended for standard site',
    15: 'Rough ground'
  };

  var state = {
    shape: 'slab',
    focus: 'slabL',
    bagSize: 20,
    hadOrder: false
  };

  var DRAFT_KEY = 'slabset-draft';
  var THEME_KEY = 'slabset-theme';

  // Carried over from v15: a soft vibrate on key entry, shape pick and the moment the
  // volume first becomes computable. Feature-detected, so it silently no-ops on desktop
  // and any browser without the Vibration API.
  function tick(ms) {
    try { if (navigator.vibrate) navigator.vibrate(ms || 8); } catch (e) {}
  }

  // GA4 only loads on index.html (see EVENTS.md) - guarded so this silently no-ops
  // anywhere else app.js runs, same pattern as tick() above.
  function track(name, params) {
    try { if (typeof gtag === 'function') gtag('event', name, params || {}); } catch (e) {}
  }

  function todayISO() {
    var d = new Date();
    // Local date, not toISOString - that shifts to UTC and can land yesterday in AEST.
    var m = String(d.getMonth() + 1);
    var day = String(d.getDate());
    return d.getFullYear() + '-' + (m.length < 2 ? '0' + m : m) + '-' + (day.length < 2 ? '0' + day : day);
  }

  // ── Draft ────────────────────────────────────────────────────────────────────
  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        vals: vals, units: units,
        shape: state.shape, focus: state.focus,
        bagSize: state.bagSize
      }));
    } catch (e) {}
  }

  function loadDraft() {
    var raw = null;
    try { raw = localStorage.getItem(DRAFT_KEY); } catch (e) {}
    if (!raw) return;
    var d;
    try { d = JSON.parse(raw); } catch (e) { return; }
    if (!d || typeof d !== 'object') return;

    if (d.vals && typeof d.vals === 'object') { vals = d.vals; }
    if (typeof vals.wastage !== 'string') { vals.wastage = String(WASTE_DEFAULT); }
    // A draft saved before wastage became a fixed preset list may carry a value outside
    // it (e.g. a freely typed "7") - snap those back to the default.
    if (WASTE_OPTS.indexOf(parseFloat(vals.wastage)) === -1) { vals.wastage = String(WASTE_DEFAULT); }
    // A draft saved before Quantity existed won't carry pierQty/colQty - default them to
    // 1 rather than leaving them blank and blocking isComplete() on an old draft.
    if (!vals.pierQty || parseFloat(vals.pierQty) <= 0) { vals.pierQty = '1'; }
    if (!vals.colQty || parseFloat(vals.colQty) <= 0) { vals.colQty = '1'; }
    if (d.units && typeof d.units === 'object') {
      for (var id in DEFAULT_UNITS) {
        if (UNIT_OPTS.indexOf(d.units[id]) !== -1) { units[id] = d.units[id]; }
      }
    }
    if (shapeById(d.shape)) { state.shape = d.shape; }
    if ([20, 25, 30].indexOf(d.bagSize) !== -1) { state.bagSize = d.bagSize; }
    state.focus = fieldById(d.focus) ? d.focus : currentShape().fields[0].id;
  }

  function shapeById(id) {
    for (var i = 0; i < shapes.length; i++) { if (shapes[i].id === id) return shapes[i]; }
    return null;
  }
  function currentShape() { return shapeById(state.shape) || shapes[0]; }
  function fieldById(id) {
    var f = currentShape().fields;
    for (var i = 0; i < f.length; i++) { if (f[i].id === id) return f[i]; }
    return null;
  }

  // ── Values ───────────────────────────────────────────────────────────────────
  function baseValueMetres(id) {
    return (parseFloat(vals[id]) || 0) * UNIT_FACTOR[units[id]];
  }
  function formatNum(n) { return String(Math.round(n * 1000) / 1000); }

  // A caution can put four or five digits in front of the decimal point (100m Thickness ->
  // 66000 bags); unformatted, a number that size defeats the "safe to act on" doctrine
  // just as much as an un-cautioned one. Comma the integer part only.
  function withCommas(numStr) {
    var parts = String(numStr).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  // m ⇄ mm. v19: a real segmented control (both units visible, active one solid) since
  // it's a strictly binary choice - HIG's own convention for a small fixed set of
  // options is to show all of them, not hide the alternative behind a cycling tap
  // (that pattern's kept for the 3-way bag-size toggle elsewhere, where a segmented
  // control would be too wide). Sets the tapped unit directly rather than advancing to
  // the next one, since both segments are already visible and tappable individually.
  // Wastage's unit ('%') has nothing to swap to, so its badge is never wired to this.
  function setUnit(id, next, evt) {
    evt.stopPropagation();
    if (units[id] === next) return;
    // Convert through metres so the measurement survives the unit change.
    if (vals[id]) { vals[id] = formatNum(baseValueMetres(id) / UNIT_FACTOR[next]); }
    units[id] = next;
    renderFields(); renderResults(); saveDraft();
  }

  // Every dimension the maths needs must be typed. Optional extras (a stairs base slab
  // that isn't being poured) and wastage don't gate the answer.
  function isComplete() {
    var f = currentShape().fields;
    for (var i = 0; i < f.length; i++) {
      if (f[i].optional) continue;
      if (!vals[f[i].id] || parseFloat(vals[f[i].id]) <= 0) return false;
    }
    return true;
  }

  // Fields the user has finished with. A half-typed number is almost always implausible -
  // typing "100" passes through "1", which is 1mm - so judging a field while it is being
  // edited just nags. A field is only assessed once you have moved on from it, and going
  // back to edit it clears the verdict until you leave again.
  var settled = {};

  // Tapping into a field selects its whole value, like a native number input - the
  // next digit replaces rather than appends. True only for the keystroke right after
  // a tap; typing itself consumes it.
  var selectFocused = false;

  function settle(id) { if (id && vals[id]) { settled[id] = true; } }
  function settleAll() {
    currentShape().fields.forEach(function (f) { settle(f.id); });
  }

  // A caution, not a gate. Returns a sentence or null.
  function warnFor(f) {
    var raw = vals[f.id];
    if (!raw) return null;
    if (!settled[f.id]) return null;
    var n = parseFloat(raw);
    if (isNaN(n)) return null;
    if (f.optional && n === 0) return null;
    var metres = f.count ? n : baseValueMetres(f.id);
    if (f.lo != null && metres < f.lo && !(f.optional && metres === 0)) {
      return f.count
        ? 'Unusually few for ' + f.label.toLowerCase() + '.'
        : 'That is a small ' + f.label.toLowerCase() + '. Check dimensions.';
    }
    if (f.hi != null && metres > f.hi) {
      return f.count
        ? 'That is a lot of ' + f.label.toLowerCase() + '. Worth a second look.'
        : 'That is a large ' + f.label.toLowerCase() + '. Check dimensions.';
    }
    return null;
  }
  function anyWarnings() {
    return currentShape().fields.filter(function (f) { return warnFor(f); });
  }

  function computeVolume() {
    var s = currentShape();
    var m = {};
    s.fields.forEach(function (f) {
      m[f.id] = f.count ? (parseFloat(vals[f.id]) || 0) : baseValueMetres(f.id);
    });
    return s.vol(m);
  }
  function orderVolume() {
    return computeVolume() * (1 + (parseFloat(vals.wastage) || 0) / 100);
  }

  // ── Recommendation ───────────────────────────────────────────────────────────
  function getRec(withWaste) {
    var buffer = 0.05, threshold = 0.5;
    if (withWaste > threshold + buffer) return 'ready';
    if (withWaste < threshold - buffer) return 'bags';
    return null;   // too close to call - don't pretend
  }
  // Kept for analytics only (calc_complete / specTrackParams); not rendered on
  // Supply tiles (v22.44) and not used to rank the Copy/Share docket (v22.47).
  // v22.25/v22.37/v22.39 copy history: ready "Less mixing. One pour."; bags "Easy on a small job."
  var REC_REASON = {
    ready: 'Less mixing. One pour.',
    bags: 'Easy on a small job.'
  };
  // size is optional (defaults to state.bagSize) - the Order list now shows all three
  // pack sizes at once (v21, no more picker), so this needs to compute a count for an
  // arbitrary size, not just whichever one used to be selected.
  function bagCount(withWaste, size) {
    var bagVol = (size || state.bagSize) * 0.0005;
    // epsilon absorbs float drift (3*2*0.1 = 0.6000000000000001) that would bill a phantom bag
    return bagVol > 0 ? Math.ceil(withWaste / bagVol - 1e-9) : 0;
  }
  // Ceil to nearest 0.1 m³ delivery increment. No 1.0 m³ floor (v22.38).
  function readyOrder(withWaste) {
    return Math.ceil(withWaste / 0.1) * 0.1;
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  function renderShapeRow() {
    var el = document.getElementById('shape-select');
    el.innerHTML = shapes.map(function (s) {
      return '<option value="' + s.id + '"' + (s.id === state.shape ? ' selected' : '') + '>' + s.label + '</option>';
    }).join('');
    document.getElementById('shape-current').textContent = currentShape().label;
  }

  function valueBox(f) {
    var raw = vals[f.id] || '';
    var focused = state.focus === f.id;
    // Count fields (Steps, Piers, Columns) show as "× 3", not a bare "3" - 2026-08-12
    // (Andre's ask), so the figure reads as the multiplier it actually is (this
    // pier's volume × N piers) rather than looking like a typed measurement. Visual
    // only - aria-label keeps the plain number, no "times"/"×" added, same as before.
    var display = (raw && f.count) ? '× ' + raw : (raw || '—');
    return '<div class="field-val' + (focused ? ' focused' : '') + (raw ? '' : ' is-empty') + '"' +
             ' role="button" tabindex="0" data-field="' + f.id + '"' +
             ' aria-label="' + f.label + (raw ? ', ' + raw : ', not set') + '">' +
             display +
           '</div>';
  }

  // m ⇄ mm toggle per field - native picker, identical interaction to
  // .shape-heading/.wastage-pulldown elsewhere in this app: current value + chevron,
  // invisible <select> covers the whole control, tapping opens the OS's native picker
  // wheel. Picked 2026-08-03 over a segmented control and a contextual-menu popover
  // (both tried and shown side by side) specifically for this consistency - it's the
  // one control language for every "pick one of a few options" row in the app now.
  function unitPickerEl(f) {
    return '<div class="unit-picker">' +
      // aria-hidden: this span is a decorative echo of the <select> below it (see the
      // comment above this function) - the select already has the accessible name
      // (aria-label) and value (the selected option), so without this a screen reader
      // announces the unit twice, once from this span's text and again from the
      // select itself.
      '<span class="unit-picker-current" aria-hidden="true">' + units[f.id] + '</span>' +
      '<svg class="ti unit-picker-chevron" aria-hidden="true"><use href="#i-chevron-down"/></svg>' +
      '<select class="unit-picker-select" data-unit-for="' + f.id + '" aria-label="' + f.label + ' unit">' +
        UNIT_OPTS.map(function (u) {
          return '<option value="' + u + '"' + (units[f.id] === u ? ' selected' : '') + '>' + u + '</option>';
        }).join('') +
      '</select>' +
    '</div>';
  }

  function renderFields() {
    var el = document.getElementById('fields');
    // Wastage used to close out this list as its own row (wastageRow(), see git
    // history) - moved into the Order ledger 2026-08-11 (Andre's call): it's an
    // order adjustment, not a physical dimension of the shape like the rows below, so
    // it now lives next to the number it actually changes (#volume-breakdown's
    // Wastage row, see renderResults()) instead of being typed here and then
    // echoed there. #fields is Length/Width/Thickness (or the equivalent for whatever
    // shape) only now.
    el.innerHTML = currentShape().fields.map(function (f) {
      // 2026-08-11: a count field (Quantity) used to keep an invisible
      // visibility:hidden unit-picker placeholder here, so its value box lined up on
      // the same left edge as a real dimension's number even without a unit to show.
      // That left the row's right edge ragged instead - Diameter/Height's "600 mm ⌄"
      // reaches the row's true right edge, Quantity's "17" stopped 66px short of it
      // (Andre flagged the resulting unevenness scanning down the card). Dropped
      // entirely for count fields, in favour of a flush right edge on every row.
      // 2026-08-12 (Andre's ask): reinstated. Flush edges came at the cost of the
      // digit itself no longer lining up between rows - Quantity/Piers/Columns' value
      // sat 66px further right than Length/Width/Depth's above it, and now that count
      // fields read "× 5" instead of a bare "5" (see valueBox), that offset draws the
      // eye even more. Same invisible-placeholder trick as before: an empty
      // visibility:hidden .unit-picker box, same 60px width, so field-controls has
      // the same footprint whether or not there's a real unit to show, and the number
      // lands on the same right edge as every dimension row above it. Row edges go
      // ragged again for count rows - accepted trade, column alignment wins this time.
      var unitEl = f.count
        ? '<div class="unit-picker" style="visibility:hidden" aria-hidden="true"></div>'
        : unitPickerEl(f);
      var warn = warnFor(f);
      return '<div class="field-row" data-row="' + f.id + '">' +
        '<div class="field-line">' +
          '<div class="field-label-group">' +
            '<span class="field-label">' + f.label + '</span>' +
            (f.optional ? '<span class="field-optional-note">(optional)</span>' : '') +
          '</div>' +
          '<div class="field-controls">' + valueBox(f) + unitEl + '</div>' +
        '</div>' +
        (warn ? '<div class="field-warn"><svg class="ti" aria-hidden="true"><use href="#i-alert"/></svg><span>' + warn + '</span></div>' : '') +
      '</div>';
    }).join('');
    wireFieldBoxes(el);
    highlightDim();
  }

  // Wastage's control - a fixed preset list, not a typed value, so it is a pull-down
  // like Shape rather than another keypad-editable field, carried over from v17.
  // Relocated into the Order ledger (label-first: "Wastage" plain, then "+10% ▾").
  // v22.48–50 HIG segments reverted (v22.51 Andre): back to native popup select.
  // Called from renderResults() every render since #wastage-select is rebuilt fresh.
  function wastageLedgerRow(amountStr) {
    return '<div class="ledger-row" data-row="wastage">' +
      '<span class="ledger-label">Wastage <span class="wastage-pulldown">' +
        // aria-hidden - same decorative-echo pattern as unitPickerEl: #wastage-select
        // already carries the accessible name/value.
        '<span id="wastage-current" aria-hidden="true"></span>' +
        '<svg class="ti wastage-chevron" aria-hidden="true"><use href="#i-chevron-down"/></svg>' +
      '</span></span>' +
      '<span class="ledger-val' + (amountStr ? '' : ' is-empty') + '">' + (amountStr || '—') + '</span>' +
      '<select id="wastage-select" aria-label="Wastage"></select>' +
    '</div>';
  }

  function renderWastagePulldown() {
    var sel = document.getElementById('wastage-select');
    sel.innerHTML = WASTE_OPTS.map(function (p) {
      var label = p + '% ' + WASTE_NOTES[p];
      return '<option value="' + p + '"' + (String(p) === vals.wastage ? ' selected' : '') + '>' + label + '</option>';
    }).join('');
    document.getElementById('wastage-current').textContent = vals.wastage + '%';
    sel.addEventListener('change', function () {
      vals.wastage = sel.value;
      renderResults(); saveDraft();
    });
  }

  function wireFieldBoxes(root) {
    Array.prototype.forEach.call(root.querySelectorAll('.field-row'), function (row) {
      row.addEventListener('click', function (e) {
        if (e.target.closest('.unit-picker')) return;
        var id = row.getAttribute('data-row');
        if (id) focusField(id);
      });
    });
    Array.prototype.forEach.call(root.querySelectorAll('[data-field]'), function (box) {
      box.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); focusField(box.getAttribute('data-field'), true); }
      });
    });
    Array.prototype.forEach.call(root.querySelectorAll('select.unit-picker-select'), function (sel) {
      sel.addEventListener('change', function (e) { setUnit(sel.getAttribute('data-unit-for'), sel.value, e); });
    });
  }

  // moveFocusToKeypad: true only when a field is activated via keyboard (Enter/Space),
  // not touch/click. v20 fix - the keypad sits last in the DOM (it's pinned outside
  // #scroll-area), so a keyboard user tabbing forward from a field used to have to walk
  // through every remaining field, Wastage, Order, Copy/Share and the footer links
  // before ever reaching a key to actually type with. Shifting focus straight into the
  // keypad on activation mirrors how a real text input immediately raises a keyboard
  // ready to type into, and needs no change for touch users since it only fires on the
  // keyboard path.
  // v22.46: Order auto-scroll above keypad removed — was hiding the Job axon
  // diagram while editing Length/Width/Thickness (Andre). Order is reached by
  // user scroll; diagram stays put while typing. Keypad unchanged; no top pin.
  // ensureOrderVisibleAboveKeypad / scrollOrderIntoViewIfComplete left unused.
  function scrollBehavior() {
    try {
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return 'auto';
      }
    } catch (e) {}
    return 'smooth';
  }

  // Unused since v22.46 (was: keep Order peeking above .keypad-wrap).
  function ensureOrderVisibleAboveKeypad() {}

  // Unused since v22.46 (was: scroll Order into view on first complete).
  function scrollOrderIntoViewIfComplete() {}

  function focusField(id, moveFocusToKeypad) {
    if (state.focus !== id) { settle(state.focus); }  // done with the one you are leaving
    delete settled[id];                               // re-editing this one: verdict off
    state.focus = id;
    selectFocused = true;
    showKeypad(true);
    renderFields();
    // Settling a field can newly trigger (or clear) its caution - the check-strip above
    // Copy/Share needs to catch that the moment you leave the field, not wait for the
    // next keystroke, or a caution earned by tapping away goes unseen until send.
    renderResults();
    // v22.46/follow-up — no scrollIntoView on field focus; keeps Job diagram stable (Andre).
    if (moveFocusToKeypad) {
      var firstKey = document.querySelector('#keypad .key');
      if (firstKey) { firstKey.focus(); }
    }
    saveDraft();
  }

  // Tapping anywhere outside the field list and the keypad de-highlights whatever was
  // focused - the field-val ring and the diagram's blue line both clear, and the
  // keypad dismisses, same as tapping outside a text field dismisses the keyboard.
  // Taps inside any field-row (the focused one or another) are left alone; those
  // already have their own handling (focus-switch, unit toggle).
  function blurField() {
    if (state.focus == null) return;
    settle(state.focus);
    state.focus = null;
    showKeypad(false);
    renderFields();
    renderResults();
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest('.field-row') || e.target.closest('#keypad-wrap')) return;
    // Opening Wastage's native picker must not rebuild Order (that destroys the
    // <select> mid-open) or the whole lower stack flashes. Dismiss the keypad only.
    if (e.target.closest('[data-row="wastage"]') || e.target.closest('#wastage-select')) {
      if (state.focus == null) return;
      settle(state.focus);
      state.focus = null;
      showKeypad(false);
      renderFields();
      return;
    }
    blurField();
  });

  // Analytics helper only (specTrackParams / calc_complete). Volume alone decides
  // which option is "recommended" for tracking; nothing is chosen from a click, and
  // the Copy/Share docket (v22.47) lists both supply options neutrally. Falls back
  // to bags in the dead-band around the 0.5 m³ threshold where getRec() declines.
  function orderPrimary(withWaste) {
    return getRec(withWaste) || 'bags';
  }

  // Fires once per shape, the moment the volume first becomes computable - not on every
  // render after that, and not again until the shape resets it (see shape-select) or the
  // user clears a field and completes it again.
  var didCompletePulse = false;

  function renderResults() {
    var complete = isComplete();
    var withWaste = complete ? orderVolume() : 0;
    var rec = complete ? getRec(withWaste) : null;
    if (complete && !didCompletePulse) {
      tick(12);
      didCompletePulse = true;
      track('calc_complete', {
        shape: state.shape,
        volume_m3: Math.round(withWaste * 1000) / 1000,
        waste_pct: parseFloat(vals.wastage) || 0,
        recommended: rec === 'ready' ? 'ready-mix' : (rec === 'bags' ? 'bags' : 'undecided')
      });
    } else if (!complete) { didCompletePulse = false; }

    // v22.1 (Andre's explicit ask, written out line by line): the volume is no longer
    // one sentence ("2.20 m³ (incl. +10% wastage)") - it's the arithmetic itself, as a
    // ledger. Base quantity, then + N% Wastage as its own row with the actual m³ it
    // adds (not just the percentage), then Order quantity as the total - each row
    // built fresh every render, same as everything else in this function.
    // The Wastage block carries its own control (relocated from Inputs earlier) - it
    // can't collapse away, or there'd be no way to dial wastage back up once it's at
    // 0%. It always renders, in both the complete and incomplete states below, just
    // with an empty "—" amount pre-completion (nothing computed to show yet, but the
    // control itself doesn't need a finished shape to be usable).
    // v22.60: incomplete shows Base — so the ledger reads as not-ready, not missing a
    // row. Full three-row skeleton (Base / Wastage / Order) with calm "—" placeholders.
    // Two decimals throughout (toFixed(2)) for the ledger's own three rows (Andre's
    // ask, 2026-08-12) - was toFixed(1), which read fine at typical volumes but
    // collapsed small ones: a 0.05 m³ wastage allowance and a 0.14 m³ one both
    // rounded to the same "0.1 m³", so two figures that were genuinely different
    // looked identical. Ready-mix/bags in Supply are untouched - Andre named
    // these three rows specifically, and readyOrder() already rounds up to its own
    // 0.1 m³ delivery increment, so a second decimal there wouldn't reflect anything
    // real about what a truck can actually deliver.
    // v22.28: full Order ledger in #volume-breakdown (scroll Order card).
    // v22.30: top pinned Order strip removed — Order card under Job is the sole order readout.
    var volEl = document.getElementById('volume-breakdown');
    function ledgerRow(label, value, isTotal, isEmpty, enter) {
      return '<div class="ledger-row' + (isTotal ? ' ledger-total' : '') + '">' +
        '<span class="ledger-label">' + label + '</span>' +
        '<span class="ledger-val' + (isTotal ? ' qty-figure' : '') + (isEmpty ? ' is-empty' : '') + (enter ? ' is-enter' : '') + '">' + value + '</span>' +
      '</div>';
    }
    var orderEnter = complete && !state.hadOrder;
    state.hadOrder = !!complete;
    if (!complete) {
      volEl.innerHTML =
        ledgerRow('Base quantity', '—', false, true) +
        wastageLedgerRow(null) +
        ledgerRow('Order quantity', '—', true, true);
    } else {
      var baseVol = computeVolume();
      volEl.innerHTML =
        ledgerRow('Base quantity', withCommas(baseVol.toFixed(2)) + ' m³', false, false) +
        wastageLedgerRow(withCommas((withWaste - baseVol).toFixed(2)) + ' m³') +
        ledgerRow('Order quantity', withCommas(withWaste.toFixed(2)) + ' m³', true, false, orderEnter);
    }
    renderWastagePulldown();

    var el = document.getElementById('options');

    if (!complete) {
      var missingLabel = null;
      var shapeFields = currentShape().fields;
      for (var mi = 0; mi < shapeFields.length; mi++) {
        if (shapeFields[mi].optional) continue;
        if (!vals[shapeFields[mi].id] || parseFloat(vals[shapeFields[mi].id]) <= 0) {
          missingLabel = shapeFields[mi].label;
          break;
        }
      }
      // v22.60: calmer empty Supply copy; names first missing field (lowercase).
      var emptyHint = missingLabel
        ? ('Add ' + missingLabel.toLowerCase() + ' to see supply.')
        : 'Add dimensions to see supply.';
      el.innerHTML = '<p class="order-empty">' + emptyHint + '</p>';
    } else {
      var ready = readyOrder(withWaste);
      var bags = bagCount(withWaste);

      // Number leads each tile (v22.14). v22.44/v22.45 (Andre): equal Supply
      // tiles — no REC_REASON / "Recommended." / badge / is-recommended /
      // is-demoted in the UI; getRec()/orderPrimary feed analytics only.
      // Docket also neutral since v22.47. User decides.
      // v22.15 (Andre's ask, written out - "75 bags / 20kg 25kg 30kg - these are
      // buttons (20 default)"): bag size stops being a native-select pill
      // (.unit-picker--inline, "[20kg ▾]") and becomes three real buttons, one per
      // size, sitting under the bag count instead of inline within its label. This
      // is the segmented-control approach specifically - "all three pack sizes list
      // as their own row" was tried and reverted for v21's one-pill version (see
      // .bag-size-buttons' CSS comment for that history); noting the reversal of a
      // reversal rather than dropping the earlier reasoning silently. The count and
      // "bags" now read as one phrase ("220 bags") instead of the count alone with
      // the word trailing on its own label line below.
      // toggle-button semantics (aria-pressed), not role="radio"/radiogroup - a
      // simpler, still-correct pattern for "N mutually exclusive buttons" that
      // doesn't also imply arrow-key navigation between them the way a true ARIA
      // radiogroup would; each button stays its own Tab stop, activated with
      // Enter/Space like any other button, no extra keyboard wiring needed.
      var BAG_SIZES = [20, 25, 30];
      // v22.31: visible "Bag size" caption + extra top margin so chips read as a
      // sub-control under Bags.
      var bagSizeButtons =
        BAG_SIZES.map(function (s) {
          var isSel = s === state.bagSize;
          return '<button type="button" class="bag-size-btn' + (isSel ? ' is-selected' : '') +
            '" data-size="' + s + '" aria-pressed="' + isSel + '">' + s + ' kg</button>';
        }).join('');

      // HIG grouped lists on the grey Supply card (the card is the "page"):
      // white inset group for Ready-mix / Bags rows. v22.74 segment sits on the
      // grey Supply card (no second white .hig-group).
      el.innerHTML =
        '<div class="hig-stack">' +
          '<div class="hig-group" role="list">' +
            '<div class="hig-row" data-row="ready" role="listitem">' +
              '<span class="hig-row-label">Ready-mix</span>' +
              '<span class="hig-row-val"><strong>' + withCommas(ready.toFixed(1)) + ' m³</strong></span>' +
            '</div>' +
            '<div class="hig-row" data-row="bags" role="listitem">' +
              '<span class="hig-row-label">' + state.bagSize + ' kg Bags</span>' +
              '<span class="hig-row-val"><strong>' + withCommas(bags) + '</strong></span>' +
            '</div>' +
          '</div>' +
          '<div class="hig-caption" id="bag-size-label">Bag size</div>' +
          '<div class="bag-size-buttons" role="group" aria-labelledby="bag-size-label">' +
            bagSizeButtons +
          '</div>' +
        '</div>';

      Array.prototype.forEach.call(document.querySelectorAll('.bag-size-btn'), function (btn) {
        btn.addEventListener('click', function () {
          state.bagSize = parseInt(btn.getAttribute('data-size'), 10);
          renderResults(); saveDraft();
        });
      });
    }

    // A caution that scrolled off the field is a caution nobody read. Repeat it where the
    // decision is actually made.
    var strip = document.getElementById('check-strip');
    var warned = anyWarnings();
    if (warned.length) {
      strip.hidden = false;
      strip.innerHTML = '<svg class="ti" aria-hidden="true"><use href="#i-alert"/></svg><span>' +
        'Check ' + warned.map(function (f) { return f.label.toLowerCase(); }).join(', ') +
        ' before you send this — the figure above may be wrong by a factor of 1000.</span>';
    } else {
      strip.hidden = true;
      strip.innerHTML = '';
    }

    // An empty docket is not worth sending.
    document.getElementById('btnCopy').disabled = !complete;
    document.getElementById('btnShare').disabled = !complete;

    // v22.46: no ensureOrderVisibleAboveKeypad / complete-time Order scroll —
    // those moved #scroll-area and hid the Job diagram while editing dims.
  }

  // ── Diagram ──────────────────────────────────────────────────────────────────
  // Inlined, not an <img>, so the focused dimension can light up: the drawing answers
  // "which one is Going and which is Rise" exactly while you are on that field, instead
  // of costing space to be decoration. Carried over from v17.
  var diagramCache = {};

  function drawDiagram() {
    var host = document.getElementById('diagram');
    var s = currentShape();
    var key = s.diagram;
    host.setAttribute('aria-label', s.label + ' dimension diagram');
    if (diagramCache[key]) { injectDiagram(host, diagramCache[key]); return; }
    fetch('shared/diagrams/oblique/' + key + '.svg')
      .then(function (r) { return r.ok ? r.text() : Promise.reject(); })
      .then(function (txt) {
        diagramCache[key] = txt;
        if (currentShape().diagram === key) { injectDiagram(host, txt); }
      })
      .catch(function () { host.innerHTML = ''; });
  }

  // `width:100%; max-width; height:auto; max-height` on an SVG asks each engine to
  // resolve two independent caps into one aspect-ratio-preserving box, and browsers
  // don't agree on that resolution - it was rendering centred in Chrome but landing
  // left-shifted with dead space on the right elsewhere. Read the viewBox and set an
  // explicit pixel width/height instead, so every engine centres the exact same box.
  var DIAGRAM_MAX_W = 300, DIAGRAM_MAX_H = 120;
  // Pier footing and Column are tall/narrow, so they hit the height cap and render
  // smaller than the wide shapes - bumped larger to read clearly at a glance.
  var DIAGRAM_SCALE = { pierfooting: 1.25, column: 1.25, stairs: 1.1 };
  function sizeDiagram(svg) {
    var vb = (svg.getAttribute('viewBox') || '').split(/\s+/).map(Number);
    if (vb.length !== 4 || !vb[2] || !vb[3]) return;
    var ratio = vb[2] / vb[3];
    var w = DIAGRAM_MAX_W, h = w / ratio;
    if (h > DIAGRAM_MAX_H) { h = DIAGRAM_MAX_H; w = h * ratio; }
    var scale = DIAGRAM_SCALE[currentShape().diagram] || 1;
    svg.style.width = (w * scale) + 'px';
    svg.style.height = (h * scale) + 'px';
  }

  // _gen_oblique.py's fit() estimates each label's glyph width from character count to
  // decide the viewBox - a guess, not a measurement, and wrong by a different amount in
  // every font-rendering engine. The box it produces still centres correctly by its own
  // (guessed) numbers, which is why the SVG element's own box always measured centred in
  // testing - the drawing inside it, positioned by real glyph metrics the guess didn't
  // match, did not. Recentre for real here using getBBox(), which reads the metrics the
  // browser actually rendered with, so this is exact in whichever engine runs it.
  //
  // Horizontal centre comes from the solid shape's own bbox, not the full content bbox -
  // centring on everything (shape + dimension leaders) reads as centred by the numbers
  // but not by eye whenever the leaders are lopsided (pier footing's Depth and Width
  // leaders both sit to the left of the shape with nothing balancing them on the right,
  // so a full-content centre dragged the block itself off to the right). The box still
  // has to be wide enough to hold every leader without clipping, so half-width is the
  // larger of the two distances from the shape's centre to the full content's edges.
  function recenterDiagram(svg) {
    var pad = 22;
    function box(els) {
      var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      els.forEach(function (el) {
        var b;
        try { b = el.getBBox(); } catch (e) { return; }
        if (!b || (!b.width && !b.height)) return;
        minX = Math.min(minX, b.x); minY = Math.min(minY, b.y);
        maxX = Math.max(maxX, b.x + b.width); maxY = Math.max(maxY, b.y + b.height);
      });
      return minX === Infinity ? null : { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
    }
    var all = Array.prototype.filter.call(svg.children, function (el) { return el.tagName !== 'title'; });
    var full = box(all);
    if (!full) return;
    var shapeEls = Array.prototype.filter.call(svg.querySelectorAll('path'), function (el) {
      return el.getAttribute('fill') !== 'none';
    });
    var shape = box(shapeEls) || full;
    var cx = (shape.minX + shape.maxX) / 2;
    var cy = (full.minY + full.maxY) / 2;
    var halfW = Math.max(cx - full.minX, full.maxX - cx) + pad;
    var halfH = (full.maxY - full.minY) / 2 + pad;
    svg.setAttribute('viewBox', [cx - halfW, cy - halfH, halfW * 2, halfH * 2].join(' '));
  }

  function injectDiagram(host, txt) {
    host.innerHTML = txt;
    var svg = host.querySelector('svg');
    if (svg) {
      svg.classList.add('diagram-svg');
      svg.setAttribute('aria-hidden', 'true');
      svg.removeAttribute('width');
      svg.removeAttribute('height');
      recenterDiagram(svg);
      sizeDiagram(svg);
    }
    highlightDim();
  }

  // A <text> wrapping to a second line is built as <text>Flag<tspan>thickness</tspan></text>
  // (see text() in _gen_oblique.py) - .textContent on that concatenates to "Flagthickness"
  // with nothing between the lines, which never equals the field label "Flag thickness".
  // Read the direct text node and each tspan separately and rejoin with a space instead.
  function labelText(t) {
    var parts = [];
    Array.prototype.forEach.call(t.childNodes, function (n) {
      if (n.nodeType === 3 || (n.tagName && n.tagName.toLowerCase() === 'tspan')) {
        parts.push(n.textContent);
      }
    });
    return parts.join(' ').trim();
  }

  // Every measurable dimension carries a <g class="dim"> group (leader line, extension
  // lines, tick marks, and a label text used only to match against the focused field -
  // the text itself is hidden in CSS, colour on the line is the signal now). Count
  // fields (Steps, Quantity) have no such group - nothing to draw a line for - so
  // focusing one matches nothing and the whole drawing fades, same as the neutral state.
  function highlightDim() {
    var svg = document.querySelector('#diagram svg');
    if (!svg) return;
    var groups = svg.querySelectorAll('g.dim');

    // Neutral / click-off state: no field is focused at all, so nothing has earned full
    // ink - the whole drawing reads as dimmed, not as a default "everything lit" state.
    if (state.focus == null) {
      Array.prototype.forEach.call(groups, function (g) {
        g.classList.remove('is-active');
        g.classList.add('is-muted');
      });
      return;
    }

    var f = fieldById(state.focus);
    var want = f ? f.label : null;

    var matched = false;
    Array.prototype.forEach.call(groups, function (g) {
      var t = g.querySelector('text');
      var hit = !!(t && want && labelText(t) === want);
      if (hit) matched = true;
      g.classList.toggle('is-active', hit);
      g.classList.toggle('is-muted', !!want && !hit);
    });

    // Nothing to point at. A count field (Steps, Quantity) has no drawn dimension at all -
    // no line ever represents it, so it reads the same as having nothing focused: fade
    // the whole drawing rather than leaving it at full ink for a field it can't actually
    // illustrate. Any other unmatched field (none currently exist) keeps the drawing at
    // full ink instead of a uniformly dimmed one.
    if (!matched) {
      if (f && f.count) {
        Array.prototype.forEach.call(groups, function (g) {
          g.classList.remove('is-active');
          g.classList.add('is-muted');
        });
      } else {
        Array.prototype.forEach.call(svg.querySelectorAll('.is-muted'), function (n) {
          n.classList.remove('is-muted');
        });
      }
    }
  }

  // ── Keypad ───────────────────────────────────────────────────────────────────
  function appendKey(k) {
    var f = state.focus;
    var field = fieldById(f);
    var cur = vals[f] || '';

    if (selectFocused) {
      cur = '';               // typing over the selected value replaces it
      selectFocused = false;
    }

    if (k === 'back') { cur = cur.slice(0, -1); tick(6); }
    else if (k === '.') {
      if (field && field.count) return;          // steps are whole numbers
      if (cur.indexOf('.') !== -1) return;
      cur = cur === '' ? '0.' : cur + '.';
      tick(8);
    } else {
      if (cur.length >= 6) return;
      cur = (cur === '0') ? k : cur + k;
      tick(8);
    }

    vals[f] = cur;
    renderFields(); renderResults(); saveDraft();
  }

  // Plain 3-col, 12-key grid per the wireframe - no Next/advance key.
  // v22.31: backspace uses a light Tabler-style SVG (sprite #i-backspace), not the
  // system '⌫' glyph which renders as a heavy outlined rectangle on many fonts.
  var KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];
  var BACKSPACE_ICO =
    '<svg class="ti key-back-ico" aria-hidden="true"><use href="#i-backspace"/></svg>';

  // Real <button> elements, not tabindex="-1" divs (v19 fix) - the old markup meant a
  // keyboard-only or screen-reader user could never reach, let alone activate, a
  // single digit key. A native button is focusable in normal tab order for free, and
  // Enter/Space already fire 'click' without any extra keydown wiring.
  function renderKeypad() {
    var el = document.getElementById('keypad');
    el.innerHTML = KEYS.map(function (k) {
      var key = k === '⌫' ? 'back' : k;
      var label = k === '⌫' ? 'Backspace' : k;
      var face = k === '⌫' ? BACKSPACE_ICO : k;
      return '<button type="button" class="key" aria-label="' + label + '" data-key="' + key + '">' + face + '</button>';
    }).join('');
    Array.prototype.forEach.call(el.querySelectorAll('.key'), function (c) {
      c.addEventListener('click', function () { appendKey(c.getAttribute('data-key')); });
    });
  }

  function showKeypad(on) {
    // v22.46: keypad show/hide only — no Order auto-scroll (keeps Job diagram put).
    document.getElementById('keypad-wrap').classList.toggle('is-hidden', !on);
  }

  // ── Docket ───────────────────────────────────────────────────────────────────
  // No preview surface: the stack IS the spec, so Copy/Share render straight from it.
  function prettyDate(iso) {
    var m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!p) return '';
    return String(Number(p[3])) + ' ' + m[Number(p[2]) - 1] + ' ' + p[1];
  }

  // Copy/Share Supply line: Ready-mix (matches UI tile).
  function readyLine(withWaste) {
    return withCommas(readyOrder(withWaste).toFixed(1)) + ' m³ Ready-mix';
  }

  // v22.47: clean Copy/Share docket (Andre sketch, Designer polish). Mirrors the
  // on-screen Order ledger (Base / +N% Wastage / Order), then neutral Supply —
  // ready-mix plus all three bag sizes under Bags: (× matching the Bags tile).
  // No primary/or/recommended ranking. Brand line only at the end. getRec /
  // orderPrimary remain for analytics (specTrackParams / calc_complete) only.
  function specText() {
    var s = currentShape();
    var baseVol = computeVolume();
    var withWaste = orderVolume();
    var wastePct = parseFloat(vals.wastage) || 0;
    var wasteAmt = withWaste - baseVol;

    var lines = ['SPEC SHEET', ''];
    lines.push('Date: ' + prettyDate(todayISO()));
    lines.push('');
    lines.push('Shape: ' + s.label);
    s.fields.forEach(function (f) {
      var v = vals[f.id];
      if (!v) return;
      lines.push(f.label + ': ' + v + (f.count ? '' : ' ' + units[f.id]));
    });
    lines.push('');
    // Two decimals, same as the Order ledger (Base / Wastage / Order). Ready-mix
    // stays 1dp via readyLine() (0.1 m³ truck step).
    lines.push('Base quantity: ' + withCommas(baseVol.toFixed(2)) + ' m³');
    // Always show the wastage row, including +0% → 0.00 m³ when dialled to zero
    // (same honesty as the on-screen Order ledger keeping the control at 0%).
    lines.push('+' + wastePct + '% Wastage: ' + withCommas(wasteAmt.toFixed(2)) + ' m³');
    lines.push('Order quantity: ' + withCommas(withWaste.toFixed(2)) + ' m³');
    lines.push('');
    lines.push('Supply options:');
    lines.push(readyLine(withWaste));
    lines.push('Bags:');
    [20, 25, 30].forEach(function (kg) {
      lines.push(withCommas(bagCount(withWaste, kg)) + ' × ' + kg + ' kg');
    });
    lines.push('');
    lines.push('Estimate only. Confirm with your supplier.');
    lines.push('by SlabSet.online');
    return lines.join('\n');
  }

  function specTrackParams() {
    var withWaste = orderVolume();
    var rec = orderPrimary(withWaste);
    return {
      shape: state.shape,
      volume_m3: Math.round(withWaste * 1000) / 1000,
      recommended: rec === 'ready' ? 'ready-mix' : 'bags'
    };
  }

  function flashLabel(id, word) {
    var el = document.getElementById(id);
    if (el.dataset.was === undefined) { el.dataset.was = el.textContent; }
    el.textContent = word;
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.textContent = el.dataset.was; }, 1600);
  }

  // ── Wiring ───────────────────────────────────────────────────────────────────
  function renderAll() {
    renderShapeRow(); renderFields(); drawDiagram(); renderResults();
  }

  document.getElementById('shape-select').addEventListener('change', function () {
    tick(10);
    state.shape = this.value;
    state.focus = currentShape().fields[0].id;
    settled = {};                       // different fields, no verdicts carried over
    didCompletePulse = false;           // a fresh shape has its own "first complete" moment
    showKeypad(true);
    renderAll(); saveDraft();
    track('shape_select', { shape: state.shape });
  });

  // Sending is the moment everything gets judged - otherwise a bad value in the field you
  // never left could go out unflagged. Still a caution: the send proceeds either way.
  function settleAndRender() {
    settleAll();
    renderFields(); renderResults();
  }

  document.getElementById('btnCopy').addEventListener('click', function () {
    if (this.disabled) return;
    settleAndRender();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(specText()).then(function () {
        flashLabel('copyLabel', '✓ Copied');
        track('spec_copy', specTrackParams());
      }, function () {});
    }
  });

  document.getElementById('btnShare').addEventListener('click', function () {
    if (this.disabled) return;
    settleAndRender();
    var text = specText();
    var params = specTrackParams();
    if (navigator.share) {
      navigator.share({ title: 'SlabSet spec sheet', text: text }).then(function () {
        track('spec_share', params);
      }).catch(function (err) {
        if (err && err.name === 'AbortError') return;
        flashLabel('shareLabel', "Couldn't share");
      });
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        params.method = 'copy_fallback';
        track('spec_share', params);
      }, function () { flashLabel('shareLabel', "Couldn't share"); });
    } else {
      flashLabel('shareLabel', "Couldn't share");
    }
  });

  // Theme - follows the OS until the user picks, then their choice sticks.
  function applyTheme(mode) {
    document.documentElement.setAttribute('data-theme', mode);
    var btn = document.getElementById('btnTheme');
    var toDark = mode !== 'dark';
    btn.setAttribute('aria-label', 'Switch to ' + (toDark ? 'dark' : 'light') + ' theme');
    btn.setAttribute('aria-pressed', String(mode === 'dark'));
    var meta = document.querySelector('meta[name="theme-color"]');
    // Light theme-color matches --bg (parchment #DED8CB), not the card.
    if (meta) meta.setAttribute('content', mode === 'dark' ? '#2E2A24' : '#DED8CB');
  }
  applyTheme(document.documentElement.getAttribute('data-theme') || 'light');

  document.getElementById('btnTheme').addEventListener('click', function () {
    var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
  });

  // ── Boot ─────────────────────────────────────────────────────────────────────
  loadDraft();

  // ?shape= deep-links from the search shells. An explicit link beats the saved draft.
  try {
    var wanted = new URLSearchParams(window.location.search).get('shape');
    if (wanted && shapeById(wanted) && wanted !== state.shape) {
      state.shape = wanted;
      state.focus = currentShape().fields[0].id;
    }
  } catch (e) {}

  // Anything restored from a draft was entered in an earlier session, so it counts as
  // moved-on and is judged straight away - except whatever the cursor is sitting in.
  settleAll();
  delete settled[state.focus];

  // v20: boot neutral - no field pre-focused, keypad hidden until the user actually
  // taps one. state.focus previously defaulted to the shape's first field (or the
  // draft's last-edited one) and stayed that way through the very first render, so
  // every fresh load showed a field pre-selected with a blue ring and the keypad
  // already covering a third of the screen before any interaction at all - a known
  // mobile anti-pattern (auto-focus + auto-keyboard on load), and it hid the very
  // overview (diagram, other fields, Order, Copy/Share) a first-time user most needs
  // to see. highlightDim() already had a dedicated "nothing focused" branch for this
  // exact state (dims the whole diagram rather than defaulting a dimension to full
  // ink) - it just was never reachable at boot before now.
  state.focus = null;

  renderKeypad();
  renderAll();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }
})();
