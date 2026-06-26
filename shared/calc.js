(function () {
  'use strict';

  var BAG_YIELD_20 = 0.0098;
  var MIN_LOAD = 0.5;
  var MAX_MM = 100000;
  var MAX_QTY = 9999;
  var COST_RANGE_LOW = 0.88;
  var COST_RANGE_HIGH = 1.12;
  var DELIVERY_HIGH = 120;
  var DEFAULT_REGION = 'NSW';
  var REGION_LABEL = 'NSW';

  var STATE = {
    NSW: { premix: 340, bag: 9.5 }, VIC: { premix: 330, bag: 9.5 },
    QLD: { premix: 320, bag: 9.0 }, WA: { premix: 355, bag: 10.5 },
    SA: { premix: 320, bag: 9.0 }, TAS: { premix: 360, bag: 11.0 },
    ACT: { premix: 345, bag: 10.0 }, NT: { premix: 395, bag: 12.0 }
  };

  var WASTE_HINT = {
    0: 'No wastage allowance',
    5: '+5% for tidy forms and minimal spillage',
    10: '+10% for spillage and uneven base (Recommended)',
    15: '+15% for rough ground or hand-dug sites'
  };

  var SHAPE_DESC = {
    slab: 'Flat pad, floor, driveway',
    footing: 'Strip, pad footing, pier',
    cylinder: 'Round column, post hole, pier'
  };

  var SHAPES = {
    slab: {
      keys: ['L', 'W', 'T'],
      labels: function () {
        return [['L', 'Length', 'mm'], ['W', 'Width', 'mm'], ['T', 'Thickness', 'mm']];
      },
      calc: function (d) { return (d.L / 1000) * (d.W / 1000) * (d.T / 1000); },
      area: function (d) { return (d.L / 1000) * (d.W / 1000); },
      reo: 'mesh'
    },
    footing: {
      keys: ['L', 'W', 'T'],
      labels: function () {
        return [['L', 'Length', 'mm'], ['W', 'Width', 'mm'], ['T', 'Depth', 'mm']];
      },
      calc: function (d) { return (d.L / 1000) * (d.W / 1000) * (d.T / 1000); },
      len: function (d) { return d.L / 1000; },
      reo: 'trench'
    },
    cylinder: {
      keys: ['D', 'H'],
      labels: function () {
        return [['D', 'Diameter', 'mm'], ['H', 'Height', 'mm']];
      },
      calc: function (d) {
        return Math.PI * Math.pow((d.D / 1000) / 2, 2) * (d.H / 1000);
      },
      reo: 'none'
    }
  };

  var state = {
    shape: 'slab', waste: 10, basebag: 9.5, premixPrice: 340
  };

  var lastSpecPlain = '';

  function $(id) { return document.getElementById(id); }
  function setText(id, text) { var el = $(id); if (el) el.textContent = text; }
  function fmt(n, dp) {
    if (dp === undefined) dp = 2;
    return n.toLocaleString('en-AU', { minimumFractionDigits: dp, maximumFractionDigits: dp });
  }
  function money(n) { return '$' + Math.round(n).toLocaleString('en-AU'); }
  function moneyRange(low, high) { return money(low) + ' \u2013 ' + money(high); }
  function bagPricePer(kg) { return state.basebag * (kg / 20); }
  function bagEstimate(Vtotal, kg) {
    var bagYield = (kg / 20) * BAG_YIELD_20;
    var bags = Math.ceil(Vtotal / bagYield);
    var price = bagPricePer(kg);
    return { bags: bags, cost: bags * price };
  }
  function priceFmt(n) {
    var dp = Math.abs(n % 1) < 1e-9 ? 0 : 2;
    return '$' + n.toLocaleString('en-AU', { minimumFractionDigits: dp, maximumFractionDigits: 2 });
  }
  function show(el, on) { if (el) el.hidden = !on; }

  function bindSeg(segId, attr, onPick) {
    $(segId).addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      [].forEach.call(this.querySelectorAll('button'), function (x) {
        x.setAttribute('aria-pressed', 'false');
        x.classList.remove('on');
      });
      b.setAttribute('aria-pressed', 'true');
      b.classList.add('on');
      onPick(b.getAttribute(attr));
    });
  }

  function renderDims() {
    var saved = {};
    var qtyEl = $('qty');
    if (qtyEl) saved.qty = qtyEl.value;
    ['L', 'W', 'T', 'D', 'H'].forEach(function (k) {
      var el = $('dim-' + k);
      if (el) saved[k] = el.value;
    });

    var fields = SHAPES[state.shape].labels();
    var html = '';

    fields.forEach(function (f) {
      html +=
        '<label class="infield infield--dim">' +
        '<span class="infield-label">' + f[1] + '</span>' +
        '<span class="infield-row">' +
        '<input id="dim-' + f[0] + '" type="number" inputmode="decimal" min="0" max="' + MAX_MM + '" step="any" autocomplete="off">' +
        '<span class="infield-unit">' + f[2] + '</span>' +
        '</span></label>';
    });

    html +=
      '<label class="infield infield--dim">' +
      '<span class="infield-label">Quantity</span>' +
      '<span class="infield-row">' +
      '<input id="qty" type="number" inputmode="numeric" min="1" max="' + MAX_QTY + '" step="1" value="1">' +
      '<span class="infield-unit">×</span>' +
      '</span></label>';

    $('dimStack').innerHTML = html;

    fields.forEach(function (f) {
      var el = $('dim-' + f[0]);
      if (el && saved[f[0]] !== undefined) el.value = saved[f[0]];
    });
    if ($('qty') && saved.qty !== undefined) $('qty').value = saved.qty;
  }

  function readDims() {
    var spec = SHAPES[state.shape];
    var d = {};
    var missing = false;

    spec.keys.forEach(function (k) {
      var el = $('dim-' + k);
      var v = parseFloat(el && el.value);
      if (isNaN(v) || v <= 0) missing = true;
      else d[k] = Math.min(v, MAX_MM);
    });

    return { d: d, missing: missing };
  }

  function wastageHint() {
    return state.waste
      ? 'Includes +' + state.waste + '% wastage'
      : 'No wastage added';
  }

  function idleHint() {
    if (state.shape === 'cylinder') return 'Enter diameter and height in mm';
    return 'Enter length, width and thickness in mm';
  }

  function lcdOrderLine(qty, suffix) {
    return '<span class="lcd-order__num">' + qty + '</span>' + suffix;
  }

  function lcdOrderRow(qty, suffix, isRec) {
    var html = '<span class="lcd-order__text">' + lcdOrderLine(qty, suffix) + '</span>';
    if (isRec) {
      html += '<span class="lcd-order__rec">Recommended</span>';
    }
    return html;
  }

  function bagOrderSuffix(count) {
    return (count === 1 ? ' bag' : ' bags') + ' \u00D7 20 kg';
  }

  function bagRecDetail(Vtotal) {
    if (Vtotal < MIN_LOAD) {
      return 'At ' + fmt(Vtotal) + ' m\u00B3, bags avoid short-load fees, better for a small DIY pour.';
    }
    return 'At ' + fmt(Vtotal) + ' m\u00B3, bags come out ahead at typical metro prices.';
  }

  function premixRecDetail(Vtotal) {
    return 'At ' + fmt(Vtotal) + ' m\u00B3, ready-mix usually costs less, and you skip hand-mixing bags on site.';
  }

  function supplyVerdict(premixWins, bagsWins, Vtotal) {
    if (premixWins) {
      return {
        title: 'Ready-mix delivery',
        detail: premixRecDetail(Vtotal),
        bagsRec: false,
        premixRec: true
      };
    }
    if (bagsWins) {
      return {
        title: 'Individual bags',
        detail: bagRecDetail(Vtotal),
        bagsRec: true,
        premixRec: false
      };
    }
    return null;
  }

  function setSupplyHighlight(verdict) {
    var bags = $('supplyBags');
    var premix = $('supplyPremix');
    if (bags) bags.classList.remove('is-rec');
    if (premix) premix.classList.remove('is-rec');
  }

  function renderCostRec(verdict) {
    var card = $('costRec');
    if (!card) return;
    if (!verdict) {
      setText('costRecTitle', 'Either supply option works');
      setText('costRecDetail',
        'At these prices, bags and ready-mix are close. Choose what suits your site access and schedule.');
    } else {
      setText('costRecTitle', 'Recommended: ' + verdict.title);
      setText('costRecDetail', verdict.detail);
    }
    card.hidden = false;
  }

  function shapeTitle() {
    if (state.shape === 'cylinder') return 'Column';
    return state.shape.charAt(0).toUpperCase() + state.shape.slice(1);
  }

  function dimSummaryLines() {
    var lines = [];
    function val(id) { var el = $(id); return el && el.value !== '' ? el.value : null; }
    if (state.shape === 'slab') {
      if (val('dim-L')) lines.push(['Length', val('dim-L') + ' mm']);
      if (val('dim-W')) lines.push(['Width', val('dim-W') + ' mm']);
      if (val('dim-T')) lines.push(['Thickness', val('dim-T') + ' mm']);
    } else if (state.shape === 'footing') {
      if (val('dim-L')) lines.push(['Length', val('dim-L') + ' mm']);
      if (val('dim-W')) lines.push(['Width', val('dim-W') + ' mm']);
      if (val('dim-T')) lines.push(['Depth', val('dim-T') + ' mm']);
    } else {
      if (val('dim-D')) lines.push(['Diameter', val('dim-D') + ' mm']);
      if (val('dim-H')) lines.push(['Height', val('dim-H') + ' mm']);
    }
    return lines;
  }

  function formatDimLine(opts) {
    var line = opts.dims.map(function (r) { return r[1]; }).join(' \u00D7 ');
    if (opts.qty > 1) line += ' \u00D7 ' + opts.qty;
    return line;
  }

  function buildSpecText(opts) {
    var wasteNote = opts.wastePct === 0
      ? '(Includes 0% waste factor)'
      : '(Includes ' + opts.wastePct + '% waste factor)';
    var bag20Range = moneyRange(
      opts.bag20Cost * COST_RANGE_LOW, opts.bag20Cost * COST_RANGE_HIGH
    );
    var bag30Range = moneyRange(
      opts.bag30Cost * COST_RANGE_LOW, opts.bag30Cost * COST_RANGE_HIGH
    );
    var premixRange = moneyRange(
      opts.premixCost * COST_RANGE_LOW,
      opts.premixCost * COST_RANGE_HIGH + DELIVERY_HIGH
    );
    var lines = [
      'CONCRETE CALCULATION \u2014 SlabSet',
      '',
      'PROJECT TYPE: ' + shapeTitle(),
      'DIMENSIONS: ' + formatDimLine(opts),
      '',
      'VOLUME REQUIRED:',
      '  Cubic Metres: ' + fmt(opts.Vtotal) + ' m\u00B3',
      '  ' + wasteNote,
      '',
      'BAG QUANTITIES:',
      '  20 kg bags: ' + opts.bags20.toLocaleString('en-AU') + ' bags',
      '  30 kg bags: ' + opts.bags30.toLocaleString('en-AU') + ' bags',
      '',
      'COST ESTIMATE:',
      '  Individual bags (20 kg): ' + bag20Range,
      '  Individual bags (30 kg): ' + bag30Range,
      '  Ready-mix delivery: ' + premixRange
    ];
    if (opts.note) lines.push('', 'NOTE: ' + opts.note);
    lines.push('', 'Estimates only. Confirm quantities and prices with your supplier.');
    return lines.join('\n');
  }

  function renderSpecSheet(opts) {
    var text = buildSpecText(opts);
    var sheet = $('specSheet');
    if (sheet) sheet.textContent = text;
    var copyBtn = $('copySpecsBtn');
    if (copyBtn) {
      copyBtn.disabled = false;
      copyBtn.removeAttribute('title');
    }
    lastSpecPlain = text;
  }

  function copySpecs() {
    if (!lastSpecPlain) return;
    function copied() {
      $('copyToast').textContent = 'Copied to clipboard';
      setTimeout(function () { $('copyToast').textContent = ''; }, 2500);
    }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = lastSpecPlain;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;left:-9999px;top:0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); copied(); }
      catch (e) { $('copyToast').textContent = 'Could not copy'; }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(lastSpecPlain).then(copied).catch(fallback);
    } else fallback();
  }

  function initPrices() {
    var st = STATE[DEFAULT_REGION];
    state.basebag = st.bag;
    state.premixPrice = st.premix;
    var note = $('costNote');
    if (note) {
      note.textContent = 'Estimates use typical metro prices in ' + REGION_LABEL +
        '. Confirm with your local supplier before ordering.';
    }
  }

  function setEmpty() {
    $('lcd').classList.add('is-empty');
    setText('lcdVol', fmt(0));
    setText('lcdHint', idleHint());
    if ($('lcdPin')) $('lcdPin').setAttribute('aria-hidden', 'true');
    if ($('lcdOrder')) $('lcdOrder').setAttribute('aria-hidden', 'true');
    setText('lcdBags20', '—');
    setText('lcdPremix', '—');
    setSupplyHighlight(null);
    var costRec = $('costRec');
    if (costRec) costRec.hidden = true;
    show($('results-section'), false);
    setText('bagsRange', '—');
    setText('bags20Detail', '');
    setText('bags30Detail', '');
    setText('premixRange', '—');
    setText('premixDetail', '');
    if ($('specSheet')) $('specSheet').textContent = '';
    $('copySpecsBtn').disabled = true;
    $('copySpecsBtn').title = 'Enter dimensions to generate a spec sheet';
    lastSpecPlain = '';
  }

  function compute() {
    var spec = SHAPES[state.shape];
    var parsed = readDims();
    if (parsed.missing) {
      setEmpty();
      return;
    }

    var d = parsed.d;
    var n = Math.min(MAX_QTY, Math.max(1, parseInt($('qty').value, 10) || 1));
    var V1 = spec.calc(d);
    var Vbase = V1 * n;
    var Vtotal = Vbase * (1 + state.waste / 100);

    var bag20 = bagEstimate(Vtotal, 20);
    var bag30 = bagEstimate(Vtotal, 30);
    var bagCost = Math.min(bag20.cost, bag30.cost);
    var premix = Math.ceil(Vtotal * 10) / 10;
    var premixPrice = state.premixPrice;
    var premixCost = premix * premixPrice;

    show($('results-section'), true);
    $('lcd').classList.remove('is-empty');
    setText('lcdVol', fmt(Vtotal));
    setText('lcdHint', wastageHint());
    if ($('lcdPin')) $('lcdPin').setAttribute('aria-hidden', 'false');
    if ($('lcdOrder')) $('lcdOrder').setAttribute('aria-hidden', 'false');

    var belowTruck = Vtotal < MIN_LOAD;
    var premixWins = !belowTruck && premixCost <= bagCost;
    var bagsWins = belowTruck || bagCost < premixCost;
    var verdict = supplyVerdict(premixWins, bagsWins, Vtotal);
    var bagsRec = !!(verdict && verdict.bagsRec);
    var premixRec = !!(verdict && verdict.premixRec);

    if ($('lcdBags20')) {
      $('lcdBags20').innerHTML = lcdOrderRow(
        bag20.bags.toLocaleString('en-AU'), bagOrderSuffix(bag20.bags), bagsRec
      );
    }
    if ($('lcdPremix')) {
      $('lcdPremix').innerHTML = lcdOrderRow(
        fmt(premix, 1) + ' m\u00B3', ' ready-mix', premixRec
      );
    }

    setSupplyHighlight(verdict);
    renderCostRec(verdict);

    setText('bagsRange', moneyRange(
      Math.min(bag20.cost * COST_RANGE_LOW, bag30.cost * COST_RANGE_LOW),
      Math.max(bag20.cost * COST_RANGE_HIGH, bag30.cost * COST_RANGE_HIGH)
    ));
    setText('bags20Detail', bag20.bags.toLocaleString('en-AU') + ' bags \u00D7 20 kg');
    setText('bags30Detail', bag30.bags.toLocaleString('en-AU') + ' bags \u00D7 30 kg');

    setText('premixRange', moneyRange(
      premixCost * COST_RANGE_LOW,
      premixCost * COST_RANGE_HIGH + DELIVERY_HIGH
    ));
    setText('premixDetail', fmt(premix, 1) + ' m\u00B3 + delivery (ex pump)');

    renderSpecSheet({
      dims: dimSummaryLines(),
      qty: n,
      wastePct: state.waste,
      Vtotal: Vtotal,
      bags20: bag20.bags,
      bags30: bag30.bags,
      bag20Cost: bag20.cost,
      bag30Cost: bag30.cost,
      premixCost: premixCost,
      note: verdict ? verdict.detail : null
    });
  }

  bindSeg('shapeSeg', 'data-shape', function (shape) {
    state.shape = shape;
    $('shapeHint').textContent = SHAPE_DESC[shape];
    renderDims();
    compute();
  });

  bindSeg('wasteSeg', 'data-waste', function (w) {
    state.waste = parseInt(w, 10);
    $('wasteHint').textContent = WASTE_HINT[state.waste];
    compute();
  });

  function onCalcInput(e) {
    if (!e.target.matches('#dimStack input, #qty')) return;
    compute();
  }

  renderDims();
  $('wasteHint').textContent = WASTE_HINT[state.waste];
  initPrices();
  setEmpty();

  var copyBtn = $('copySpecsBtn');
  if (copyBtn) copyBtn.addEventListener('click', copySpecs);

  document.addEventListener('input', onCalcInput);
  document.addEventListener('change', onCalcInput);
})();
