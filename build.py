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
    'slab':        [('L', 'Length', 'm'), ('W', 'Width', 'm'), ('T', 'Thickness', 'mm'), ('Q', 'Quantity', '')],
    'footing':     [('L', 'Total run', 'm'), ('W', 'Width', 'm'), ('D', 'Depth', 'mm'), ('Q', 'Quantity', '')],
    'pierfooting': [('PL', 'Length', 'mm'), ('PW', 'Width', 'mm'), ('PD', 'Depth', 'mm'), ('Q', 'Quantity', '')],
    'column':      [('DIA', 'Diameter', 'mm'), ('H', 'Height', 'mm'), ('Q', 'Quantity', '')],
    'round':       [('DIA', 'Diameter', 'm'), ('T', 'Thickness', 'mm'), ('Q', 'Quantity', '')],
    'stairs':      [('W', 'Width', 'm'), ('R', 'Rise', 'mm'), ('G', 'Going', 'mm'), ('N', 'Steps', ''), ('BT', 'Base thickness (optional)', 'mm')],
}
SHAPE_NAMES = {'slab': 'Slab', 'footing': 'Strip footing', 'pierfooting': 'Pier footing', 'column': 'Column', 'round': 'Round pad', 'stairs': 'Stairs'}
ICONS = {
    'slab': '<svg class="ico" viewBox="0 0 32 32"><polygon class="f" points="16,8 27,14.4 16,20.7 5,14.4"/><polygon class="s" points="5,14.4 16,20.7 16,23.7 5,17.4"/><polygon class="s" points="16,20.7 27,14.4 27,17.4 16,23.7"/></svg>',
    'footing': '<svg class="ico" viewBox="0 0 32 32"><polygon class="f" points="14.3,8 25.5,14.5 22.9,16 14.3,11 5.6,16 3,14.5"/><polygon class="s" points="14.3,11 25.5,17.5 22.9,19 14.3,14 5.6,19 3,17.5"/><polygon class="s" points="25.5,14.5 22.9,16 22.9,19 25.5,17.5"/><polygon class="s" points="5.6,16 3,14.5 3,17.5 5.6,19"/></svg>',
    'pierfooting': '<svg class="ico" viewBox="0 0 32 32"><polygon class="f" points="16,6 24,10.6 16,15.2 8,10.6"/><polygon class="s" points="8,10.6 16,15.2 16,29.2 8,24.6"/><polygon class="s" points="16,15.2 24,10.6 24,24.6 16,29.2"/></svg>',
    'column': '<svg class="ico" viewBox="0 0 32 32"><ellipse class="f" cx="16" cy="8" rx="6" ry="3.46"/><path class="s" d="M10 8v15a6 3.46 0 0 0 12 0V8"/></svg>',
    'round': '<svg class="ico" viewBox="0 0 32 32"><ellipse class="f" cx="16" cy="13" rx="12.5" ry="7.22"/><path class="s" d="M3.5 13v4a12.5 7.22 0 0 0 25 0v-4"/></svg>',
    'stairs': '<svg class="ico" viewBox="0 0 32 32"><path class="s" d="M11 24v-5h6v-5h6v-5h6v15z"/></svg>',
}

MOON_SVG = '<svg class="ld-ico ico-moon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.03 3.94A9.5 9.5 0 1 0 17.03 20.06A7.03 7.03 0 0 1 17.03 3.94Z"/></svg>'
SUN_SVG = '<svg class="ld-ico ico-sun" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><g transform="translate(12 12)"><circle cx="0" cy="0" r="4.25"/><rect x="-0.9" y="-10.25" width="1.8" height="4.25" rx="0.9"/><g transform="rotate(45)"><rect x="-0.9" y="-10.25" width="1.8" height="4.25" rx="0.9"/></g><g transform="rotate(90)"><rect x="-0.9" y="-10.25" width="1.8" height="4.25" rx="0.9"/></g><g transform="rotate(135)"><rect x="-0.9" y="-10.25" width="1.8" height="4.25" rx="0.9"/></g><g transform="rotate(180)"><rect x="-0.9" y="-10.25" width="1.8" height="4.25" rx="0.9"/></g><g transform="rotate(225)"><rect x="-0.9" y="-10.25" width="1.8" height="4.25" rx="0.9"/></g><g transform="rotate(270)"><rect x="-0.9" y="-10.25" width="1.8" height="4.25" rx="0.9"/></g><g transform="rotate(315)"><rect x="-0.9" y="-10.25" width="1.8" height="4.25" rx="0.9"/></g></g></svg>'

# ---------------------------------------------------------------- pages
FAQ_SHARED = [
    ('How much wastage should I add?',
     '10% is a normal starting point. Use less for tidy formwork and more for rough ground, uneven excavation or over-dig.'),
    ('Should I order bags or premix?',
     'Below 0.5 m³, bags usually work out cheaper: you skip the delivery minimums and short-load fees trucks charge. Above 0.5 m³, ready-mix usually wins on price, whether that\'s a mini-mix truck for tight access and smaller loads or a standard agitator truck for bigger pours.'),
    ('Are the price estimates quotes?',
     'No. SlabSet uses typical Australian prices for bags and ready-mix, reviewed about every quarter. Delivery, pump, waiting time, region and mix grade can move the real number a lot. Treat the range as a planning guide and confirm with your supplier before you order.'),
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
            'SlabSet is a metric concrete calculator built for Australian sites. Pick a shape (slab, strip footing, pier footing, column, round pad or stairs), enter your measurements, and get volume in m³, bag counts, a premix order size and typical cost, ready to copy to your supplier.',
            'Everything runs in your browser. No sign-up, no ads between you and the number. Install it to your phone home screen and it works offline on site.',
        ],
        'faq_first': ('How do I work out how much concrete I need?',
                      'Pick your shape, then measure it in metres (millimetres for thickness, depth or diameter) and SlabSet multiplies it out to cubic metres, wastage included.'),
        'webapp_ld': True,
    },
    {
        'file': 'concrete-slab-calculator.html',
        'shape': 'slab',
        'title': 'Concrete Slab Calculator: m³, Bags & Cost | SlabSet',
        'og_title': 'Concrete Slab Calculator | SlabSet',
        'desc': 'Work out concrete for a slab: enter length and width in metres and thickness in mm to get m³, 20 kg bags, premix order size and typical Australian cost.',
        'h1': 'Concrete slab calculator',
        'about': [
            'A slab is priced by volume: length × width × thickness. A typical Australian shed or patio slab is 100 mm thick; driveways are usually 125–150 mm with mesh. Enter length and width in metres and thickness in millimetres, and SlabSet converts to cubic metres, adds wastage and sizes the order.',
            'The spec sheet also estimates reinforcing mesh sheets, formwork edge length and total concrete weight, useful for checking access and barrow counts before pour day.',
        ],
        'faq_first': ('How much concrete do I need for a slab?',
                      'Multiply length × width × thickness in metres. A 3 m × 3 m shed slab at 100 mm thick is 0.9 m³ before wastage, about 1.0 m³ to order.'),
    },
    {
        'file': 'concrete-footing-calculator.html',
        'shape': 'footing',
        'title': 'Strip Footing Calculator: Trench m³ & Bags | SlabSet',
        'og_title': 'Strip Footing Calculator | SlabSet',
        'desc': 'Work out concrete for strip footings: enter trench length and width in metres and depth in mm to get m³, bags, premix order size and typical Australian cost.',
        'h1': 'Strip footing calculator',
        'about': [
            'Strip footings are volume-hungry: a 300 mm × 600 mm trench takes 0.18 m³ per metre run. Enter the trench length and width in metres and the depth in millimetres, and SlabSet gives cubic metres, bag counts and a premix order size.',
            'Footings poured against excavated ground lose more concrete than formed work: over-dig and uneven trench bottoms add up. Bump wastage to 15–20% for rough ground.',
        ],
        'faq_first': ('How do I calculate concrete for a strip footing?',
                      'Multiply trench length × width × depth in metres. Add generous wastage of 15% or more, because trenches are rarely cut clean.'),
    },
    {
        'file': 'pier-footing-calculator.html',
        'shape': 'pierfooting',
        'title': 'Pier Footing Calculator: Pad Footing m³ & Bags | SlabSet',
        'og_title': 'Pier Footing Calculator | SlabSet',
        'desc': 'Work out concrete for an isolated pier or pad footing: enter length, width and depth in mm to get m³, bags, premix order size and typical Australian cost.',
        'h1': 'Pier footing calculator',
        'about': [
            'A pier footing (or pad footing) is the isolated rectangular pad a post, stump or pier sits on, spreading a point load into the ground. Enter the pad length, width and depth in millimetres: a common 600 mm × 600 mm × 300 mm footing is about 0.11 m³.',
            'Deck and verandah posts usually need several identical footings. Set Quantity to the number of pads and SlabSet multiplies the whole order for you.',
        ],
        'faq_first': ('How do I calculate concrete for a pier or pad footing?',
                      'Multiply length × width × depth in metres, then by how many identical footings you need. A 600 mm × 600 mm × 300 mm pad footing is about 0.11 m³ each.'),
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
        'desc': 'Work out concrete for a round pad or circular slab: enter diameter in metres and thickness in mm to get m³, bags, premix and typical Australian cost.',
        'h1': 'Round concrete pad calculator',
        'about': [
            'Round pads (water tank bases, hot tub pads, circular landings) are flat cylinders: π × radius² × thickness. Enter diameter in metres and thickness in millimetres; a 2.4 m tank pad at 100 mm is about 0.45 m³.',
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
            'Solid concrete stairs stack like wedges: each step adds one more riser-worth of volume than the last. SlabSet assumes every step in the flight has the same rise and going, matching how a real flight is built and how the Australian standard requires it. Enter the step width, rise, going and the number of steps and SlabSet sums the whole flight.',
            'Common Australian external steps use a 150–190 mm rise and 240–355 mm going. Stairs are fiddly to barrow and vibrate, so keep wastage at 10% or more.',
            'If the flight sits on a thickened base slab rather than tapering to nothing at the bottom step, add a base thickness and SlabSet adds that extra concrete across the full footprint.',
        ],
        'faq_first': ('How do I calculate concrete for stairs?',
                      'For a solid flight: width × going × rise × n(n+1)/2, where n is the number of steps. SlabSet does this sum for you.'),
    },
]
for p in PAGES:
    if 'url' not in p:
        p['url'] = SITE + '/' + p['file']

# ---------------------------------------------------------------- fragments

def unit_phrase(unit):
    if unit == 'mm':
        return ' in millimetres'
    if unit == 'm':
        return ' in metres'
    return ''


FIELD_DEFAULTS = {}


def field_rows(shape):
    out = []
    fields = SHAPES[shape]
    for i, (k, label, unit) in enumerate(fields):
        default = FIELD_DEFAULTS.get(shape, {}).get(k, '')
        placeholder = '0 = none' if k == 'BT' else (default or '0')
        hint = 'done' if (i == len(fields) - 1 or k == 'BT') else 'next'
        out.append(
            '<div class="fld" data-field="' + k + '">'
            '<label class="tl" for="fld-' + k + '">' + label + '</label>'
            '<input class="fld-input" type="text" inputmode="decimal" enterkeyhint="' + hint + '" autocomplete="off" spellcheck="false" '
            'id="fld-' + k + '" data-key="' + k + '" value="" placeholder="' + placeholder + '" aria-label="' + label + unit_phrase(unit) + '">'
            '<span class="unit">' + unit + '</span>'
            '<span class="fld-warn" aria-live="polite"></span>'
            '<button type="button" class="fld-fix" data-fix-key="' + k + '" hidden></button></div>'
        )
    return ''.join(out)


def input_rows(shape):
    return ''.join(
        '<div class="sp-row"><span class="k">' + label + '</span><span class="v">0' + ((' ' + unit) if unit else '') + '</span></div>'
        for k, label, unit in SHAPES[shape]
    )


def shape_menu(shape):
    items = ''.join(
        '<button type="button" role="option" aria-selected="' + ('true' if k == shape else 'false')
        + '" class="menu-item' + (' on' if k == shape else '') + '" data-shape="' + k + '">'
        + ICONS[k] + '<span>' + SHAPE_NAMES[k] + '</span><span class="chk">✓</span></button>'
        for k in ['slab', 'footing', 'pierfooting', 'column', 'round', 'stairs']
    )
    return (
        '<div class="shape-menu" id="shapeMenu">'
        '<button type="button" class="fld shape-fld" data-menu-btn aria-haspopup="listbox" aria-expanded="false" aria-controls="shapeMenuPanel">'
        '<span class="tl">Shape</span>'
        '<span class="shape-pick" id="shapePick">' + ICONS[shape]
        + '<span class="shape-pick__name">' + SHAPE_NAMES[shape] + '</span></span>'
        '<svg class="chev" viewBox="0 0 16 10" aria-hidden="true"><path d="M2 2l6 6 6-6"/></svg>'
        '</button>'
        '<div class="menu-panel" id="shapeMenuPanel" role="listbox" aria-label="Shape">' + items + '</div></div>'
    )


WASTE_MENU = (
    '<div class="shape-menu wmenu" id="wasteMenu">'
    '<button type="button" class="menu-btn" data-menu-btn aria-haspopup="listbox" aria-expanded="false" aria-controls="wasteMenuPanel">'
    '<span class="cur">Wastage</span><b data-wcur>10%</b><svg class="chev" viewBox="0 0 16 10" aria-hidden="true"><path d="M2 2l6 6 6-6"/></svg></button>'
    '<div class="menu-panel" id="wasteMenuPanel" role="listbox" aria-label="Wastage allowance">'
    + ''.join(
        '<button type="button" role="option" aria-selected="' + ('true' if pct == 10 else 'false')
        + '" class="menu-item' + (' on' if pct == 10 else '') + '" data-waste="' + str(pct) + '">'
        '<span class="wdesc">' + desc + '</span><span class="wpct">' + str(pct) + '%</span></button>'
        for pct, desc in [(0, 'No allowance'), (5, 'Tidy formwork'), (10, 'Standard site (recommended)'), (15, 'Rough ground'), (20, 'Heavy over-dig')]
    )
    + '</div></div>'
)


def field_view(shape):
    return (
        '<div class="view view-field" id="viewField">'
        '<section class="sec-lcd" aria-label="Volume readout">'
        '<div class="out"><div class="out-a"><div class="out-main"><span class="out-vol-h">VOLUME</span>'
        '<span class="ov"><span data-vol>0.00</span><b>m³</b></span></div></div>'
        '<div class="out-b"><p class="out-guidance" data-guidance>Enter length and width to calculate.</p>'
        '<div class="out-rec" id="outRecommend" hidden>'
        '<span class="out-rec__label">Recommended</span>'
        '<span class="out-rec__body">'
        '<span class="out-rec__value" data-lcd-recommend></span>'
        '<span class="out-rec__price" data-lcd-price></span>'
        '</span></div></div></div>'
        '</section>'
        '<section class="sec-inputs" aria-label="Input fields">'
        '<div class="input-card">'
        + shape_menu(shape)
        + '<div class="flds" id="flds">' + field_rows(shape) + '</div>'
        + WASTE_MENU
        + '</div>'
        + '<button type="button" class="spec-cta" id="specCta">Job sheet</button>'
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
        '<section class="sp-group sp-group--estimate" aria-label="Result"><div class="sp-group-h">Result</div>'
        '<section class="sp-sec sp-sec--sub" aria-label="Volume">'
        '<div class="sp-hero"><span class="hv" data-vol>0.00</span><span class="hu">m³</span></div>'
        '<span class="sp-hero-note" data-waste-incl>includes 10% wastage</span>'
        '</section>'
        '<section class="sp-sec sp-sec--sub sp-sec--divider order-plan" aria-label="Order options" data-order-plan hidden>'
        '<div class="sp-h">Order options</div>'
        '<div class="order-option order-option--recommended">'
        '<div class="order-option__title-row"><p class="order-option__title" data-plan-rec-title></p><span class="order-option__tag">Recommended</span></div>'
        '<p class="order-option__price" data-plan-rec-price></p>'
        '<p class="order-option__why" data-plan-rec-why></p>'
        '</div>'
        '<div class="order-option">'
        '<p class="order-option__title" data-plan-alt-title></p>'
        '<p class="order-option__price" data-plan-alt-price></p>'
        '<p class="order-option__why" data-plan-alt-why></p>'
        '</div>'
        '<p class="order-plan__note" data-plan-note></p>'
        '</section>'
        '</section>'
        '<section class="sp-group" aria-label="Job"><div class="sp-group-h">Job</div>'
        '<section class="sp-sec sp-sec--sub" aria-label="Job description">'
        '<input type="text" class="job-input" id="jobDesc" placeholder="Add description" aria-label="Job description" autocomplete="off">'
        '</section>'
        '<section class="sp-sec sp-sec--sub" aria-label="Dimensions"><div class="sp-h">Dimensions</div>'
        '<div class="sp-row"><span class="k">Shape</span><span class="v" data-shape-name>' + SHAPE_NAMES[shape] + '</span></div>'
        '<div data-input-rows>' + input_rows(shape) + '</div>'
        '<div class="sp-row"><span class="k">Subtotal</span><span class="v"><span data-base-vol>0.00</span> m³</span></div>'
        '<div class="sp-row"><span class="k">Wastage</span><span class="v" data-waste-label>+10%</span></div>'
        '<div class="sp-row sp-row--total"><span class="k">Total</span><span class="v"><span data-order-vol>0.00</span> m³</span></div></section>'
        '<section class="sp-sec sp-sec--sub" aria-label="Quantities"><div class="sp-h">Quantities</div>'
        '<div class="sp-row"><span class="k">Reinforcing mesh</span><span class="v"><span data-mesh>0</span> sheets</span></div>'
        '<div class="sp-row"><span class="k">Formwork edge</span><span class="v"><span data-edge>0.0</span> m</span></div>'
        '<div class="sp-row"><span class="k">Concrete weight</span><span class="v"><span data-weight>0.00</span> t</span></div></section>'
        '</section>'
        '<details class="sp-more"><summary>Help & links</summary>'
        '<section class="sp-sec" aria-label="Frequently asked questions"><div class="sp-h">FAQ</div><div class="faq-list">' + faq_html + '</div></section>'
        '<section class="sp-sec" aria-label="About"><div class="sp-h">About</div>' + about_html + '</section>'
        + other_links(page) +
        '</details>'
        '<p class="sp-fine">Estimates only. Not a supplier quote. Confirm quantities and prices with your supplier.</p>'
        '<p class="sp-foot">SlabSet · Metric Concrete Calculator · Made for Australia · <a href="terms.html">Terms</a> · <a href="privacy.html">Privacy</a> · <a href="mailto:metainstruments@icloud.com">Contact</a></p>'
        '<section class="sp-group sp-group--actions" aria-label="Actions">'
        '<div class="sp-actions"><button type="button" class="back" id="btnBack" data-edit>← Back</button>'
        '<button type="button" class="copy" id="btnCopy">Copy job</button>'
        '<button type="button" class="pdf" id="btnPdf">Save PDF</button>'
        '<button type="button" class="share" id="btnShare" hidden>Share</button></div></section>'
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
    'document.querySelectorAll(\'meta[name="theme-color"]\').forEach(function(m){m.setAttribute(\'content\',\'#16181A\');});'
    '}}catch(e){}})();</script>'
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
<meta name="theme-color" content="#F0F2EA" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#16181A" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#F0F2EA">
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
    <svg class="slogo" viewBox="0 0 88 88" aria-hidden="true">
      <rect class="slogo-bg" x="0" y="0" width="88" height="88" rx="10"/>
      <polygon class="slogo-s" points="12,26 64,26 76,14 24,14"/>
      <polygon class="slogo-s" points="12,50 64,50 76,38 24,38"/>
      <polygon class="slogo-s" points="12,74 64,74 76,62 24,62"/>
      <polygon class="slogo-s" points="12,26 24,14 24,38 12,50"/>
      <polygon class="slogo-s" points="64,50 76,38 76,62 64,74"/>
    </svg>
    <span class="bz">SlabSet</span>
    <div class="appbar-right">
      <button type="button" class="ld-btn" id="themeToggle" aria-label="Switch light/dark theme">''' + MOON_SVG + SUN_SVG + '''</button>
      <button type="button" class="toggle" id="modeToggle" aria-pressed="true"><span class="knob"></span><span class="opt">Calc</span><span class="opt">Job</span></button>
    </div>
  </header>
  ''' + field_view(page['shape']) + '''
  ''' + spec_view(page) + '''
</div>

<button type="button" class="grid-toggle" id="gridToggle" hidden aria-pressed="false">GRID</button>

<p class="copy-toast" id="copyToast" role="status" aria-live="polite" hidden></p>

<div class="install-banner" id="installBanner" hidden>
  <p>Install SlabSet for the best on-site experience</p>
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
