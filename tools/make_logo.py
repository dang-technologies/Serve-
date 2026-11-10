"""Build Servé SB logo SVGs from OFL fonts (glyphs converted to paths)."""
import sys, os
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.varLib import instancer

FONTS, OUT = sys.argv[1], sys.argv[2]

def load(name, wght=None):
    f = TTFont(os.path.join(FONTS, name))
    if wght is not None and 'fvar' in f:
        f = instancer.instantiateVariableFont(f, {"wght": wght})
    return f

def glyph(font, ch):
    cmap = font.getBestCmap()
    return cmap[ord(ch)]

def text_path(font, text, size, x, y, tracking=0.0, anchor="start"):
    """Return (path_d, width, bounds) for text; baseline at y."""
    gs = font.getGlyphSet()
    upm = font['head'].unitsPerEm
    s = size / upm
    hmtx = font['hmtx']
    names = [glyph(font, c) for c in text]
    adv = [hmtx[n][0] * s for n in names]
    width = sum(adv) + tracking * size * (len(names) - 1)
    if anchor == "middle":
        x -= width / 2
    pen = SVGPathPen(gs)
    bp = BoundsPen(gs)
    cx = x
    for n, a in zip(names, adv):
        t = (s, 0, 0, -s, cx, y)
        gs[n].draw(TransformPen(pen, t))
        gs[n].draw(TransformPen(bp, t))
        cx += a + tracking * size
    return pen.getCommands(), width, bp.bounds

GOLD = '''<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7a5528"/><stop offset=".32" stop-color="#c39b5e"/>
      <stop offset=".5" stop-color="#f0dba6"/><stop offset=".68" stop-color="#b88c4c"/>
      <stop offset="1" stop-color="#6e4b22"/></linearGradient>'''

swash = load("CormorantGaramond-Italic.ttf", 500)
roman = load("CinzelDecorative-Regular.ttf")
cinzel = load("Cinzel.ttf", 400)
sans = load("Montserrat.ttf", 300)
sym = load("NotoSansSymbols.ttf", 400)

def monogram(cx, base, size):
    """B behind, tall swash S in front; B is knocked out in a thin gap around S."""
    b_d, _, _ = text_path(cinzel, "B", size, cx + size * 0.10, base, anchor="middle")
    s_d, _, _ = text_path(swash, "S", size * 1.55, cx - size * 0.06, base + size * 0.16, anchor="middle")
    return s_d, b_d

def svg(w, h, body, defs="", x0=0):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0} 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="Servé Beauty Lounge">\n  <defs>\n    {GOLD}\n{defs}  </defs>\n{body}\n</svg>\n'

def mono_block(cx, base, size, mid):
    s_d, b_d = monogram(cx, base, size)
    defs = f'''    <mask id="ko{mid}" maskUnits="userSpaceOnUse">
      <rect x="-1000" y="-1000" width="4000" height="4000" fill="#fff"/>
      <path d="{s_d}" fill="#000" stroke="#000" stroke-width="{size*0.05:.1f}" stroke-linejoin="round"/>
    </mask>\n'''
    body = (f'  <path d="{b_d}" fill="url(#gold)" mask="url(#ko{mid})"/>\n'
            f'  <path d="{s_d}" fill="url(#gold)"/>')
    return defs, body

# 1) Full lockup
W, H = 620, 680
d1, b1 = mono_block(W / 2, 330, 300, "1")
word_d, _, _ = text_path(cinzel, "SERVÉ", 116, W / 2, 490, tracking=0.16, anchor="middle")
sub_d, _, _ = text_path(sans, "BEAUTY LOUNGE", 30, W / 2, 552, tracking=0.5, anchor="middle")
fl_d, _, fb = text_path(sym, "⚜", 44, W / 2, 628, anchor="middle")
lines = '  <path d="M150 612H275M345 612H470" stroke="#b88c4c" stroke-width="2" fill="none"/>'
body = b1 + f'\n  <path d="{word_d}" fill="url(#gold)"/>\n  <path d="{sub_d}" fill="url(#gold)"/>\n  <path d="{fl_d}" fill="url(#gold)"/>\n' + lines
open(os.path.join(OUT, "logo.svg"), "w").write(svg(W, H, body, d1))

# 2) Monogram only (square)
d2, b2 = mono_block(160, 248, 250, "2")
open(os.path.join(OUT, "logo-mark.svg"), "w").write(svg(320, 320, b2, d2))

# 3) Wordmark for the header (SERVÉ + BEAUTY LOUNGE)
w_d, ww, _ = text_path(cinzel, "SERVÉ", 64, 230, 70, tracking=0.16, anchor="middle")
s2_d, _, _ = text_path(sans, "BEAUTY LOUNGE", 17, 230, 104, tracking=0.5, anchor="middle")
open(os.path.join(OUT, "logo-wordmark.svg"), "w").write(
    svg(300, 116, x0=80, body=f'  <path d="{w_d}" fill="url(#gold)"/>\n  <path d="{s2_d}" fill="url(#gold)"/>'))

# 4) Favicon: monogram on chocolate
fd, fbody = mono_block(32, 50, 50, "3")
open(os.path.join(OUT, "favicon.svg"), "w").write(
    svg(64, 64, '  <rect width="64" height="64" rx="14" fill="#3a2a22"/>\n' + fbody, fd))
# 5) Darker gold variant of the wordmark for light backgrounds (header)
DARK = GOLD.replace('#c39b5e', '#9a7440').replace('#f0dba6', '#c9a56b').replace('#b88c4c', '#8d6634').replace('#7a5528', '#5e4120').replace('#6e4b22', '#55391b')
w_d2, _, _ = text_path(cinzel, "SERVÉ", 64, 230, 70, tracking=0.16, anchor="middle")
s3_d, _, _ = text_path(load("Montserrat.ttf", 400), "BEAUTY LOUNGE", 18, 230, 106, tracking=0.42, anchor="middle")
open(os.path.join(OUT, "logo-wordmark-dark.svg"), "w").write(
    svg(300, 116, x0=80, body=f'  <path d="{w_d2}" fill="url(#gold)"/>\n  <path d="{s3_d}" fill="url(#gold)"/>').replace(GOLD, DARK))
print("ok", ww)
