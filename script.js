// Sæt salonens booking-link her (fx Planway, Fresha, Booksy, EasyTime…).
const BOOKING_URL = '';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* ---------- Data ---------- */
const COLORS = [
  { id: 'strawberry', name: 'Strawberry', hex: '#ff3d7f' },
  { id: 'peach', name: 'Peach', hex: '#ff9e7a' },
  { id: 'butter', name: 'Butter', hex: '#ffd966' },
  { id: 'mint', name: 'Mint', hex: '#7fddbe' },
  { id: 'lilac', name: 'Lilac', hex: '#b89cff' },
  { id: 'berry', name: 'Berry', hex: '#8a1f5c' },
  { id: 'milk', name: 'Milk', hex: '#f4e3e6' },
];
const FINISHES = [
  { id: 'gloss', name: 'Blank', addon: null },
  { id: 'chrome', name: 'Chrome', addon: 'chrome' },
  { id: 'glitter', name: 'Glitter', addon: 'glitter' },
  { id: 'french', name: 'French', addon: 'french' },
];
const SHAPES = [
  { id: 'almond', name: 'Almond' },
  { id: 'oval', name: 'Oval' },
  { id: 'square', name: 'Square' },
  { id: 'coffin', name: 'Coffin' },
];
const CATEGORIES = [
  { id: 'gel', name: 'Gelé', items: [
    { id: 'gel-nat', name: 'Gelé på naturlige negle', price: 350, min: 60 },
    { id: 'gel-fill', name: 'Opfyldning, gelé', price: 320, min: 60 },
    { id: 'gel-off', name: 'Aftagning med manicure', price: 200, min: 30 },
  ]},
  { id: 'ext', name: 'Forlængelse', items: [
    { id: 'ext-short', name: 'Nyt sæt, kort til medium', price: 450, min: 90 },
    { id: 'ext-long', name: 'Nyt sæt, lang', price: 520, min: 105 },
    { id: 'ext-fill', name: 'Opfyldning', price: 380, min: 75 },
  ]},
  { id: 'feet', name: 'Fødder', items: [
    { id: 'pedi', name: 'Pedicure med gelé', price: 450, min: 75 },
    { id: 'toes', name: 'Gelé på tæer', price: 320, min: 45 },
  ]},
];
const ADDONS = [
  { id: 'french', name: 'French', price: 50, min: 15 },
  { id: 'chrome', name: 'Chrome eller cat eye', price: 60, min: 10 },
  { id: 'glitter', name: 'Glitter', price: 40, min: 5 },
  { id: 'art', name: 'Håndmalet design, 2 negle', price: 40, min: 15 },
  { id: 'remove', name: 'Aftagning af gammelt sæt', price: 100, min: 20 },
];
// Erstattes senere med salonens egne billeder fra Instagram.
const LOOKS = [
  { color: 'strawberry', finish: 'glitter', shape: 'almond' },
  { color: 'lilac', finish: 'chrome', shape: 'coffin' },
  { color: 'milk', finish: 'french', shape: 'almond' },
  { color: 'mint', finish: 'gloss', shape: 'oval' },
  { color: 'peach', finish: 'french', shape: 'square' },
  { color: 'berry', finish: 'glitter', shape: 'coffin' },
  { color: 'butter', finish: 'gloss', shape: 'square' },
  { color: 'strawberry', finish: 'chrome', shape: 'oval' },
];
const HOURS = [ // 0 = søndag
  null, [10, 18], [10, 18], [10, 18], [10, 18], [10, 18], [10, 15],
];
const DAY_NAMES = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];

const byId = (list, id) => list.find((x) => x.id === id);
const lookName = (l) => {
  const c = byId(COLORS, l.color).name;
  const f = l.finish === 'gloss' ? '' : ' ' + byId(FINISHES, l.finish).name.toLowerCase();
  return `${c}${f}, ${byId(SHAPES, l.shape).name.toLowerCase()}`;
};

/* ---------- Booking links ---------- */
function openBooking() {
  if (BOOKING_URL) window.open(BOOKING_URL, '_blank', 'noopener');
  else toast('Bookinglinket sættes ind, når salonen har valgt system.');
}
$$('[data-booking]').forEach((a) => {
  a.href = BOOKING_URL || '#priser';
  if (BOOKING_URL) { a.target = '_blank'; a.rel = 'noopener'; }
});
$('#year').textContent = new Date().getFullYear();

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 4200);
}

/* ---------- Try-on ---------- */
const nailsEl = $('#nails');
const stage = $('#stage');
const look = { color: 'strawberry', finish: 'gloss', shape: 'almond' };
let topLayer = 0;

function radio(name, item, checked, extra = '') {
  return `<label class="${name}-opt"${extra}><input type="radio" name="${name}" value="${item.id}"${checked ? ' checked' : ''}><span>${item.name}</span></label>`;
}
$('#swatches').innerHTML = COLORS.map((c) =>
  radio('color', c, c.id === look.color, ` style="--c:${c.hex}"`)).join('');
$('#finishes').innerHTML = FINISHES.map((f) => radio('finish', f, f.id === look.finish)).join('');
$('#shapes').innerHTML = SHAPES.map((s) => radio('shape', s, s.id === look.shape)).join('');

function paint(hex, animate) {
  const next = 1 - topLayer;
  $$('.nail', nailsEl).forEach((nail, i) => {
    const layers = $$('.paint', nail);
    const fresh = layers[next];
    fresh.style.background = hex;
    fresh.style.zIndex = 2;
    layers[topLayer].style.zIndex = 1;
    if (animate && !reduceMotion) {
      fresh.animate(
        [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }],
        { duration: 560, delay: i * 70, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' },
      );
    }
  });
  topLayer = next;
}

function setLook(next, { animate = true } = {}) {
  const colorChanged = next.color && next.color !== look.color;
  Object.assign(look, next);
  const color = byId(COLORS, look.color);
  if (colorChanged || !animate) paint(color.hex, animate);
  nailsEl.dataset.finish = look.finish;
  nailsEl.dataset.shape = look.shape;
  stage.style.setProperty('--polish', color.hex);
  ['color', 'finish', 'shape'].forEach((k) => {
    const input = $(`input[name="${k}"][value="${look[k]}"]`);
    if (input) input.checked = true;
  });
  const name = lookName(look);
  $('#look-name').textContent = name;
  nailsEl.setAttribute('aria-label', `Fem negle: ${name}`);
}

$('#controls').addEventListener('change', (e) => {
  setLook({ [e.target.name]: e.target.value });
});

// Load-moment: neglene bliver lakeret én efter én.
paint(byId(COLORS, look.color).hex, false);
stage.style.setProperty('--polish', byId(COLORS, look.color).hex);
if (!reduceMotion) {
  $$('.nail .paint', nailsEl).forEach((p) => { p.style.transform = 'scaleY(0)'; });
  requestAnimationFrame(() => setTimeout(() => {
    $$('.nail', nailsEl).forEach((nail, i) => {
      const p = $$('.paint', nail)[topLayer];
      $$('.paint', nail).forEach((x) => { x.style.transform = ''; });
      p.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }],
        { duration: 700, delay: 250 + i * 110, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
    });
  }, 60));
}

/* ---------- Price calculator ---------- */
const calc = { cat: 'gel', item: 'gel-nat', addons: new Set() };

const tabs = $('#tabs');
tabs.insertAdjacentHTML('beforeend', CATEGORIES.map((c) =>
  `<button role="tab" type="button" id="tab-${c.id}" aria-controls="treatments" data-cat="${c.id}">${c.name}</button>`).join(''));
$('#addons').insertAdjacentHTML('beforeend', ADDONS.map((a) =>
  `<label class="addon"><input type="checkbox" value="${a.id}"><span class="addon-name">${a.name}</span><span class="addon-price">+${a.price} kr</span></label>`).join(''));

function moveInk() {
  const active = $(`[role="tab"][aria-selected="true"]`, tabs);
  const ink = $('.tab-ink', tabs);
  ink.style.width = active.offsetWidth + 'px';
  ink.style.transform = `translateX(${active.offsetLeft}px)`;
}

function renderTreatments() {
  const cat = byId(CATEGORIES, calc.cat);
  $$('[role="tab"]', tabs).forEach((t) => {
    const on = t.dataset.cat === calc.cat;
    t.setAttribute('aria-selected', on);
    t.tabIndex = on ? 0 : -1;
  });
  const fs = $('#treatments');
  fs.setAttribute('aria-labelledby', `tab-${calc.cat}`);
  $$('label', fs).forEach((l) => l.remove());
  fs.insertAdjacentHTML('beforeend', cat.items.map((it) =>
    `<label class="treatment"><input type="radio" name="treatment" value="${it.id}"${it.id === calc.item ? ' checked' : ''}>
      <span class="t-name">${it.name}</span><span class="t-meta">${it.min} min</span><span class="t-price">${it.price} kr</span></label>`).join(''));
  moveInk();
}

function animateNumber(el, to) {
  const from = Number(el.textContent) || 0;
  if (reduceMotion || from === to) { el.textContent = to; return; }
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / 380);
    el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - t, 3)));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function findItem(id) {
  for (const c of CATEGORIES) { const it = byId(c.items, id); if (it) return it; }
  return null;
}

function renderSummary() {
  const lines = [];
  const item = findItem(calc.item);
  if (item) lines.push(item);
  ADDONS.filter((a) => calc.addons.has(a.id)).forEach((a) => lines.push({ ...a, addon: true }));
  $('#summary-lines').innerHTML = lines.length
    ? lines.map((l) => `<li><span>${l.addon ? '+ ' : ''}${l.name}</span><span>${l.price} kr</span></li>`).join('')
    : '<li class="empty">Vælg en behandling for at se pris og tid.</li>';
  animateNumber($('#total-price'), lines.reduce((s, l) => s + l.price, 0));
  animateNumber($('#total-time'), lines.reduce((s, l) => s + l.min, 0));
  $$('#addons input').forEach((i) => { i.checked = calc.addons.has(i.value); });
}

tabs.addEventListener('click', (e) => {
  const t = e.target.closest('[role="tab"]');
  if (!t) return;
  calc.cat = t.dataset.cat;
  calc.item = byId(CATEGORIES, calc.cat).items[0].id;
  renderTreatments();
  renderSummary();
});
tabs.addEventListener('keydown', (e) => {
  const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
  if (!step) return;
  const ids = CATEGORIES.map((c) => c.id);
  const next = ids[(ids.indexOf(calc.cat) + step + ids.length) % ids.length];
  $(`[data-cat="${next}"]`, tabs).click();
  $(`[data-cat="${next}"]`, tabs).focus();
});
$('#treatments').addEventListener('change', (e) => { calc.item = e.target.value; renderSummary(); });
$('#addons').addEventListener('change', (e) => {
  e.target.checked ? calc.addons.add(e.target.value) : calc.addons.delete(e.target.value);
  renderSummary();
});
addEventListener('resize', moveInk);
document.fonts?.ready.then(moveInk);

renderTreatments();
renderSummary();

/* ---------- Try-on → booking flow ---------- */
let bookedLook = null;
$('#book-look').addEventListener('click', () => {
  bookedLook = { ...look };
  const addon = byId(FINISHES, look.finish).addon;
  ['french', 'chrome', 'glitter'].forEach((a) => calc.addons.delete(a));
  if (addon) calc.addons.add(addon);
  const sl = $('#summary-look');
  sl.hidden = false;
  sl.innerHTML = `<span class="mini" style="--c:${byId(COLORS, look.color).hex}"></span>Look: ${lookName(look)}`;
  renderSummary();
  $('#priser').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
});

$('#book-summary').addEventListener('click', async () => {
  const item = findItem(calc.item);
  const parts = [item?.name, ...ADDONS.filter((a) => calc.addons.has(a.id)).map((a) => a.name)].filter(Boolean);
  const note = `${parts.join(' + ')}${bookedLook ? `. Look: ${lookName(bookedLook)}` : ''}`;
  try {
    await navigator.clipboard.writeText(note);
    toast('Din behandling er kopieret. Sæt den ind som bemærkning, når du booker.');
  } catch {
    toast(`Skriv i bemærkningen: ${note}`);
  }
  setTimeout(openBooking, 900);
});

/* ---------- Looks gallery ---------- */
const FILTERS = [{ id: 'all', name: 'Alle' }, ...FINISHES];
let filter = 'all';
$('#chips').innerHTML = FILTERS.map((f) =>
  `<button type="button" data-filter="${f.id}" aria-pressed="${f.id === filter}">${f.name}</button>`).join('');

const miniNails = (l) => `<span class="nails mini-nails" data-shape="${l.shape}" data-finish="${l.finish}" aria-hidden="true">${
  [1, 2, 3, 4, 5].map((n) => `<span class="nail n${n}"><i class="paint" style="background:${byId(COLORS, l.color).hex}"></i><i class="fx"></i></span>`).join('')}</span>`;

$('#look-grid').innerHTML = LOOKS.map((l, i) => `
  <li class="look-card" data-finish="${l.finish}" style="--polish:${byId(COLORS, l.color).hex};view-transition-name:look-${i}">
    <button type="button" data-look="${i}" aria-label="Prøv ${lookName(l)}">
      <span class="look-art">${miniNails(l)}</span>
      <span class="look-meta"><span>${lookName(l)}</span><span class="try">Prøv</span></span>
    </button>
  </li>`).join('');

$('#chips').addEventListener('click', (e) => {
  const b = e.target.closest('[data-filter]');
  if (!b || b.dataset.filter === filter) return;
  const apply = () => {
    filter = b.dataset.filter;
    $$('#chips button').forEach((c) => c.setAttribute('aria-pressed', c === b));
    $$('.look-card').forEach((c) => { c.hidden = filter !== 'all' && c.dataset.finish !== filter; });
  };
  if (document.startViewTransition && !reduceMotion) document.startViewTransition(apply);
  else apply();
});

$('#look-grid').addEventListener('click', (e) => {
  const b = e.target.closest('[data-look]');
  if (!b) return;
  setLook(LOOKS[Number(b.dataset.look)]);
  $('#proev').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
});

/* ---------- Opening hours + live status ---------- */
const pad = (h) => `${h}`.padStart(2, '0');
const order = [1, 2, 3, 4, 5, 6, 0];
function cphNow() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Copenhagen', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { day, hour: Number(get('hour')) + Number(get('minute')) / 60 };
}
const now = cphNow();
$('#hours').innerHTML = order.map((d) => {
  const h = HOURS[d];
  return `<dt${d === now.day ? ' class="today"' : ''}>${DAY_NAMES[d]}</dt><dd${d === now.day ? ' class="today"' : ''}>${h ? `${pad(h[0])}–${pad(h[1])}` : 'Lukket'}</dd>`;
}).join('');

(function status() {
  const el = $('[data-status]');
  const today = HOURS[now.day];
  let text;
  let open = false;
  if (today && now.hour >= today[0] && now.hour < today[1]) {
    open = true;
    text = `Åbent nu, til kl. ${pad(today[1])}`;
  } else {
    let d = now.day;
    let offset = 0;
    if (today && now.hour < today[0]) offset = 0;
    else { do { d = (d + 1) % 7; offset++; } while (!HOURS[d]); }
    const when = offset === 0 ? 'i dag' : offset === 1 ? 'i morgen' : DAY_NAMES[d].toLowerCase();
    text = `Lukket nu, åbner ${when} kl. ${pad(HOURS[d][0])}`;
  }
  el.classList.toggle('open', open);
  $('[data-status-text]', el).textContent = text;
  el.hidden = false;
})();
