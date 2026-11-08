// Sæt salonens booking-link her (fx Planway, Fresha, Booksy, EasyTime…).
const BOOKING_URL = '';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
// ?static: vis alt uden animation (bruges til skærmbilleder af hele siden).
const STATIC = new URLSearchParams(location.search).has('static');
if (!STATIC) document.documentElement.classList.add('js');
else document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });

/* ---------- Booking ---------- */
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 4000);
}
$$('[data-booking]').forEach((a) => {
  if (BOOKING_URL) {
    a.href = BOOKING_URL; a.target = '_blank'; a.rel = 'noopener';
  } else {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      toast('Bookinglinket sættes ind, når salonen har valgt system.');
    });
  }
});
$('#year').textContent = new Date().getFullYear();

/* ---------- Header + mobile menu ---------- */
const header = $('#header');
const onScroll = () => header.classList.toggle('scrolled', scrollY > 24);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

const menuBtn = $('#menu-btn');
const nav = $('#nav');
function setMenu(open) {
  menuBtn.setAttribute('aria-expanded', open);
  document.body.classList.toggle('menu-open', open);
}
menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

/* ---------- Load sequence + scroll reveals ---------- */
requestAnimationFrame(() => document.body.classList.add('loaded'));

// Reveal: tjek position ved scroll (billeder med clip-path måles via forælderen).
let pending = [
  ...$$('[data-reveal]').map((el) => ({ el, probe: el })),
  ...$$('[data-reveal-img]').map((el) => ({ el, probe: el.parentElement })),
];
$$('[data-reveal]').forEach((el) => {
  // Små forsinkelser for elementer i samme række
  const sibs = [...el.parentElement.children].filter((c) => c.hasAttribute('data-reveal'));
  const idx = sibs.indexOf(el);
  if (idx > 0) el.style.setProperty('--d', `${Math.min(idx, 5) * 90}ms`);
});
function reveal() {
  const limit = innerHeight * 0.92;
  pending = pending.filter(({ el, probe }) => {
    const r = probe.getBoundingClientRect();
    // Også elementer, der er scrollet forbi (fx ved hop via menuen), vises.
    if (r.top < limit) { el.classList.add('in'); return false; }
    return true;
  });
  if (!pending.length) removeEventListener('scroll', reveal);
}
addEventListener('scroll', reveal, { passive: true });
addEventListener('resize', reveal);
addEventListener('load', reveal);
reveal();

/* ---------- Counters ---------- */
let counters = $$('[data-count]');
function runCount(el) {
  const to = Number(el.dataset.count);
  const dec = Number(el.dataset.decimals || 0);
  const fmt = (v) => v.toLocaleString('da-DK', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  if (reduceMotion || STATIC) { el.textContent = fmt(to); return; }
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / 1600);
    el.textContent = fmt(to * (1 - Math.pow(1 - t, 4)));
    if (t < 1) requestAnimationFrame(step);
    else el.textContent = fmt(to);
  };
  requestAnimationFrame(step);
}
function checkCounters() {
  counters = counters.filter((el) => {
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight * 0.9) { runCount(el); return false; }
    return true;
  });
  if (!counters.length) removeEventListener('scroll', checkCounters);
}
addEventListener('scroll', checkCounters, { passive: true });
checkCounters();

/* ---------- Hero parallax ---------- */
if (!reduceMotion) {
  const arch = $('.arch img');
  const bubble = $('.bubble');
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = Math.min(scrollY, 1000);
      arch.style.translate = `0 ${y * 0.08}px`;
      bubble.style.translate = `0 ${y * -0.12}px`;
      ticking = false;
    });
  }, { passive: true });
}

/* ---------- Price tabs ---------- */
const tabs = $('#tabs');
const tabBtns = $$('[role="tab"]', tabs);
function moveInk() {
  const a = $('[aria-selected="true"]', tabs);
  const ink = $('.tab-ink', tabs);
  ink.style.width = `${a.offsetWidth}px`;
  ink.style.height = `${a.offsetHeight}px`;
  ink.style.transform = `translate(${a.offsetLeft}px, ${a.offsetTop}px)`;
}
function selectTab(btn, focus) {
  tabBtns.forEach((b) => {
    const on = b === btn;
    b.setAttribute('aria-selected', on);
    b.tabIndex = on ? 0 : -1;
    $(`#${b.getAttribute('aria-controls')}`).hidden = !on;
  });
  moveInk();
  if (focus) btn.focus();
}
tabBtns.forEach((b, i) => {
  b.addEventListener('click', () => selectTab(b));
  b.addEventListener('keydown', (e) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (step) { e.preventDefault(); selectTab(tabBtns[(i + step + tabBtns.length) % tabBtns.length], true); }
  });
});
addEventListener('resize', moveInk);
document.fonts?.ready.then(moveInk);
moveInk();

/* ---------- Reviews slider ---------- */
const slides = $('#slides');
const reviewEls = $$('.review', slides);
const dots = $('#dots');
let current = 0;
let timer;
dots.innerHTML = reviewEls.map((_, i) => `<button type="button" aria-label="Anmeldelse ${i + 1}"></button>`).join('');
function go(i) {
  current = (i + reviewEls.length) % reviewEls.length;
  reviewEls.forEach((r, k) => {
    r.classList.toggle('active', k === current);
    r.setAttribute('aria-hidden', k !== current);
  });
  $$('button', dots).forEach((d, k) => d.setAttribute('aria-current', k === current));
}
function auto() {
  clearInterval(timer);
  if (!reduceMotion) timer = setInterval(() => go(current + 1), 6500);
}
$$('[data-slide]').forEach((b) => b.addEventListener('click', () => { go(current + Number(b.dataset.slide)); auto(); }));
$$('button', dots).forEach((d, k) => d.addEventListener('click', () => { go(k); auto(); }));
$('#slider').addEventListener('mouseenter', () => clearInterval(timer));
$('#slider').addEventListener('mouseleave', auto);
// Swipe på mobil
let touchX = null;
slides.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
slides.addEventListener('touchend', (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 40) { go(current + (dx < 0 ? 1 : -1)); auto(); }
  touchX = null;
}, { passive: true });
go(0);
auto();

/* ---------- FAQ: én åben ad gangen ---------- */
$$('.faq details').forEach((d) => d.addEventListener('toggle', () => {
  if (d.open) $$('.faq details').forEach((o) => { if (o !== d) o.open = false; });
}));

/* ---------- Lightbox ---------- */
const lb = $('#lightbox');
const lbImg = $('#lightbox-img');
$('#masonry').addEventListener('click', (e) => {
  const tile = e.target.closest('.tile');
  if (!tile) return;
  const img = $('img', tile);
  lbImg.src = img.src.replace(/w=\d+&h=\d+/, 'w=1400&h=1400').replace('fit=crop', 'fit=max');
  lbImg.alt = img.alt;
  lb.showModal();
});
$('#lb-close').addEventListener('click', () => lb.close());
lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });

/* ---------- Opening hours ---------- */
const HOURS = [null, [10, 18], [10, 18], [10, 18], [10, 18], [10, 18], [10, 15]]; // 0 = søndag
const DAYS = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];
const pad = (h) => `${h}`.padStart(2, '0');
const parts = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Copenhagen', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
}).formatToParts(new Date());
const get = (t) => parts.find((p) => p.type === t).value;
const now = {
  day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday')),
  hour: Number(get('hour')) + Number(get('minute')) / 60,
};
$('#hours').innerHTML = [1, 2, 3, 4, 5, 6, 0].map((d) => {
  const h = HOURS[d];
  const cls = d === now.day ? ' class="today"' : '';
  return `<dt${cls}>${DAYS[d]}</dt><dd${cls}>${h ? `${pad(h[0])}–${pad(h[1])}` : 'Lukket'}</dd>`;
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
    if (!(today && now.hour < today[0])) { do { d = (d + 1) % 7; offset++; } while (!HOURS[d]); }
    const when = offset === 0 ? 'i dag' : offset === 1 ? 'i morgen' : DAYS[d].toLowerCase();
    text = `Lukket nu, åbner ${when} kl. ${pad(HOURS[d][0])}`;
  }
  el.classList.toggle('open', open);
  $('[data-status-text]', el).textContent = text;
  el.hidden = false;
})();
