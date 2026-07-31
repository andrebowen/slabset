/* SlabSet v18 - flat stack, no card containers, iPhone first.
   Engine and shape maths carried from v15/v16/v17 unchanged. */
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
     // Quantity carried over from v15/live - a job pours a set of identical piers, not one.
     fields:[{id:'pierL',label:'Length',lo:0.2,hi:3},
             {id:'pierW',label:'Width',lo:0.2,hi:3},
             {id:'pierD',label:'Depth',lo:0.2,hi:4},
             {id:'pierQty',label:'Quantity',count:true,lo:1,hi:60}],
     vol:function(v){ return v.pierL * v.pierW * v.pierD * v.pierQty; }},

    {id:'column', label:'Column', diagram:'column',
     // Verandah posts start around 75-90mm; structural columns for a two-storey pour rarely
     // exceed ~1.2m diameter or 8m height in residential/light-commercial work. Quantity
     // carried over from v15/live, same reasoning as pier footing.
     fields:[{id:'colDia',label:'Diameter',lo:0.075,hi:1.2},
             {id:'colH',label:'Height',lo:0.3,hi:8},
             {id:'colQty',label:'Quantity',count:true,lo:1,hi:40}],
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
             {id:'stBT',label:'Base slab',optional:true,lo:0,hi:0.3}],
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

  // Wastage is a fixed preset list, not a typed value, so it is a pull-down like Shape
  // rather than another keypad-editable field - carried over from v17. Each preset
  // carries a two-to-three word site condition so the number means something without a
  // trade background to read it.
  var WASTE_OPTS = [0, 5, 10, 15, 20];
  var WASTE_DEFAULT = 10;
  var WASTE_NOTES = { 0: 'No wastage', 5: 'Smooth, flat site', 10: 'Recommended', 15: 'Uneven ground', 20: 'Rough ground' };

  var state = {
    shape: 'slab',
    focus: 'slabL',
    bagSize: 20
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

  // m ⇄ mm, carried over from v17. Wastage's unit ('%') has nothing to swap to, so its
  // badge is never wired to this.
  function toggleUnit(id, evt) {
    evt.stopPropagation();
    var next = UNIT_OPTS[(UNIT_OPTS.indexOf(units[id]) + 1) % UNIT_OPTS.length];
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
  function bagCount(withWaste) {
    var bagVol = state.bagSize * 0.0005;
    // epsilon absorbs float drift (3*2*0.1 = 0.6000000000000001) that would bill a phantom bag
    return bagVol > 0 ? Math.ceil(withWaste / bagVol - 1e-9) : 0;
  }
  function readyOrder(withWaste) {
    var order = Math.ceil(withWaste / 0.1) * 0.1;
    return order < 1.0 ? 1.0 : order;
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
    return '<div class="field-val' + (focused ? ' focused' : '') + (raw ? '' : ' is-empty') + '"' +
             ' role="button" tabindex="0" data-field="' + f.id + '"' +
             ' aria-label="' + f.label + (raw ? ', ' + raw : ', not set') + '">' +
             (raw || '—') +
           '</div>';
  }

  // m ⇄ mm toggles per field, like v17.
  function renderFields() {
    var el = document.getElementById('fields');
    el.innerHTML = currentShape().fields.map(function (f) {
      var unitEl;
      if (f.count) {
        unitEl = '<div class="unit-badge" aria-hidden="true" style="visibility:hidden;">-</div>';
      } else {
        unitEl = '<button type="button" class="unit-badge switchable" data-unit-for="' + f.id + '"' +
                   ' aria-label="' + f.label + ' unit, ' + units[f.id] + ', tap to switch">' +
                   units[f.id] +
                 '</button>';
      }
      var warn = warnFor(f);
      return '<div class="field-row" data-row="' + f.id + '">' +
        '<div class="field-line">' +
          '<span class="field-label">' + f.label + (f.optional ? ' (optional)' : '') + '</span>' +
          '<div class="field-controls">' + valueBox(f) + unitEl + '</div>' +
        '</div>' +
        (warn ? '<div class="field-warn"><svg class="ti" aria-hidden="true"><use href="#i-alert"/></svg><span>' + warn + '</span></div>' : '') +
      '</div>';
    }).join('') + wastageRow();
    wireFieldBoxes(el);
    renderWastagePulldown();
    highlightDim();
  }

  // Last row of the same list: it changes the volume like the rows above it. A fixed
  // preset list, not a typed value, so it is a pull-down like Shape rather than another
  // keypad-editable field - carried over from v17.
  // Two boxes, same width/gap as field-val + unit-badge above, so "10%" and the chevron
  // land on the exact same verticals as the dimension value and its unit badge.
  function wastageRow() {
    return '<div class="field-row" data-row="wastage">' +
      '<div class="field-line">' +
        '<span class="field-label">Wastage</span>' +
        '<div class="wastage-pulldown">' +
          '<div class="wastage-value-box"><span id="wastage-current"></span></div>' +
          '<div class="wastage-chevron-box"><svg class="ti" aria-hidden="true"><use href="#i-chevron-down"/></svg></div>' +
          '<select id="wastage-select" aria-label="Wastage"></select>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderWastagePulldown() {
    var sel = document.getElementById('wastage-select');
    sel.innerHTML = WASTE_OPTS.map(function (p) {
      var label = p + '% — ' + WASTE_NOTES[p];
      return '<option value="' + p + '"' + (String(p) === vals.wastage ? ' selected' : '') + '>' + label + '</option>';
    }).join('');
    document.getElementById('wastage-current').textContent = vals.wastage + '%';
    sel.onchange = function () {
      vals.wastage = sel.value;
      document.getElementById('wastage-current').textContent = vals.wastage + '%';
      renderResults(); saveDraft();
    };
  }

  function wireFieldBoxes(root) {
    Array.prototype.forEach.call(root.querySelectorAll('[data-field]'), function (box) {
      box.addEventListener('click', function () { focusField(box.getAttribute('data-field')); });
      box.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); focusField(box.getAttribute('data-field')); }
      });
    });
    Array.prototype.forEach.call(root.querySelectorAll('[data-unit-for]'), function (u) {
      u.addEventListener('click', function (e) { toggleUnit(u.getAttribute('data-unit-for'), e); });
    });
  }

  function focusField(id) {
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
    var box = document.querySelector('[data-field="' + id + '"]');
    if (box) { box.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
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
    blurField();
  });

  // Volume alone decides which option is advised; nothing is ever "chosen" from a click.
  // Falls back to bags in the dead-band around the 0.5 m³ threshold, where getRec()
  // declines to call it - the docket still has to say something.
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

    var volEl = document.getElementById('volume-val');
    volEl.textContent = withCommas((complete ? withWaste : 0).toFixed(2)) + ' m³';
    volEl.classList.toggle('is-empty', !complete);

    var el = document.getElementById('options');

    if (!complete) {
      el.innerHTML = '<p class="order-empty">Enter every dimension to see the order.</p>';
    } else {
      var bags = bagCount(withWaste);
      var ready = readyOrder(withWaste);

      // Per the v18 wireframe: name, quantity on the right, reason text off-screen
      // (Copy/Share still write the full docket, see specText()). Recommended badge sits
      // beside the option name it advises - doctrine 7, restored 2026-07-31. Icons dropped
      // 2026-07-31: nowhere else in the flat stack uses one, and with the badge back the
      // row's leading edge was crowded. Bag size still cycles 20/25/30kg on tap, same as
      // v17, styled like the field unit badges.
      el.innerHTML =
        '<div class="order-row">' +
          '<span class="order-row-name">Bags' +
            (rec === 'bags' ? ' <span class="badge-recommended">Recommended</span>' : '') +
          '</span>' +
          '<span class="order-row-value">' + withCommas(bags) + ' × <button type="button" class="order-unit-box" id="bagSizeBtn" aria-label="Bag size, ' + state.bagSize + ' kg, tap to change">' + state.bagSize + 'kg</button></span>' +
        '</div>' +
        '<div class="order-row">' +
          '<span class="order-row-name">Ready-mix' +
            (rec === 'ready' ? ' <span class="badge-recommended">Recommended</span>' : '') +
          '</span>' +
          '<span class="order-row-value">' + withCommas(ready.toFixed(1)) + ' m³</span>' +
        '</div>';

      var BAG_SIZES = [20, 25, 30];
      document.getElementById('bagSizeBtn').addEventListener('click', function () {
        state.bagSize = BAG_SIZES[(BAG_SIZES.indexOf(state.bagSize) + 1) % BAG_SIZES.length];
        renderResults(); saveDraft();
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

  // Plain 3-col, 12-key grid per the wireframe - no Next/advance key. Backspace is the
  // literal '⌫' glyph the wireframe uses, not an icon.
  var KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

  function renderKeypad() {
    var el = document.getElementById('keypad');
    el.innerHTML = KEYS.map(function (k) {
      var key = k === '⌫' ? 'back' : k;
      var label = k === '⌫' ? 'Backspace' : k;
      return '<div class="key" role="button" tabindex="-1" aria-label="' + label + '" data-key="' + key + '">' + k + '</div>';
    }).join('');
    Array.prototype.forEach.call(el.querySelectorAll('.key'), function (c) {
      c.addEventListener('click', function () { appendKey(c.getAttribute('data-key')); });
    });
  }

  function showKeypad(on) {
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

  function bagsLine(withWaste) { return withCommas(bagCount(withWaste)) + ' x ' + state.bagSize + ' kg bags'; }
  function readyLine(withWaste) { return withCommas(readyOrder(withWaste).toFixed(1)) + ' m³ ready-mix'; }

  function specText() {
    var s = currentShape();
    var withWaste = orderVolume();
    var rec = orderPrimary(withWaste);
    var primary = rec === 'bags' ? bagsLine(withWaste) : readyLine(withWaste);
    var alt     = rec === 'bags' ? readyLine(withWaste) : bagsLine(withWaste);

    var lines = ['SPEC SHEET', 'by SlabSet.online', ''];
    lines.push('Date: ' + prettyDate(todayISO()));
    lines.push('');
    lines.push('Shape: ' + s.label);
    s.fields.forEach(function (f) {
      var v = vals[f.id];
      if (!v) return;
      lines.push(f.label + ': ' + v + (f.count ? '' : ' ' + units[f.id]));
    });
    lines.push('Wastage: +' + (parseFloat(vals.wastage) || 0) + '%');
    lines.push('');
    lines.push('Order volume: ' + withCommas(withWaste.toFixed(3)) + ' m³');
    lines.push('');
    lines.push('Order quantity:');
    lines.push(primary);
    lines.push('or');
    lines.push(alt);
    lines.push('');
    lines.push('Estimate only. Confirm with your supplier.');
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

  // Per the wireframe: a toast above the CTAs instead of a persistent visible spec
  // sheet. Copy/Share still write the full docket to the clipboard (see specText()) -
  // this just confirms it happened.
  function showToast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(t._t);
    t._t = setTimeout(function () { t.hidden = true; }, 1600);
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
    var btn = this;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(specText()).then(function () {
        flashLabel('copyLabel', '✓ Copied');
        showToast('Spec copied to clipboard');
        btn.classList.add('is-confirmed');
        clearTimeout(btn._t);
        btn._t = setTimeout(function () { btn.classList.remove('is-confirmed'); }, 1600);
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
      }).catch(function () {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      // no share target on desktop - copying is the honest fallback
      navigator.clipboard.writeText(text).then(function () {
        flashLabel('shareLabel', 'Copied');
        showToast('Spec copied to clipboard');
        params.method = 'copy_fallback';
        track('spec_share', params);
      }, function () {});
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
    if (meta) meta.setAttribute('content', mode === 'dark' ? '#1c1c1e' : '#f2f2f7');
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

  renderKeypad();
  renderAll();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }
})();
