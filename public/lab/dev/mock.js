// Dev-only UI mocks for the M0 style board (lobby, arsenal).
import { OPS, WEAPONS, figureCanvas, weaponCanvas, streetScene } from './render.js';
import { MAT } from '../js/art/weapons/index.js';
import { tone } from '../js/art/style.js';

await document.fonts.load('700 20px Rajdhani'); await document.fonts.load('400 12px Inter');
const screen = new URLSearchParams(location.search).get('screen') || 'lobby';

const ICON = {
  coin: '<svg viewBox="0 0 20 20"><path d="M10 1.5 17.4 5.75v8.5L10 18.5 2.6 14.25v-8.5Z" fill="#ffc93c"/><path d="M10 4.6 14.7 7.3v5.4L10 15.4 5.3 12.7V7.3Z" fill="#c99512"/><circle cx="10" cy="10" r="2.3" fill="#1a1c20"/></svg>',
  gear: '<svg viewBox="0 0 20 20"><path d="M10 6.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8Zm7 4.6v-2.4l-2.1-.5a5 5 0 0 0-.6-1.4l1.1-1.8-1.7-1.7-1.8 1.1a5 5 0 0 0-1.4-.6L10 1.8H7.6l-.5 2.1a5 5 0 0 0-1.4.6L3.9 3.4 2.2 5.1l1.1 1.8a5 5 0 0 0-.6 1.4L.6 8.8v2.4l2.1.5c.1.5.3 1 .6 1.4l-1.1 1.8 1.7 1.7 1.8-1.1c.4.3.9.5 1.4.6l.5 2.1H10l.5-2.1c.5-.1 1-.3 1.4-.6l1.8 1.1 1.7-1.7-1.1-1.8c.3-.4.5-.9.6-1.4Z" fill="#939dab" transform="translate(1.2 0)"/></svg>',
  arrow: '<svg class="arrow" viewBox="0 0 24 24"><path d="M5 12h12M12 6l6 6-6 6" stroke="#1a0d06" stroke-width="2.6" fill="none" stroke-linecap="square"/></svg>',
  dash: '<svg viewBox="0 0 20 20"><path d="M3 5l5 5-5 5M10 5l5 5-5 5" stroke="#d9dee5" stroke-width="2.2" fill="none"/></svg>',
  flash: '<svg viewBox="0 0 20 20"><path d="M10 1l2 6 6-2-4 5 4 5-6-2-2 6-2-6-6 2 4-5-4-5 6 2Z" fill="#d9dee5"/></svg>',
  bolt: '<svg viewBox="0 0 20 20"><path d="M12 1 4 11h5l-2 8 9-11h-5Z" fill="#1a0d06"/></svg>',
  lock: '<svg viewBox="0 0 12 12"><rect x="2" y="5" width="8" height="6" fill="#939dab"/><path d="M4 5V3.5a2 2 0 0 1 4 0V5" stroke="#939dab" stroke-width="1.4" fill="none"/></svg>',
};

function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
function put(sel, node) { document.querySelector(sel).appendChild(node); }

// head-and-shoulders crop of an operator for avatars
function avatar(op, px = 28 * 2.5) {
  const z = px / 13, big = figureCanvas(op, z);
  const c = document.createElement('canvas'); c.width = px; c.height = px;
  const g = c.getContext('2d');
  g.drawImage(big, -(big.width * 0.42 - 6 * z), -(big.height - 6 * z - 66 * z));
  return c;
}
function asImg(src, cls) { const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; c.getContext('2d').drawImage(src, 0, 0); if (cls) c.className = cls; return c; }

const bg = streetScene(2).toDataURL('image/jpeg', 0.8);

const topbar = (active) => `
<header class="topbar">
  <div class="me cut"><span class="av"></span><div><b>KÜLKUZGUN<span class="lvl">SV 24</span></b><div class="bar"><i style="width:62%"></i></div></div></div>
  <nav class="tabs">${['LOBİ', 'OPERATÖRLER', 'CEPHANELİK', 'SANDIK', 'TÜCCAR'].map((t) => `<a class="${t === active ? 'on' : ''}">${t}</a>`).join('')}</nav>
  <div class="cur cut">${ICON.coin}12.450</div>
  <button class="icon-btn cut">${ICON.gear}</button>
</header>`;

function mountTop(active) {
  const app = el(`<div class="app" style="--bg-image:url(${bg})">${topbar(active)}</div>`);
  document.body.appendChild(app);
  const av = avatar(OPS.vex); av.style.cssText = 'width:28px;height:28px;border-radius:4px;background:#2a323d';
  app.querySelector('.av').replaceWith(av);
  return app;
}

if (screen === 'lobby') {
  const app = mountTop('LOBİ');
  app.appendChild(el(`
  <main class="lobby">
    <section class="stage">
      <div class="slab"></div><div class="floor"></div>
      <div class="op-head">
        <div class="eyebrow">OPERATÖR</div>
        <div class="op-name">VEX</div>
        <div class="op-role">SALDIRI</div>
        <div class="op-mastery"><div class="eyebrow"><span>USTALIK 4</span><span>62%</span></div><div class="meter"><i style="width:62%;background:var(--ember)"></i></div></div>
      </div>
      <div class="op-swap"></div>
      <div class="abil">
        <div class="a"><div class="hex">${ICON.dash}</div><small>ATILMA</small></div>
        <div class="a"><div class="hex">${ICON.flash}</div><small>FLAŞ</small></div>
        <div class="a"><div class="hex ult">${ICON.bolt}</div><small>AŞIRI YÜK</small></div>
      </div>
    </section>
    <section class="modes">
      <button class="play btn-primary cut">
        <div class="eyebrow">KAMPANYA · PERDE 1 · KÜL HATTI</div>
        <b>OYNA</b>
        <span>GÖREV 3 — DÖKÜMHANE</span>
        ${ICON.arrow}
      </button>
      <div class="mode-row">
        <div class="card cut"><div class="eyebrow">GÜNLÜK GÖREVLER</div><div class="big-num">1<small>/ 3</small></div><div class="meter"><i style="width:33%;background:var(--interact)"></i></div></div>
        <div class="card cut"><div class="eyebrow">SONSUZ SEKTÖR</div><div class="big-num">27<small>REKOR BÖLÜM</small></div><div class="eyebrow" style="color:var(--n5)">HER 5 BÖLÜMDE BOSS</div></div>
      </div>
      <div class="card cut wide">
        <div><div class="eyebrow"><span class="dot"></span>CROW'UN TEZGÂHI</div><div class="title" style="font-size:16px;margin-top:6px">4 YENİ ÜRÜN · 1 ÖZEL</div></div>
        <div class="tag"><div class="eyebrow">YENİLENME</div><div class="title" style="font-size:16px;margin-top:6px;color:var(--ember-hi)">09:25:12</div></div>
      </div>
    </section>
  </main>`));
  const stage = app.querySelector('.stage');
  const hero = asImg(figureCanvas(OPS.vex, 2.5 * 4.1), 'hero');
  stage.appendChild(hero);
  for (const id of ['vex', 'hale', 'morrow', 'kite', 'brick']) {
    const a = avatar(OPS[id], 34 * 2.5); a.className = 'cut' + (id === 'vex' ? ' on' : '');
    app.querySelector('.op-swap').appendChild(a);
  }
}

if (screen === 'arsenal') {
  const app = mountTop('CEPHANELİK');
  const SKINS = [
    ['FABRİKA', 'common', MAT],
    ['KÜL', 'epic', { ...MAT, poly: tone('#5a4642', '#3d2e2b', '#2a1f1d', '#110c0b'), metal: tone('#e2e6ec', '#b3bac4', '#7d8693', '#30353d') }],
    ['BUZ HATTI', 'rare', { ...MAT, poly: tone('#e8f4ff', '#bcd8f0', '#86a8c8', '#3b5670'), accent: tone('#bfe6ff', '#4aa8ff', '#2d77c4', '#123a66') }],
    ['NEON KUZGUN', 'legendary', { ...MAT, poly: tone('#4a3a78', '#2e2350', '#1f1838', '#0c0918'), metal: tone('#4a5361', '#323843', '#21262e', '#0d0f13'), accent: tone('#c8fbff', '#3ee8e0', '#1a8c95', '#0b3c42') }],
    ['PASLI KRALİYET', 'mythic', { ...MAT, poly: tone('#a8473c', '#7a2a24', '#561a17', '#260a08'), metal: tone('#ffe39a', '#e8b65a', '#a9792f', '#5e3f14'), accent: tone('#ffe39a', '#ffc93c', '#c99512', '#5e430a') }],
  ];
  const sel = SKINS[1];
  app.appendChild(el(`
  <main class="arsenal">
    <section>
      <div class="chips">${['TÜMÜ', 'TABANCA', 'H.MAKİNELİ', 'TÜFEK', 'POMPALI', 'NİŞANCI', 'AĞIR'].map((c, i) => `<span class="chip cut ${i === 0 ? 'on' : ''}">${c}</span>`).join('')}</div>
      <div class="wgrid"></div>
    </section>
    <section class="detail cut rar-${sel[1]}">
      <div class="d-head">
        <div><div class="eyebrow">TÜFEK · OTOMATİK</div><div class="title">KESTREL AR</div></div>
        <span class="skin">${sel[0]}</span>
        <div class="mast"><div class="eyebrow"><span>USTALIK 7</span><span>7/10</span></div><div class="meter"><i style="width:70%;background:var(--r-epic)"></i></div></div>
      </div>
      <div class="d-gun"></div>
      <div class="skins"></div>
      <div class="stats">
        ${[['HASAR', 32, 64], ['ATEŞ HIZI', '720/dk', 78], ['MENZİL', '38 m', 60], ['KONTROL', '', 55]].map(([n, v, w]) => `<div class="stat"><div class="eyebrow"><span>${n}</span><b>${v}</b></div><div class="meter"><i style="width:${w}%"></i></div></div>`).join('')}
      </div>
      <div class="slots">
        ${[['NİŞANGÂH', 'K. NOKTA'], ['NAMLU', 'FREN'], ['ŞARJÖR', '30 MERMİ'], ['ALT', 'BOŞ']].map(([a, b]) => `<div class="slot cut ${b === 'BOŞ' ? 'empty' : ''}"><div class="eyebrow" style="font-size:9px">${a}</div><b>${b}</b></div>`).join('')}
      </div>
      <div class="d-actions"><button class="btn-primary cut">KUŞANILDI</button><button class="btn-ghost cut">İNCELE</button></div>
    </section>
  </main>`));
  const grid = app.querySelector('.wgrid');
  const cards = [['wren9', 'TABANCA', 'rare', 40], ['kestrel', 'TÜFEK', 'epic', 70], ['ramrod', 'POMPALI', 'common', 20], ['marksman', 'NİŞANCI', 'legendary', 55], ['kestrel', 'H.MAKİNELİ', 'common', 0, 'HORNET', 'SV 8'], ['marksman', 'AĞIR', 'common', 0, 'ANVIL LMG', 'SV 14']];
  for (const [id, cls, rar, m, lockName, lockLv] of cards) {
    const w = WEAPONS[id];
    const card = el(`<div class="wcard cut rar-${rar} ${id === 'kestrel' && !lockName ? 'on' : ''} ${lockName ? 'locked' : ''}"><div class="eyebrow" style="margin:0 0 2px">${cls}</div></div>`);
    const s = 2.5 * Math.min(5.0, 112 / (w.box[2] - w.box[0]));
    const pic = el('<div class="pic"></div>'); const wc = asImg(weaponCanvas(w, s, 0.5));
    wc.style.width = (wc.width / 2.5) + 'px'; pic.appendChild(wc); card.appendChild(pic);
    card.appendChild(el(`<b>${lockName || w.name}</b>`));
    card.appendChild(el(lockName ? `<div class="eyebrow">KİLİTLİ</div>` : `<div class="meter"><i style="width:${m}%;background:var(--rar)"></i></div>`));
    if (lockName) card.appendChild(el(`<span class="lock">${ICON.lock}${lockLv}</span>`));
    grid.appendChild(card);
  }
  const W = WEAPONS.kestrel;
  const big = weaponCanvas({ ...W, paint: (g) => W.paint(g, sel[2]) }, 2.5 * 9.6, 0.5);
  const bc = asImg(big); bc.style.height = '74px';
  app.querySelector('.d-gun').appendChild(bc);
  for (const [name, rar, mat] of SKINS) {
    const c = asImg(weaponCanvas({ ...W, paint: (g) => W.paint(g, mat) }, 2.5 * 1.2, 0.5));
    c.className = `cut rar-${rar}` + (name === sel[0] ? ' on' : ''); c.title = name;
    app.querySelector('.skins').appendChild(c);
  }
}
window.__done = 1;
