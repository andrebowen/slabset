(function () {
  'use strict';

  var DRAFT_KEY = 'slabset-v11-draft';
  var THEME_KEY = 'slabset-theme';
  var DRAFT_SCHEMA = 2;
  var BAG_20 = 0.01;
  var THIN_MM = 50;

  var FIELD_DEFAULTS = {
    slab: { L: '3', W: '3', T: '100' },
    footing: { L: '10', W: '0.3', D: '400' },
    pierfooting: { PL: '600', PW: '600', PD: '400' },
    column: { DIA: '300', H: '2400' },
    stairs: { W: '1', R: '170', G: '250', N: '3', BT: '' },
    gutter: { L: '10', KD: '150', KH: '150', FT: '100', GW: '300' }
  };

  var SHAPES = {
    slab: {
      label: 'Slab / Pad',
      fields: [
        { k: 'L', lab: 'Length', unit: 'm', need: true, max: 30 },
        { k: 'W', lab: 'Width', unit: 'm', need: true, max: 30 },
        { k: 'T', lab: 'Depth', unit: 'mm', need: true, mm: true, max: 1000 }
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
      // Deferred — same L×W×D as slab; use Slab / Pad. Re-add button to restore.
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
        { k: 'W', lab: 'Width', unit: 'm', need: true, max: 3 },
        { k: 'R', lab: 'Rise', unit: 'mm', need: true, mm: true, max: 300 },
        { k: 'G', lab: 'Going', unit: 'mm', need: true, mm: true, max: 500 },
        { k: 'N', lab: 'Steps', unit: '', need: true, max: 60 },
        { k: 'BT', lab: 'Base slab (optional)', unit: 'mm', need: false, mm: true, max: 300 }
      ],
      vol: function (v) {
        var wedge = v.W * (v.G / 1000) * (v.R / 1000) * (v.N * (v.N + 1) / 2);
        return wedge + v.W * (v.G / 1000 * v.N) * (v.BT / 1000);
      }
    },
    gutter: {
      // Deferred from picker — re-add shape button to restore.
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
  var SHAPE_HINTS = {
    gutter: 'L-section: kerb depth × full height, plus gutter width × flag thickness.'
  };

  var st = {
    step: 'measure',
    shape: 'slab',
    waste: 10,
    qty: 1,
    vals: {
      L: '', W: '', T: '', D: '', DIA: '', H: '',
      PL: '', PW: '', PD: '', R: '', G: '', N: '', BT: '',
      KD: '', KH: '', FT: '', GW: ''
    }
  };

  var deferredInstall = null;

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
    return SHAPES[st.shape].fields.every(function (f) {
      if (!f.need) return true;
      return rawComplete(f.k) || !!fieldDefault(f.k);
    });
  }

  function missingFields() {
    return SHAPES[st.shape].fields.filter(function (f) {
      return f.need && !rawComplete(f.k) && !fieldDefault(f.k);
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

  function recommend(total) {
    if (total <= 0) return null;
    var bags20 = Math.ceil(total / BAG_20);
    var truck = ceil1(total);
    var truckTxt = truck.toFixed(1);
    var bagsTxt = bags20 + ' × 20 kg bags';
    var mixTxt = truckTxt + ' m³ ready-mix';
    var mixAlt =
      '<span class="qty-cell__n">' + truckTxt + ' m³</span> ' +
      '<span class="qty-cell__u">ready-mix</span>';
    var bagsAlt =
      '<span class="qty-cell__n">' + bags20 + '</span> ' +
      '<span class="qty-cell__u">× 20 kg bags</span>';
    var volTxt = total.toFixed(2) + ' m³';

    if (total < 0.5) {
      return {
        tone: 'bags',
        title: 'Bag concrete',
        why: volTxt + ' is a small pour. Bags are easy to source, need no minimum order, and are manageable solo.',
        layout: 'bags',
        bags20: bags20,
        truck: truck,
        order: bagsTxt,
        alt: mixAlt,
        altPlain: mixTxt
      };
    }
    if (total <= 1.2) {
      return {
        tone: 'either',
        title: 'Bags or ready-mix',
        why: volTxt + ' sits in the crossover zone. Compare local bag vs ready-mix truck pricing before you order.',
        layout: 'either',
        bags20: bags20,
        truck: truck,
        order: bagsTxt,
        alt: mixAlt,
        altPlain: mixTxt
      };
    }
    return {
      tone: 'truck',
      title: 'Ready-mix truck',
      why: volTxt + ' is too large for bags to be practical. Ready-mix is faster and cheaper per m³ at this volume.',
      layout: 'truck',
      bags20: bags20,
      truck: truck,
      order: mixTxt,
      alt: bagsAlt,
      altPlain: bagsTxt
    };
  }

  function qtyRow(bags20) {
    return (
      '<div class="qty-row">' +
      '<span class="qty-cell__n">' + bags20 + '</span>' +
      '<span class="qty-cell__u">× 20 kg bags</span>' +
      '</div>'
    );
  }

  function mixPrimary(val) {
    return (
      '<div class="mix-primary">' +
      '<span class="mix-primary__n">' + val + ' m³</span>' +
      '<span class="mix-primary__u">ready-mix</span>' +
      '</div>'
    );
  }

  function renderRec(total) {
    var card = document.getElementById('recCard');
    var body = document.getElementById('recBody');
    var altWrap = document.getElementById('recAlt');
    var altText = card ? card.querySelector('[data-rec-alt]') : null;
    var plan = recommend(total);
    if (!card || !body || !plan) return;
    card.setAttribute('data-tone', plan.tone);
    var title = card.querySelector('[data-rec-title]');
    var why = card.querySelector('[data-rec-why]');
    if (title) title.textContent = plan.title;
    if (why) why.textContent = plan.why;

    if (plan.layout === 'truck') {
      body.innerHTML = mixPrimary(plan.truck.toFixed(1));
    } else {
      body.innerHTML = qtyRow(plan.bags20);
    }

    if (altWrap && altText && plan.alt) {
      altWrap.hidden = false;
      altText.innerHTML = plan.alt;
    } else if (altWrap) {
      altWrap.hidden = true;
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
      area = v.W * run * qty;
      edge = 2 * (v.W + run) * qty;
    } else if (st.shape === 'gutter') {
      edge = 2 * v.L * qty;
    }
    return {
      mesh: area ? Math.ceil(area / 14.4) : 0,
      edge: edge,
      weight: total * 2.4
    };
  }

  function specRows() {
    var v = volume();
    var sh = SHAPES[st.shape];
    var rows = [{ k: 'Shape', v: sh.label }];
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
    rows.push({ k: 'Volume', v: v.total.toFixed(3) + ' m³' });
    var plan = recommend(v.total);
    if (plan) {
      rows.push({ gap: true });
      rows.push({ k: 'Order', v: plan.order });
      rows.push({ k: 'Alternative', v: plan.altPlain });
    }
    if (v.total > 0) {
      var extras = jobExtras(v.total);
      rows.push({ gap: true });
      rows.push({ head: 'Quantities' });
      rows.push({
        k: 'Mesh',
        v: extras.mesh === 1 ? '1 sheet' : extras.mesh + ' sheets'
      });
      rows.push({ k: 'Formwork', v: extras.edge.toFixed(1) + ' m' });
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
    var lines = ['Spec Sheet by SlabSet', specDate(), ''];
    var keyW = 14;
    specRows().forEach(function (r) {
      if (r.gap) {
        lines.push('');
        return;
      }
      if (r.head) {
        lines.push(String(r.head).toUpperCase());
        return;
      }
      var key = r.k || '';
      while (key.length < keyW) key += ' ';
      lines.push(key + '  ' + r.v);
    });
    while (lines.length && lines[lines.length - 1] === '') lines.pop();
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
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        schema: DRAFT_SCHEMA,
        shape: st.shape,
        waste: st.waste,
        qty: st.qty,
        step: st.step,
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
      // Hidden from picker — calc kept in SHAPES for later.
      if (d.shape === 'gutter' || d.shape === 'footing') d.shape = 'slab';
      if (!SHAPES[d.shape]) return;
      st.shape = d.shape;
      st.waste = [0, 5, 10, 15, 20].indexOf(d.waste) >= 0 ? d.waste : 10;
      if (d.qty != null) st.qty = clampQty(parseFloat(d.qty));
      if (d.step === 'measure' || d.step === 'results') st.step = d.step;
      if (d.vals) {
        Object.keys(st.vals).forEach(function (k) {
          if (typeof d.vals[k] === 'string' || typeof d.vals[k] === 'number') {
            st.vals[k] = String(d.vals[k]);
          }
        });
        if (d.vals.Q != null && d.qty == null) {
          st.qty = clampQty(parseFloat(d.vals.Q));
        }
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
    if (field) field.hidden = !show;
    if (input && document.activeElement !== input) input.value = String(q);
  }

  function syncShapeUi() {
    document.querySelectorAll('#shapeGrid [data-shape]').forEach(function (btn) {
      var on = btn.getAttribute('data-shape') === st.shape;
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    var hint = document.getElementById('dimsHint');
    if (hint) {
      var text = SHAPE_HINTS[st.shape] || '';
      hint.textContent = text;
      hint.hidden = !text;
    }
  }

  function validateField(key) {
    var sh = SHAPES[st.shape];
    var fdef = sh.fields.filter(function (f) { return f.k === key; })[0];
    if (!fdef) return;
    var field = document.querySelector('.field[data-key="' + key + '"]');
    if (!field) return;
    var wrap = field.closest('.field-wrap') || field;
    var warnEl = wrap.querySelector('.field__warn');
    var fixEl = wrap.querySelector('.field__fix');
    var thinEl = wrap.querySelector('.field__thin');
    var raw = effectiveRaw(key);
    var val = parseFloat(raw) || 0;
    var bad = !!(fdef.max && val > fdef.max);
    var suggested = '';
    var fixUnit = fdef.unit || '';
    if (bad && fdef.mm && val >= 1000 && val % 10 === 0) {
      suggested = String(val / 10);
      fixUnit = 'mm';
    } else if (bad && !fdef.mm && fdef.unit === 'm' && val >= 100) {
      suggested = String(+(val / 1000).toFixed(3));
      fixUnit = 'm';
    }
    field.classList.toggle('warn', bad);
    if (warnEl) {
      warnEl.textContent = bad
        ? (suggested ? 'That looks unusually large.' : 'That looks unusually large. Check the units.')
        : '';
    }
    if (fixEl) {
      fixEl.hidden = !suggested;
      fixEl.textContent = suggested ? 'Use ' + suggested + ' ' + fixUnit : '';
      fixEl.setAttribute('data-fix-value', suggested);
      fixEl.setAttribute('data-fix-key', key);
    }
    if (thinEl) {
      var thin = !!(fdef.mm && val > 0 && val < THIN_MM && !bad);
      thinEl.hidden = !thin;
      thinEl.textContent = thin ? 'Looks thin — check units' : '';
    }
  }

  function validateAllFields() {
    SHAPES[st.shape].fields.forEach(function (f) { validateField(f.k); });
  }

  function applyFix(btn) {
    var key = btn.getAttribute('data-fix-key');
    var value = btn.getAttribute('data-fix-value');
    if (!key || !value) return;
    st.vals[key] = value;
    var input = document.querySelector('input[data-key="' + key + '"]');
    if (input) {
      input.value = value;
      input.focus();
    }
    saveDraft();
    validateField(key);
    bumpLive();
  }

  function bumpLive() {
    var v = volume();
    var ready = complete();
    var calc = document.getElementById('btnCalc');
    if (calc) calc.disabled = !ready;
    syncDock(v, ready);
    validateAllFields();
  }

  function setStep(step) {
    if (step === 'results' && !complete()) {
      toast('Enter dimensions first');
      return;
    }
    st.step = step;
    saveDraft();
    render();
  }

  function renderFields() {
    var box = document.getElementById('fields');
    if (!box) return;
    var html = '';
    SHAPES[st.shape].fields.forEach(function (f) {
      var val = displayVal(f);
      var isDef = defaultValueShown(f.k);
      html +=
        '<div class="field-wrap">' +
        '<label class="field' + (isDef ? ' is-default' : '') + '" data-key="' + f.k + '">' +
        '<span class="field__lab">' + f.lab + '</span>' +
        '<input class="field__input" type="text" inputmode="decimal" enterkeyhint="next" ' +
        'autocomplete="off" spellcheck="false" data-key="' + f.k + '" value="' +
        String(val).replace(/"/g, '&quot;') + '" placeholder="0" aria-label="' +
        f.lab + (f.unit ? (' in ' + f.unit) : '') + '">' +
        '<span class="field__unit">' + (f.unit || '') + '</span>' +
        '</label>' +
        '<span class="field__warn" aria-live="polite"></span>' +
        '<button type="button" class="field__fix" hidden></button>' +
        '<span class="field__thin" hidden></span>' +
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
      if (r.head) return '<div class="spec__head">' + r.head + '</div>';
      return (
        '<div class="spec__row">' +
        '<span class="spec__k">' + (r.k || '') + '</span>' +
        '<span class="spec__v">' + r.v + '</span>' +
        '</div>'
      );
    }).join('');
  }

  function syncDock(v, ready) {
    var volEl = document.querySelector('[data-dock-vol]');
    var unitEl = document.querySelector('[data-dock-unit]');
    var hint = document.getElementById('dockHint');
    if (ready) {
      if (volEl) volEl.textContent = v.total.toFixed(3);
      if (unitEl) unitEl.textContent = 'm³ (includes +' + st.waste + '% waste)';
      if (hint) {
        hint.hidden = true;
        hint.textContent = '';
      }
    } else {
      if (volEl) volEl.textContent = '—';
      if (unitEl) unitEl.textContent = guidanceText() || 'Enter dimensions';
      if (hint) {
        var g = guidanceText();
        hint.hidden = !g;
        hint.textContent = g;
      }
    }
  }

  function copySpec() {
    var text = specText();
    if (!complete()) { toast('Enter dimensions first'); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        toast('Spec sheet copied');
      }).catch(function () { toast('Copy failed'); });
    } else {
      toast('Copy unavailable');
    }
  }

  function shareSpec() {
    if (!complete()) { toast('Enter dimensions first'); return; }
    var text = specText();
    if (navigator.share) {
      navigator.share({ title: 'Spec Sheet by SlabSet', text: text }).catch(function () {});
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        toast('Copied — paste into Messages or Notes');
      }).catch(function () { toast('Share unavailable'); });
      return;
    }
    toast('Share unavailable');
  }

  function render() {
    var measure = st.step === 'measure';
    document.getElementById('panelMeasure').hidden = !measure;
    document.getElementById('panelResults').hidden = measure;
    document.getElementById('dockMeasure').hidden = !measure;

    document.querySelectorAll('.steps__btn').forEach(function (btn) {
      var on = btn.getAttribute('data-step') === st.step;
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    document.querySelectorAll('.waste__btn[data-waste]').forEach(function (btn) {
      var w = parseInt(btn.getAttribute('data-waste'), 10);
      btn.classList.toggle('is-on', w === st.waste);
    });

    syncShapeUi();
    syncQtyUi();
    if (measure) renderFields();

    var v = volume();
    var ready = complete();
    var calc = document.getElementById('btnCalc');
    if (calc) calc.disabled = !ready;
    syncDock(v, ready);

    if (!measure) {
      document.querySelectorAll('[data-total]').forEach(function (el) {
        el.textContent = v.total.toFixed(3);
      });
      document.querySelectorAll('[data-waste-lab]').forEach(function (el) {
        el.textContent = 'm³ (includes +' + st.waste + '% waste)';
      });
      renderRec(v.total);
      renderSpec();
    }
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
    var shape = e.target.closest('.shape[data-shape]');
    if (shape) {
      st.shape = shape.getAttribute('data-shape');
      saveDraft();
      render();
      return;
    }
    var waste = e.target.closest('.waste__btn[data-waste]');
    if (waste) {
      st.waste = parseInt(waste.getAttribute('data-waste'), 10);
      saveDraft();
      render();
      return;
    }
    var fix = e.target.closest('.field__fix');
    if (fix) {
      applyFix(fix);
      return;
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
      try { sessionStorage.setItem('slabset-v11-install-dismiss', '1'); } catch (err) {}
    }
  });

  function isMeasureInput(el) {
    return !!(el && (el.id === 'qtyInput' || el.classList.contains('field__input')));
  }

  document.addEventListener('focusin', function (e) {
    if (!isMeasureInput(e.target)) return;
    var el = e.target;
    requestAnimationFrame(function () {
      el.select();
    });
  });

  // Click would otherwise collapse the selection after focus.
  document.addEventListener('mouseup', function (e) {
    if (!isMeasureInput(e.target)) return;
    e.preventDefault();
  });

  document.addEventListener('input', function (e) {
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
    st.vals[key] = input.value;
    var wrap = input.closest('.field');
    if (wrap) wrap.classList.toggle('is-default', defaultValueShown(key));
    saveDraft();
    bumpLive();
  });

  document.addEventListener('change', function (e) {
    if (e.target.id !== 'qtyInput') return;
    st.qty = clampQty(parseInt(e.target.value, 10) || QTY_MIN);
    saveDraft();
    syncQtyUi();
    bumpLive();
  });

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredInstall = e;
    try {
      if (sessionStorage.getItem('slabset-v11-install-dismiss')) return;
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
      if (shape === 'gutter' || shape === 'footing') shape = 'slab';
      if (shape && SHAPES[shape]) {
        st.shape = shape;
        st.step = 'measure';
        saveDraft();
      }
    } catch (e) {}
  }

  loadDraft();
  applyShapeFromUrl();
  syncThemeBtn();
  render();
})();
