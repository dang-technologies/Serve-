// Build the site (SRV-20261116-01): src/index.html + content/*.json -> dist/.
// The content files are edited by the salon in Pages CMS (.pages.yml); Vercel runs this on every push.
// Usage: node tools/build.mjs            (no dependencies)
import { cpSync, existsSync, mkdirSync, openSync, readFileSync, readSync, closeSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = join(ROOT, 'dist');
const read = (f) => JSON.parse(readFileSync(join(ROOT, 'content', f), 'utf8'));
const forside = read('forside.json');
const om = read('om.json');
const beh = read('behandlinger.json');
const priser = read('priser.json');
const galleri = read('galleri.json');
const anm = read('anmeldelser.json');
const faq = read('faq.json');
const k = read('kontakt.json');

const warnings = [];
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// **fed** i korte tekster bliver til <strong>
const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
const has = (s) => String(s ?? '').trim() !== '';
const list = (a) => (Array.isArray(a) ? a : []);

// Billedets bredde/højde (JPEG, PNG, WebP), så siden ikke hopper, mens billeder indlæses.
function imageSize(src) {
  const file = join(ROOT, String(src).replace(/^\//, '').split('?')[0]);
  if (!existsSync(file)) { warnings.push(`billede findes ikke: ${src}`); return null; }
  const fd = openSync(file, 'r');
  const buf = Buffer.alloc(256 * 1024);
  const n = readSync(fd, buf, 0, buf.length, 0);
  closeSync(fd);
  const b = buf.subarray(0, n);
  if (b[0] === 0x89 && b.toString('ascii', 1, 4) === 'PNG') return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const t = b.toString('ascii', 12, 16);
    if (t === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
    if (t === 'VP8L') { const v = b.readUInt32LE(21); return { w: (v & 0x3fff) + 1, h: ((v >> 14) & 0x3fff) + 1 }; }
    if (t === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  warnings.push(`kunne ikke læse størrelse: ${src}`);
  return null;
}

function img(src, alt, extra = '') {
  const s = imageSize(src);
  const wh = s ? ` width="${s.w}" height="${s.h}"` : '';
  return `<img src="${esc(src)}" alt="${esc(alt)}"${wh}${extra}>`;
}
const lazy = ' loading="lazy"';

// ---------- Kontakt ----------
const digits = String(k.telefon).replace(/\D/g, '');
const tel = digits.length === 8 ? `+45${digits}` : `+${digits}`;
const [postnr, ...byParts] = String(k.postnr_by).trim().split(/\s+/);
const handle = '@' + (String(k.instagram).match(/instagram\.com\/([^/?#]+)/)?.[1] ?? 'instagram');

// ---------- Tilbud (vises indtil slutdatoen; script.js skjuler det også efter datoen) ----------
const t = forside.tilbud;
const tilbud = t.vis ? `    <!-- TILBUD (redigeres i Pages CMS – skjules automatisk efter slutdatoen) -->
    <aside class="promo"${has(t.slutdato) ? ` data-until="${esc(String(t.slutdato).slice(0, 10))}"` : ''} aria-label="${esc(t.kicker)}">
      ${has(t.billede) ? img(t.billede, t.billede_alt, lazy) : ''}
      <div class="promo-text">
        <p class="kicker">${esc(t.kicker)}</p>
        <p class="promo-title">${md(t.titel)}</p>
        ${has(t.tekst) ? `<p class="promo-sub">${md(t.tekst)}</p>` : ''}
      </div>
      <a class="btn" data-booking href="#">${esc(t.knap || 'Book tid')}</a>
    </aside>` : '';

const fakta = list(forside.fakta).map((f) => `      <div data-reveal><strong>${esc(f.fed)}</strong><span>${esc(f.tekst)}</span></div>`).join('\n');

// ---------- Om / ejer ----------
const paras = (a, indent) => list(a).filter(has).map((p) => `${indent}<p>${md(p)}</p>`).join('\n');
const ejer = om.ejer;
const ejerPortraet = has(ejer.billede)
  ? `        <figure class="owner-portrait owner-photo" data-reveal>
          ${img(ejer.billede, ejer.billede_alt, lazy)}
        </figure>`
  : `        <figure class="owner-portrait" data-reveal>
          <img src="images/logo-mark-light.svg?v=20261113" alt="" width="160" height="160">
          <figcaption>Billede af ejeren kommer her</figcaption>
        </figure>`;

// ---------- Behandlinger ----------
const behandlinger = list(beh.behandlinger).map((b) => {
  const style = has(b.fokus) ? ` style="object-position: ${esc(b.fokus)}"` : '';
  const meta = [b.pris, b.tid].filter(has).map((v) => `<span>${esc(v)}</span>`).join('');
  return `        <article class="service" data-reveal>
          <figure>${img(b.billede, b.billede_alt, lazy + style)}</figure>
          <div class="service-body">
            <h3>${esc(b.navn)}</h3>
            <p>${md(b.tekst)}</p>
            <p class="meta">${meta}</p>
          </div>
        </article>`;
}).join('\n');

// ---------- Galleri ----------
const galleriHtml = list(galleri.billeder).filter((g) => has(g.billede)).map((g) =>
  `        <button class="tile${g.hoej ? ' t-tall' : ''}" type="button" data-reveal>${img(g.billede, g.billede_alt, lazy)}</button>`).join('\n');

// ---------- Priser ----------
const kat = list(priser.kategorier);
const faner = kat.map((c, i) => `          <button role="tab" type="button" id="tab-${i + 1}" aria-controls="panel-${i + 1}" aria-selected="${i === 0}"${i ? ' tabindex="-1"' : ''}>${esc(c.navn)}</button>`).join('\n');
const paneler = kat.map((c, i) => `        <div class="panel" id="panel-${i + 1}" role="tabpanel" aria-labelledby="tab-${i + 1}"${i ? ' hidden' : ''}>
          <dl class="price-list">
${list(c.priser).map((p) => `            <div><dt>${esc(p.navn)}${has(p.detaljer) ? ` <small>${esc(p.detaljer)}</small>` : ''}</dt><dd>${esc(p.pris)}</dd></div>`).join('\n')}
          </dl>
        </div>`).join('\n');

// Struktureret data til Google: alle priser, der starter med et tal.
const amounts = [];
const offers = kat.flatMap((c) => list(c.priser)).flatMap((p) => {
  const m = String(p.pris).trim().match(/^(\d+)/);
  if (!m) return [];
  amounts.push(Number(m[1]));
  return [{ '@type': 'Offer', itemOffered: { '@type': 'Service', name: p.navn }, price: m[1], priceCurrency: 'DKK' }];
});
const priceRange = amounts.length ? `${Math.min(...amounts)}–${Math.max(...amounts)} kr` : '';

// ---------- Anmeldelser ----------
const reviews = list(anm.anmeldelser).filter((r) => has(r.tekst));
const anmeldelser = anm.vis && reviews.length ? `    <!-- TESTIMONIALS (redigeres i Pages CMS) -->
    <section class="reviews section" id="anmeldelser" aria-labelledby="reviews-title">
      <div class="section-head center" data-reveal>
        <p class="kicker">Anmeldelser</p>
        <h2 id="reviews-title">Det siger vores kunder</h2>
        ${has(anm.undertekst) ? `<p class="rating">${esc(anm.undertekst)}</p>` : ''}
      </div>
      <div class="slider" id="slider" aria-roledescription="karrusel" aria-label="Kundeanmeldelser">
        <div class="slides" id="slides">
${reviews.map((r) => `          <figure class="review" aria-roledescription="slide">
            <blockquote>“${esc(r.tekst)}”</blockquote>
            <figcaption><strong>${esc(r.navn || 'Kunde')}</strong>${has(r.behandling) ? `<span>${esc(r.behandling)}</span>` : ''}</figcaption>
          </figure>`).join('\n')}
        </div>
        <div class="slider-nav">
          <button type="button" class="round" data-slide="-1" aria-label="Forrige anmeldelse"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>
          <div class="dots" id="dots"></div>
          <button type="button" class="round" data-slide="1" aria-label="Næste anmeldelse"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>
        </div>
      </div>
    </section>` : '';

// ---------- FAQ ----------
const qa = list(faq.spoergsmaal).filter((q) => has(q.spoergsmaal) && has(q.svar));
const faqHtml = qa.map((q) => `        <details><summary>${esc(q.spoergsmaal)}</summary><p>${md(q.svar)}</p></details>`).join('\n');
const faqLd = qa.map((q) => ({ '@type': 'Question', name: q.spoergsmaal, acceptedAnswer: { '@type': 'Answer', text: String(q.svar).replace(/\*\*/g, '') } }));

// JSON inde i <script>: undgå at "</" lukker scriptet.
const json = (v) => JSON.stringify(v).replace(/</g, '\\u003c');

const slots = {
  hero_kicker: esc(forside.hero.kicker),
  hero_titel: esc(forside.hero.titel),
  hero_tekst: md(forside.hero.tekst),
  hero_billede: img(forside.hero.billede, forside.hero.billede_alt, ' fetchpriority="high"'),
  tilbud,
  fakta,
  om_overskrift: esc(om.om.overskrift),
  om_afsnit: paras(om.om.afsnit, '        '),
  om_punkter: list(om.om.punkter).filter(has).map((p) => `          <li>${esc(p)}</li>`).join('\n'),
  om_billede: img(om.om.billede, om.om.billede_alt, lazy),
  ejer_portraet: ejerPortraet,
  ejer_overskrift: esc(ejer.overskrift),
  ejer_afsnit: paras(ejer.afsnit, '          '),
  behandlinger_intro: md(beh.intro),
  behandlinger,
  galleri: galleriHtml,
  pris_intro: md(priser.intro),
  pris_faner: faner,
  pris_paneler: paneler,
  pris_note: md(priser.note),
  anmeldelser,
  faq: faqHtml,
  telefon: esc(k.telefon),
  tel_e164: esc(tel),
  adresse: esc(k.adresse),
  postnr_by: esc(k.postnr_by),
  tider: esc(k.tider),
  maps_url: esc(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${k.adresse}, ${k.postnr_by}`)}`),
  instagram: esc(k.instagram),
  instagram_handle: esc(handle),
  tiktok: esc(k.tiktok),
  facebook: esc(k.facebook),
  tel_json: json(tel),
  price_range_json: json(priceRange),
  adresse_json: json(k.adresse),
  postnr_json: json(postnr),
  by_json: json(byParts.join(' ')),
  same_as_jsonld: json([k.instagram, k.tiktok, k.facebook].filter(has)),
  offers_jsonld: json(offers),
  faq_jsonld: json(faqLd),
};

let html = readFileSync(join(ROOT, 'src', 'index.html'), 'utf8');
html = html.replace(/\{\{\{?(\w+)\}?\}\}/g, (all, name) => {
  if (!(name in slots)) throw new Error(`ukendt felt i skabelonen: ${all}`);
  return slots[name];
});

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);
writeFileSync(join(OUT, 'index.html'), html);
for (const f of ['styles.css', 'script.js', 'favicon.svg', 'images']) cpSync(join(ROOT, f), join(OUT, f), { recursive: true });

for (const w of warnings) console.warn(`ADVARSEL: ${w}`);
console.log(`ok: dist/ (${kat.length} priskategorier, ${galleriHtml.split('\n').length} galleribilleder, ${reviews.length} anmeldelser)`);
