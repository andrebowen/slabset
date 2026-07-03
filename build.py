#!/usr/bin/env python3
"""SlabSet static page generator.

Single source of truth for index.html and the per-shape landing pages.
Edit PAGES / templates below, then run:  python3 build.py

Why: content must ship as static HTML (SEO — calc.js only hydrates),
and six near-identical pages hand-edited would drift.
"""
import json
from pathlib import Path

ROOT = Path(__file__).parent
SITE = 'https://slabset.online'
GA_ID = 'G-PPKFHXV1DS'

# ---------------------------------------------------------------- shapes
# Field defs mirror shared/calc.js SHAPES — keep in sync.
SHAPES = {
    'slab':    [('L', 'Length', 'mm'), ('W', 'Width', 'mm'), ('T', 'Thickness', 'mm')],
    'footing': [('L', 'Length', 'mm'), ('W', 'Width', 'mm'), ('D', 'Depth', 'mm')],
    'column':  [('DIA', 'Diameter', 'mm'), ('H', 'Height', 'mm')],
    'round':   [('DIA', 'Diameter', 'mm'), ('T', 'Thickness', 'mm')],
    'stairs':  [('W', 'Width', 'mm'), ('R', 'Rise', 'mm'), ('G', 'Going', 'mm'), ('N', 'Steps', '')],
}
SHAPE_NAMES = {'slab': 'Slab', 'footing': 'Footing', 'column': 'Column', 'round': 'Round pad', 'stairs': 'Stairs'}
ICONS = {
    'slab': '<svg class="ico" viewBox="0 0 32 32"><polygon class="f" points="6,13 16,8 26,13 16,18"/><polygon class="s" points="6,13 16,18 16,22 6,17"/><polygon class="s" points="16,18 26,13 26,17 16,22"/></svg>',
    'footing': '<svg class="ico" viewBox="0 0 32 32"><polygon class="f" points="9,7 16,4 23,7 16,10"/><polygon class="s" points="9,7 16,10 16,28 9,25"/><polygon class="s" points="16,10 23,7 23,25 16,28"/></svg>',
    'column': '<svg class="ico" viewBox="0 0 32 32"><ellipse class="f" cx="16" cy="8" rx="8" ry="3"/><path class="s" d="M8 8v15a8 3 0 0 0 16 0V8"/></svg>',
    'round': '<svg class="ico" viewBox="0 0 32 32"><ellipse class="f" cx="16" cy="13" rx="10" ry="4"/><path class="s" d="M6 13v4a10 4 0 0 0 20 0v-4"/></svg>',
    'stairs': '<svg class="ico" viewBox="0 0 32 32"><path class="s" d="M5 24h6v-5h6v-5h6v-5h4v15z"/></svg>',
}

MOON_SVG = '<svg class="ld-ico ico-moon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.03 3.94A9.5 9.5 0 1 0 17.03 20.06A7.03 7.03 0 0 1 17.03 3.94Z"/></svg>'
SUN_SVG = '<svg class="ld-ico ico-sun" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><g transform="translate(12 12)"><circle cx="0" cy="0" r="4.25"/><rect x="-0.9" y="-10.25" width="1.8" height="4.25" rx="0.9"/><g transform="rotate(45)"><rect x="-0.9" y="-10.25" width="1.8" height="4.25" rx="0.9"/></g><g transform="rotate(90)"><rect x="-0.9" y="-10.25" width="1.8" height="4.25" rx="0.9"/></g><g transform="rotate(135)"><rect x="-0.9" y="-10.25" width="1.8" height="4.25" rx="0.9"/></g><g transform="rotate(180)"><rect x="-0.9" y="-10.25" width="1.8" height="4.25" rx="0.9"/></g><g transform="rotate(225)"><rect x="-0.9" y="-10.25" width="1.8" height="4.25" rx="0.9"/></g><g transform="rotate(270)"><rect x="-0.9" y="-10.25" width="1.8" height="4.25" rx="0.9"/></g><g transform="rotate(315)"><rect x="-0.9" y="-10.25" width="1.8" height="4.25" rx="0.9"/></g></g></svg>'

# ---------------------------------------------------------------- pages
FAQ_SHARED = [
    ('How much wastage should I add?',
     '10% is a normal starting point. Use less for tidy formwork and more for rough ground, uneven excavation or over-dig.'),
    ('Should I order bags or premix?',
     'Ready-mix is cheaper per cubic metre, but delivery and short-load fees make small deliveries poor value: suppliers charge extra below about 0.5 m³. Bags cost more per m³ but scale down to any size. The switchover is roughly 0.5 m³: below it, order bags; above it, book the truck.'),
    ('Does this replace a builder or engineer?',
     'No. Use SlabSet for estimating, then confirm quantities, grade and reinforcement before ordering.'),
]

PAGES = [
    {
        'file': 'index.html',
        'shape': 'slab',
        'url': SITE + '/',
        'title': 'Concrete Calculator Australia | SlabSet',
        'og_title': 'SlabSet Concrete Calculator',
        'desc': 'Concrete calculator for Australian slabs, footings, columns and stairs. Work out m³, bags, premix and a copy-ready pour spec.',
        'h1': 'Concrete calculator Australia',
        'about': [
            'SlabSet is a metric concrete calculator built for Australian sites. Pick a shape (slab, footing, column, round pad or stairs), enter dimensions in millimetres, and get volume in m³, bag counts, a premix order size and typical cost, ready to copy to your supplier.',
            'Everything runs in your browser. No sign-up, no ads between you and the number. Install it to your phone home screen and it works offline on site.',
        ],
        'faq_first': ('How do I work out how much concrete I need?',
                      'Measure the space in millimetres, convert to metres, multiply the dimensions to get m³, then add wastage.'),
        'webapp_ld': True,
    },
    {
        'file': 'concrete-slab-calculator.html',
        'shape': 'slab',
        'title': 'Concrete Slab Calculator: m³, Bags & Cost | SlabSet',
        'og_title': 'Concrete Slab Calculator | SlabSet',
        'desc': 'Work out concrete for a slab: enter length, width and thickness in mm to get m³, 20 kg bags, premix order size and typical Australian cost.',
        'h1': 'Concrete slab calculator',
        'about': [
            'A slab is priced by volume: length × width × thickness. A typical Australian shed or patio slab is 100 mm thick; driveways are usually 125–150 mm with mesh. Enter your dimensions in millimetres and SlabSet converts to cubic metres, adds wastage and sizes the order.',
            'The spec sheet also estimates reinforcing mesh sheets, formwork edge length and total concrete weight, useful for checking access and barrow counts before pour day.',
        ],
        'faq_first': ('How much concrete do I need for a slab?',
                      'Multiply length × width × thickness in metres. A 3 m × 3 m shed slab at 100 mm thick is 0.9 m³ before wastage, about 1.0 m³ to order.'),
    },
    {
        'file': 'concrete-footing-calculator.html',
        'shape': 'footing',
        'title': 'Concrete Footing Calculator: Trench m³ & Bags | SlabSet',
        'og_title': 'Concrete Footing Calculator | SlabSet',
        'desc': 'Work out concrete for strip footings: enter trench length, width and depth in mm to get m³, bags, premix order size and typical Australian cost.',
        'h1': 'Concrete footing calculator',
        'about': [
            'Strip footings are volume-hungry: a 300 mm × 600 mm trench takes 0.18 m³ per metre run. Enter the trench length, width and depth in millimetres and SlabSet gives cubic metres, bag counts and a premix order size.',
            'Footings poured against excavated ground lose more concrete than formed work: over-dig and uneven trench bottoms add up. Bump wastage to 15–20% for rough ground.',
        ],
        'faq_first': ('How do I calculate concrete for footings?',
                      'Multiply trench length × width × depth in metres. Add generous wastage of 15% or more, because trenches are rarely cut clean.'),
    },
    {
        'file': 'concrete-column-calculator.html',
        'shape': 'column',
        'title': 'Concrete Column Calculator: Pier & Post Hole m³ | SlabSet',
        'og_title': 'Concrete Column Calculator | SlabSet',
        'desc': 'Work out concrete for round columns, piers and post holes: enter diameter and height in mm to get m³, bags, premix and typical Australian cost.',
        'h1': 'Concrete column and pier calculator',
        'desc_note': '',
        'about': [
            'Round columns, bored piers and post holes are cylinders: π × radius² × height. Enter the diameter and height in millimetres: a 450 mm auger hole at 1200 mm deep is about 0.19 m³ each.',
            'For multiple identical piers, calculate one and multiply, or sum the total height. Post holes suit bags; a pier cage pour usually suits premix once you pass roughly 0.5 m³ total.',
        ],
        'faq_first': ('How do I calculate concrete for a column or pier?',
                      'Volume = π × (diameter ÷ 2)² × height, all in metres. A 450 mm diameter pier 1.2 m deep is about 0.19 m³ before wastage.'),
    },
    {
        'file': 'round-pad-calculator.html',
        'shape': 'round',
        'title': 'Round Concrete Pad Calculator: m³ & Bags | SlabSet',
        'og_title': 'Round Concrete Pad Calculator | SlabSet',
        'desc': 'Work out concrete for a round pad or circular slab: enter diameter and thickness in mm to get m³, bags, premix and typical Australian cost.',
        'h1': 'Round concrete pad calculator',
        'about': [
            'Round pads (water tank bases, hot tub pads, circular landings) are flat cylinders: π × radius² × thickness. Enter diameter and thickness in millimetres; a 2.4 m tank pad at 100 mm is about 0.45 m³.',
            'Tank pads carry real load: check your tank supplier\'s minimum thickness and mesh requirements. SlabSet estimates mesh sheets and the circular formwork edge length for you.',
        ],
    },
    {
        'file': 'concrete-stairs-calculator.html',
        'shape': 'stairs',
        'title': 'Concrete Stairs Calculator: Steps m³ & Bags | SlabSet',
        'og_title': 'Concrete Stairs Calculator | SlabSet',
        'desc': 'Work out concrete for solid stairs: enter width, rise, going and number of steps to get m³, bags, premix and typical Australian cost.',
        'h1': 'Concrete stairs calculator',
        'about': [
            'Solid concrete stairs stack like wedges: each step adds one more riser-worth of volume than the last. Enter the step width, rise, going and the number of steps and SlabSet sums the whole flight.',
            'Common Australian external steps use a 150–190 mm rise and 240–355 mm going. Stairs are fiddly to barrow and vibrate, so keep wastage at 10% or more.',
        ],
        'faq_first': ('How do I calculate concrete for stairs?',
                      'For a solid flight: width × going × rise × n(n+1)/2, where n is the number of steps. SlabSet does this sum for you.'),
    },
]
for p in PAGES:
    if 'url' not in p:
        p['url'] = SITE + '/' + p['file']

# ---------------------------------------------------------------- fragments

def field_rows(shape):
    out = []
    for k, label, unit in SHAPES[shape]:
        out.append(
            '<label class="fld" data-field="' + k + '">'
            '<span class="tl">' + label + '</span>'
            '<input class="fld-input" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" '
            'data-key="' + k + '" value="" placeholder="0" aria-label="' + label + (' in millimetres' if unit else '') + '">'
            '<span class="unit">' + unit + '</span></label>'
        )
    return ''.join(out)


def input_rows(shape):
    return ''.join(
        '<div class="sp-row"><span class="k">' + label + '</span><span class="v">0' + ((' ' + unit) if unit else '') + '</span></div>'
        for k, label, unit in SHAPES[shape]
    )


def shape_menu(shape):
    items = ''.join(
        '<button type="button" class="menu-item' + (' on' if k == shape else '') + '" data-shape="' + k + '">'
        + ICONS[k] + '<span>' + SHAPE_NAMES[k] + '</span><span class="chk">✓</span></button>'
        for k in ['slab', 'footing', 'column', 'round', 'stairs']
    )
    return (
        '<div class="shape-menu" id="shapeMenu">'
        '<button type="button" class="fld shape-fld" data-menu-btn aria-haspopup="true" aria-expanded="false">'
        '<span class="tl">Shape</span>'
        '<span class="shape-pick" id="shapePick">' + ICONS[shape]
        + '<span class="shape-pick__name">' + SHAPE_NAMES[shape] + '</span></span>'
        '<span class="chev" aria-hidden="true">▾</span>'
        '</button>'
        '<div class="menu-panel">' + items + '</div></div>'
    )


WASTE_MENU = (
    '<div class="shape-menu wmenu" id="wasteMenu">'
    '<button type="button" class="menu-btn" data-menu-btn aria-haspopup="true" aria-expanded="false">'
    '<span class="cur">Wastage</span><b data-wcur>10%</b><span class="chev">▾</span></button>'
    '<div class="menu-panel">'
    + ''.join(
        '<button type="button" class="menu-item' + (' on' if pct == 10 else '') + '" data-waste="' + str(pct) + '">'
        '<span class="wdesc">' + desc + '</span><span class="wpct">' + str(pct) + '%</span></button>'
        for pct, desc in [(0, 'No allowance'), (5, 'Tidy formwork'), (10, 'Standard site'), (15, 'Rough ground'), (20, 'Heavy over-dig')]
    )
    + '</div></div>'
)


def field_view(shape):
    return (
        '<div class="view view-field" id="viewField">'
        '<section class="sec-lcd" aria-label="Volume readout">'
        '<div class="out"><div class="out-main"><span class="out-vol-h">VOLUME</span>'
        '<span class="ov"><span data-vol>0.00</span><b>m³</b></span>'
        '<span class="out-note" data-waste-incl>includes 10% wastage</span></div>'
        '<div class="out-sub"><div class="out-sub-grid"><span class="out-sub-h">TO ORDER</span>'
        '<span class="out-sub-line"><b data-bags>0</b> Bags (20kg) or <b data-premix>0.0</b> m3 Premix</span></div></div></div>'
        '</section>'
        '<section class="sec-inputs" aria-label="Input fields">'
        + shape_menu(shape)
        + '<div class="flds" id="flds">' + field_rows(shape) + '</div>'
        + WASTE_MENU
        + '<button type="button" class="spec-cta" id="specCta">Spec sheet</button>'
        + '</section></div>'
    )


def other_links(page):
    links = ''.join(
        '<a href="' + p['file'] + '">' + p['h1'][0].upper() + p['h1'][1:] + '</a>'
        for p in PAGES if p['file'] != page['file'] and p['file'] != 'index.html'
    )
    if page['file'] != 'index.html':
        links = '<a href="./">Concrete calculator for all shapes</a>' + links
    return '<section class="sp-sec" aria-label="Other calculators"><div class="sp-h">Other calculators</div><nav class="sp-links">' + links + '</nav></section>'


def spec_view(page):
    shape = page['shape']
    faqs = ([page['faq_first']] if 'faq_first' in page else []) + FAQ_SHARED
    faq_html = ''.join(
        '<article class="faq-item"><h3>' + q + '</h3><p class="sp-prose">' + a + '</p></article>'
        for q, a in faqs
    )
    about_html = ''.join('<p class="sp-prose">' + para + '</p>' for para in page['about'])
    return (
        '<div class="view view-spec" id="viewSpec">'
        '<section class="sp-sec" aria-label="To order"><div class="sp-h"><span>To order</span></div>'
        '<div class="sp-hero"><button type="button" class="edit" data-edit>edit ⌨</button>'
        '<span class="hv" data-vol>0.00</span><span class="hu">m³</span></div></section>'
        '<section class="sp-sec" aria-label="Inputs"><div class="sp-h">Inputs</div>'
        '<div class="sp-row"><span class="k">Shape</span><span class="v" data-shape-name>' + SHAPE_NAMES[shape] + '</span></div>'
        '<div data-input-rows>' + input_rows(shape) + '</div>'
        '<div class="sp-row"><span class="k">Wastage</span><span class="v" data-waste-label>+10%</span></div></section>'
        '<section class="sp-sec" aria-label="Estimated cost"><div class="sp-h">Estimated cost</div>'
        '<div class="sp-rec"><span>Recommended: <b data-cost-rec>–</b></span><span class="why" data-cost-why>Enter dimensions to estimate cost.</span></div>'
        '<div class="cc" data-rec="bags"><div class="cc-top"><span class="cc-name">Individual bags</span><span class="cc-price" data-bags-cost>–</span></div>'
        '<div class="cc-sub"><span data-bags>0</span> × 20 kg · <span data-bags30>0</span> × 30 kg</div></div>'
        '<div class="cc" data-rec="premix"><div class="cc-top"><span class="cc-name">Ready-mix delivery</span><span class="cc-price" data-rm-cost>–</span></div>'
        '<div class="cc-sub"><span data-premix>0.0</span> m³ + delivery (ex pump)</div></div>'
        '<p class="sp-fine">Typical metro prices in Australia. Confirm with your local supplier before ordering.</p></section>'
        '<section class="sp-sec" aria-label="Materials and weight"><div class="sp-h">Materials &amp; weight</div>'
        '<div class="sp-row"><span class="k">Reinforcing mesh</span><span class="v"><span data-mesh>0</span> sheets</span></div>'
        '<div class="sp-row"><span class="k">Formwork edge</span><span class="v"><span data-edge>0.0</span> m</span></div>'
        '<div class="sp-row"><span class="k">Concrete weight</span><span class="v"><span data-weight>0.00</span> t</span></div></section>'
        '<section class="sp-sec" aria-label="How it is calculated"><div class="sp-h">How it\'s calculated</div>'
        '<div class="sp-working" data-working></div>'
        '<p class="sp-prose">Concrete is sold by volume in m³. Measure the space, work out its volume, add wastage, then convert to individual bags or a premix order.</p>'
        '<p class="sp-prose"><b>Wastage</b>: sites lose concrete to spillage and uneven ground. 10% is standard; raise it for rough ground, lower it for tidy formwork.</p>'
        '<p class="sp-prose"><b>Bags or premix</b>: a 20 kg bag yields ≈ 0.0098 m³ (~102 bags/m³). Premix sells in 0.1 m³ steps; below 0.5 m³ bags usually avoid short-load fees.</p></section>'
        '<section class="sp-sec" aria-label="About"><div class="sp-h">About</div>' + about_html + '</section>'
        '<section class="sp-sec" aria-label="Frequently asked questions"><div class="sp-h">FAQ</div><div class="faq-list">' + faq_html + '</div></section>'
        + other_links(page) +
        '<div class="sp-actions"><button type="button" class="copy" id="btnCopy">Copy specs</button><button type="button" class="pdf" id="btnPdf">Save PDF</button></div>'
        '<p class="sp-fine">Estimates only. Confirm quantities and prices with your supplier.</p>'
        '<p class="sp-foot">SlabSet · Metric Concrete Calculator · designed in Australia · <a href="terms.html">Terms</a> · <a href="privacy.html">Privacy</a> · <a href="mailto:metainstruments@icloud.com">Contact</a></p>'
        '</div>'
    )


def json_ld(page):
    faqs = ([page['faq_first']] if 'faq_first' in page else []) + FAQ_SHARED
    blocks = []
    if page.get('webapp_ld'):
        blocks.append(json.dumps({
            '@context': 'https://schema.org', '@type': 'WebApplication',
            'name': 'SlabSet Concrete Calculator', 'applicationCategory': 'UtilitiesApplication',
            'operatingSystem': 'Web', 'url': page['url'],
            'offers': {'@type': 'Offer', 'price': '0'},
            'description': page['desc'], 'inLanguage': 'en-AU',
        }, ensure_ascii=False))
    blocks.append(json.dumps({
        '@context': 'https://schema.org', '@type': 'FAQPage',
        'mainEntity': [
            {'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}}
            for q, a in faqs
        ],
    }, ensure_ascii=False))
    return ''.join('<script type="application/ld+json">\n' + b + '\n</script>\n' for b in blocks)


THEME_SCRIPT = (
    '<script>(function(){try{var s=localStorage.getItem(\'slabset-theme\');'
    'var d=s?s===\'dark\':(window.matchMedia&&matchMedia(\'(prefers-color-scheme: dark)\').matches);'
    'if(d){var a=document.getElementById(\'app\');a.classList.remove(\'t4\');a.classList.add(\'t4d\');'
    'var m=document.querySelector(\'meta[name="theme-color"]\');if(m)m.setAttribute(\'content\',\'#16181A\');}}catch(e){}})();</script>'
)

SW_CLEANUP = '''<script>
(function () {
  var h = location.hostname;
  if (h !== 'localhost' && h !== '127.0.0.1' && h !== '[::1]') return;
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function (regs) {
      regs.forEach(function (r) { r.unregister(); });
    });
  }
  if (window.caches) {
    caches.keys().then(function (keys) {
      keys.forEach(function (k) { caches.delete(k); });
    });
  }
})();
</script>'''


def render(page):
    return ('''<!DOCTYPE html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>''' + page['title'] + '''</title>
<meta name="description" content="''' + page['desc'] + '''">
<link rel="canonical" href="''' + page['url'] + '''">
<meta name="theme-color" content="#DED8CB">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="SlabSet">
<meta property="og:site_name" content="SlabSet">
<meta property="og:title" content="''' + page['og_title'] + '''">
<meta property="og:description" content="''' + page['desc'] + '''">
<meta property="og:url" content="''' + page['url'] + '''">
<meta property="og:type" content="website">
<meta property="og:image" content="''' + SITE + '''/shared/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="''' + page['og_title'] + '''">
<meta name="twitter:description" content="''' + page['desc'] + '''">
<meta name="twitter:image" content="''' + SITE + '''/shared/og-image.png">
<link rel="icon" type="image/png" sizes="48x48" href="shared/icons/favicon-48.png">
<link rel="icon" type="image/png" sizes="192x192" href="shared/icons/icon-192.png">
<link rel="apple-touch-icon" href="shared/icons/apple-touch-icon.png">
<link rel="manifest" href="manifest.webmanifest">
<link rel="stylesheet" href="shared/styles.css">
''' + SW_CLEANUP + '''
<script async src="https://www.googletagmanager.com/gtag/js?id=''' + GA_ID + '''"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','''
        + "'" + GA_ID + "'" + ''');</script>
</head>
<body class="website" data-shape="''' + page['shape'] + '''">
<div class="dev-ribbon" id="devRibbon" hidden aria-hidden="true">Website · mockup 04 · mono light/dark</div>

<div class="app mono t4 mode-field" id="app">
''' + THEME_SCRIPT + '''
  <h1 class="sr-only">''' + page['h1'] + '''</h1>
  <div class="layout-guides" id="layoutGuides" aria-hidden="true">
    <div class="guide-margin guide-margin--left"><span class="guide-margin__label">margin 20</span></div>
    <div class="guide-margin guide-margin--right"></div>
  </div>
  <header class="appbar sec-topbar" aria-label="SlabSet">
    <img class="slogo" src="shared/logo.svg" alt="">
    <span class="bz">SLABSET</span>
    <div class="appbar-right">
      <button type="button" class="ld-btn" id="themeToggle" aria-label="Switch light/dark theme">''' + MOON_SVG + SUN_SVG + '''</button>
      <button type="button" class="toggle" id="modeToggle" aria-pressed="true"><span class="knob"></span><span class="opt">Field</span><span class="opt">Spec</span></button>
    </div>
  </header>
  ''' + field_view(page['shape']) + '''
  ''' + spec_view(page) + '''
</div>

<button type="button" class="grid-toggle" id="gridToggle" hidden aria-pressed="false">GRID</button>

<p class="copy-toast" id="copyToast" role="status" aria-live="polite" hidden></p>

<div class="install-banner" id="installBanner" hidden>
  <p>Install SlabSet for iOS for the best on-site experience</p>
  <button type="button" class="install-banner__go" id="installGo">Install</button>
  <button type="button" class="install-banner__dismiss" id="installDismiss" aria-label="Dismiss">✕</button>
</div>

''' + json_ld(page) + '''<script src="shared/calc.js"></script>
<script src="shared/layout-guides.js"></script>
</body>
</html>
''')


if __name__ == '__main__':
    for page in PAGES:
        (ROOT / page['file']).write_text(render(page), encoding='utf-8')
        print('wrote', page['file'])
