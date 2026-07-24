(function () {
  'use strict';

  var DRAFT_KEY = 'slabset-v12-draft';
  var THEME_KEY = 'slabset-theme';
  var JOB_KEY = 'slabset-job';
  var DRAFT_SCHEMA = 5;
  var BAG_KG = [20, 25, 30];
  var BAG_M3 = { 20: 0.01, 25: 0.0125, 30: 0.015 };
  var THIN_MM = 50;
  var MESH_SHEET_M2 = 14.4;
  var MESH_SHEET_SIZE = '6.0 × 2.4 m';

  var FIELD_DEFAULTS = {
    slab: { L: '3', W: '3', T: '100' },
    footing: { L: '10', W: '0.3', D: '400' },
    pierfooting: { PL: '600', PW: '600', PD: '400' },
    column: { DIA: '300', H: '2400' },
    stairs: { W: '1000', R: '170', G: '250', N: '3', BT: '' },
    gutter: { L: '10', KD: '150', KH: '150', FT: '100', GW: '300' }
  };

  var SHAPES = {
    slab: {
      label: 'Slab / Pad',
      fields: [
        { k: 'L', lab: 'Length', unit: 'm', need: true, max: 30 },
        { k: 'W', lab: 'Width', unit: 'm', need: true, max: 30 },
        { k: 'T', lab: 'Thickness', unit: 'mm', need: true, mm: true, max: 1000 }
      ],
      vol: function (v) { return v.L * v.W * (v.T / 1000); }
    },
    pierfooting: {
      label: 'Pier footing',
      fields: [
        { k: 'PL', lab: 'Length', unit: 'mm', need: true, mm: true, max: 3000 },
        { k: 'PW', lab: 'Width', unit: 'mm', need: true, mm: true, max: 3000 },
        { k: 'PD', lab: 'Depth', unit: 'mm', need: true, mm: true, max: 2000 }
      ],
      vol: function (v) {
        return (v.PL / 1000) * (v.PW / 1000) * (v.PD / 1000);
      }
    },
    column: {
      label: 'Column',
      fields: [
        { k: 'DIA', lab: 'Diameter', unit: 'mm', need: true, mm: true, max: 3000 },
        { k: 'H', lab: 'Height', unit: 'mm', need: true, mm: true, max: 10000 }
      ],
      vol: function (v) {
        return Math.PI * Math.pow((v.DIA / 1000) / 2, 2) * (v.H / 1000);
      }
    },
    footing: {
      label: 'Strip footing',
      fields: [
        { k: 'L', lab: 'Length', unit: 'm', need: true, max: 30 },
        { k: 'W', lab: 'Width', unit: 'm', need: true, max: 2 },
        { k: 'D', lab: 'Depth', unit: 'mm', need: true, mm: true, max: 2000 }
      ],
      vol: function (v) { return v.L * v.W * (v.D / 1000); }
    },
    stairs: {
      label: 'Stairs',
      fields: [
        { k: 'W', lab: 'Width', unit: 'mm', need: true, mm: true, max: 3000 },
        { k: 'R', lab: 'Rise', unit: 'mm', need: true, mm: true, max: 300 },
        { k: 'G', lab: 'Going', unit: 'mm', need: true, mm: true, max: 500 },
        { k: 'N', lab: 'Steps', unit: '', need: true, max: 60, int: true },
        { k: 'BT', lab: 'Base slab (optional)', unit: 'mm', need: false, mm: true, max: 300 }
      ],
      vol: function (v) {
        var w = v.W / 1000;
        var wedge = w * (v.G / 1000) * (v.R / 1000) * (v.N * (v.N + 1) / 2);
        return wedge + w * (v.G / 1000 * v.N) * (v.BT / 1000);
      }
    },
    gutter: {
      label: 'Gutter / Kerb',
      fields: [
        { k: 'L', lab: 'Length', unit: 'm', need: true, max: 100 },
        { k: 'KD', lab: 'Kerb depth', unit: 'mm', need: true, mm: true, max: 500 },
        { k: 'KH', lab: 'Kerb height', unit: 'mm', need: true, mm: true, max: 500 },
        { k: 'FT', lab: 'Flag thickness', unit: 'mm', need: true, mm: true, max: 300 },
        { k: 'GW', lab: 'Gutter width', unit: 'mm', need: true, mm: true, max: 1000 }
      ],
      vol: function (v) {
        var kd = v.KD / 1000;
        var kh = v.KH / 1000;
        var ft = v.FT / 1000;
        var gw = v.GW / 1000;
        return v.L * (kd * (kh + ft) + gw * ft);
      }
    }
  };

  var QTY_MIN = 1;
  var QTY_MAX = 999;

  var SHAPE_ICONS = {
    slab: '<rect x="3" y="9" width="18" height="6" rx="1" stroke="currentColor" stroke-width="1.75"/>',
    footing: '<path d="M3 5h18v14H3V5zm4 4h10v6H7V9z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>',
    pierfooting: '<rect x="7" y="4" width="10" height="16" rx="1" stroke="currentColor" stroke-width="1.75"/>',
    column: '<rect x="9" y="3" width="6" height="18" rx="1" stroke="currentColor" stroke-width="1.75"/>',
    stairs: '<path d="M4 20v-4h6v-4h6v-4h6" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/><path d="M4 20h18M22 20V8" stroke="currentColor" stroke-width="1.75" stroke-linecap="square"/>',
    gutter: '<path d="M3 6h6v8h12v4H3z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>'
  };

  var DIAGRAMS = {
    slab: { src: 'shared/diagrams/slab.svg' },
    footing: { src: 'shared/diagrams/footing.svg' },
    pierfooting: { src: 'shared/diagrams/pierfooting.svg' },
    column: { src: 'shared/diagrams/column.svg' },
    stairs: { src: 'shared/diagrams/stairs.svg' },
    gutter: { src: 'shared/diagrams/gutter.svg' }
  };

  function fieldDef(key) {
    return SHAPES[st.shape].fields.filter(function (f) { return f.k === key; })[0];
  }

  function fieldIsInt(key) {
    if (key === 'qty') return true;
    var f = fieldDef(key);
    return !!(f && f.int);
  }

  function emptyVals() {
    return {
      L: '', W: '', T: '', D: '', DIA: '', H: '',
      PL: '', PW: '', PD: '', R: '', G: '', N: '', BT: '',
      KD: '', KH: '', FT: '', GW: ''
    };
  }

  var st = {
    step: 'measure',
    shape: 'slab',
    waste: 10,
    bagKg: 20,
    qty: 1,
    vals: emptyVals(),
    shapeVals: {}
  };

  function bagKg() {
    return BAG_M3[st.bagKg] ? st.bagKg : 20;
  }

  function bagVol() {
    return BAG_M3[bagKg()];
  }

  function bagSizeSegHtml() {
    var cur = bagKg();
    return (
      '<div class="bag-size" role="group" aria-label="Bag size">' +
      BAG_KG.map(function (kg) {
        var on = kg === cur;
        return (
          '<button type="button" class="bag-size__btn' + (on ? ' is-on' : '') +
          '" data-bag="' + kg + '" aria-pressed="' + (on ? 'true' : 'false') + '">' +
          kg + ' kg</button>'
        );
      }).join('') +
      '</div>'
    );
  }

  var deferredInstall = null;
  var editing = null; // field key | 'qty' | null
  var buffer = '';
  var editSnapshot = '';
  var jobName = '';

  function parkShapeVals(shape) {
    var s = shape || st.shape;
    st.shapeVals[s] = Object.assign(emptyVals(), st.vals);
  }

  function adoptShapeVals(shape) {
    var saved = st.shapeVals[shape];
    st.vals = emptyVals();
    if (!saved) return;
    Object.keys(st.vals).forEach(function (k) {
      if (saved[k] != null && String(saved[k]) !== '') {
        st.vals[k] = String(saved[k]);
      }
    });
  }

  function fieldDefault(key) {
    var defs = FIELD_DEFAULTS[st.shape] || {};
    return defs[key] != null ? String(defs[key]) : '';
  }

  function rawComplete(key) {
    var raw = (st.vals[key] || '').toString().trim();
    return raw !== '' && raw !== '.' && parseFloat(raw) > 0;
  }

  function defaultInUse(key) {
    return !rawComplete(key) && !!fieldDefault(key);
  }

  function defaultValueShown(key) {
    var def = fieldDefault(key);
    if (!def) return false;
    if (defaultInUse(key)) return true;
    if (!rawComplete(key)) return false;
    return parseFloat(st.vals[key]) === parseFloat(def);
  }

  function effectiveRaw(key) {
    return rawComplete(key) ? st.vals[key] : fieldDefault(key);
  }

  function numEff(key) {
    var n = parseFloat(effectiveRaw(key));
    return isFinite(n) ? n : 0;
  }

  function clampQty(n) {
    n = Math.round(n);
    if (!isFinite(n) || n < QTY_MIN) return QTY_MIN;
    if (n > QTY_MAX) return QTY_MAX;
    return n;
  }

  function shapeUsesQty(shape) {
    return shape === 'pierfooting' || shape === 'column';
  }

  function effectiveQty() {
    return shapeUsesQty(st.shape) ? clampQty(st.qty) : 1;
  }

  function parseVals() {
    var v = {};
    SHAPES[st.shape].fields.forEach(function (f) { v[f.k] = numEff(f.k); });
    return v;
  }

  function complete() {
    // Preview calc OK: entered value or ghost default for every needed field
    return SHAPES[st.shape].fields.every(function (f) {
      if (!f.need) return true;
      return rawComplete(f.k) || !!fieldDefault(f.k);
    });
  }

  function resultsReady() {
    // Unlock Results only after the user has entered each needed field
    return SHAPES[st.shape].fields.every(function (f) {
      if (!f.need) return true;
      return rawComplete(f.k);
    });
  }

  function missingFields() {
    return SHAPES[st.shape].fields.filter(function (f) {
      return f.need && !rawComplete(f.k);
    });
  }

  function guidanceText() {
    var missing = missingFields();
    if (!missing.length) return '';
    if (missing.length === 1) return 'Enter ' + missing[0].lab.toLowerCase() + ' to continue';
    return (
      'Enter ' +
      missing.slice(0, -1).map(function (f) { return f.lab.toLowerCase(); }).join(', ') +
      ' and ' +
      missing[missing.length - 1].lab.toLowerCase() +
      ' to continue'
    );
  }

  function volume() {
    if (!complete()) return { net: 0, total: 0 };
    var qty = effectiveQty();
    var net = SHAPES[st.shape].vol(parseVals()) * qty;
    var total = net * (1 + st.waste / 100);
    return { net: net, total: total };
  }

  function ceil1(n) {
    return Math.ceil(n * 10) / 10;
  }

  /** Never show 0.00 when volume is positive but tiny. */
  function formatVol(n) {
    if (!(n > 0)) return '0.00';
    if (n < 0.01) return '<0.01';
    return n.toFixed(2);
  }

  function recommend(total) {
    if (total <= 0) return null;
    var kg = bagKg();
    var bagsN = Math.ceil(total / bagVol());
    var truck = ceil1(total);
    var truckTxt = truck.toFixed(1);
    var bagsOrder = bagsN + ' × ' + kg + ' kg bags';
    var mixOrder = truckTxt + ' m³ Ready-mix';
    var bagsQtyHtml =
      '<div class="qty-stack">' +
      '<div class="qty-line">' + bagsOrder + '</div>' +
      bagSizeSegHtml() +
      '</div>';
    var mixQtyHtml =
      '<div class="qty-line">' + truckTxt + ' m³ Ready-mix</div>';

    if (total < 0.5) {
      return {
        tone: 'bags',
        why: '',
        pick: 'bags',
        order: bagsOrder,
        altOrder: mixOrder,
        altPlain: mixOrder + '. Most ready-mix suppliers have a minimum of 0.2-0.5 m³, with a small-load surcharge under 1 m³.',
        bags: {
          name: 'Bags',
          summary: bagsOrder,
          qtyHtml: bagsQtyHtml,
          note: 'Best for small pours where a truck would trigger minimum load fees.'
        },
        mix: {
          name: 'Ready-mix',
          summary: truckTxt + ' m³ Ready-mix',
          qtyHtml: mixQtyHtml,
          note: 'Usually not worth it for this volume - most suppliers charge short-load fees under ~1 m³.'
        }
      };
    }
    return {
      tone: 'truck',
      why: '',
      pick: 'truck',
      order: mixOrder,
      altOrder: bagsOrder,
      altPlain: bagsOrder + '. Use this option if truck access is difficult.',
      bags: {
        name: 'Bags',
        summary: bagsOrder,
        qtyHtml: bagsQtyHtml,
        note: 'Use this option if truck access is difficult.'
      },
      mix: {
        name: 'Ready-mix',
        summary: truckTxt + ' m³ Ready-mix',
        qtyHtml: mixQtyHtml,
        note: 'Less labour, more consistent pour, and usually cheaper past 0.5 m³.'
      }
    };
  }

  function choiceHtml(opt, kind) {
    var note = opt.note
      ? '<p class="rec-choice__note">' + opt.note + '</p>'
      : '';
    return (
      '<div class="rec-choice" data-choice="' + kind + '">' +
      '<div class="rec-choice__qty">' + opt.qtyHtml + '</div>' +
      note +
      '</div>'
    );
  }

  function groupHtml(label, opt, kind, isRec) {
    var labClass = 'rec-group__lab' + (isRec ? ' rec-group__lab--rec' : '');
    var groupClass = 'rec-group' + (isRec ? ' is-recommended' : ' is-alternative');
    return (
      '<div class="' + groupClass + '">' +
      '<h3 class="' + labClass + '">' + label + '</h3>' +
      choiceHtml(opt, kind) +
      '</div>'
    );
  }

  function renderRec(total) {
    var card = document.getElementById('recCard');
    var body = document.getElementById('recBody');
    var plan = recommend(total);
    if (!card || !body || !plan) return;
    card.setAttribute('data-tone', plan.tone);
    var why = card.querySelector('[data-rec-why]');
    if (why) {
      why.textContent = plan.why || '';
      why.hidden = !plan.why;
    }

    if (plan.pick === 'truck') {
      body.innerHTML =
        groupHtml('Recommended', plan.mix, 'mix', true) +
        groupHtml('Other option', plan.bags, 'bags', false);
    } else {
      body.innerHTML =
        groupHtml('Recommended', plan.bags, 'bags', true) +
        groupHtml('Other option', plan.mix, 'mix', false);
    }
  }

  function displayVal(f) {
    if (rawComplete(f.k)) return st.vals[f.k];
    return fieldDefault(f.k) || '';
  }

  function jobExtras(total) {
    var v = parseVals();
    var qty = effectiveQty();
    var area = 0;
    var edge = 0;
    if (st.shape === 'slab' || st.shape === 'footing') {
      area = v.L * v.W * qty;
      edge = 2 * (v.L + v.W) * qty;
    } else if (st.shape === 'pierfooting') {
      area = (v.PL / 1000) * (v.PW / 1000) * qty;
      edge = 2 * ((v.PL / 1000) + (v.PW / 1000)) * qty;
    } else if (st.shape === 'column') {
      edge = Math.PI * (v.DIA / 1000) * qty;
    } else if (st.shape === 'stairs') {
      var run = (v.G / 1000) * v.N;
      var w = v.W / 1000;
      area = w * run * qty;
      edge = 2 * (w + run) * qty;
    } else if (st.shape === 'gutter') {
      edge = 2 * v.L * qty;
    }
    return {
      mesh: area ? Math.ceil(area / MESH_SHEET_M2) : 0,
      edge: edge,
      weight: total * 2.4
    };
  }

  function specRows() {
    var v = volume();
    var sh = SHAPES[st.shape];
    var rows = [
      { k: 'Date', v: specDate() },
      { gap: true }
    ];
    rows.push({ k: 'Shape', v: sh.label });
    sh.fields.forEach(function (f) {
      if (!f.need && !rawComplete(f.k)) return;
      var shown = displayVal(f) || '0';
      rows.push({
        k: f.lab,
        v: shown + (f.unit ? (' ' + f.unit) : '')
      });
    });
    if (shapeUsesQty(st.shape)) {
      rows.push({ k: 'Quantity', v: String(effectiveQty()) + ' ×' });
    }
    rows.push({ k: 'Waste', v: '+' + st.waste + '%' });
    rows.push({ k: 'Volume', v: formatVol(v.total) + ' m³' });
    var plan = recommend(v.total);
    if (plan) {
      rows.push({ gap: true });
      rows.push({ k: 'Recommended', v: plan.order });
      rows.push({ k: 'Other option', v: plan.altOrder || plan.altPlain });
    }
    if (v.total > 0) {
      var extras = jobExtras(v.total);
      rows.push({ gap: true });
      if (extras.mesh > 0) {
        rows.push({
          k: 'Mesh (' + MESH_SHEET_SIZE + ')',
          v: extras.mesh === 1 ? '1 sheet' : extras.mesh + ' sheets'
        });
      }
      rows.push({ k: 'Formwork length', v: extras.edge.toFixed(1) + ' m' });
      rows.push({ k: 'Weight', v: extras.weight.toFixed(2) + ' t' });
    }
    return rows;
  }

  function specDate() {
    var d = new Date();
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  }

  function specText() {
    var v = volume();
    var sh = SHAPES[st.shape];
    var lines = ['SPEC SHEET', ''];
    if (jobName) lines.push('Job: ' + jobName);
    lines.push('Date: ' + specDate());

    lines.push('');
    lines.push('Shape: ' + sh.label);
    sh.fields.forEach(function (f) {
      if (!f.need && !rawComplete(f.k)) return;
      var shown = displayVal(f) || '0';
      lines.push(f.lab + ': ' + shown + (f.unit ? (' ' + f.unit) : ''));
    });
    if (shapeUsesQty(st.shape)) {
      lines.push('Quantity: ' + String(effectiveQty()) + ' ×');
    }
    lines.push('Waste: +' + st.waste + '%');
    lines.push('Volume: ' + formatVol(v.total) + ' m³');

    var plan = recommend(v.total);
    if (plan) {
      lines.push('');
      lines.push('Recommended: ' + plan.order);
      lines.push('Other option: ' + (plan.altOrder || plan.altPlain));
    }

    if (v.total > 0) {
      var extras = jobExtras(v.total);
      lines.push('');
      if (extras.mesh > 0) {
        lines.push(
          'Mesh (' + MESH_SHEET_SIZE + '): ' +
          (extras.mesh === 1 ? '1 sheet' : extras.mesh + ' sheets')
        );
      }
      lines.push('Formwork length: ' + extras.edge.toFixed(1) + ' m');
      lines.push('Weight: ' + extras.weight.toFixed(2) + ' t');
    }

    lines.push('');
    lines.push('by SlabSet');
    return lines.join('\n');
  }

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  function syncThemeBtn() {
    var btn = document.getElementById('btnTheme');
    if (!btn) return;
    var light = currentTheme() === 'light';
    btn.setAttribute('aria-pressed', light ? 'true' : 'false');
    btn.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
  }

  function applyTheme(theme) {
    var next = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', next === 'light' ? '#f4f4f5' : '#121212');
    syncThemeBtn();
  }

  function toast(msg) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.hidden = false;
    el.textContent = msg;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.hidden = true; }, 1800);
  }

  function saveDraft() {
    try {
      parkShapeVals(st.shape);
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        schema: DRAFT_SCHEMA,
        shape: st.shape,
        waste: st.waste,
        bagKg: bagKg(),
        qty: st.qty,
        step: st.step,
        shapeVals: st.shapeVals,
        vals: st.vals
      }));
    } catch (e) {}
  }

  function loadDraft() {
    try {
      var raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      var d = JSON.parse(raw);
      if (!d) return;
      if (d.shape === 'round') d.shape = 'slab';
      if (!SHAPES[d.shape]) return;
      st.shape = d.shape;
      st.waste = [0, 5, 10, 15, 20].indexOf(d.waste) >= 0 ? d.waste : 10;
      st.bagKg = BAG_M3[d.bagKg] ? d.bagKg : 20;
      if (d.qty != null) st.qty = clampQty(parseFloat(d.qty));
      if (d.step === 'measure' || d.step === 'results') st.step = d.step;

      if (d.shapeVals && typeof d.shapeVals === 'object') {
        st.shapeVals = d.shapeVals;
        adoptShapeVals(st.shape);
      } else if (d.vals) {
        // Schema ≤3: one flat vals bag - keep it on the active shape only.
        Object.keys(st.vals).forEach(function (k) {
          if (typeof d.vals[k] === 'string' || typeof d.vals[k] === 'number') {
            st.vals[k] = String(d.vals[k]);
          }
        });
        if (d.vals.Q != null && d.qty == null) {
          st.qty = clampQty(parseFloat(d.vals.Q));
        }
        parkShapeVals(st.shape);
      }

      // Schema 2: column diameter/height are mm (was metres).
      if ((d.schema || 1) < 2) {
        var dia = parseFloat(st.vals.DIA);
        var h = parseFloat(st.vals.H);
        if (isFinite(dia) && dia > 0 && dia < 20) {
          st.vals.DIA = String(Math.round(dia * 1000));
        }
        if (isFinite(h) && h > 0 && h <= 30) {
          st.vals.H = String(Math.round(h * 1000));
        }
        parkShapeVals(st.shape);
      }
      // Schema 3: stairs width is mm (was metres).
      if ((d.schema || 1) < 3) {
        var sw = parseFloat(st.vals.W);
        if (st.shape === 'stairs' && isFinite(sw) && sw > 0 && sw <= 5) {
          st.vals.W = String(Math.round(sw * 1000));
          parkShapeVals(st.shape);
        }
      }
    } catch (e) {}
  }

  function syncQtyUi() {
    var field = document.getElementById('qtyField');
    var input = document.getElementById('qtyInput');
    var show = shapeUsesQty(st.shape);
    if (!show) st.qty = 1;
    var q = clampQty(st.qty);
    st.qty = q;
    if (field) {
      field.hidden = !show;
      field.classList.toggle('is-editing', editing === 'qty');
      if (!field.getAttribute('data-key')) field.setAttribute('data-key', 'qty');
    }
    if (input) {
      if (useKeypad()) {
        input.setAttribute('readonly', '');
        input.setAttribute('inputmode', 'none');
      } else {
        input.removeAttribute('readonly');
        input.setAttribute('inputmode', 'numeric');
      }
      if (document.activeElement !== input && editing !== 'qty') {
        input.value = String(q);
      } else if (editing === 'qty') {
        input.value = buffer === '' ? String(q) : buffer;
      }
    }
  }

  function shapeMenuOpen() {
    var dd = document.getElementById('shapeDd');
    return !!(dd && dd.classList.contains('is-open'));
  }

  function syncShapeUi() {
    var card = document.getElementById('shapeCard');
    var lab = document.getElementById('shapeCardLab');
    var ico = document.getElementById('shapeCardIco');
    var menu = document.getElementById('shapeMenu');
    var open = shapeMenuOpen();
    if (card) card.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (menu) {
      menu.setAttribute('aria-hidden', open ? 'false' : 'true');
      menu.removeAttribute('hidden');
    }
    if (lab) {
      lab.textContent = (SHAPES[st.shape] && SHAPES[st.shape].label) || 'Shape';
    }
    if (ico) {
      ico.innerHTML = SHAPE_ICONS[st.shape] || SHAPE_ICONS.slab;
    }
    document.querySelectorAll('#shapeMoreList [data-shape]').forEach(function (btn) {
      var on = btn.getAttribute('data-shape') === st.shape;
      btn.hidden = on;
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
      btn.tabIndex = open && !on ? 0 : -1;
    });
  }

  function openShapeMenu() {
    if (editing) stopEdit();
    var dd = document.getElementById('shapeDd');
    if (!dd) return;
    dd.classList.add('is-open');
    syncShapeUi();
  }

  function closeShapeMenu() {
    var dd = document.getElementById('shapeDd');
    if (!dd) return;
    dd.classList.remove('is-open');
    syncShapeUi();
  }

  function toggleShapeMenu() {
    if (shapeMenuOpen()) closeShapeMenu();
    else openShapeMenu();
  }

  function selectShape(shape) {
    if (!SHAPES[shape]) return;
    if (shape === st.shape) {
      closeShapeMenu();
      return;
    }
    if (editing) stopEdit();
    parkShapeVals(st.shape);
    st.shape = shape;
    adoptShapeVals(shape);
    saveDraft();
    closeShapeMenu();
    render();
  }

  function validateField(key) {
    var fdef = fieldDef(key);
    if (!fdef) return;
    var field = document.querySelector('.field[data-key="' + key + '"]');
    if (!field) return;
    var wrap = field.closest('.field-wrap') || field;
    var warnEl = wrap.querySelector('.field__warn');
    var thinEl = wrap.querySelector('.field__thin');
    var raw = effectiveRaw(key);
    var val = parseFloat(raw) || 0;
    var bad = !!(fdef.max && val > fdef.max);
    var thin = !!(fdef.mm && val > 0 && val < THIN_MM && !bad);
    field.classList.toggle('warn', bad);
    field.classList.toggle('thin', thin);
    if (warnEl) {
      warnEl.textContent = bad ? 'That looks too large. Check units.' : '';
    }
    if (thinEl) {
      thinEl.hidden = !thin;
      thinEl.textContent = thin ? 'Looks thin. Check units' : '';
    }
  }

  function validateAllFields() {
    SHAPES[st.shape].fields.forEach(function (f) { validateField(f.k); });
  }

  function isDesktop() {
    return document.documentElement.getAttribute('data-layout') === 'desktop';
  }

  function syncResultsPanel(v) {
    // Same gate as phone: ghost defaults do not unlock order / summary
    var ready = resultsReady();
    var dash = '-';
    document.querySelectorAll('[data-total]').forEach(function (el) {
      el.textContent = ready ? formatVol(v.total) : dash;
    });
    document.querySelectorAll('[data-waste-lab]').forEach(function (el) {
      if (el.classList && el.classList.contains('dock-live__unit')) {
        el.textContent = ready
          ? 'm³ (includes +' + st.waste + '% waste)'
          : 'm³';
      } else {
        el.textContent = ready ? ('+' + st.waste + '% waste') : 'Waste';
      }
    });
    var results = document.getElementById('panelResults');
    if (results) results.classList.toggle('is-pending', !ready);
    if (ready) {
      renderRec(v.total);
      renderSpec();
    } else if (isDesktop()) {
      var why = document.querySelector('[data-rec-why]');
      if (why) {
        why.textContent = 'Fill in the dimensions on the left to get bags vs ready-mix advice.';
        why.hidden = false;
      }
      var body = document.getElementById('recBody');
      if (body) body.innerHTML = '';
      var card = document.getElementById('recCard');
      if (card) card.setAttribute('data-tone', 'bags');
      var spec = document.getElementById('specSheet');
      if (spec) spec.innerHTML = '';
    }
  }

  function bumpLive() {
    var v = volume();
    var preview = complete();
    var ready = resultsReady();
    var calc = document.getElementById('btnCalc');
    if (calc) calc.disabled = !ready;
    syncDock(v, preview, ready);
    validateAllFields();
    if (isDesktop() || st.step === 'results') syncResultsPanel(v);
  }

  function setStep(step) {
    if (step === 'results' && !resultsReady()) {
      toast(guidanceText() || 'Enter dimensions first');
      return;
    }
    if (editing) stopEdit();
    st.step = step;
    saveDraft();
    render();
    // Summary always opens on Volume → Recommended (not mid-scroll from Measure)
    if (step === 'results' && !isDesktop()) {
      var scroll = document.querySelector('.scroll');
      if (scroll) scroll.scrollTop = 0;
    }
  }

  function useKeypad() {
    return !isDesktop();
  }

  function dimFieldKeys() {
    return SHAPES[st.shape].fields.map(function (f) { return f.k; });
  }

  function editTargets() {
    var keys = dimFieldKeys();
    if (shapeUsesQty(st.shape)) keys.push('qty');
    return keys;
  }

  var padOpen = false;
  /** Ignore the click that follows the pointerdown which opened/switched a field. */
  var ignoreOutsideClick = false;

  function setPadOpen(open) {
    open = !!open;
    var dock = document.getElementById('dockMeasure');
    var pad = document.getElementById('keypad');
    var app = document.getElementById('app');
    padOpen = open;
    if (dock) dock.classList.toggle('is-pad-open', open);
    if (pad) pad.hidden = !open;
    if (app) app.classList.toggle('is-editing-dims', open);
    if (!open) clearEditScrollSpacer();
    syncKeypadDecimal();
  }

  function syncKeypadDecimal() {
    var btn = document.querySelector('#keypad [data-k="."]');
    if (!btn) return;
    var intOnly = !!(editing && fieldIsInt(editing));
    btn.disabled = intOnly;
    btn.setAttribute('aria-disabled', intOnly ? 'true' : 'false');
  }

  function editScrollSpacer() {
    var scroll = document.querySelector('.scroll');
    if (!scroll) return null;
    var el = document.getElementById('editScrollSpacer');
    if (!el) {
      el = document.createElement('div');
      el.id = 'editScrollSpacer';
      el.setAttribute('aria-hidden', 'true');
      el.style.cssText = 'flex:0 0 auto; width:100%; height:0; pointer-events:none;';
      scroll.appendChild(el);
    }
    return el;
  }

  function clearEditScrollSpacer() {
    var el = document.getElementById('editScrollSpacer');
    if (el) el.style.height = '0px';
  }

  /**
   * Pad-open: park Dimensions just under the Measure/Summary steps (scroll top).
   * Max scroll-up: Waste may not rise more than 16px above the Volume LCD.
   */
  var WASTE_ABOVE_VOL = 16;

  function wasteVolLimitY() {
    var vol = document.querySelector('#dockMeasure .dock-live');
    return vol ? vol.getBoundingClientRect().top - WASTE_ABOVE_VOL : null;
  }

  function clampWasteScroll() {
    if (!padOpen || !useKeypad()) return;
    var scroll = document.querySelector('.scroll');
    var waste = document.querySelector('#panelMeasure .block--waste');
    var limit = wasteVolLimitY();
    if (!scroll || !waste || limit == null) return;
    var bottom = waste.getBoundingClientRect().bottom;
    if (bottom < limit - 0.5) {
      scroll.scrollTop = Math.max(0, scroll.scrollTop - (limit - bottom));
    }
  }

  function capEditSpacer() {
    var scroll = document.querySelector('.scroll');
    var waste = document.querySelector('#panelMeasure .block--waste');
    var spacer = document.getElementById('editScrollSpacer');
    var limit = wasteVolLimitY();
    if (!scroll || !waste || !spacer || limit == null) return;
    var saved = scroll.scrollTop;
    var max = scroll.scrollHeight - scroll.clientHeight;
    if (max <= 0) return;
    scroll.scrollTop = max;
    var bottom = waste.getBoundingClientRect().bottom;
    if (bottom < limit - 1) {
      var cur = parseFloat(spacer.style.height) || 0;
      spacer.style.height = Math.max(0, cur - (limit - bottom)) + 'px';
    }
    scroll.scrollTop = Math.min(saved, Math.max(0, scroll.scrollHeight - scroll.clientHeight));
  }

  function pinDimsStack() {
    var scroll = document.querySelector('.scroll');
    var dims = document.querySelector('#panelMeasure .block--dims');
    if (!scroll || !dims || !padOpen) return;
    var spacer = editScrollSpacer();
    // Just below Measure/Summary - scroll viewport top
    var edge = scroll.getBoundingClientRect().top;

    for (var i = 0; i < 6; i++) {
      var delta = dims.getBoundingClientRect().top - edge;
      if (Math.abs(delta) <= 1) break;
      var target = scroll.scrollTop + delta;
      if (target < 0) target = 0;
      var max = scroll.scrollHeight - scroll.clientHeight;
      if (target > max && spacer) {
        var cur = parseFloat(spacer.style.height) || 0;
        spacer.style.height = (cur + (target - max) + 8) + 'px';
        void scroll.offsetHeight;
        max = scroll.scrollHeight - scroll.clientHeight;
      }
      scroll.scrollTop = Math.min(Math.max(0, target), Math.max(0, max));
    }
    // Don't pull down after pin (keeps Dimensions under steps); only cap further up.
    capEditSpacer();
  }

  function syncEditingUi() {
    document.querySelectorAll('.field[data-key], #qtyField').forEach(function (el) {
      var key = el.getAttribute('data-key') || (el.id === 'qtyField' ? 'qty' : '');
      var on = editing === key;
      el.classList.toggle('is-editing', on);
    });
  }

  function focusEditingValue() {
    if (!editing || !useKeypad()) return;
    var input = editing === 'qty'
      ? document.getElementById('qtyInput')
      : document.querySelector('input.field__input[data-key="' + editing + '"]');
    if (!input) return;
    try {
      input.focus({ preventScroll: true });
      var n = input.value.length;
      input.setSelectionRange(n, n);
    } catch (e) {}
  }

  function refreshEditingChip() {
    if (!editing) return;
    if (editing === 'qty') {
      var input = document.getElementById('qtyInput');
      if (input) {
        input.value = buffer === '' ? String(clampQty(st.qty)) : buffer;
        var wrap = document.getElementById('qtyField');
        if (wrap) {
          wrap.classList.toggle('is-default', false);
          wrap.classList.add('is-editing');
        }
      }
      focusEditingValue();
      return;
    }
    var input = document.querySelector('input.field__input[data-key="' + editing + '"]');
    if (!input) return;
    var ghost = buffer === '';
    input.value = ghost ? (displayVal({ k: editing }) || '') : buffer;
    var wrap = input.closest('.field');
    if (wrap) {
      wrap.classList.toggle('is-default', ghost && defaultValueShown(editing));
      wrap.classList.add('is-editing');
    }
    focusEditingValue();
  }

  function commitEdit(opts) {
    if (!editing) return;
    var keepPad = !!(opts && opts.keepPad);
    var key = editing;
    if (buffer !== '' && buffer !== '.') {
      if (key === 'qty') {
        st.qty = clampQty(parseInt(buffer, 10) || QTY_MIN);
      } else if (fieldIsInt(key)) {
        var n = parseInt(buffer, 10);
        st.vals[key] = isFinite(n) && n > 0 ? String(n) : editSnapshot;
      } else {
        st.vals[key] = buffer;
      }
    } else {
      if (key === 'qty') {
        st.qty = clampQty(parseInt(editSnapshot, 10) || QTY_MIN);
      } else {
        st.vals[key] = editSnapshot;
      }
    }
    editing = null;
    buffer = '';
    editSnapshot = '';
    if (!keepPad) setPadOpen(false);
    syncEditingUi();
    saveDraft();
    bumpLive();
  }

  function discardEdit() {
    if (!editing) return;
    if (editing === 'qty') {
      st.qty = clampQty(parseInt(editSnapshot, 10) || QTY_MIN);
    } else {
      st.vals[editing] = editSnapshot;
    }
    editing = null;
    buffer = '';
    editSnapshot = '';
    setPadOpen(false);
    syncEditingUi();
    saveDraft();
    bumpLive();
  }

  function startEdit(key) {
    if (!useKeypad()) return;
    if (editing === key) return;
    if (shapeMenuOpen()) closeShapeMenu();
    var opening = !padOpen;
    // Keep keypad open when moving between fields (avoids flash/jump)
    if (editing && editing !== key) commitEdit({ keepPad: true });
    editing = key;
    buffer = '';
    editSnapshot = key === 'qty'
      ? String(clampQty(st.qty))
      : String(st.vals[key] || '');
    setPadOpen(true);
    // pointerdown opens the field; the synthetic click must not dismiss it
    ignoreOutsideClick = true;
    syncEditingUi();
    refreshEditingChip();
    bumpLive();
    if (opening) {
      // After the tap settles: Dimensions just under Measure/Summary.
      setTimeout(function () {
        requestAnimationFrame(pinDimsStack);
      }, 0);
    }
  }

  function stopEdit() {
    if (!editing) return;
    commitEdit();
    renderFields();
    syncQtyUi();
  }

  function handleKey(k) {
    if (!editing) return;
    if (k === 'done') {
      // Hardware Enter: commit and close. No Next / See results on the pad.
      commitEdit();
      renderFields();
      syncQtyUi();
      return;
    }
    if (k === 'del') {
      buffer = buffer.slice(0, -1);
    } else {
      if (fieldIsInt(editing)) {
        if (k === '.') return;
        if (!/^\d$/.test(k)) return;
        if (buffer.length >= (editing === 'qty' ? 3 : 2)) return;
        buffer += k;
      } else {
        if (k === '.' && buffer.indexOf('.') >= 0) return;
        if (buffer.length >= 7) return;
        buffer += k;
      }
    }
    refreshEditingChip();
    if (editing === 'qty') {
      st.qty = buffer === ''
        ? clampQty(parseInt(editSnapshot, 10) || QTY_MIN)
        : clampQty(parseInt(buffer, 10) || QTY_MIN);
    } else {
      st.vals[editing] = (buffer === '' || buffer === '.')
        ? editSnapshot
        : buffer;
    }
    bumpLive();
  }

  function layoutDiagramPanel() {
    var sheet = document.getElementById('diagramSheet');
    var panel = sheet && sheet.querySelector('.diagram-sheet__panel');
    var ref =
      document.querySelector('#panelMeasure .block--dims .field:not([hidden])') ||
      document.querySelector('#panelMeasure .field:not([hidden])') ||
      document.querySelector('.field[data-key]:not([hidden])');
    if (!sheet || !panel || !ref || sheet.hidden) return;
    var r = ref.getBoundingClientRect();
    panel.style.width = Math.round(r.width) + 'px';
    sheet.style.paddingLeft = Math.max(0, Math.round(r.left)) + 'px';
  }

  var diagramFocusBefore = null;

  function diagramFocusables() {
    var sheet = document.getElementById('diagramSheet');
    if (!sheet || sheet.hidden) return [];
    return Array.prototype.slice.call(
      sheet.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ).filter(function (el) {
      return !el.disabled && el.getAttribute('aria-hidden') !== 'true';
    });
  }

  function onDiagramKeydown(e) {
    if (e.key !== 'Tab') return;
    var sheet = document.getElementById('diagramSheet');
    if (!sheet || sheet.hidden) return;
    var list = diagramFocusables();
    if (!list.length) return;
    var first = list[0];
    var last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function openDiagram() {
    if (editing) stopEdit();
    var meta = DIAGRAMS[st.shape];
    var sheet = document.getElementById('diagramSheet');
    var img = document.getElementById('diagramImg');
    var title = document.getElementById('diagramTitle');
    if (!meta || !sheet || !img) return;
    var label = (SHAPES[st.shape] && SHAPES[st.shape].label) || 'Shape';
    if (title) title.textContent = label;
    img.src = meta.src;
    img.alt = label + ' dimension diagram';
    diagramFocusBefore = document.activeElement;
    sheet.hidden = false;
    layoutDiagramPanel();
    document.addEventListener('keydown', onDiagramKeydown);
    var close = document.getElementById('diagramClose');
    if (close) close.focus();
  }

  function closeDiagram() {
    var sheet = document.getElementById('diagramSheet');
    if (sheet) sheet.hidden = true;
    document.removeEventListener('keydown', onDiagramKeydown);
    var back = diagramFocusBefore;
    diagramFocusBefore = null;
    if (back && typeof back.focus === 'function') {
      try { back.focus(); } catch (e) {}
    }
  }

  function syncJobInput() {
    var input = document.getElementById('jobName');
    if (!input) return;
    if (document.activeElement === input) return;
    input.value = jobName;
  }

  function isLegacyShapeJobName(name) {
    if (!name) return false;
    return Object.keys(SHAPES).some(function (k) {
      var label = (SHAPES[k] && SHAPES[k].label) || '';
      return label.split(' / ')[0] === name;
    });
  }

  function loadJobName() {
    try { jobName = localStorage.getItem(JOB_KEY) || ''; } catch (e) { jobName = ''; }
    // Drop old auto-filled shape names ("Slab", "Stairs", …)
    if (isLegacyShapeJobName(jobName)) jobName = '';
    syncJobInput();
  }

  function persistJobName() {
    try {
      if (jobName) localStorage.setItem(JOB_KEY, jobName);
      else localStorage.removeItem(JOB_KEY);
    } catch (e) {}
  }

  function saveJobName(val, opts) {
    var trim = !(opts && opts.keepRaw);
    jobName = trim ? (val || '').trim() : (val || '');
    persistJobName();
    if (!(opts && opts.skipSync)) syncJobInput();
  }

  function renderFields() {
    var box = document.getElementById('fields');
    if (!box) return;
    var kp = useKeypad();
    var html = '';
    SHAPES[st.shape].fields.forEach(function (f) {
      var val = (editing === f.k)
        ? (buffer === '' ? (displayVal(f) || '') : buffer)
        : displayVal(f);
      var isDef = editing === f.k
        ? (buffer === '' && defaultValueShown(f.k))
        : defaultValueShown(f.k);
      var editingCls = editing === f.k ? ' is-editing' : '';
      var mode = f.int ? 'numeric' : 'decimal';
      html +=
        '<div class="field-wrap">' +
        '<label class="field' + (isDef ? ' is-default' : '') + editingCls + '" data-key="' + f.k + '">' +
        '<span class="field__lab">' + f.lab + '</span>' +
        '<input class="field__input" type="text" ' +
        (kp
          ? 'readonly inputmode="none" '
          : 'inputmode="' + mode + '" enterkeyhint="next" ') +
        'autocomplete="off" spellcheck="false" data-key="' + f.k + '" value="' +
        String(val).replace(/"/g, '&quot;') + '" placeholder="0" aria-label="' +
        f.lab + (f.unit ? (' in ' + f.unit) : '') + '">' +
        '<span class="field__unit">' + (f.unit || '') + '</span>' +
        '</label>' +
        '<span class="field__thin" hidden aria-live="polite"></span>' +
        '<div class="field__meta">' +
        '<span class="field__warn" aria-live="polite"></span>' +
        '</div>' +
        '</div>';
    });
    box.innerHTML = html;
    validateAllFields();
  }

  function renderSpec() {
    var el = document.getElementById('specSheet');
    if (!el) return;
    el.innerHTML = specRows().map(function (r) {
      if (r.gap) return '<div class="spec__gap"></div>';
      return (
        '<div class="spec__row">' +
        '<span class="spec__k">' + (r.k || '') + '</span>' +
        '<span class="spec__v">' + r.v + '</span>' +
        '</div>'
      );
    }).join('');
  }

  function syncDock(v, preview, ready) {
    var volEl = document.querySelector('[data-dock-vol]');
    var unitEl = document.querySelector('[data-dock-unit]');
    var live = document.querySelector('.dock-live');
    var hint = document.getElementById('dockHint');
    if (live) live.classList.toggle('is-example', !!preview && !ready);
    if (preview) {
      if (volEl) volEl.textContent = formatVol(v.total);
      if (unitEl) {
        unitEl.textContent = ready
          ? 'm³ (includes +' + st.waste + '% waste)'
          : 'example only';
      }
    } else {
      if (volEl) volEl.textContent = '-';
      if (unitEl) unitEl.textContent = 'm³';
    }
    // No guidance line under the dock LCD - CTA / fields carry the next step
    if (hint) {
      hint.hidden = true;
      hint.textContent = '';
    }
  }

  function copySpec() {
    var text = specText();
    if (!resultsReady()) { toast(guidanceText() || 'Enter dimensions first'); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        toast('Summary copied');
      }).catch(function () { toast('Copy failed'); });
    } else {
      toast('Copy unavailable');
    }
  }

  function shareSpec() {
    if (!resultsReady()) { toast(guidanceText() || 'Enter dimensions first'); return; }
    var text = specText();
    if (navigator.share) {
      navigator.share({ title: 'SlabSet job summary', text: text }).catch(function () {});
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        toast('Copied. Paste into Messages or Notes');
      }).catch(function () { toast('Share unavailable'); });
      return;
    }
    toast('Share unavailable');
  }

  function render() {
    var desk = isDesktop();
    var measure = st.step === 'measure';
    var panelMeasure = document.getElementById('panelMeasure');
    var panelResults = document.getElementById('panelResults');
    var dockMeasure = document.getElementById('dockMeasure');
    var app = document.getElementById('app');
    if (app) app.setAttribute('data-step', st.step);

    if (desk) {
      if (panelMeasure) panelMeasure.hidden = false;
      if (panelResults) panelResults.hidden = false;
      if (dockMeasure) dockMeasure.hidden = true;
    } else {
      if (panelMeasure) panelMeasure.hidden = !measure;
      if (panelResults) panelResults.hidden = measure;
      if (dockMeasure) dockMeasure.hidden = !measure;
    }

    document.querySelectorAll('.steps__btn').forEach(function (btn) {
      var on = btn.getAttribute('data-step') === st.step;
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    document.querySelectorAll('.waste__btn[data-waste]').forEach(function (btn) {
      var w = parseInt(btn.getAttribute('data-waste'), 10);
      var on = w === st.waste;
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    syncShapeUi();
    syncQtyUi();
    if (desk || measure) renderFields();

    var v = volume();
    var preview = complete();
    var ready = resultsReady();
    if (!desk && st.step === 'results' && !ready) {
      st.step = 'measure';
      measure = true;
      if (panelMeasure) panelMeasure.hidden = false;
      if (panelResults) panelResults.hidden = true;
      if (dockMeasure) dockMeasure.hidden = false;
      if (app) app.setAttribute('data-step', 'measure');
      document.querySelectorAll('.steps__btn').forEach(function (btn) {
        var on = btn.getAttribute('data-step') === 'measure';
        btn.classList.toggle('is-on', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }
    var calc = document.getElementById('btnCalc');
    if (calc) calc.disabled = !ready;
    syncDock(v, preview, ready);

    if (desk || !measure) syncResultsPanel(v);
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('#btnTheme')) {
      applyTheme(currentTheme() === 'light' ? 'dark' : 'light');
      return;
    }
    var stepBtn = e.target.closest('.steps__btn');
    if (stepBtn) {
      setStep(stepBtn.getAttribute('data-step'));
      return;
    }
    var shape = e.target.closest('#shapeMoreList .shape[data-shape]');
    if (shape) {
      selectShape(shape.getAttribute('data-shape'));
      return;
    }
    if (e.target.closest('#shapeCard')) {
      toggleShapeMenu();
      return;
    }
    if (shapeMenuOpen() && !e.target.closest('#shapeDd')) {
      closeShapeMenu();
    }
    var waste = e.target.closest('.waste__btn[data-waste]');
    if (waste) {
      if (editing) stopEdit();
      st.waste = parseInt(waste.getAttribute('data-waste'), 10);
      saveDraft();
      render();
      return;
    }
    var bagBtn = e.target.closest('.bag-size__btn[data-bag]');
    if (bagBtn) {
      var nextKg = parseInt(bagBtn.getAttribute('data-bag'), 10);
      if (!BAG_M3[nextKg] || nextKg === bagKg()) return;
      st.bagKg = nextKg;
      saveDraft();
      render();
      return;
    }
    var keyBtn = e.target.closest('#keypad [data-k]');
    if (keyBtn) {
      e.preventDefault();
      handleKey(keyBtn.getAttribute('data-k'));
      return;
    }
    if (useKeypad()) {
      // Field open is handled on pointerdown (avoids focus scroll-into-view).
      // Any tap inside the dims stack (including gaps) must not dismiss.
      if (e.target.closest('.fields') || e.target.closest('#qtyField')) {
        ignoreOutsideClick = false;
        return;
      }
      // Same gesture that opened/switched a field - don't dismiss
      if (ignoreOutsideClick) {
        ignoreOutsideClick = false;
        return;
      }
      // Don't dismiss the pad after a scroll gesture - user may be heading to Shape.
      if (editing && tapMoved) return;
      if (editing && !e.target.closest('#keypad') && !e.target.closest('.field.is-editing') && !e.target.closest('#qtyField.is-editing')) {
        stopEdit();
      }
    }
    if (e.target.closest('#btnCalc')) {
      setStep('results');
      return;
    }
    if (e.target.closest('#btnEdit')) {
      setStep('measure');
      return;
    }
    if (e.target.closest('#btnCopy')) {
      copySpec();
      return;
    }
    if (e.target.closest('#btnShare')) {
      shareSpec();
      return;
    }
    if (e.target.closest('#btnDiagram')) {
      openDiagram();
      return;
    }
    if (
      e.target.closest('#diagramClose') ||
      e.target.closest('#diagramScrim')
    ) {
      closeDiagram();
      return;
    }
    if (e.target.closest('#btnInstall')) {
      if (!deferredInstall) return;
      deferredInstall.prompt();
      deferredInstall.userChoice.finally(function () {
        deferredInstall = null;
        var ban = document.getElementById('installBanner');
        if (ban) ban.hidden = true;
      });
      return;
    }
    if (e.target.closest('#btnInstallDismiss')) {
      var ban = document.getElementById('installBanner');
      if (ban) ban.hidden = true;
      try { sessionStorage.setItem('slabset-v12-install-dismiss', '1'); } catch (err) {}
    }
  });

  function isMeasureInput(el) {
    return !!(el && (el.id === 'qtyInput' || el.classList.contains('field__input')));
  }

  var tapMoved = false;
  var tapStartY = 0;
  document.addEventListener('pointerdown', function (e) {
    tapMoved = false;
    tapStartY = e.clientY;
    if (!useKeypad()) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    var qtyTap = e.target.closest('#qtyField');
    if (qtyTap && shapeUsesQty(st.shape)) {
      e.preventDefault();
      startEdit('qty');
      return;
    }
    var fieldTap = e.target.closest('.field[data-key]');
    if (
      fieldTap &&
      fieldTap.getAttribute('data-key') !== 'qty' &&
      fieldTap.closest('.fields')
    ) {
      // Prevent input focus so the browser doesn't scroll Length into view
      // and push Shape off-screen.
      e.preventDefault();
      startEdit(fieldTap.getAttribute('data-key'));
    }
  }, { passive: false });

  document.addEventListener('pointermove', function (e) {
    if (Math.abs(e.clientY - tapStartY) > 8) tapMoved = true;
  }, { passive: true });

  document.addEventListener('focusin', function (e) {
    if (!isMeasureInput(e.target)) return;
    if (useKeypad()) {
      e.target.blur();
      var key = e.target.id === 'qtyInput' ? 'qty' : e.target.getAttribute('data-key');
      if (key) startEdit(key);
      return;
    }
    var el = e.target;
    requestAnimationFrame(function () {
      el.select();
    });
  });

  // Click would otherwise collapse the selection after focus.
  document.addEventListener('mouseup', function (e) {
    if (!isMeasureInput(e.target)) return;
    if (useKeypad()) return;
    e.preventDefault();
  });

  document.addEventListener('input', function (e) {
    if (e.target.id === 'jobName') {
      saveJobName(e.target.value, { keepRaw: true, skipSync: true });
      return;
    }
    if (useKeypad()) return;
    if (e.target.id === 'qtyInput') {
      var raw = e.target.value.replace(/[^\d]/g, '');
      e.target.value = raw;
      if (raw === '') return;
      st.qty = clampQty(parseInt(raw, 10));
      saveDraft();
      syncQtyUi();
      bumpLive();
      return;
    }
    var input = e.target.closest('.field__input');
    if (!input) return;
    var key = input.getAttribute('data-key');
    var raw = input.value;
    if (fieldIsInt(key)) {
      raw = raw.replace(/[^\d]/g, '');
      input.value = raw;
    }
    st.vals[key] = raw;
    var wrap = input.closest('.field');
    if (wrap) wrap.classList.toggle('is-default', defaultValueShown(key));
    saveDraft();
    bumpLive();
  });

  document.addEventListener('change', function (e) {
    if (e.target.id === 'jobName') {
      saveJobName(e.target.value);
      return;
    }
    if (useKeypad()) return;
    if (e.target.id !== 'qtyInput') return;
    st.qty = clampQty(parseInt(e.target.value, 10) || QTY_MIN);
    saveDraft();
    syncQtyUi();
    bumpLive();
  });

  document.addEventListener('blur', function (e) {
    if (e.target && e.target.id === 'jobName') {
      saveJobName(e.target.value);
    }
  }, true);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (shapeMenuOpen()) {
        closeShapeMenu();
        e.preventDefault();
        return;
      }
      var sheet = document.getElementById('diagramSheet');
      if (sheet && !sheet.hidden) {
        closeDiagram();
        e.preventDefault();
        return;
      }
    }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target && (e.target.id === 'jobName' || (e.target.tagName === 'INPUT' && !useKeypad()))) return;
    if (!useKeypad()) return;
    if (!editing) {
      if (/^[0-9.]$/.test(e.key)) {
        var first = dimFieldKeys()[0];
        if (first) {
          startEdit(first);
          handleKey(e.key);
          e.preventDefault();
        }
      }
      return;
    }
    if (/^[0-9.]$/.test(e.key)) { handleKey(e.key); e.preventDefault(); }
    else if (e.key === 'Backspace') { handleKey('del'); e.preventDefault(); }
    else if (e.key === 'Enter') { handleKey('done'); e.preventDefault(); }
    else if (e.key === 'Escape') { discardEdit(); renderFields(); syncQtyUi(); e.preventDefault(); }
    else if (e.key === 'Tab') {
      e.preventDefault();
      var targets = editTargets();
      var i = targets.indexOf(editing);
      var next = targets[(i + (e.shiftKey ? targets.length - 1 : 1)) % targets.length];
      commitEdit({ keepPad: true });
      renderFields();
      syncQtyUi();
      startEdit(next);
    }
  });

  window.addEventListener('resize', layoutDiagramPanel);

  (function bindEditScrollClamp() {
    var scroll = document.querySelector('.scroll');
    if (!scroll) return;
    var lastTop = scroll.scrollTop;
    scroll.addEventListener('scroll', function () {
      if (!padOpen) {
        lastTop = scroll.scrollTop;
        return;
      }
      // Only clamp when scrolling up (stack rising) - don't undo Dimensions-under-steps pin
      if (scroll.scrollTop > lastTop) clampWasteScroll();
      lastTop = scroll.scrollTop;
    }, { passive: true });
  })();

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredInstall = e;
    try {
      if (sessionStorage.getItem('slabset-v12-install-dismiss')) return;
    } catch (err) {}
    var ban = document.getElementById('installBanner');
    if (ban) ban.hidden = false;
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(function () {});
  }

  function applyShapeFromUrl() {
    try {
      var params = new URLSearchParams(window.location.search);
      var shape = params.get('shape');
      if (shape && SHAPES[shape] && shape !== st.shape) {
        parkShapeVals(st.shape);
        st.shape = shape;
        adoptShapeVals(shape);
        st.step = 'measure';
        saveDraft();
      }
    } catch (e) {}
  }

  loadDraft();
  applyShapeFromUrl();
  loadJobName();
  syncThemeBtn();
  render();
  if (st.step === 'results' && !isDesktop()) {
    var bootScroll = document.querySelector('.scroll');
    if (bootScroll) bootScroll.scrollTop = 0;
  }
})();
