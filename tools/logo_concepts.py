"""Build 3 new logo concepts for Servé Beauty Lounge (SRV-20261112-03) from OFL fonts.

Usage: python3 tools/logo_concepts.py <fonts dir> <out dir>
Fonts: Marcellus-Regular.ttf, PinyonScript-Regular.ttf, Montserrat.ttf (variable).
Writes per concept (a, b, c): <c>-stacked-{light,dark}.svg, <c>-header-{light,dark}.svg, <c>-mark.svg.
"light" = for cream background, "dark" = for chocolate background.
"""
import os
import sys

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

FONTS, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)

CHOCO, CREAM, GOLD, GOLD_L = "#3a2a22", "#f6efe6", "#b08a52", "#dcc391"
THEMES = {"light": (CHOCO, GOLD), "dark": (CREAM, GOLD_L)}


def load(name, wght=None):
    f = TTFont(os.path.join(FONTS, name))
    if wght is not None and "fvar" in f:
        f = instancer.instantiateVariableFont(f, {"wght": wght})
    return f


def text(font, s, size, x, y, tracking=0.0, anchor="start"):
    """Path data for s with baseline y. Returns (d, (xmin, ymin, xmax, ymax))."""
    gs, upm, hmtx, cmap = font.getGlyphSet(), font["head"].unitsPerEm, font["hmtx"], font.getBestCmap()
    k = size / upm
    names = [cmap[ord(c)] for c in s]
    adv = [hmtx[n][0] * k for n in names]
    width = sum(adv) + tracking * size * (len(names) - 1)
    if anchor == "middle":
        x -= width / 2
    pen, bp = SVGPathPen(gs), BoundsPen(gs)
    for n, a in zip(names, adv):
        t = (k, 0, 0, -k, x, y)
        gs[n].draw(TransformPen(pen, t))
        gs[n].draw(TransformPen(bp, t))
        x += a + tracking * size
    return pen.getCommands(), bp.bounds


def arch(x0, x1, top, bottom):
    r = (x1 - x0) / 2
    return f"M{x0} {bottom}V{top + r}A{r} {r} 0 0 1 {x1} {top + r}V{bottom}"


def svg(w, h, body, label="Servé Beauty Lounge"):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" '
            f'role="img" aria-label="{label}">\n{body}\n</svg>\n')


def p(d, fill):
    return f'  <path fill="{fill}" d="{d}"/>'


marcellus = load("Marcellus-Regular.ttf")
script = load("PinyonScript-Regular.ttf")
sans = load("Montserrat.ttf", 400)

SUB = "BEAUTY LOUNGE"


def write(name, content):
    with open(os.path.join(OUT, name), "w", encoding="utf-8") as f:
        f.write(content)


# ---------- A: quiet wordmark (Marcellus, like the site headings) ----------
def a_stacked(fg, acc):
    W, H = 520, 230
    d, _ = text(marcellus, "Servé", 120, W / 2, 128, tracking=0.02, anchor="middle")
    sub, _ = text(sans, SUB, 17, W / 2, 196, tracking=0.55, anchor="middle")
    line = f'  <path stroke="{acc}" stroke-width="1.4" d="M{W/2-70} 160H{W/2+70}"/>'
    return svg(W, H, "\n".join([p(d, fg), line, p(sub, acc)]))


def a_header(fg, acc):
    W, H = 300, 96
    d, _ = text(marcellus, "Servé", 56, W / 2, 54, tracking=0.02, anchor="middle")
    sub, _ = text(sans, SUB, 13, W / 2, 86, tracking=0.42, anchor="middle")
    return svg(W, H, "\n".join([p(d, fg), p(sub, acc)]))


def a_mark():
    d, _ = text(marcellus, "S", 46, 32, 48, anchor="middle")
    return svg(64, 64, f'  <rect width="64" height="64" rx="12" fill="{CHOCO}"/>\n' + p(d, GOLD_L), "Servé")


# ---------- B: arch monogram (echoes the arched photos) ----------
def b_arch(cx, top, w, h, fg, acc, stroke=2.2, letter=1.0):
    path = f'  <path fill="none" stroke="{acc}" stroke-width="{stroke}" d="{arch(cx - w/2, cx + w/2, top, top + h)}"/>'
    inner = (f'  <path fill="none" stroke="{acc}" stroke-width="{stroke*0.5}" opacity=".7" '
             f'd="{arch(cx - w/2 + w*0.09, cx + w/2 - w*0.09, top + w*0.09, top + h)}"/>')
    s, _ = text(marcellus, "S", h * 0.52 * letter, cx, top + h * 0.80, anchor="middle")
    base = f'  <path stroke="{acc}" stroke-width="{stroke}" d="M{cx - w/2 - w*0.12} {top+h}H{cx + w/2 + w*0.12}"/>'
    return "\n".join([path, inner, p(s, fg), base])


def b_stacked(fg, acc):
    W, H = 520, 330
    mark = b_arch(W / 2, 20, 104, 150, fg, acc)
    d, _ = text(marcellus, "SERVÉ", 64, W / 2, 252, tracking=0.22, anchor="middle")
    sub, _ = text(sans, SUB, 15, W / 2, 296, tracking=0.6, anchor="middle")
    return svg(W, H, "\n".join([mark, p(d, fg), p(sub, acc)]))


def b_header(fg, acc):
    W, H = 300, 96
    mark = b_arch(36, 12, 46, 70, fg, acc, stroke=1.6)
    d, _ = text(marcellus, "SERVÉ", 38, 82, 56, tracking=0.2)
    sub, _ = text(sans, SUB, 11.5, 84, 82, tracking=0.42)
    return svg(W, H, "\n".join([mark, p(d, fg), p(sub, acc)]))


def b_mark():
    body = f'  <rect width="64" height="64" rx="12" fill="{CHOCO}"/>\n' + b_arch(32, 9, 32, 46, GOLD_L, GOLD_L, stroke=2.4, letter=1.05)
    return svg(64, 64, body, "Servé")


# ---------- C: script signature ----------
def c_stacked(fg, acc):
    W, H = 520, 250
    d, _ = text(script, "Servé", 150, W / 2, 142, anchor="middle")
    sub, _ = text(sans, SUB, 16, W / 2, 214, tracking=0.6, anchor="middle")
    dots = (f'  <path stroke="{acc}" stroke-width="1.2" d="M{W/2-182} 208H{W/2-148}M{W/2+148} 208H{W/2+182}"/>')
    return svg(W, H, "\n".join([p(d, fg), p(sub, acc), dots]))


def c_header(fg, acc):
    W, H = 300, 96
    d, _ = text(script, "Servé", 66, W / 2, 56, anchor="middle")
    sub, _ = text(sans, SUB, 12, W / 2, 88, tracking=0.45, anchor="middle")
    return svg(W, H, "\n".join([p(d, fg), p(sub, acc)]))


def c_mark():
    d, _ = text(script, "S", 58, 33, 47, anchor="middle")
    return svg(64, 64, f'  <rect width="64" height="64" rx="12" fill="{CHOCO}"/>\n' + p(d, GOLD_L), "Servé")


for key, stacked, header, mark in [("a", a_stacked, a_header, a_mark),
                                   ("b", b_stacked, b_header, b_mark),
                                   ("c", c_stacked, c_header, c_mark)]:
    for theme, (fg, acc) in THEMES.items():
        write(f"{key}-stacked-{theme}.svg", stacked(fg, acc))
        write(f"{key}-header-{theme}.svg", header(fg, acc))
    write(f"{key}-mark.svg", mark())
print("ok", OUT)
