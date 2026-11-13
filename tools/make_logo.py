"""Build the Servé Beauty Lounge logo SVGs (SRV-20261112-03).

Chosen 13/11/2026: layout of idea C ("Servé" over "— BEAUTY LOUNGE —") set in the font of idea A (Marcellus).
Text is converted to paths, so the SVGs need no web font.

Usage: python3 tools/make_logo.py <fonts dir> <images dir>
Fonts (OFL, Google Fonts): Marcellus-Regular.ttf, Montserrat.ttf (variable).
Writes: logo.svg (stacked, for dark background), logo-light.svg (stacked, for cream),
        logo-wordmark-dark.svg (header on cream), logo-wordmark.svg (header over the hero photo),
        logo-mark.svg (gold S), logo-mark-light.svg (light gold S), and ../favicon.svg.
"""
import os
import sys

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

FONTS, OUT = sys.argv[1], sys.argv[2]

CHOCO, CREAM, GOLD, GOLD_L = "#3a2a22", "#f6efe6", "#b08a52", "#dcc391"


def load(name, wght=None):
    f = TTFont(os.path.join(FONTS, name))
    if wght is not None and "fvar" in f:
        f = instancer.instantiateVariableFont(f, {"wght": wght})
    return f


def text(font, s, size, x, y, tracking=0.0):
    """Centered on x, baseline y. Returns (path d, bounds)."""
    gs, upm, hmtx, cmap = font.getGlyphSet(), font["head"].unitsPerEm, font["hmtx"], font.getBestCmap()
    k = size / upm
    names = [cmap[ord(c)] for c in s]
    adv = [hmtx[n][0] * k for n in names]
    x -= (sum(adv) + tracking * size * (len(names) - 1)) / 2
    pen, bp = SVGPathPen(gs), BoundsPen(gs)
    for n, a in zip(names, adv):
        t = (k, 0, 0, -k, x, y)
        gs[n].draw(TransformPen(pen, t))
        gs[n].draw(TransformPen(bp, t))
        x += a + tracking * size
    return pen.getCommands(), bp.bounds


def r(v):
    return round(v, 2)


def svg(box, body, label="Servé Beauty Lounge"):
    x0, y0, x1, y1 = box
    w, h = r(x1 - x0), r(y1 - y0)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{r(x0)} {r(y0)} {w} {h}" width="{w}" height="{h}" '
            f'role="img" aria-label="{label}">\n{body}\n</svg>\n')


marcellus = load("Marcellus-Regular.ttf")
sans = load("Montserrat.ttf", 500)


def lockup(fg, acc, name_size, sub_size, gap, dash, pad):
    """'Servé' over '— BEAUTY LOUNGE —'. Returns (body, box)."""
    name, nb = text(marcellus, "Servé", name_size, 0, 0, tracking=0.02)
    sub_y = nb[3] + gap + sub_size * 0.72
    sub, sb = text(sans, "BEAUTY LOUNGE", sub_size, 0, sub_y, tracking=0.42)
    mid = (sb[1] + sb[3]) / 2
    space = sub_size * 0.9
    lines = (f'  <path stroke="{acc}" stroke-width="{r(sub_size * 0.09)}" '
             f'd="M{r(sb[0] - space - dash)} {r(mid)}H{r(sb[0] - space)}M{r(sb[2] + space)} {r(mid)}H{r(sb[2] + space + dash)}"/>')
    body = "\n".join([f'  <path fill="{fg}" d="{name}"/>', f'  <path fill="{acc}" d="{sub}"/>', lines])
    x0 = min(nb[0], sb[0] - space - dash) - pad
    x1 = max(nb[2], sb[2] + space + dash) + pad
    return body, (x0, nb[1] - pad, x1, sb[3] + pad)


def write(name, content):
    with open(os.path.join(OUT, name), "w", encoding="utf-8") as f:
        f.write(content)


# Stacked logo (footer, documents)
for fname, fg, acc in [("logo.svg", CREAM, GOLD_L), ("logo-light.svg", CHOCO, GOLD)]:
    body, box = lockup(fg, acc, 120, 15, 30, 34, 12)
    write(fname, svg(box, body))

# Header wordmark: bigger sub line so it stays readable at ~150px wide
for fname, fg, acc in [("logo-wordmark-dark.svg", CHOCO, GOLD), ("logo-wordmark.svg", CREAM, GOLD_L)]:
    body, box = lockup(fg, acc, 64, 12.5, 14, 14, 4)
    write(fname, svg(box, body))

# Monogram S (signature, portrait placeholder)
for fname, fill in [("logo-mark.svg", GOLD), ("logo-mark-light.svg", GOLD_L)]:
    d, b = text(marcellus, "S", 100, 0, 0)
    write(fname, svg((b[0] - 6, b[1] - 6, b[2] + 6, b[3] + 6), f'  <path fill="{fill}" d="{d}"/>', "Servé"))

# Favicon: light gold S on a chocolate rounded square
d, b = text(marcellus, "S", 46, 32, 0)
dy = 32 - (b[1] + b[3]) / 2
fav = (f'  <rect width="64" height="64" rx="12" fill="{CHOCO}"/>\n'
       f'  <path fill="{GOLD_L}" transform="translate(0 {r(dy)})" d="{d}"/>')
with open(os.path.join(OUT, "..", "favicon.svg"), "w", encoding="utf-8") as f:
    f.write(svg((0, 0, 64, 64), fav, "Servé"))
print("ok")
