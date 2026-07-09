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
      fields: [['W', 'Width', 'm', 3], ['R', 'Rise', 'mm', 300], ['G', 'Going', 'mm', 500], ['N', 'Steps', '', 60], ['BT', 'Base thickness', 'mm', 300]],
      vol: function (v) {
        var wedge = v.W * (v.G / 1000) * (v.R / 1000) * (v.N * (v.N + 1) / 2);
        var base = v.W * (v.G / 1000 * v.N) * (v.BT / 1000);
        return wedge + base;
      }
    }
  };

  var SHAPE_NAMES = { slab: 'Slab', footing: 'Strip footing', pierfooting: 'Pier footing', column: 'Column', round: 'Round pad', stairs: 'Stairs' };

  // Indicative Australian rates — kept in sync with the "Estimated cost" copy in build.py.
  var RATE_MIX_LOW = 220, RATE_MIX_HIGH = 320, RATE_BAG_LOW = 7, RATE_BAG_HIGH = 10;

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
  var st = { shape: initShape, active: SHAPES[initShape].fields[0][0], vals: { L: '', W: '', T: '', D: '', PL: '', PW: '', PD: '', DIA: '', H: '', R: '', G: '', N: '', Q: '1', BT: '0', WASTE: '10' } };
  var lastSpecPlain = '';
  var lastVolValue = null;
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
      if (f[0] === 'BT') return true; // optional: 0 is a valid "no base slab" value
      var raw = st.vals[f[0]];
      return raw && raw !== '0' && raw !== '.';
    });
  }

  function buildPlainSpec(opts) {
    return [
      'CONCRETE CALCULATION · SlabSet',
      '',
    ].concat(opts.job ? ['JOB: ' + opts.job, ''] : []).concat([
      'SHAPE: ' + SHAPE_NAMES[st.shape],
      'DIMENSIONS: ' + opts.dimLine,
      'WASTAGE: +' + opts.w + '%',
      '',
      'To order: ' + opts.total.toFixed(2) + ' m³',
      'Measured: ' + opts.base.toFixed(2) + ' m³',
      '',
      'Bags (20 kg): ' + opts.bags20,
      'Bags (30 kg): ' + opts.bags30,
      'Premix: ' + opts.premix.toFixed(1) + ' m³',
      '',
      'Reinforcing mesh: ' + opts.mesh + ' sheets',
      'Formwork edge: ' + opts.edge.toFixed(1) + ' m',
      'Concrete weight: ' + opts.weight.toFixed(2) + ' t',
      '',
      opts.working,
      '',
      'Estimates only. Confirm quantities and prices with your supplier before ordering.'
    ]).join('\n');
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

    var v = parseVals();
    var base = allComplete() ? sh.vol(v) : 0;
    var total = base * (1 + w / 100);
    var bags20 = total ? Math.ceil(total / 0.0098) : 0;
    var bags30 = total ? Math.ceil(total / (0.0098 * 1.5)) : 0;
    var premix = total ? Math.ceil(total * 10) / 10 : 0;

    var outSub = root.querySelector('.out-sub');
    if (outSub) outSub.classList.toggle('is-empty', !total);
    var specOrderLine = root.querySelector('.sp-order-line');
    if (specOrderLine) specOrderLine.classList.toggle('is-empty', !total);

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
    setText('[data-cost-mix]', costRange(premix, RATE_MIX_LOW, RATE_MIX_HIGH));
    setText('[data-cost-bags]', costRange(bags20, RATE_BAG_LOW, RATE_BAG_HIGH));
    setText('[data-weight]', (total * 2.4).toFixed(2));
    setText('[data-mesh]', mesh);
    setText('[data-edge]', edge.toFixed(1));
    setText('[data-shape-name]', SHAPE_NAMES[st.shape]);
    setText('[data-waste-label]', '+' + w + '%');
    setText('[data-waste-incl]', w ? 'includes ' + w + '% wastage' : 'no wastage added');

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
        mesh: mesh,
        edge: edge,
        weight: total * 2.4,
        working: work,
        job: (document.getElementById('jobDesc') || {}).value || ''
      });
    } else {
      lastSpecPlain = '';
    }
  }

  function validateField(key) {
    var sh = SHAPES[st.shape];
    var fdef = sh.fields.filter(function (f) { return f[0] === key; })[0];
    if (!fdef) return;
    var max = fdef[3];
    var label = root.querySelector('.fld[data-field="' + key + '"]');
    if (!label) return;
    var warnEl = label.querySelector('.fld-warn');
    var val = parseFloat(st.vals[key]) || 0;
    var bad = !!(max && val > max);
    label.classList.toggle('warn', bad);
    if (warnEl) warnEl.textContent = bad ? 'That looks unusually large — check the units.' : '';
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

    var fh = '';
    sh.fields.forEach(function (f) {
      var k = f[0];
      var val = st.vals[k] || '';
      fh += '<label class="fld" data-field="' + k + '">'
        + '<span class="tl">' + f[1] + '</span>'
        + '<input class="fld-input" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" data-key="' + k + '" value="' + val + '" placeholder="0" aria-label="' + f[1] + unitPhrase(f[2]) + '">'
        + '<span class="unit">' + (f[2] || '') + '</span>'
        + '<span class="fld-warn" aria-live="polite"></span></label>';
    });
    document.getElementById('flds').innerHTML = fh;
    sh.fields.forEach(function (f) { validateField(f[0]); });
    updateOutputs();
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
      st.shape = b.getAttribute('data-shape');
      st.active = SHAPES[st.shape].fields[0][0];
      closeMenus(true);
      track('shape_select', { shape: st.shape });
      render();
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
    showToast(ok ? 'Specs copied' : 'Copy failed');
  }

  function copyText(text) {
    if (!text) { showToast('Enter dimensions first'); return; }
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
      document.querySelector('meta[name="theme-color"]').setAttribute('content', dark ? '#16181A' : '#F0F2EA');
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

  function initShare() {
    var btn = document.getElementById('btnShare');
    if (!btn || !navigator.share) return;
    btn.hidden = false;
    btn.addEventListener('click', function () {
      if (!lastSpecPlain) return;
      track('share_spec', { shape: st.shape });
      navigator.share({ title: 'SlabSet concrete spec', text: lastSpecPlain, url: location.href }).catch(function () {});
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
      return;
    }
    handleMenuInteraction(e);
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

  document.getElementById('viewSpec').addEventListener('click', function (e) {
    if (handleMenuInteraction(e)) return;
    if (e.target.closest('[data-edit]')) setMode(false);
    if (e.target.closest('#btnCopy')) copyText(lastSpecPlain);
    if (e.target.closest('#btnPdf')) { track('save_pdf', { shape: st.shape }); window.print(); }
  });

  document.getElementById('viewSpec').addEventListener('input', function (e) {
    if (e.target.id === 'jobDesc') updateOutputs();
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

  initTheme();
  initPwa();
  initShare();
  initServiceWorker();
  render();
})();
