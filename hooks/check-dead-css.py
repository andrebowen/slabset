#!/usr/bin/env python3
"""Flags CSS custom properties and classes defined in shared/styles.css that no
longer have a live reference anywhere else in the site.

This is the exact failure mode that let --diagram-accent, --accent-text, and a
whole dead .buy-tile block survive silently in v23 after the code that used them
changed: nothing else in a plain HTML/CSS/JS site checks this, so a removed
feature's leftover CSS just sits there, invisible, until someone happens to read
it. Runs as a pre-commit hook (see hooks/pre-commit) - bypass a false positive
with `git commit --no-verify`.

Heuristic, not a real CSS/JS parser: a custom property counts as used if the
literal text "var(--name" appears anywhere in the site; a class counts as used
if its bare name appears anywhere outside styles.css (index.html, the other
calculator pages, shared/app.js). That's deliberately how this codebase builds
class lists too (plain string concatenation - see app.js's bagSizeButtons), so
substring matching catches it exactly the same way a browser would resolve it.
False positives are possible (a class reserved for a not-yet-wired feature); the
hook does not block the commit for that reason alone, --no-verify is the escape
hatch, not a bug to work around in this script.
"""
import re
import sys
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
CSS = ROOT / "shared" / "styles.css"

# Classes that are legitimately reserved / applied only in ways this heuristic
# can't see. Keep this list short and justified per entry - it's an escape hatch
# for real exceptions, not a place to silence the check.
CLASS_ALLOWLIST = {
    # Standard visually-hidden a11y utility (see its own comment in styles.css) -
    # infrastructure kept ready for the next screen-reader-only label, not a
    # leftover from a removed feature. Currently unused is fine for this one.
    "sr-only",
}


def read(p):
    return p.read_text(encoding="utf-8")


def strip_comments(css):
    return re.sub(r"/\*.*?\*/", "", css, flags=re.S)


def find_custom_properties(css_nocomments):
    return sorted(set(re.findall(r"--([a-zA-Z0-9-]+)\s*:", css_nocomments)))


def find_class_selectors(css_nocomments):
    names = set()
    for m in re.finditer(r"\.([a-zA-Z_][a-zA-Z0-9_-]*)", css_nocomments):
        names.add(m.group(1))
    return sorted(names)


def haystack_files():
    files = sorted(ROOT.glob("*.html")) + [ROOT / "shared" / "app.js"]
    return [f for f in files if f.exists()]


def literal_count(needle, text):
    pattern = r"(?<![\w-])" + re.escape(needle) + r"(?![\w-])"
    return len(re.findall(pattern, text))


def main():
    if not CSS.exists():
        print("check-dead-css: shared/styles.css not found, skipping")
        return 0

    css = read(CSS)
    nocomments = strip_comments(css)
    haystacks = {f: read(f) for f in haystack_files()}
    css_nocomments_by_file = {CSS: nocomments}

    dead_props = []
    for name in find_custom_properties(nocomments):
        needle = "var(--" + name
        uses = literal_count(needle, nocomments)  # other declarations/usages within styles.css itself
        uses += sum(literal_count(needle, t) for t in haystacks.values())
        if uses == 0:
            dead_props.append(name)

    dead_classes = []
    for name in find_class_selectors(nocomments):
        if name in CLASS_ALLOWLIST:
            continue
        hits = sum(literal_count(name, t) for t in haystacks.values())
        if hits == 0:
            dead_classes.append(name)

    if not dead_props and not dead_classes:
        print("check-dead-css: clean, no orphaned custom properties or classes")
        return 0

    print("check-dead-css: possible dead CSS found\n")
    if dead_props:
        print("Custom properties defined but \"var(--x)\" never appears anywhere:")
        for n in dead_props:
            print("  --" + n)
        print()
    if dead_classes:
        print("Classes defined in styles.css whose name doesn't appear in any .html file or app.js:")
        for n in dead_classes:
            print("  ." + n)
        print()
    print("If any of these are real (reserved for something not wired up yet), commit anyway with:")
    print("  git commit --no-verify")
    return 1


if __name__ == "__main__":
    sys.exit(main())
