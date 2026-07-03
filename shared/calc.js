(function () {
  'use strict';

  // Static markup ships in the HTML (see build.py) — this script hydrates it.
  // SHAPES/ICONS below must stay in sync with build.py.

  var SHAPES = {
    slab: {
      fields: [['L', 'Length', 'mm'], ['W', 'Width', 'mm'], ['T', 'Thickness', 'mm']],
      vol: function (v) { return v.L * v.W * v.T / 1e9; }
    },
    footing: {
      fields: [['L', 'Length', 'mm'], ['W', 'Width', 'mm'], ['D', 'Depth', 'mm']],
      vol: function (v) { return v.L * v.W * v.D / 1e9; }
    },
    column: {
      fields: [['DIA', 'Diameter', 'mm'], ['H', 'Height', 'mm']],
      vol: function (v) { return Math.PI * Math.pow(v.DIA / 1000 / 2, 2) * (v.H / 1000); }
    },
    round: {
      fields: [['DIA', 'Diameter', 'mm'], ['T', 'Thickness', 'mm']],
      vol: function (v) { return Math.PI * Math.pow(v.DIA / 1000 / 2, 2) * (v.T / 1000); }
    },
    stairs: {
      fields: [['W', 'Width', 'mm'], ['R', 'Rise', 'mm'], ['G', 'Going', 'mm'], ['N', 'Steps', '']],
      vol: function (v) { return (v.W / 1000) * (v.G / 1000) * (v.R / 1000) * (v.N * (v.N + 1) / 2); }
    }
  };

  var SHAPE_NAMES = { slab: 'Slab', footing: 'Footing', column: 'Column', round: 'Round pad', stairs: 'Stairs' };

  var ICONS = {
    slab: '<svg class="ico" viewBox="0 0 32 32"><polygon class="f" points="6,13 16,8 26,13 16,18"/><polygon class="s" points="6,13 16,18 16,22 6,17"/><polygon class="s" points="16,18 26,13 26,17 16,22"/></svg>',
    footing: '<svg class="ico" viewBox="0 0 32 32"><polygon class="f" points="9,7 16,4 23,7 16,10"/><polygon class="s" points="9,7 16,10 16,28 9,25"/><polygon class="s" points="16,10 23,7 23,25 16,28"/></svg>',
    column: '<svg class="ico" viewBox="0 0 32 32"><ellipse class="f" cx="16" cy="8" rx="8" ry="3"/><path class="s" d="M8 8v15a8 3 0 0 0 16 0V8"/></svg>',
    round: '<svg class="ico" viewBox="0 0 32 32"><ellipse class="f" cx="16" cy="13" rx="10" ry="4"/><path class="s" d="M6 13v4a10 4 0 0 0 20 0v-4"/></svg>',
    stairs: '<svg class="ico" viewBox="0 0 32 32"><path class="s" d="M5 24h6v-5h6v-5h6v-5h4v15z"/></svg>'
  };

  var root = document.getElementById('app');
  var initShape = document.body.getAttribute('data-shape');
  if (!SHAPES[initShape]) initShape = 'slab';
  var st = { shape: initShape, active: SHAPES[initShape].fields[0][0], vals: { L: '', W: '', T: '', D: '', DIA: '', H: '', R: '', G: '', N: '', WASTE: '10' } };
  var lastSpecPlain = '';
  var deferredInstall = null;
  var trackedComplete = false;

  function track(name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
  }

  function $all(sel) { return [].slice.call(root.querySelectorAll(sel)); }
  function setText(sel, val) { $all(sel).forEach(function (e) { e.textContent = val; }); }

  function setMode(spec) {
    root.classList.toggle('mode-spec', spec);
    document.getElementById('modeToggle').classList.toggle('is-spec', spec);
    document.getElementById('modeToggle').setAttribute('aria-pressed', spec ? 'false' : 'true');
    if (spec) {
      document.getElementById('viewSpec').scrollTop = 0;
      track('spec_view', { shape: st.shape });
    }
  }

  function fieldKeys() {
    return SHAPES[st.shape].fields.map(function (f) { return f[0]; });
  }

  function parseVals() {
    var sh = SHAPES[st.shape];
    var v = {};
    sh.fields.forEach(function (f) { v[f[0]] = parseFloat(st.vals[f[0]]) || 0; });
    return v;
  }

  function allComplete() {
    return SHAPES[st.shape].fields.every(function (f) {
      var raw = st.vals[f[0]];
      return raw && raw !== '0' && raw !== '.';
    });
  }

  function buildPlainSpec(opts) {
    return [
      'CONCRETE CALCULATION · SlabSet',
      '',
      'PROJECT: ' + SHAPE_NAMES[st.shape],
      'DIMENSIONS: ' + opts.dimLine,
      'WASTAGE: +' + opts.w + '%',
      '',
      'To order: ' + opts.total.toFixed(2) + ' m³',
      'Measured: ' + opts.base.toFixed(2) + ' m³',
      '',
      'Bags (20 kg): ' + opts.bags20,
      'Bags (30 kg): ' + opts.bags30,
      'Premix: ' + opts.premix.toFixed(1) + ' m³',
      'Recommended: ' + opts.recLabel,
      '',
      'Est. bags: ' + opts.bagsCost,
      'Est. premix: ' + opts.rmCost,
      '',
      'Reinforcing mesh: ' + opts.mesh + ' sheets',
      'Formwork edge: ' + opts.edge.toFixed(1) + ' m',
      'Concrete weight: ' + opts.weight.toFixed(2) + ' t',
      '',
      opts.working,
      '',
      'Estimate uses typical metro prices in Australia.',
      'Confirm with your local supplier before ordering.'
    ].join('\n');
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
      ir += '<div class="sp-row"><span class="k">' + f[1] + '</span><span class="v">' + (empty ? '0' : val) + unit + '</span></div>';
    });
    var irEl = root.querySelector('[data-input-rows]');
    if (irEl) irEl.innerHTML = ir;

    var pickEl = document.getElementById('shapePick');
    if (pickEl) {
      pickEl.innerHTML = ICONS[st.shape]
        + '<span class="shape-pick__name">' + SHAPE_NAMES[st.shape] + '</span>';
    }

    $all('.menu-item[data-shape]').forEach(function (it) {
      it.classList.toggle('on', it.getAttribute('data-shape') === st.shape);
    });
    setText('[data-wcur]', w + '%');
    $all('.menu-item[data-waste]').forEach(function (it) {
      it.classList.toggle('on', +it.getAttribute('data-waste') === w);
    });

    var v = parseVals();
    var base = allComplete() ? sh.vol(v) : 0;
    var total = base * (1 + w / 100);
    var bags20 = total ? Math.ceil(total / 0.0098) : 0;
    var bags30 = total ? Math.ceil(total / (0.0098 * 1.5)) : 0;
    var premix = total ? Math.ceil(total * 10) / 10 : 0;

    var area = 0;
    var edge = 0;
    if (st.shape === 'slab' || st.shape === 'footing') {
      area = v.L * v.W / 1e6;
      edge = 2 * (v.L + v.W) / 1000;
    } else if (st.shape === 'round') {
      var r = v.DIA / 1000 / 2;
      area = Math.PI * r * r;
      edge = Math.PI * v.DIA / 1000;
    } else if (st.shape === 'column') {
      edge = Math.PI * v.DIA / 1000;
    }
    var mesh = area ? Math.ceil(area / 14.4) : 0;

    setText('[data-vol]', total ? total.toFixed(2) : '0.00');
    setText('[data-bags]', bags20);
    setText('[data-bags30]', bags30);
    setText('[data-premix]', premix.toFixed(1));
    setText('[data-weight]', (total * 2.4).toFixed(2));
    setText('[data-mesh]', mesh);
    setText('[data-edge]', edge.toFixed(1));
    setText('[data-shape-name]', SHAPE_NAMES[st.shape]);
    setText('[data-waste-label]', '+' + w + '%');
    setText('[data-waste-incl]', w ? 'includes ' + w + '% wastage' : 'no wastage added');

    var wf = (1 + w / 100).toFixed(2);
    var work;
    if (st.shape === 'column' || st.shape === 'round') {
      work = 'π × (' + (v.DIA / 1000).toFixed(3) + ' ÷ 2)² × ' + ((st.shape === 'column' ? v.H : v.T) / 1000).toFixed(3) + ' m = ' + base.toFixed(2) + ' m³\n→ × ' + wf + ' wastage = ' + total.toFixed(2) + ' m³';
    } else if (st.shape === 'stairs') {
      work = (v.W / 1000).toFixed(2) + ' × ' + (v.G / 1000).toFixed(3) + ' × ' + (v.R / 1000).toFixed(3) + ' × ' + v.N + '(' + v.N + '+1)/2 = ' + base.toFixed(2) + ' m³\n→ × ' + wf + ' wastage = ' + total.toFixed(2) + ' m³';
    } else {
      work = sh.fields.map(function (f) { return (v[f[0]] / 1000).toFixed(2); }).join(' × ') + ' m = ' + base.toFixed(2) + ' m³\n→ × ' + wf + ' wastage = ' + total.toFixed(2) + ' m³';
    }
    setText('[data-working]', work);

    var bagsLo = Math.round(Math.min(bags20 * 8.35, bags30 * 12.55));
    var bagsHi = Math.round(Math.max(bags20 * 10.65, bags30 * 15.95));
    var rmLo = Math.round(premix * 300);
    var rmHi = Math.round(premix * 330 + (premix < 0.5 ? 130 : 0));
    function money(a, b) { return '$' + a.toLocaleString() + ' – $' + b.toLocaleString(); }

    setText('[data-bags-cost]', total ? money(bagsLo, bagsHi) : '–');
    setText('[data-rm-cost]', total ? money(rmLo, rmHi) : '–');

    var recPremix = total >= 0.5;
    setText('[data-cost-rec]', total ? (recPremix ? 'Ready-mix delivery' : 'Individual bags') : '–');
    setText('[data-cost-why]', total ? (recPremix
      ? 'At ' + total.toFixed(2) + ' m³, ready-mix is cheaper per cubic metre and far less work than mixing bags.'
      : 'At ' + total.toFixed(2) + ' m³, bags skip delivery and short-load fees, so they are cheaper overall.') : 'Enter dimensions to estimate cost.');

    $all('[data-rec="premix"]').forEach(function (e) { e.classList.toggle('rec', total && recPremix); });
    $all('[data-rec="bags"]').forEach(function (e) { e.classList.toggle('rec', total && !recPremix); });

    var cta = document.getElementById('specCta');
    if (cta) {
      cta.classList.toggle('is-ready', !!total);
      cta.textContent = total ? 'View spec sheet →' : 'Spec sheet';
    }

    if (total) {
      if (!trackedComplete) {
        trackedComplete = true;
        track('calc_complete', { shape: st.shape });
      }
      var dimLine = sh.fields.map(function (f) {
        var raw = st.vals[f[0]] || '0';
        return raw + (f[2] ? ' ' + f[2] : '');
      }).join(' × ');
      lastSpecPlain = buildPlainSpec({
        w: w,
        base: base,
        total: total,
        bags20: bags20,
        bags30: bags30,
        premix: premix,
        dimLine: dimLine,
        recLabel: recPremix ? 'Ready-mix delivery' : 'Individual bags',
        bagsCost: money(bagsLo, bagsHi),
        rmCost: money(rmLo, rmHi),
        mesh: mesh,
        edge: edge,
        weight: total * 2.4,
        working: work
      });
    } else {
      lastSpecPlain = '';
    }
  }

  function updateFields() {
    var sh = SHAPES[st.shape];
    if (fieldKeys().indexOf(st.active) < 0) st.active = sh.fields[0][0];

    var fh = '';
    sh.fields.forEach(function (f) {
      var k = f[0];
      var val = st.vals[k] || '';
      fh += '<label class="fld" data-field="' + k + '">'
        + '<span class="tl">' + f[1] + '</span>'
        + '<input class="fld-input" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" data-key="' + k + '" value="' + val + '" placeholder="0" aria-label="' + f[1] + (f[2] ? ' in millimetres' : '') + '">'
        + '<span class="unit">' + (f[2] || '') + '</span></label>';
    });
    document.getElementById('flds').innerHTML = fh;
    updateOutputs();
  }

  function render() {
    updateFields();
  }

  function closeMenus() {
    $all('.shape-menu.open').forEach(function (m) {
      m.classList.remove('open');
      var b = m.querySelector('[data-menu-btn]');
      if (b) b.setAttribute('aria-expanded', 'false');
    });
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
    showToast(ok ? 'Specs copied' : 'Copy failed');
  }

  function copyText(text) {
    if (!text) return;
    track('copy_spec', { shape: st.shape });
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showToast('Specs copied');
      }).catch(function () {
        copyFallback(text);
      });
    } else {
      copyFallback(text);
    }
  }

  function initTheme() {
    // Theme class is applied before paint by an inline script in the HTML.
    document.getElementById('themeToggle').addEventListener('click', function () {
      var dark = !root.classList.contains('t4d');
      root.classList.toggle('t4d', dark);
      root.classList.toggle('t4', !dark);
      try { localStorage.setItem('slabset-theme', dark ? 'dark' : 'light'); } catch (e) {}
      document.querySelector('meta[name="theme-color"]').setAttribute('content', dark ? '#16181A' : '#DED8CB');
      track('theme_toggle', { theme: dark ? 'dark' : 'light' });
    });
  }

  function initPwa() {
    var banner = document.getElementById('installBanner');
    if (!banner) return;

    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferredInstall = e;
      var dismissed = false;
      try { dismissed = !!localStorage.getItem('slabset-install-dismissed'); } catch (err) {}
      if (dismissed) return;
      banner.hidden = false;
      track('pwa_banner_shown');
    });

    document.getElementById('installGo').addEventListener('click', function () {
      if (!deferredInstall) return;
      deferredInstall.prompt();
      deferredInstall.userChoice.then(function (choice) {
        track('pwa_install', { outcome: choice && choice.outcome ? choice.outcome : 'unknown' });
        banner.hidden = true;
        deferredInstall = null;
      });
    });

    document.getElementById('installDismiss').addEventListener('click', function () {
      banner.hidden = true;
      track('pwa_banner_dismissed');
      try { localStorage.setItem('slabset-install-dismissed', '1'); } catch (e) {}
    });
  }

  function initServiceWorker() {
    var local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
    if (local || location.protocol !== 'https:' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }

  document.getElementById('modeToggle').addEventListener('click', function () {
    setMode(!root.classList.contains('mode-spec'));
  });

  document.getElementById('viewField').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    if (b.id === 'specCta') {
      track('spec_cta_tap', { ready: b.classList.contains('is-ready'), shape: st.shape });
      setMode(true);
    } else if (b.hasAttribute('data-menu-btn')) {
      var menu = b.closest('.shape-menu');
      var open = menu.classList.contains('open');
      closeMenus();
      if (!open) {
        menu.classList.add('open');
        b.setAttribute('aria-expanded', 'true');
      }
    } else if (b.hasAttribute('data-shape')) {
      st.shape = b.getAttribute('data-shape');
      st.active = SHAPES[st.shape].fields[0][0];
      closeMenus();
      track('shape_select', { shape: st.shape });
      render();
    } else if (b.hasAttribute('data-waste')) {
      st.vals.WASTE = b.getAttribute('data-waste');
      closeMenus();
      track('waste_select', { value: st.vals.WASTE });
      updateOutputs();
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
    updateOutputs();
  });

  document.getElementById('viewSpec').addEventListener('click', function (e) {
    if (e.target.closest('[data-edit]')) setMode(false);
    if (e.target.closest('#btnCopy')) copyText(lastSpecPlain);
    if (e.target.closest('#btnPdf')) { track('save_pdf', { shape: st.shape }); window.print(); }
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.shape-menu')) closeMenus();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenus();
  });

  initTheme();
  initPwa();
  initServiceWorker();
  render();
})();
