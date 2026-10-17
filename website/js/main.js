// SECTOR 9: CINDERFALL — website behaviour.
//
// One small module, no dependencies. Every feature is progressive: the page
// is complete without this file, and each block below only enhances markup
// that is already there (and quietly does nothing if it is not).

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const root = document.documentElement;
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const reducedMotion = () => motionQuery.matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const desktop = window.matchMedia('(min-width: 1024px)');

root.classList.remove('no-js');
root.classList.add('js');

let CONFIG = {};
try { CONFIG = JSON.parse($('#site-config')?.textContent || '{}'); } catch { CONFIG = {}; }

// ------------------------------------------------------------- header
function initHeader() {
  const header = $('[data-header]');
  const hero = $('.hero');
  if (!header) return;
  // Scrolled state from an observer, not a scroll listener.
  if (hero && 'IntersectionObserver' in window) {
    const sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:24px;pointer-events:none';
    hero.prepend(sentinel);
    new IntersectionObserver(([e]) => header.classList.toggle('is-scrolled', !e.isIntersecting)).observe(sentinel);
  }

  const toggle = $('[data-nav-toggle]');
  const nav = $('#site-nav');
  const label = $('[data-nav-toggle-label]');
  if (!toggle || !nav) return;
  const setOpen = (open, { returnFocus = false } = {}) => {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    if (label) label.textContent = open ? 'Close menu' : 'Open menu';
    if (open) $('a', nav)?.focus({ preventScroll: true });
    else if (returnFocus) toggle.focus({ preventScroll: true });
  };
  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';
  toggle.addEventListener('click', () => setOpen(!isOpen()));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) setOpen(false, { returnFocus: true });
  });
  // a disclosure, not a modal: leaving it (focus or tap elsewhere) closes it
  header.addEventListener('focusout', (e) => {
    if (isOpen() && e.relatedTarget && !header.contains(e.relatedTarget)) setOpen(false);
  });
  document.addEventListener('pointerdown', (e) => {
    if (isOpen() && !header.contains(e.target)) setOpen(false);
  });
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  desktop.addEventListener('change', () => { if (desktop.matches) setOpen(false); });
}

// Active section in the nav.
function initActiveNav() {
  const links = new Map($$('.site-nav__link[data-nav]').map((a) => [a.dataset.nav, a]));
  const sections = $$('[data-section]');
  if (!links.size || !sections.length || !('IntersectionObserver' in window)) return;
  const visible = new Map();
  const update = () => {
    let best = null, bestRatio = 0;
    for (const [el, ratio] of visible) if (ratio > bestRatio) { best = el; bestRatio = ratio; }
    const key = best?.dataset.section;
    for (const [k, a] of links) {
      if (k === key) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    }
  };
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) visible.set(e.target, e.intersectionRatio);
      else visible.delete(e.target);
    }
    update();
  }, { rootMargin: '-35% 0px -55% 0px', threshold: [0, 0.01, 0.25, 0.5, 1] });
  sections.forEach((s) => io.observe(s));
  // the hero and the final band own no nav item: clear it there
  for (const id of ['top', 'deploy', 'screens']) {
    const el = document.getElementById(id);
    if (el) io.observe(el);
  }
}

// In-page links: let CSS do the smooth scroll, then hand focus to the
// target so keyboard and screen-reader users land where the page did.
function initAnchors() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
    const id = decodeURIComponent(a.getAttribute('href').slice(1));
    const target = id ? document.getElementById(id) : null;
    if (!target) return;
    const heading = id === 'top' || id === 'main' ? target : ($('h2, h1', target) || target);
    window.setTimeout(() => {
      if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }, reducedMotion() ? 0 : 450);
  });
}

// ------------------------------------------------------------ reveals
function initReveals() {
  const items = $$('[data-reveal]');
  if (!items.length || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-visible');
      io.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  items.forEach((el) => io.observe(el));
  root.classList.add('reveal-ready');
  // small looping details outside the hero only run while they are on screen
  const live = new IntersectionObserver((entries) => {
    for (const e of entries) e.target.classList.toggle('in-view', e.isIntersecting);
  });
  $$('[data-in-view]').forEach((el) => live.observe(el));
}

// --------------------------------------------------------------- hero
function initHero() {
  const hero = $('.hero');
  if (!hero) return;
  // pause every hero animation while it is off screen
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => hero.classList.toggle('is-offscreen', !e.isIntersecting)).observe(hero);
  }

  const embers = $('[data-embers]', hero);
  const makeEmbers = () => {
    if (!embers) return;
    embers.textContent = '';
    if (reducedMotion()) return;
    const n = window.innerWidth < 600 ? 7 : window.innerWidth < 1024 ? 11 : 16;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < n; i++) {
      // outer span rises and fades, inner one sways: two compositor-only
      // animations with fixed keyframes, randomised by timing alone
      const s = document.createElement('span');
      s.className = 'ember';
      s.appendChild(document.createElement('i'));
      const size = 2 + Math.random() * 2.6;
      s.style.cssText = [
        `--x:${(Math.random() * 100).toFixed(1)}%`, `--s:${size.toFixed(1)}px`,
        `--t:${(9 + Math.random() * 9).toFixed(1)}s`, `--sw:${(2.5 + Math.random() * 3).toFixed(1)}s`,
        `--delay:-${(Math.random() * 14).toFixed(1)}s`,
      ].join(';');
      frag.appendChild(s);
    }
    embers.appendChild(frag);
  };
  makeEmbers();
  motionQuery.addEventListener('change', makeEmbers);

  // Parallax fallback for browsers without scroll-driven animations.
  const layers = $$('.sky-layer[data-depth]', hero);
  const rates = { far: 0.09, mid: 0.05, near: 0.015 };
  if (layers.length && !(window.CSS && CSS.supports('animation-timeline: scroll()'))) {
    let ticking = false, inView = true;
    const apply = () => {
      ticking = false;
      if (reducedMotion() || !inView) return;
      const y = Math.min(window.scrollY, hero.offsetHeight);
      for (const l of layers) l.style.transform = `translate3d(0, ${(y * rates[l.dataset.depth]).toFixed(1)}px, 0)`;
    };
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { inView = e.isIntersecting; }).observe(hero);
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(apply); } }, { passive: true });
  }

  // Gentle pointer tilt on the phone — desktop, fine pointers only.
  const device = $('[data-tilt]');
  const body = device && $('.device__body', device);
  if (body) {
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const step = () => {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      body.style.setProperty('--ry', `${cx.toFixed(2)}deg`);
      body.style.setProperty('--rx', `${cy.toFixed(2)}deg`);
      raf = Math.abs(tx - cx) > 0.01 || Math.abs(ty - cy) > 0.01 ? requestAnimationFrame(step) : 0;
    };
    hero.addEventListener('pointermove', (e) => {
      if (!finePointer.matches || !desktop.matches || reducedMotion() || e.pointerType !== 'mouse') return;
      const r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 8;
      ty = -((e.clientY - r.top) / r.height - 0.5) * 5;
      if (!raf) raf = requestAnimationFrame(step);
    });
    hero.addEventListener('pointerleave', () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(step); });
  }
}

// ------------------------------------------------------------ dialogs
// Native <dialog>: showModal() makes the rest of the page inert and gives
// Escape for free. We add focus return and backdrop-click closing.
function dialogController(dialog, { onClose } = {}) {
  let opener = null;
  const close = () => { if (dialog.open) dialog.close(); };
  dialog.addEventListener('close', () => {
    onClose?.();
    root.style.overflow = '';
    if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    opener = null;
  });
  dialog.addEventListener('click', (e) => {
    // a click on the ::backdrop lands on the dialog element itself
    if (e.target === dialog) close();
  });
  return {
    open(from) {
      opener = from || document.activeElement;
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      root.style.overflow = 'hidden';
    },
    close,
  };
}

function trailerEmbed(url) {
  if (!url) return null;
  try {
    const u = new URL(url, location.href);
    const host = u.hostname.replace(/^www\./, '');
    let id = null;
    if (host === 'youtu.be') id = u.pathname.slice(1);
    else if (host.endsWith('youtube.com')) id = u.searchParams.get('v') || (u.pathname.match(/\/(?:embed|shorts)\/([\w-]+)/) || [])[1];
    if (id && /^[\w-]{6,}$/.test(id)) {
      const f = document.createElement('iframe');
      f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
      f.title = 'SECTOR 9: CINDERFALL trailer';
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      f.referrerPolicy = 'strict-origin-when-cross-origin';
      return f;
    }
    if (/\.(mp4|webm)$/i.test(u.pathname)) {
      const v = document.createElement('video');
      v.src = u.href; v.controls = true; v.playsInline = true; v.preload = 'metadata';
      v.setAttribute('aria-label', 'SECTOR 9: CINDERFALL trailer');
      return v;
    }
  } catch { /* fall through to the placeholder */ }
  return null;
}

function initTrailer() {
  const dialog = $('[data-trailer]');
  if (!dialog) return;
  const media = $('[data-trailer-media]', dialog);
  const placeholder = media?.innerHTML || '';
  const ctl = dialogController(dialog, {
    // stop playback by removing the player; restore the placeholder markup
    onClose: () => { if (media && CONFIG.trailerUrl) media.innerHTML = placeholder; },
  });
  $$('[data-trailer-open]').forEach((btn) => btn.addEventListener('click', () => {
    const embed = trailerEmbed(CONFIG.trailerUrl);
    if (embed && media) { media.textContent = ''; media.appendChild(embed); }
    else if (CONFIG.trailerUrl && media) {
      // a trailer exists but cannot be embedded here: link to it plainly
      const title = $('.trailer-placeholder__title', media), copy = $('.trailer-placeholder p:not([class])', media);
      const link = $('[data-modal-close-nav]', media);
      if (title) title.textContent = 'Watch the trailer';
      if (copy) copy.textContent = 'The trailer is hosted elsewhere and opens in a new tab.';
      if (link) { link.href = CONFIG.trailerUrl; link.target = '_blank'; link.rel = 'noopener'; link.textContent = 'Open the trailer'; link.removeAttribute('data-modal-close-nav'); }
      $('.trailer-placeholder__tag', media)?.remove();
    }
    ctl.open(btn);
    $('[data-modal-close]', dialog)?.focus();
  }));
  $$('[data-modal-close]', dialog).forEach((b) => b.addEventListener('click', ctl.close));
  $$('[data-modal-close-nav]', dialog).forEach((a) => a.addEventListener('click', () => ctl.close()));
}

// --------------------------------------------------------- threat meter
const THREAT = [
  { name: 'Hidden', glyph: '', color: '#8B93A2', fill: 0.06, msg: 'Unaware. Patrol routes unchanged — they have not seen you.' },
  { name: 'Suspicious', glyph: '?', color: '#E8C65A', fill: 0.3, msg: 'Something caught their eye. Stay low, keep still, break line of sight.' },
  { name: 'Searching', glyph: '?', color: '#E8A05A', fill: 0.55, msg: 'They are hunting your last known position, scanning left and right.' },
  { name: 'Detected', glyph: '!', color: '#FF8A4A', fill: 0.8, msg: 'You have been spotted. Nearby hostiles are being called in.' },
  { name: 'Combat', glyph: '!!', color: '#FF5C46', fill: 1, msg: 'Weapons free. Expect them to strafe, take cover and push.' },
];
function initThreat() {
  const box = $('[data-threat]');
  if (!box) return;
  const fill = $('[data-threat-fill]', box), state = $('[data-threat-state]', box);
  const glyph = $('[data-threat-glyph]', box), msg = $('[data-threat-msg]', box);
  const steps = $$('[data-step]', box);
  const next = $('[data-threat-next]', box), reset = $('[data-threat-reset]', box);
  let level = 0;
  const render = (announce = true) => {
    const s = THREAT[level];
    box.dataset.level = String(level);
    box.style.setProperty('--tc', s.color);
    fill.style.setProperty('--tf', String(s.fill));
    state.textContent = s.name;
    glyph.textContent = s.glyph;
    steps.forEach((li, i) => { li.classList.toggle('is-on', i === level); li.classList.toggle('is-past', i < level); });
    if (announce) msg.textContent = `${s.name}. ${s.msg.replace(/^Unaware\. /, '')}`;
    next.textContent = level === THREAT.length - 1 ? 'Break contact' : 'Advance threat';
  };
  next.addEventListener('click', () => { level = (level + 1) % THREAT.length; render(); });
  reset.addEventListener('click', () => { level = 0; render(); });
  render(false);
}

// ----------------------------------------------------------- HUD strip
// The VK-77's real numbers: 30-round magazine, 120 in reserve, 2.1 s reload.
function initHudStrip() {
  const strip = $('[data-hudstrip]');
  if (!strip || !('IntersectionObserver' in window)) return;
  const ammo = $('[data-ammo]', strip), reserve = $('[data-reserve]', strip);
  let mag = 30, res = 120, timer = 0, running = false;
  const tick = () => {
    if (!running) return;
    if (mag > 0) {
      const burst = Math.min(mag, 3 + Math.floor(Math.random() * 4));
      mag -= burst;
      ammo.textContent = String(mag);
      strip.style.setProperty('--st', String(0.35 + Math.random() * 0.5));
      strip.classList.toggle('is-empty', mag === 0);
      timer = setTimeout(tick, 650 + Math.random() * 500);
    } else {
      strip.classList.add('is-reloading');
      timer = setTimeout(() => {
        const take = Math.min(30, res);
        res = res - take > 0 ? res - take : 120;  // loop the demo rather than run dry
        mag = take;
        ammo.textContent = String(mag); reserve.textContent = String(res);
        strip.classList.remove('is-reloading', 'is-empty');
        timer = setTimeout(tick, 1400);
      }, 2100);
    }
  };
  new IntersectionObserver(([e]) => {
    const go = e.isIntersecting && !reducedMotion();
    if (go && !running) { running = true; timer = setTimeout(tick, 900); }
    if (!go && running) { running = false; clearTimeout(timer); }
  }, { threshold: 0.4 }).observe(strip);
}

// ----------------------------------------------------------- carousels
function initCarousel(name, { roving = false } = {}) {
  const track = $(`[data-carousel="${name}"]`);
  const nav = $(`[data-carousel-nav="${name}"]`);
  if (!track) return null;
  const prev = nav && $('[data-carousel-prev]', nav);
  const next = nav && $('[data-carousel-next]', nav);
  const items = () => [...track.children].filter((el) => !el.hidden);
  const behavior = () => (reducedMotion() ? 'auto' : 'smooth');

  const update = () => {
    const max = track.scrollWidth - track.clientWidth - 2;
    if (prev) prev.disabled = track.scrollLeft <= 2;
    if (next) next.disabled = track.scrollLeft >= max;
  };
  const page = (dir) => {
    const list = items();
    if (!list.length) return;
    const step = list.length > 1 ? list[1].offsetLeft - list[0].offsetLeft : list[0].offsetWidth;
    const per = Math.max(1, Math.floor(track.clientWidth / step) - (track.clientWidth > 900 ? 1 : 0));
    track.scrollBy({ left: dir * step * per, behavior: behavior() });
  };
  prev?.addEventListener('click', () => page(-1));
  next?.addEventListener('click', () => page(1));
  let raf = 0;
  track.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; update(); }); }, { passive: true });
  window.addEventListener('resize', update);
  update();

  if (roving) {
    // One card in the tab order; arrow keys move between cards. The list
    // items are the filterable units, the article inside each is focusable.
    const cards = () => items().map((li) => li.querySelector('[tabindex]') || li);
    const focusAt = (el) => {
      cards().forEach((c) => { c.tabIndex = c === el ? 0 : -1; });
      el.focus({ preventScroll: true });
      el.scrollIntoView({ behavior: behavior(), block: 'nearest', inline: 'nearest' });
    };
    track.addEventListener('keydown', (e) => {
      const list = cards();
      const i = list.indexOf(document.activeElement);
      if (i < 0) return;
      let j = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = Math.min(list.length - 1, i + 1);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = Math.max(0, i - 1);
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = list.length - 1;
      if (j === null) return;
      e.preventDefault();
      focusAt(list[j]);
    });
    track.addEventListener('focusin', (e) => {
      const list = cards();
      if (list.includes(e.target)) list.forEach((c) => { c.tabIndex = c === e.target ? 0 : -1; });
    });
  }
  return {
    reset() {
      track.scrollTo({ left: 0, behavior: 'auto' });
      if (roving) {
        // every card leaves the tab order except the first one still shown
        [...track.children].forEach((li) => { const c = li.querySelector('[tabindex]'); if (c) c.tabIndex = -1; });
        const firstShown = items()[0]?.querySelector('[tabindex]');
        if (firstShown) firstShown.tabIndex = 0;
      }
      update();
    },
  };
}

function initArmory() {
  const carousel = initCarousel('armory', { roving: true });
  const filters = $$('[data-filter]');
  const status = $('[data-filter-status]');
  const cards = $$('[data-carousel="armory"] > [data-cat]');
  if (!filters.length || !cards.length) return;
  carousel?.reset();
  filters.forEach((btn) => btn.addEventListener('click', () => {
    const cat = btn.dataset.filter;
    filters.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    let n = 0;
    for (const c of cards) { const on = cat === 'all' || c.dataset.cat === cat; c.hidden = !on; if (on) n++; }
    carousel?.reset();
    if (status) status.textContent = `Showing ${n} ${cat === 'all' ? '' : btn.firstChild.textContent.trim().toLowerCase() + ' '}weapon${n === 1 ? '' : 's'}.`;
  }));
}

// --------------------------------------------------------- supply crate
// A preview of the in-game reveal, drawn from real crate-eligible VK-77
// finishes. Picks are uniform on purpose: this does not model drop odds.
const CRATE_POOL = [
  { rarity: 'common', label: 'Common', name: 'VK-77 · Urban', img: 'assets/art/skin-rifle-urban.webp', w: 624, h: 268 },
  { rarity: 'rare', label: 'Rare', name: 'VK-77 · Cinder', img: 'assets/art/skin-rifle-cinder.webp', w: 745, h: 268 },
  { rarity: 'epic', label: 'Epic', name: 'VK-77 · Spectre', img: 'assets/art/skin-rifle-spectre.webp', w: 798, h: 288 },
  { rarity: 'legendary', label: 'Legendary', name: 'ARC-9 · Pulse', img: 'assets/art/skin-rifle-arc.webp', w: 830, h: 286 },
];
function initCrate() {
  const box = $('[data-crate]');
  if (!box) return;
  const btn = $('[data-crate-open]', box);
  const tier = $('[data-reveal-tier]', box), name = $('[data-reveal-name]', box), img = $('[data-reveal-img]', box);
  const card = $('[data-reveal-card]', box), status = $('[data-crate-status]', box);
  const sparks = $('[data-crate-sparks]', box), serial = $('[data-crate-serial]', box);
  let last = -1, busy = false, opened = 0;
  // warm the four finish images so the reveal never waits on the network
  const warm = () => CRATE_POOL.forEach((p) => { const i = new Image(); i.src = p.img; });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { warm(); io.disconnect(); } }, { rootMargin: '300px' });
    io.observe(box);
  }
  const burst = () => {
    if (reducedMotion() || !sparks) return;
    sparks.textContent = '';
    for (let i = 0; i < 12; i++) {
      const s = document.createElement('span');
      s.className = 'spark';
      const a = (Math.PI * 2 * i) / 12 + Math.random() * 0.4, d = 70 + Math.random() * 90;
      s.style.cssText = `--sx:${(Math.cos(a) * d).toFixed(0)}px;--sy:${(Math.sin(a) * d - 40).toFixed(0)}px;animation-delay:${(Math.random() * 80).toFixed(0)}ms`;
      sparks.appendChild(s);
    }
    setTimeout(() => { sparks.textContent = ''; }, 1000);
  };
  const reveal = () => {
    let k;
    do { k = Math.floor(Math.random() * CRATE_POOL.length); } while (k === last && CRATE_POOL.length > 1);
    last = k;
    const p = CRATE_POOL[k];
    box.dataset.rarity = p.rarity;
    tier.textContent = p.label;
    name.textContent = p.name;
    img.src = p.img; img.width = p.w; img.height = p.h;
    img.alt = `${p.name} weapon finish`;
    box.classList.remove('is-opening');
    box.classList.add('is-open');
    card.setAttribute('aria-hidden', 'false');
    burst();
    status.textContent = `Preview: ${p.label} — ${p.name}. Website preview only, no in-game reward granted.`;
    btn.textContent = 'Open another';
    btn.disabled = false;
    busy = false;
  };
  btn.addEventListener('click', () => {
    if (busy) return;
    busy = true;
    btn.disabled = true;
    opened++;
    if (serial) serial.textContent = `SN-09${String(opened).padStart(2, '0')}`;
    const fast = reducedMotion();
    const wasOpen = box.classList.contains('is-open');
    box.classList.remove('is-open');
    card.setAttribute('aria-hidden', 'true');
    // close the lid first if a preview is showing, then rattle and open
    setTimeout(() => {
      box.classList.add('is-opening');
      setTimeout(reveal, fast ? 0 : 420);
    }, wasOpen && !fast ? 360 : 0);
  });
}

// ------------------------------------------------------------ archives
function initArchives() {
  const list = $('[data-files]');
  const out = $('[data-files-out]');
  const text = $('[data-files-text]');
  if (!list || !out || !text) return;
  list.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-file]');
    if (!btn) return;
    $$('[data-file]', list).forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    const { file, tier, boss, stage } = btn.dataset;
    const where = boss === 'true'
      ? `Carried by bosses — recoverable from stage ${stage} onward.`
      : `Recovered from fallen hostiles — from stage ${stage} onward.`;
    out.classList.add('is-denied');
    text.textContent = `${file} // ${tier} — Access restricted. ${where}`;
  });
}

// ----------------------------------------------------- gallery + lightbox
function initGallery() {
  initCarousel('screens');
  const dialog = $('[data-lightbox]');
  const buttons = $$('[data-shot]');
  if (!dialog || !buttons.length) return;
  const img = $('[data-lightbox-img]', dialog), cap = $('[data-lightbox-caption]', dialog), count = $('[data-lightbox-count]', dialog);
  const shots = buttons.map((b) => ({ src: b.dataset.full, alt: b.dataset.alt, caption: b.dataset.caption }));
  let index = 0;
  const pad = (n) => String(n).padStart(2, '0');
  const show = (i) => {
    index = (i + shots.length) % shots.length;
    const s = shots[index];
    img.src = s.src; img.alt = s.alt; cap.textContent = s.caption;
    count.textContent = `${pad(index + 1)} / ${pad(shots.length)}`;
    // keep the strip in step, so closing returns focus to what was viewed
    lastOpener = buttons[index];
  };
  let lastOpener = null;
  const ctl = dialogController(dialog);
  const origOpen = ctl.open;
  buttons.forEach((b, i) => b.addEventListener('click', () => {
    show(i);
    origOpen(b);
    $('[data-lightbox-close]', dialog)?.focus();
  }));
  dialog.addEventListener('close', () => {
    if (lastOpener) {
      lastOpener.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'auto' });
      lastOpener.focus({ preventScroll: true });
    }
  });
  $('[data-lightbox-close]', dialog)?.addEventListener('click', ctl.close);
  $('[data-lightbox-prev]', dialog)?.addEventListener('click', () => show(index - 1));
  $('[data-lightbox-next]', dialog)?.addEventListener('click', () => show(index + 1));
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
  });
  // horizontal swipe on the image
  let x0 = null, y0 = null;
  const fig = $('.lightbox__figure', dialog);
  fig?.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') { x0 = e.clientX; y0 = e.clientY; } });
  fig?.addEventListener('pointerup', (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0, dy = e.clientY - y0;
    x0 = y0 = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) show(index + (dx < 0 ? 1 : -1));
  });
  fig?.addEventListener('pointercancel', () => { x0 = y0 = null; });
}

// ------------------------------------------------- Google Play badge
// The badge is Google's own artwork. If it cannot load (offline, blocked),
// fall back to a plainly worded text link instead of a broken image.
function initBadges() {
  $$('.play-badge__img').forEach((img) => {
    const fail = () => img.closest('.play-badge')?.classList.add('is-fallback');
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) fail();
    img.addEventListener('error', fail, { once: true });
  });
}

// ---------------------------------------------------------------- boot
for (const init of [initHeader, initActiveNav, initAnchors, initReveals, initHero, initTrailer, initThreat, initHudStrip, initArmory, initCrate, initArchives, initGallery, initBadges]) {
  try { init(); } catch (err) { console.error(`[cinderfall] ${init.name} failed`, err); }
}
