(function () {
  'use strict';

  if (!/localhost|127\.0\.0\.1/.test(location.hostname)) return;
  if (!/[?&]grid=1\b/.test(location.search)) return;

  var app = document.getElementById('app');
  var layer = document.getElementById('layoutGuides');
  var btn = document.getElementById('gridToggle');
  if (!app || !layer || !btn) return;

  document.getElementById('devRibbon').hidden = false;
  btn.hidden = false;

  var FIELD_SECTIONS = [
    { sel: '.sec-topbar', label: 'top bar' },
    { sel: '.sec-lcd', label: 'LCD' },
    { sel: '.sec-inputs', label: 'input fields' }
  ];

  function px(n) { return Math.round(n) + 'px'; }

  function readToken(name) {
    return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || 0;
  }

  function rel(rect, root) {
    return {
      top: rect.top - root.top,
      bottom: rect.bottom - root.top
    };
  }

  function band(x, y, w, h) {
    if (w < 1 || h < 1) return;
    var el = document.createElement('div');
    el.className = 'guide-rect';
    el.style.left = px(x);
    el.style.top = px(y);
    el.style.width = px(w);
    el.style.height = px(h);
    layer.appendChild(el);
  }

  function bandFull(y1, y2, rootW, g) {
    band(g, y1, rootW - g * 2, y2 - y1);
  }

  function label(text, x, y) {
    var el = document.createElement('span');
    el.className = 'guide-label';
    el.textContent = text;
    el.style.left = px(x);
    el.style.top = px(y);
    layer.appendChild(el);
  }

  function drawSections(sections, root, rootW, g) {
    var prevBottom = 0;
    sections.forEach(function (def, i) {
      var el = def.el || app.querySelector(def.sel);
      if (!el) return;
      var sr = rel(el.getBoundingClientRect(), root);
      if (i > 0 && sr.top > prevBottom) {
        bandFull(prevBottom, sr.top, rootW, g);
      }
      label(def.label, g + 4, sr.top + 4);
      prevBottom = sr.bottom;
    });
    if (prevBottom > 0 && prevBottom < root.height) {
      bandFull(prevBottom, root.height, rootW, g);
    }
  }

  function specSections() {
    var view = app.querySelector('.view-spec');
    if (!view) return [{ sel: '.sec-topbar', label: 'top bar' }];
    var sections = [{ sel: '.sec-topbar', label: 'top bar' }];
    view.querySelectorAll(':scope > .sp-sec').forEach(function (sec) {
      var h = sec.querySelector('.sp-h');
      var text = h ? h.textContent.replace(/\s*edit.*$/i, '').trim() : 'section';
      sections.push({ el: sec, label: text });
    });
    return sections;
  }

  function draw() {
    layer.innerHTML = '';
    if (!app.classList.contains('show-guides')) return;

    var root = app.getBoundingClientRect();
    var rootW = root.width;
    var rootH = root.height;
    var g = readToken('--gutter');

    if (app.classList.contains('mode-spec')) {
      drawSections(specSections(), root, rootW, g);
      return;
    }

    drawSections(FIELD_SECTIONS, root, rootW, g);
  }

  function sync(on) {
    app.classList.toggle('show-guides', on);
    btn.classList.toggle('is-on', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    draw();
  }

  btn.addEventListener('click', function () {
    sync(!app.classList.contains('show-guides'));
  });

  var ro = new ResizeObserver(function () { requestAnimationFrame(draw); });
  ro.observe(app);
  var mo = new MutationObserver(function () { requestAnimationFrame(draw); });
  mo.observe(app, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  window.addEventListener('resize', draw);

  sync(true);
})();
