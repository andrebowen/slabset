(function () {
  'use strict';

  // Static markup ships in the HTML (see build.py) — this script hydrates it.
  // SHAPES/ICONS below must stay in sync with build.py.

  // fields: [key, label, unit, softMax] — softMax triggers an inline warning, not a hard block.
  // Length/Width are entered in metres; thickness/depth/diameter/rise/going stay in millimetres.
  var SHAPES = {
    slab: {
      fields: [['L', 'Length', 'm', 30], ['W', 'Width', 'm', 30], ['T', 'Thickness', 'mm', 1000], ['Q', 'Quantity', '', 0]],
      vol: function (v) { return v.L * v.W * (v.T / 1000) * v.Q; }
    },
    footing: {
      fields: [['L', 'Total run', 'm', 30], ['W', 'Width', 'm', 2], ['D', 'Depth', 'mm', 2000], ['Q', 'Quantity', '', 0]],
      vol: function (v) { return v.L * v.W * (v.D / 1000) * v.Q; }
    },
    pierfooting: {
      fields: [['PL', 'Length', 'mm', 3000], ['PW', 'Width', 'mm', 3000], ['PD', 'Depth', 'mm', 2000], ['Q', 'Quantity', '', 0]],
      vol: function (v) { return (v.PL / 1000) * (v.PW / 1000) * (v.PD / 1000) * v.Q; }
    },
    column: {
      fields: [['DIA', 'Diameter', 'mm', 3000], ['H', 'Height', 'mm', 10000], ['Q', 'Quantity', '', 0]],
      vol: function (v) { return Math.PI * Math.pow(v.DIA / 1000 / 2, 2) * (v.H / 1000) * v.Q; }
    },
    round: {
      fields: [['DIA', 'Diameter', 'm', 10], ['T', 'Thickness', 'mm', 1000], ['Q', 'Quantity', '', 0]],
      vol: function (v) { return Math.PI * Math.pow(v.DIA / 2, 2) * (v.T / 1000) * v.Q; }
    },
    stairs: {
      fields: [['W', 'Width', 'm', 3], ['R', 'Rise', 'mm', 300], ['G', 'Going', 'mm', 500], ['N', 'Steps', '', 60], ['BT', 'Base thickness (optional)', 'mm', 300]],
      vol: function (v) {
        var wedge = v.W * (v.G / 1000) * (v.R / 1000) * (v.N * (v.N + 1) / 2);
        var base = v.W * (v.G / 1000 * v.N) * (v.BT / 1000);
        return wedge + base;
      }
    }
  };

  var SHAPE_NAMES = { slab: 'Slab', footing: 'Strip footing', pierfooting: 'Pier footing', column: 'Column', round: 'Round pad', stairs: 'Stairs' };
  var FIELD_DEFAULTS = {};
  var UNIT_HINTS = {
    slab: 'Length & width in metres · thickness in mm',
    footing: 'Run & width in metres · depth in mm',
    pierfooting: 'Length, width & depth in millimetres',
    column: 'Diameter & height in millimetres',
    round: 'Diameter in metres · thickness in mm',
    stairs: 'Width in metres · rise & going in mm'
  };

  // Indicative Australian rate bands for Job sheet / LCD order options.
  // Ops: revisit every quarter (or sooner if bags/ready-mix move sharply); update asOf when you do.
  var RATES = {
    mixLow: 220,
    mixHigh: 320,
    bagLow: 7,
    bagHigh: 10,
    asOf: '13 Jul 2026',
    cadence: 'quarterly'
  };
  var RATE_MIX_LOW = RATES.mixLow, RATE_MIX_HIGH = RATES.mixHigh;
  var RATE_BAG_LOW = RATES.bagLow, RATE_BAG_HIGH = RATES.bagHigh;
  var DRAFT_KEY = 'slabset-draft';

  var ICONS = {
    slab: '<svg class="ico" viewBox="0 0 32 32"><polygon class="f" points="16,8 27,14.4 16,20.7 5,14.4"/><polygon class="s" points="5,14.4 16,20.7 16,23.7 5,17.4"/><polygon class="s" points="16,20.7 27,14.4 27,17.4 16,23.7"/></svg>',
    footing: '<svg class="ico" viewBox="0 0 32 32"><polygon class="f" points="14.3,8 25.5,14.5 22.9,16 14.3,11 5.6,16 3,14.5"/><polygon class="s" points="14.3,11 25.5,17.5 22.9,19 14.3,14 5.6,19 3,17.5"/><polygon class="s" points="25.5,14.5 22.9,16 22.9,19 25.5,17.5"/><polygon class="s" points="5.6,16 3,14.5 3,17.5 5.6,19"/></svg>',
    pierfooting: '<svg class="ico" viewBox="0 0 32 32"><polygon class="f" points="16,6 24,10.6 16,15.2 8,10.6"/><polygon class="s" points="8,10.6 16,15.2 16,29.2 8,24.6"/><polygon class="s" points="16,15.2 24,10.6 24,24.6 16,29.2"/></svg>',
    column: '<svg class="ico" viewBox="0 0 32 32"><ellipse class="f" cx="16" cy="8" rx="6" ry="3.46"/><path class="s" d="M10 8v15a6 3.46 0 0 0 12 0V8"/></svg>',
    round: '<svg class="ico" viewBox="0 0 32 32"><ellipse class="f" cx="16" cy="13" rx="12.5" ry="7.22"/><path class="s" d="M3.5 13v4a12.5 7.22 0 0 0 25 0v-4"/></svg>',
    stairs: '<svg class="ico" viewBox="0 0 32 32"><path class="s" d="M11 24v-5h6v-5h6v-5h6v15z"/></svg>'
  };

  var root = document.getElementById('app');
  var initShape = document.body.getAttribute('data-shape');
  if (!SHAPES[initShape]) initShape = 'slab';
  // Landing pages lock shape; index.html can restore the last draft shape.
  var shapeLocked = /calculator\.html$/.test(location.pathname);
  var st = { shape: initShape, active: SHAPES[initShape].fields[0][0], vals: { L: '', W: '', T: '', D: '', PL: '', PW: '', PD: '', DIA: '', H: '', R: '', G: '', N: '', Q: '1', BT: '0', WASTE: '10' } };
  var lastSpecPlain = '';
  var lastVolValue = null;
  var deferredInstall = null;
  var trackedComplete = false;
  var printRestoreTimer = null;

  function track(name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
  }

  function $all(sel) { return [].slice.call(root.querySelectorAll(sel)); }
  function setText(sel, val) { $all(sel).forEach(function (e) { e.textContent = val; }); }

  function setThemeColor(dark) {
    var color = dark ? '#16181A' : '#F0F2EA';
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) {
      m.setAttribute('content', color);
    });
  }

  function setMode(spec) {
    root.classList.toggle('mode-spec', spec);
    document.getElementById('modeToggle').classList.toggle('is-spec', spec);
    document.getElementById('modeToggle').setAttribute('aria-pressed', spec ? 'false' : 'true');
    if (spec) {
      document.getElementById('viewSpec').scrollTop = 0;
      track('spec_view', { shape: st.shape });
    }
    syncInstallBanner();
    saveDraft();
  }

  function fieldKeys() {
    return SHAPES[st.shape].fields.map(function (f) { return f[0]; });
  }

  function fieldDefault(key) {
    return (FIELD_DEFAULTS[st.shape] && FIELD_DEFAULTS[st.shape][key]) || '';
  }

  function rawComplete(key) {
    var raw = st.vals[key];
    return !!(raw && raw !== '0' && raw !== '.');
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

  function parseVals() {
    var sh = SHAPES[st.shape];
    var v = {};
    sh.fields.forEach(function (f) { v[f[0]] = parseFloat(effectiveRaw(f[0])) || 0; });
    return v;
  }

  function allComplete() {
    return SHAPES[st.shape].fields.every(function (f) {
      if (f[0] === 'BT') return true; // optional: 0 is a valid "no base slab" value
      return rawComplete(f[0]) || !!fieldDefault(f[0]);
    });
  }

  function missingFields() {
    return SHAPES[st.shape].fields.filter(function (f) {
      return f[0] !== 'BT' && !rawComplete(f[0]) && !fieldDefault(f[0]);
    });
  }

  function guidanceText(total) {
    if (total) return '';
    var missing = missingFields();
    if (!missing.length) return 'Enter dimensions to calculate.';
    if (missing.length === 1) return 'Enter ' + missing[0][1].toLowerCase() + ' to calculate.';
    return 'Enter ' + missing.slice(0, -1).map(function (f) { return f[1].toLowerCase(); }).join(', ') + ' and ' + missing[missing.length - 1][1].toLowerCase() + ' to calculate.';
  }

  function ratesNote(confirmHint) {
    var bands = 'bags $' + RATES.bagLow + '–$' + RATES.bagHigh + ' each, ready-mix $' + RATES.mixLow + '–$' + RATES.mixHigh + ' per m³';
    return 'Guide only. Not a supplier quote. Typical Australian prices: ' + bands +
      ' (ex delivery, pump and waiting). Reviewed ' + RATES.cadence + ' · last checked ' + RATES.asOf + '. ' + confirmHint;
  }

  function orderPlan(total, bags20, premix) {
    if (!total) return null;
    var mixCost = costRange(premix, RATE_MIX_LOW, RATE_MIX_HIGH);
    var bagCost = costRange(bags20, RATE_BAG_LOW, RATE_BAG_HIGH);
    if (total < 0.5) {
      return {
        recTitle: bags20 + ' × 20 kg bags',
        recPrice: bagCost,
        recWhy: 'Usually the cheapest landed cost at this size: no truck booking, no minimum load, no short-load fee.',
        altTitle: premix.toFixed(1) + ' m³ ready-mix',
        altPrice: mixCost + ' + delivery + fees',
        altWhy: 'Under 0.5 m³ the delivery and short-load fees usually push the total cost above bags',
        note: ratesNote('Confirm mix grade before ordering.')
      };
    }
    if (total < 1.2) {
      return {
        recTitle: premix.toFixed(1) + ' m³ ready-mix',
        recPrice: mixCost,
        recWhy: 'Less mixing and lifting. Ask for mini-mix if access is tight or the load is small.',
        altTitle: bags20 + ' × 20 kg bags',
        altPrice: bagCost,
        altWhy: 'Works if truck access is poor, but it is slower and physically harder.',
        note: ratesNote('Confirm minimum load, delivery and mix specification.')
      };
    }
    return {
      recTitle: premix.toFixed(1) + ' m³ ready-mix',
      recPrice: mixCost,
      recWhy: 'Best fit for this volume: far less labour than mixing bags and easier to pour consistently.',
      altTitle: bags20 + ' × 20 kg bags',
      altPrice: bagCost,
      altWhy: 'Only practical if truck access is impossible or the pour can be staged.',
      note: ratesNote('Confirm truck access and mix specification.')
    };
  }

  function buildPlainSpec(opts) {
    return [
      'JOB SHEET · SlabSet',
      '',
    ].concat(opts.job ? ['JOB: ' + opts.job, ''] : []).concat([
      'SHAPE: ' + SHAPE_NAMES[st.shape],
    ]).concat(opts.dimLines).concat([
      'Subtotal: ' + opts.base.toFixed(2) + ' m³',
      'Wastage: +' + opts.w + '%',
      'Total: ' + opts.total.toFixed(2) + ' m³',
      '',
      'Ordering Options:',
      opts.bags20 + ' × 20 kg Bags',
      opts.bags30 + ' × 30 kg Bags',
      opts.premix.toFixed(1) + ' m³ Premix',
      '',
      'Reinforcing mesh: ' + opts.mesh + ' sheets',
      'Formwork edge: ' + opts.edge.toFixed(1) + ' m',
      'Concrete weight: ' + opts.weight.toFixed(2) + ' t',
      '',
      opts.working,
      '',
      'Estimates only. Not a supplier quote. Confirm quantities and prices before ordering.'
    ]).join('\n');
  }

  function saveDraft() {
    try {
      var jobEl = document.getElementById('jobDesc');
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
        shape: st.shape,
        vals: st.vals,
        job: jobEl ? jobEl.value : '',
        mode: root.classList.contains('mode-spec') ? 'spec' : 'field'
      }));
    } catch (e) {}
  }

  function loadDraft() {
    try {
      var raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      var draft = JSON.parse(raw);
      if (!draft || !draft.vals) return;
      if (!shapeLocked && draft.shape && SHAPES[draft.shape]) st.shape = draft.shape;
      Object.keys(draft.vals).forEach(function (k) {
        if (Object.prototype.hasOwnProperty.call(st.vals, k)) st.vals[k] = draft.vals[k];
      });
      st.active = SHAPES[st.shape].fields[0][0];
      var jobEl = document.getElementById('jobDesc');
      if (jobEl && typeof draft.job === 'string') jobEl.value = draft.job;
    } catch (e) {}
  }

  function focusField(key, select) {
    var input = root.querySelector('input[data-key="' + key + '"]');
    if (!input) return;
    setTimeout(function () {
      input.focus();
      if (select) input.select();
      try {
        input.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
      } catch (err) {
        input.scrollIntoView(true);
      }
    }, 0);
  }

  function focusFirstEmpty() {
    var missing = missingFields();
    var key = missing.length ? missing[0][0] : SHAPES[st.shape].fields[0][0];
    focusField(key);
  }

  function flashUnits() {
    $all('.fld .unit').forEach(function (el) {
      el.classList.remove('unit-flash');
      void el.offsetWidth;
      el.classList.add('unit-flash');
    });
    var hint = UNIT_HINTS[st.shape];
    if (hint) showToast(hint);
  }

  function updateOutputs() {
    var sh = SHAPES[st.shape];
    var w = parseFloat(st.vals.WASTE) || 0;

    var ir = '';
    sh.fields.forEach(function (f) {
      var k = f[0];
      var val = st.vals[k] || '';
      var unit = f[2] ? (' ' + f[2]) : '';
      var empty = !(val && val !== '0' && val !== '.');
      var shown = (empty ? '0' : val) + unit;
      ir += '<button type="button" class="sp-row sp-row--edit" data-edit-field="' + k + '"><span class="k">' + f[1] + '</span><span class="v">' + shown + '</span></button>';
    });
    var irEl = root.querySelector('[data-input-rows]');
    if (irEl) irEl.innerHTML = ir;

    var pickEl = document.getElementById('shapePick');
    if (pickEl) {
      pickEl.innerHTML = ICONS[st.shape]
        + '<span class="shape-pick__name">' + SHAPE_NAMES[st.shape] + '</span>';
    }

    $all('.menu-item[data-shape]').forEach(function (it) {
      var on = it.getAttribute('data-shape') === st.shape;
      it.classList.toggle('on', on);
      it.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    setText('[data-wcur]', w + '%');
    $all('.menu-item[data-waste]').forEach(function (it) {
      var on = +it.getAttribute('data-waste') === w;
      it.classList.toggle('on', on);
      it.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    sh.fields.forEach(function (f) {
      var row = root.querySelector('.fld[data-field="' + f[0] + '"]');
      if (row) row.classList.toggle('is-default', defaultValueShown(f[0]));
    });

    var v = parseVals();
    var base = allComplete() ? sh.vol(v) : 0;
    var total = base * (1 + w / 100);
    var bags20 = total ? Math.ceil(total / 0.0098) : 0;
    var bags30 = total ? Math.ceil(total / (0.0098 * 1.5)) : 0;
    var premix = total ? Math.ceil(total * 10) / 10 : 0;

    var specOrderBlock = root.querySelector('.sp-order-block');
    if (specOrderBlock) specOrderBlock.classList.toggle('is-empty', !total);

    var area = 0;
    var edge = 0;
    if (st.shape === 'slab' || st.shape === 'footing') {
      area = v.L * v.W * v.Q;
      edge = 2 * (v.L + v.W) * v.Q;
    } else if (st.shape === 'pierfooting') {
      area = (v.PL / 1000) * (v.PW / 1000) * v.Q;
      edge = 2 * (v.PL / 1000 + v.PW / 1000) * v.Q;
    } else if (st.shape === 'round') {
      var r = v.DIA / 2;
      area = Math.PI * r * r * v.Q;
      edge = Math.PI * v.DIA * v.Q;
    } else if (st.shape === 'column') {
      edge = Math.PI * v.DIA / 1000 * v.Q;
    }
    var mesh = area ? Math.ceil(area / 14.4) : 0;

    setText('[data-vol]', total ? total.toFixed(2) : '0.00');
    setText('[data-order-vol]', total ? total.toFixed(2) : '0.00');
    setText('[data-base-vol]', base ? base.toFixed(2) : '0.00');
    var volEl = root.querySelector('.out .ov');
    if (volEl && total !== lastVolValue) {
      lastVolValue = total;
      volEl.classList.remove('pulse');
      void volEl.offsetWidth;
      volEl.classList.add('pulse');
    }
    setText('[data-bags]', bags20);
    setText('[data-bags30]', bags30);
    setText('[data-premix]', premix.toFixed(1));
    setText('[data-weight]', (total * 2.4).toFixed(2));
    setText('[data-mesh]', mesh);
    setText('[data-edge]', edge.toFixed(1));
    setText('[data-shape-name]', SHAPE_NAMES[st.shape]);
    setText('[data-waste-label]', '+' + w + '%');
    setText('[data-waste-incl]', w ? 'includes ' + w + '% wastage' : 'no wastage added');
    setText('[data-guidance]', guidanceText(total));
    $all('[data-guidance]').forEach(function (el) { el.hidden = !!total; });
    var plan = orderPlan(total, bags20, premix);
    setText('[data-lcd-recommend]', plan ? plan.recTitle : '');
    setText('[data-lcd-price]', plan ? plan.recPrice : '');
    var outRecommend = document.getElementById('outRecommend');
    if (outRecommend) outRecommend.hidden = !plan;
    $all('[data-order-plan]').forEach(function (el) { el.hidden = !plan; });
    if (plan) {
      setText('[data-plan-rec-title]', plan.recTitle);
      setText('[data-plan-rec-price]', plan.recPrice);
      setText('[data-plan-rec-why]', plan.recWhy);
      setText('[data-plan-alt-title]', plan.altTitle);
      setText('[data-plan-alt-price]', plan.altPrice);
      setText('[data-plan-alt-why]', plan.altWhy);
      setText('[data-plan-note]', plan.note);
    }

    var wf = (1 + w / 100).toFixed(2);
    var work;
    if (st.shape === 'column' || st.shape === 'round') {
      var diaM = st.shape === 'column' ? v.DIA / 1000 : v.DIA;
      work = 'π × (' + diaM.toFixed(3) + ' ÷ 2)² × ' + ((st.shape === 'column' ? v.H : v.T) / 1000).toFixed(3) + ' × ' + v.Q + ' m = ' + base.toFixed(2) + ' m³\n→ × ' + wf + ' wastage = ' + total.toFixed(2) + ' m³';
    } else if (st.shape === 'stairs') {
      var wedgeVol = v.W * (v.G / 1000) * (v.R / 1000) * (v.N * (v.N + 1) / 2);
      work = v.W.toFixed(2) + ' × ' + (v.G / 1000).toFixed(3) + ' × ' + (v.R / 1000).toFixed(3) + ' × ' + v.N + '(' + v.N + '+1)/2 = ' + wedgeVol.toFixed(2) + ' m³';
      if (v.BT) {
        var baseSlabVol = v.W * (v.G / 1000 * v.N) * (v.BT / 1000);
        work += '\n+ base slab ' + v.BT + ' mm = ' + baseSlabVol.toFixed(2) + ' m³';
      }
      work += '\n→ × ' + wf + ' wastage = ' + total.toFixed(2) + ' m³';
    } else {
      work = sh.fields.map(function (f) { return f[0] === 'Q' ? v.Q.toString() : (f[2] === 'mm' ? v[f[0]] / 1000 : v[f[0]]).toFixed(2); }).join(' × ') + ' m = ' + base.toFixed(2) + ' m³\n→ × ' + wf + ' wastage = ' + total.toFixed(2) + ' m³';
    }
    setText('[data-working]', work);

    var cta = document.getElementById('specCta');
    if (cta) {
      cta.classList.toggle('is-ready', !!total);
      cta.textContent = total ? 'View job sheet →' : 'Job sheet';
    }

    if (total) {
      if (!trackedComplete) {
        trackedComplete = true;
        track('calc_complete', { shape: st.shape });
      }
      var dimLines = sh.fields.map(function (f) {
        var raw = effectiveRaw(f[0]) || '0';
        return f[1] + ': ' + raw + (f[2] ? ' ' + f[2] : '');
      });
      lastSpecPlain = buildPlainSpec({
        w: w,
        base: base,
        total: total,
        bags20: bags20,
        bags30: bags30,
        premix: premix,
        dimLines: dimLines,
        mesh: mesh,
        edge: edge,
        weight: total * 2.4,
        working: work,
        job: (document.getElementById('jobDesc') || {}).value || ''
      });
    } else {
      lastSpecPlain = '';
    }
    saveDraft();
  }

  function validateField(key) {
    var sh = SHAPES[st.shape];
    var fdef = sh.fields.filter(function (f) { return f[0] === key; })[0];
    if (!fdef) return;
    var max = fdef[3];
    var label = root.querySelector('.fld[data-field="' + key + '"]');
    if (!label) return;
    var warnEl = label.querySelector('.fld-warn');
    var fixEl = label.querySelector('.fld-fix');
    var val = parseFloat(st.vals[key]) || 0;
    var bad = !!(max && val > max);
    var suggested = '';
    if (bad && fdef[2] === 'mm' && val >= 1000 && val % 10 === 0) suggested = String(val / 10);
    label.classList.toggle('warn', bad);
    if (warnEl) warnEl.textContent = bad ? (suggested ? 'That looks unusually large.' : 'That looks unusually large. Check the units.') : '';
    if (fixEl) {
      fixEl.hidden = !suggested;
      fixEl.textContent = suggested ? 'Use ' + suggested + ' mm' : '';
      fixEl.setAttribute('data-fix-value', suggested);
    }
  }

  function costRange(qty, low, high) {
    if (!qty) return 'N/A';
    return '$' + Math.round(qty * low).toLocaleString() + ' to $' + Math.round(qty * high).toLocaleString();
  }

  function unitPhrase(u) {
    if (u === 'mm') return ' in millimetres';
    if (u === 'm') return ' in metres';
    return '';
  }

  function updateFields() {
    var sh = SHAPES[st.shape];
    if (fieldKeys().indexOf(st.active) < 0) st.active = sh.fields[0][0];

    var keys = fieldKeys();
    var fh = '';
    sh.fields.forEach(function (f, i) {
      var k = f[0];
      var val = st.vals[k] || '';
      var def = fieldDefault(k);
      var ph = k === 'BT' ? '0 = none' : (def || '0');
      var hint = (i === keys.length - 1 || k === 'BT') ? 'done' : 'next';
      fh += '<div class="fld" data-field="' + k + '">'
        + '<label class="tl" for="fld-' + k + '">' + f[1] + '</label>'
        + '<input class="fld-input" type="text" inputmode="decimal" enterkeyhint="' + hint + '" autocomplete="off" spellcheck="false" id="fld-' + k + '" data-key="' + k + '" value="' + val + '" placeholder="' + ph + '" aria-label="' + f[1] + unitPhrase(f[2]) + '">'
        + '<span class="unit">' + (f[2] || '') + '</span>'
        + '<span class="fld-warn" aria-live="polite"></span>'
        + '<button type="button" class="fld-fix" data-fix-key="' + k + '" hidden></button></div>';
    });
    document.getElementById('flds').innerHTML = fh;
    sh.fields.forEach(function (f) {
      var row = root.querySelector('.fld[data-field="' + f[0] + '"]');
      if (row) row.classList.toggle('is-default', defaultValueShown(f[0]));
    });
    sh.fields.forEach(function (f) { validateField(f[0]); });
    updateOutputs();
  }

  function applyFix(btn) {
    var key = btn.getAttribute('data-fix-key');
    var value = btn.getAttribute('data-fix-value');
    if (!key || !value) return;
    st.vals[key] = value;
    st.active = key;
    var input = root.querySelector('input[data-key="' + key + '"]');
    if (input) {
      input.value = value;
      input.focus();
    }
    validateField(key);
    updateOutputs();
    track('unit_fix_apply', { shape: st.shape, field: key });
  }

  function render() {
    updateFields();
  }

  function closeMenus(returnFocus) {
    $all('.shape-menu.open').forEach(function (m) {
      m.classList.remove('open');
      var b = m.querySelector('[data-menu-btn]');
      if (b) {
        b.setAttribute('aria-expanded', 'false');
        if (returnFocus) b.focus();
      }
    });
  }

  function handleMenuInteraction(e) {
    var b = e.target.closest('button[data-menu-btn], button[data-shape], button[data-waste]');
    if (!b) return false;
    if (b.hasAttribute('data-menu-btn')) {
      var menu = b.closest('.shape-menu');
      var open = menu.classList.contains('open');
      closeMenus();
      if (!open) {
        menu.classList.add('open');
        b.setAttribute('aria-expanded', 'true');
        var onItem = menu.querySelector('.menu-item.on') || menu.querySelector('.menu-item');
        if (onItem) onItem.focus();
      }
      return true;
    }
    if (b.hasAttribute('data-shape')) {
      var nextShape = b.getAttribute('data-shape');
      var changed = nextShape !== st.shape;
      st.shape = nextShape;
      st.active = SHAPES[st.shape].fields[0][0];
      closeMenus();
      track('shape_select', { shape: st.shape });
      render();
      if (changed) flashUnits();
      focusFirstEmpty();
      return true;
    }
    if (b.hasAttribute('data-waste')) {
      st.vals.WASTE = b.getAttribute('data-waste');
      closeMenus(true);
      track('waste_select', { value: st.vals.WASTE });
      updateOutputs();
      return true;
    }
    return false;
  }

  function showToast(msg) {
    var toast = document.getElementById('copyToast');
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () { toast.hidden = true; }, 2200);
  }

  function copyFallback(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    showToast(ok ? 'Job copied' : 'Copy failed');
  }

  function copyText(text) {
    if (!text) { showToast('Enter dimensions first'); return; }
    track('copy_spec', { shape: st.shape });
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showToast('Job copied');
      }).catch(function () {
        copyFallback(text);
      });
    } else {
      copyFallback(text);
    }
  }

  function printJob() {
    if (!lastSpecPlain) { showToast('Enter dimensions first'); return; }
    track('save_pdf', { shape: st.shape });
    var sheet = document.getElementById('printSheet');
    if (!sheet) {
      sheet = document.createElement('pre');
      sheet.id = 'printSheet';
      sheet.className = 'print-sheet';
      sheet.setAttribute('aria-hidden', 'true');
      document.body.appendChild(sheet);
    }
    sheet.textContent = lastSpecPlain;
    document.body.classList.add('printing-job');
    var wasDark = root.classList.contains('t4d');
    function restore() {
      document.body.classList.remove('printing-job');
      if (sheet) sheet.textContent = '';
      if (!wasDark) return;
      root.classList.add('t4d');
      root.classList.remove('t4');
      setThemeColor(true);
    }
    if (wasDark) {
      root.classList.remove('t4d');
      root.classList.add('t4');
      setThemeColor(false);
    }
    window.removeEventListener('afterprint', restore);
    window.addEventListener('afterprint', restore);
    clearTimeout(printRestoreTimer);
    printRestoreTimer = setTimeout(restore, 1500);
    window.print();
  }

  function isIos() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
  }

  function initTheme() {
    document.getElementById('themeToggle').addEventListener('click', function () {
      var dark = !root.classList.contains('t4d');
      root.classList.toggle('t4d', dark);
      root.classList.toggle('t4', !dark);
      try { localStorage.setItem('slabset-theme', dark ? 'dark' : 'light'); } catch (e) {}
      setThemeColor(dark);
      track('theme_toggle', { theme: dark ? 'dark' : 'light' });
    });
  }

  var syncInstallBanner = function () {};

  function initPwa() {
    var banner = document.getElementById('installBanner');
    if (!banner) return;
    var copy = banner.querySelector('p');
    var go = document.getElementById('installGo');
    var dismissed = false;
    var wanted = false;
    try { dismissed = !!localStorage.getItem('slabset-install-dismissed'); } catch (err) {}

    syncInstallBanner = function () {
      if (dismissed || isStandalone() || root.classList.contains('mode-spec') || !wanted) {
        banner.hidden = true;
        document.body.classList.remove('has-install-banner');
        return;
      }
      banner.hidden = false;
      document.body.classList.add('has-install-banner');
    };

    function showBanner(mode) {
      if (dismissed || isStandalone()) return;
      wanted = true;
      banner.setAttribute('data-mode', mode);
      if (mode === 'ios') {
        if (copy) copy.textContent = 'Install SlabSet: tap Share, then Add to Home Screen';
        if (go) go.textContent = 'How';
      } else {
        if (copy) copy.textContent = 'Install SlabSet for the best on-site experience';
        if (go) go.textContent = 'Install';
      }
      syncInstallBanner();
      track('pwa_banner_shown', { mode: mode });
    }

    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferredInstall = e;
      showBanner('android');
    });

    if (isIos()) showBanner('ios');

    go.addEventListener('click', function () {
      if (banner.getAttribute('data-mode') === 'ios') {
        showToast('Tap Share → Add to Home Screen');
        track('pwa_ios_how');
        return;
      }
      if (!deferredInstall) return;
      deferredInstall.prompt();
      deferredInstall.userChoice.then(function (choice) {
        track('pwa_install', { outcome: choice && choice.outcome ? choice.outcome : 'unknown' });
        wanted = false;
        syncInstallBanner();
        deferredInstall = null;
      });
    });

    document.getElementById('installDismiss').addEventListener('click', function () {
      dismissed = true;
      wanted = false;
      syncInstallBanner();
      track('pwa_banner_dismissed');
      try { localStorage.setItem('slabset-install-dismissed', '1'); } catch (e) {}
    });
  }

  function initShare() {
    var btn = document.getElementById('btnShare');
    if (!btn || !navigator.share) return;
    btn.hidden = false;
    btn.addEventListener('click', function () {
      if (!lastSpecPlain) { showToast('Enter dimensions first'); return; }
      track('share_spec', { shape: st.shape });
      navigator.share({ title: 'SlabSet job sheet', text: lastSpecPlain, url: location.href }).catch(function (err) {
        if (err && err.name === 'AbortError') return;
        showToast('Share failed');
      });
    });
  }

  function initServiceWorker() {
    var local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
    if (local || location.protocol !== 'https:' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }

  document.getElementById('modeToggle').addEventListener('click', function () {
    var toSpec = !root.classList.contains('mode-spec');
    if (toSpec && !allComplete()) {
      showToast(guidanceText(0));
      return;
    }
    setMode(toSpec);
  });

  document.getElementById('viewField').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (b) {
      if (b.classList.contains('fld-fix')) {
        applyFix(b);
        return;
      }
      if (b.id === 'specCta') {
        if (!b.classList.contains('is-ready')) {
          showToast(guidanceText(0));
          return;
        }
        track('spec_cta_tap', { ready: true, shape: st.shape });
        setMode(true);
        return;
      }
      if (handleMenuInteraction(e)) return;
    }
    var row = e.target.closest('.fld[data-field]');
    if (row) {
      var input = row.querySelector('.fld-input');
      if (input && e.target !== input) input.focus();
      return;
    }
  });

  document.getElementById('viewField').addEventListener('input', function (e) {
    var input = e.target.closest('.fld-input');
    if (!input) return;
    var key = input.getAttribute('data-key');
    var next = input.value.replace(/[^\d.]/g, '');
    if ((next.match(/\./g) || []).length > 1) return;
    if (next.length > 8) next = next.slice(0, 8);
    st.vals[key] = next;
    st.active = key;
    if (input.value !== next) input.value = next;
    validateField(key);
    updateOutputs();
  });

  document.getElementById('viewField').addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    var input = e.target.closest('.fld-input');
    if (!input) return;
    e.preventDefault();
    var keys = fieldKeys();
    var idx = keys.indexOf(input.getAttribute('data-key'));
    if (idx < 0) return;
    if (idx < keys.length - 1) {
      var next = keys[idx + 1];
      // Optional trailing field (stairs base): skip straight to Job when ready
      if (next === 'BT' && allComplete()) {
        setMode(true);
        return;
      }
      focusField(next, true);
      return;
    }
    if (allComplete()) {
      setMode(true);
      return;
    }
    focusFirstEmpty();
  });

  document.getElementById('viewSpec').addEventListener('click', function (e) {
    if (handleMenuInteraction(e)) return;
    var editField = e.target.closest('[data-edit-field]');
    if (editField) {
      var key = editField.getAttribute('data-edit-field');
      setMode(false);
      focusField(key, true);
      return;
    }
    if (e.target.closest('[data-edit]')) setMode(false);
    if (e.target.closest('#btnCopy')) copyText(lastSpecPlain);
    if (e.target.closest('#btnPdf')) printJob();
  });

  document.getElementById('viewSpec').addEventListener('input', function (e) {
    if (e.target.id === 'jobDesc') {
      updateOutputs();
      saveDraft();
    }
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.shape-menu')) closeMenus();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeMenus(true); return; }
    var openMenu = document.querySelector('.shape-menu.open');
    if (!openMenu) return;
    var items = [].slice.call(openMenu.querySelectorAll('.menu-item'));
    if (!items.length) return;
    var idx = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      items[(idx + 1 + items.length) % items.length].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      items[(idx - 1 + items.length) % items.length].focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      items[0].focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      items[items.length - 1].focus();
    }
  });

  loadDraft();
  initTheme();
  initPwa();
  initShare();
  initServiceWorker();
  render();
})();
