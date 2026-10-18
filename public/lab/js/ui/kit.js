// KOR LAB — interface kit: element builder, icons, and the feel of
// every touch (press squash + spring, haptic tick, UI sound), toasts,
// modals, counters and staggered entrances.
//
// Motion rules: transform/opacity only (no layout work), nothing runs while
// idle, and everything collapses to instant when the player asks for reduced
// motion (setting or OS).

let ctx = { haptics: true, reduce: false, sfx: null };
export function configureKit(o) { ctx = { ...ctx, ...o }; }
export const reduced = () => ctx.reduce || (matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

// The surfaces' materials (docs §10.3), painted once at start into CSS
// variables: --grain (concrete and soot speckle over any colour), --fibre
// (kraft paper's fibres) and --citymap (the map drawn on the campaign sheet).
export function grain() {
  const R = document.documentElement.style;
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const mk = (n, fn) => { const c = document.createElement('canvas'); c.width = c.height = n; fn(c.getContext('2d'), n); return `url(${c.toDataURL('image/png')})`; };
  R.setProperty('--grain', mk(128, (g, n) => {
    for (let i = 0; i < 1400; i++) { const l = rnd() < 0.5; g.fillStyle = l ? `rgba(255,240,220,${0.03 + rnd() * 0.05})` : `rgba(0,0,0,${0.06 + rnd() * 0.1})`; g.fillRect(rnd() * n, rnd() * n, 1 + (rnd() < 0.1), 1); }
    for (let i = 0; i < 14; i++) { const x = rnd() * n, y = rnd() * n, r = 4 + rnd() * 14, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(0,0,0,${0.04 + rnd() * 0.05})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  }));
  R.setProperty('--fibre', mk(160, (g, n) => {
    for (let i = 0; i < 700; i++) { const x = rnd() * n, y = rnd() * n, a = rnd() * Math.PI, l = 2 + rnd() * 6; g.strokeStyle = rnd() < 0.5 ? `rgba(255,248,230,${0.12 + rnd() * 0.14})` : `rgba(90,60,30,${0.08 + rnd() * 0.12})`; g.lineWidth = 0.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
    for (let i = 0; i < 10; i++) { const x = rnd() * n, y = rnd() * n, r = 8 + rnd() * 26, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(120,80,40,${0.05 + rnd() * 0.06})`); gr.addColorStop(1, 'rgba(120,80,40,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  }));
  // the city in ink: the river, the rail line, the avenues, blocks; the harbour's basins on the right
  const ink = 'rgba(58,44,30,', P = [];
  P.push(`<path d="M-2 70 C 14 64 22 76 38 70 S 62 58 74 66 S 92 80 104 74" fill="none" stroke="rgba(70,96,110,0.32)" stroke-width="5"/>`);
  P.push(`<path d="M-2 70 C 14 64 22 76 38 70 S 62 58 74 66 S 92 80 104 74" fill="none" stroke="${ink}0.45)" stroke-width="0.3"/>`);
  P.push(`<path d="M-2 30 L 104 26" fill="none" stroke="${ink}0.5)" stroke-width="0.6" stroke-dasharray="1.6 1"/>`);
  for (const [d, w] of [['M 0 48 L 100 44', 1.1], ['M 22 0 L 26 100', 1.0], ['M 58 0 L 54 100', 1.0], ['M 0 14 L 100 18', 0.6], ['M 0 88 L 100 92', 0.6], ['M 8 0 L 12 100', 0.4], ['M 40 0 L 40 100', 0.4], ['M 74 0 L 70 100', 0.4], ['M 88 0 L 86 60', 0.4], ['M 0 58 L 60 54', 0.35], ['M 30 36 L 100 34', 0.35]]) P.push(`<path d="${d}" fill="none" stroke="${ink}0.38)" stroke-width="${w}"/>`);
  for (let i = 0; i < 46; i++) { const x = rnd() * 96, y = rnd() * 96, w = 2 + rnd() * 5, h = 2 + rnd() * 4; P.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="none" stroke="${ink}0.18)" stroke-width="0.25"/>`); }
  for (const [x, y] of [[84, 70], [92, 76], [88, 84]]) P.push(`<rect x="${x}" y="${y}" width="7" height="3" fill="rgba(70,96,110,0.25)" stroke="${ink}0.35)" stroke-width="0.25"/>`);
  P.push(`<circle cx="18" cy="40" r="4" fill="none" stroke="${ink}0.3)" stroke-width="0.3"/><path d="M 14 40 h 8 M 18 36 v 8" stroke="${ink}0.3)" stroke-width="0.2"/>`);
  R.setProperty('--citymap', `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'>${P.join('')}</svg>`)}")`);
}

// h('div.card.cut', { onclick, style }, child, 'text', [more])
export function h(sel, attrs, ...kids) {
  const [tag, ...cls] = sel.split('.');
  const e = document.createElement(tag || 'div');
  if (cls.length) e.className = cls.join(' ');
  if (attrs && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) { kids.unshift(attrs); attrs = null; }
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') { for (const [p, x] of Object.entries(v)) if (p.startsWith('--')) e.style.setProperty(p, x); else e.style[p] = x; }
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'dataset') Object.assign(e.dataset, v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  const add = (k) => { if (k === null || k === undefined || k === false) return; if (Array.isArray(k)) k.forEach(add); else e.append(k instanceof Node ? k : document.createTextNode(String(k))); };
  kids.forEach(add);
  return e;
}
export const svg = (name, cls = 'ic') => { const s = h('span.' + cls); s.innerHTML = ICONS[name] || ''; return s; };

// --- icons (24-unit grid, currentColor) ------------------------------------------------
const P = (d, extra = '') => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" fill="currentColor" ${extra}/></svg>`;
const S = (d, w = 2.4) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="square" stroke-linejoin="miter"/></svg>`;
// a filled shape and a stroked one in the same icon
const PS = (fill, stroke, w = 2, rule = 'nonzero') => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${fill}" fill="currentColor" fill-rule="${rule}"/><path d="${stroke}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
export const ICONS = {
  back: S('M15 5 8 12l7 7'),
  close: S('M6 6l12 12M18 6 6 18'),
  arrow: S('M4 12h14M13 6l6 6-6 6', 2.8),
  gear: P('M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Zm8.6 5.1v-2.6l-2.4-.6a6.3 6.3 0 0 0-.7-1.6l1.3-2.1-1.8-1.8-2.1 1.3c-.5-.3-1-.5-1.6-.7L12.7 3h-2.6l-.6 2.4c-.6.2-1.1.4-1.6.7L5.8 4.8 4 6.6l1.3 2.1c-.3.5-.5 1-.7 1.6L2.2 10.9v2.6l2.4.6c.2.6.4 1.1.7 1.6L4 17.8l1.8 1.8 2.1-1.3c.5.3 1 .5 1.6.7l.6 2.4h2.6l.6-2.4c.6-.2 1.1-.4 1.6-.7l2.1 1.3 1.8-1.8-1.3-2.1c.3-.5.5-1 .7-1.6Z'),
  lock: P('M7 10V8a5 5 0 0 1 10 0v2h1.5v11h-13V10Zm2.6 0h4.8V8a2.4 2.4 0 0 0-4.8 0Z'),
  star: P('M12 2.5l2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 17.6l-6 3.3 1.3-6.7-5-4.7 6.8-.8Z'),
  play: P('M7 4.5v15l12-7.5Z'),
  check: S('M4.5 12.5l5 5 10-11', 2.8),
  user: P('M12 3a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Zm-8 18c.6-4.4 3.8-7 8-7s7.4 2.6 8 7Z'),
  target: S('M12 3v4M12 17v4M3 12h4M17 12h4M12 7.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z', 2.2),
  map: P('M3 5.5 8.5 3l7 2.5L21 3v15.5L15.5 21l-7-2.5L3 21Zm6 .4v10.6l6 2.1V7.9Z'),
  daily: P('M6 3h2v2h8V3h2v2h3v16H3V5h3Zm-1 7v9h14v-9Zm2 2h4v4H7Z'),
  infinite: S('M7.5 8.5C4.5 8.5 3 10.2 3 12s1.5 3.5 4.5 3.5c3.8 0 5.2-7 9-7 3 0 4.5 1.7 4.5 3.5s-1.5 3.5-4.5 3.5c-3.8 0-5.2-7-9-7Z', 2.2),
  crate: P('M3 7.5 12 3l9 4.5v9L12 21l-9-4.5Zm2.4 1.6v6.2l5.4 2.7v-6.2Zm13.2 0-5.4 2.7v6.2l5.4-2.7ZM12 5.4 6.8 8 12 10.6 17.2 8Z'),
  shop: P('M4 4h16l1 5a3 3 0 0 1-5 2.2 3 3 0 0 1-4 0 3 3 0 0 1-4 0A3 3 0 0 1 3 9Zm1 9.4c1.3.6 2.8.5 4-.2a5 5 0 0 0 6 0c1.2.7 2.7.8 4 .2V21H5Zm6 2.6v5h2v-5Z'),
  gun: P('M2 9h15l1.5-1.5H22v4h-3v1.5l-3 .8V16h-3.4l-1.2 4.5H7.5L9 14H2Z'),
  ops: P('M8 4.5a3.3 3.3 0 1 1 0 6.6 3.3 3.3 0 0 1 0-6.6Zm8.5 1a2.8 2.8 0 1 1 0 5.6 2.8 2.8 0 0 1 0-5.6ZM2 19.5c.4-3.6 2.8-6 6-6s5.6 2.4 6 6Zm13-6c3 0 5.1 2 5.6 5.5h-4.4c-.3-2-1-3.8-2.3-5.1.4-.3.7-.4 1.1-.4Z'),
  trophy: P('M7 3h10v2h4c0 3.8-2 6-4.6 6.5A5 5 0 0 1 13 14.8V17h3.5v4h-9v-4H11v-2.2a5 5 0 0 1-3.4-3.3C5 11 3 8.8 3 5h4Zm-2 4c.3 1.6 1.1 2.6 2 3V7Zm14 0h-2v3c.9-.4 1.7-1.4 2-3Z'),
  chart: P('M3 20V4h2.4v13.6H21V20Zm4.5-4.5v-5h3v5Zm4.8 0V7h3v8.5Zm4.8 0v-3h3v3Z'),
  sound: P('M3 9h4l5-4.5v15L7 15H3Zm12.5-1.5a6.5 6.5 0 0 1 0 9l-1.6-1.6a4.2 4.2 0 0 0 0-5.8Zm2.9-2.9a10.6 10.6 0 0 1 0 14.8l-1.6-1.6a8.3 8.3 0 0 0 0-11.6Z'),
  pad: P('M7 7h10a5 5 0 0 1 5 5v1a5 5 0 0 1-9.3 2.6h-1.4A5 5 0 0 1 2 13v-1a5 5 0 0 1 5-5Zm-.8 3v1.8H4.4v1.8h1.8v1.8H8v-1.8h1.8v-1.8H8V10Zm9.6 0a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Zm-2.4 2.6a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z'),
  eye: P('M12 5c5 0 8.6 3.6 10 7-1.4 3.4-5 7-10 7s-8.6-3.6-10-7c1.4-3.4 5-7 10-7Zm0 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 2.2a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6Z'),
  globe: S('M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm0 0c2.6 2.6 3.6 5.6 3.6 9s-1 6.4-3.6 9c-2.6-2.6-3.6-5.6-3.6-9s1-6.4 3.6-9ZM3.5 9h17M3.5 15h17', 1.8),
  shield: P('M12 2.5 20 5.5v6c0 5-3.4 8.8-8 10-4.6-1.2-8-5-8-10v-6Zm0 3-5.4 2v4c0 3.6 2.2 6.4 5.4 7.5Z'),
  info: P('M12 2.5a9.5 9.5 0 1 1 0 19 9.5 9.5 0 0 1 0-19Zm-1.3 8v7.5h2.6V10.5Zm1.3-4.2a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z'),
  move: S('M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3', 1.8),
  reset: S('M5 12a7 7 0 1 0 2-5M5 4v4h4', 2.4),
  dash: S('M4 6l6 6-6 6M12 6l6 6-6 6', 2.6),
  flash: P('M12 1.5 14 8l6.5-2.2L16 11l4.5 5.2L14 14l-2 6.5L10 14l-6.5 2.2L8 11 3.5 5.8 10 8Z'),
  bolt: P('M13.5 1.5 4 13.5h6L8.5 22.5 20 9.5h-6Z'),
  wall: P('M3 6h8v4H3Zm10 0h8v4h-8ZM3 12h4v4H3Zm6 0h6v4H9Zm8 0h4v4h-4ZM3 18h8v3H3Zm10 0h8v3h-8Z'),
  mine: P('M12 6a7 7 0 0 1 7 7v2H5v-2a7 7 0 0 1 7-7Zm-1-4h2v3h-2ZM3 17h18v3H3Z'),
  turret: P('M9 3h6v4h4v3h-6v2h5v4H6v-4h5V10H5V7h4ZM5 18h14v3H5Z'),
  smoke: P('M7 18a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 17 9a4.5 4.5 0 0 1 .5 9Z'),
  slow: S('M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm0 3v5l3 2', 2.2),
  blind: P('M2 12c1.4-3.4 5-7 10-7 1.7 0 3.2.4 4.6 1.1L19 3.6l1.4 1.4-15 15L4 18.6l2.2-2.2C4.2 15.2 2.8 13.7 2 12Zm19.9 0c-1.4 3.4-5 7-9.9 7a9.8 9.8 0 0 1-3.6-.7l2.3-2.3a4 4 0 0 0 5-5l3-3c1.4 1.1 2.5 2.5 3.2 4Z'),
  drone: P('M4 5h5v2H7.5v1.5h9V7H15V5h5v2h-1.5v1.5H20v3h-3.5a4.5 4.5 0 0 1-9 0H4v-3h1.5V7H4Zm8 4.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z'),
  heat: P('M12 2c3.2 3.5 6 6.8 6 11a6 6 0 0 1-12 0c0-2.2.8-3.9 2-5.5.2 1.8 1 3 2.2 3.6C10 8.4 10.6 5 12 2Z'),
  radar: S('M12 12 19 5M12 3a9 9 0 1 0 9 9M12 7.5a4.5 4.5 0 1 0 4.5 4.5', 2.2),
  charge: P('M3 9h7V4l11 8-11 8v-5H3Z'),
  armor: P('M5 4h4l3 2 3-2h4v8.5c0 4-3 7-7 8.5-4-1.5-7-4.5-7-8.5Z'),
  // the abilities, each from the operator's old trade (docs §10.10)
  flare: PS('M10.4 11h3.2l.7 11H9.7ZM10 8.6h4V11h-4Z', 'M12 6V2.5M8.6 7.2 6.4 4.8M15.4 7.2l2.2-2.4M7.6 10.2H5M16.4 10.2H19'),
  furnace: P('M3 21V10.5a9 7.5 0 0 1 18 0V21h-3.6v-5.4a5.4 4.4 0 0 0-10.8 0V21ZM12 21c-2 0-3.2-1.3-3.2-3 0-1.5 1-2.5 1.9-3.4.1.9.6 1.5 1.1 1.8-.2-1.5.4-2.8 1.5-3.8.1 1.8 1.9 2.7 1.9 5.2 0 1.9-1.3 3.2-3.2 3.2Z'),
  door: P('M5 2h14v20H5Zm2.2 2.2v15.6h9.6V4.2ZM8.6 5.6h6.8v12.8H8.6Zm4.4 5.6a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z', 'fill-rule="evenodd"'),
  tank: P('M7 7.4C7 6.1 9.2 5 12 5s5 1.1 5 2.4v12.2C17 20.9 14.8 22 12 22s-5-1.1-5-2.4ZM10.4 2h3.2v2.4h-3.2ZM8.6 2h6.8v1.4H8.6ZM12 10.2a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4Z', 'fill-rule="evenodd"'),
  nozzle: PS('M7.6 9.6 19 4.6l1.6 3.8L9.6 13Z', 'M8.6 12.6 4 21.5M8.6 12.6l4 8.9M8.6 12.6V21.5M3 21.5h11'),
  canister: P('M6 8h8v14H6Zm1-3.2h6V7H7ZM15.4 6.4a2.6 2.6 0 0 1 4.8-1.3 2.1 2.1 0 0 1-.9 4H17a2.3 2.3 0 0 1-1.6-2.7ZM16.6 1.8a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2Z'),
  waves: PS('M12 8.4a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4Z', 'M12 12v9.5M8.4 21.5h7.2M8.6 6.8a4.8 4.8 0 0 1 6.8 0M5.8 4a8.8 8.8 0 0 1 12.4 0'),
  roof: PS('M7.4 15.4c1.2-1.8 2.8-2.8 4.6-2.8s3.4 1 4.6 2.8c-1.2 1.8-2.8 2.8-4.6 2.8s-3.4-1-4.6-2.8Zm4.6-1.3a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6Z', 'M2.5 11.6 12 4l9.5 7.6M5.4 9.6V20.6h13.2V9.6', 2.2, 'evenodd'),
  plate: P('M3.5 4h17v16h-17ZM6.2 6.4v11.2h1.6V6.4Zm3.6 0v11.2h1.6V6.4Zm3.6 0v11.2H15V6.4Zm3.4 0v11.2h1.6V6.4Z', 'fill-rule="evenodd"'),
  quote: P('M3.5 6h6.6v6.6c0 3.4-1.7 5.6-4.9 6.4l-1-1.8c1.7-.7 2.5-1.8 2.6-3.6H3.5Zm10.4 0h6.6v6.6c0 3.4-1.7 5.6-4.9 6.4l-1-1.8c1.7-.7 2.5-1.8 2.6-3.6h-3.3Z'),
  skull: P('M12 2.5c5 0 8.5 3.4 8.5 8 0 2.6-1.2 4.4-3 5.4V20h-3v-2h-1.4v2h-2.2v-2H9.5v2h-3v-4.1c-1.8-1-3-2.8-3-5.4 0-4.6 3.5-8 8.5-8Zm-3.5 7a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z'),
  clock: S('M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17ZM12 7.5V12l3.2 2', 2.2),
  // PARÇA: salvage, a steel nut
  coin: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1.2 17.6 5.6v8.8L10 18.8 2.4 14.4V5.6Z" fill="#5e5a54"/><path d="M10 1.2 17.6 5.6v8.8L10 18.8 2.4 14.4V5.6Z" fill="none" stroke="#c9c2b6" stroke-width="1.1"/><path d="M10 3.3 15.8 6.7v6.6L10 16.7 4.2 13.3V6.7Z" fill="#9b958b"/><circle cx="10" cy="10" r="3.6" fill="#1a1612"/><path d="M6.6 9.2a3.6 3.6 0 0 1 5.2-2.4" fill="none" stroke="#e2692f" stroke-width="1"/><path d="M4.6 6.4 10 3.3" stroke="#efe8dc" stroke-width="0.8" fill="none"/></svg>',
};

// --- feel ----------------------------------------------------------------------------------
const BUZZ = { tap: 8, soft: 12, tick: 5, success: [14, 40, 22], warn: [26, 50, 26], heavy: 34 };
export function haptic(kind = 'tap') {
  if (!ctx.haptics) return;
  const Hp = window.Capacitor?.isNativePlatform?.() && window.Capacitor.Plugins?.Haptics;
  try {
    if (Hp) {
      if (kind === 'success') Hp.notification({ type: 'SUCCESS' });
      else if (kind === 'warn') Hp.notification({ type: 'WARNING' });
      else if (kind === 'heavy') Hp.impact({ style: 'HEAVY' });
      else if (kind === 'soft') Hp.impact({ style: 'MEDIUM' });
      else Hp.impact({ style: 'LIGHT' });
    } else if (navigator.vibrate) navigator.vibrate(BUZZ[kind] || BUZZ.tap);
  } catch { /* no motor is not an error */ }
}
export function ui(name, vol = 1) { if (ctx.sfx) ctx.sfx.ui(name, vol); }

const SPRING = 'linear(0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077, 1.121, 1.149 24.3%, 1.159, 1.163, 1.161, 1.154 29.9%, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.974 53.8%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1.004 83.8%, 1)';
let springOk = null;
export function spring() {
  if (springOk === null) { try { springOk = CSS.supports('animation-timing-function', SPRING); } catch { springOk = false; } }
  return springOk ? SPRING : 'cubic-bezier(0.34, 1.56, 0.64, 1)';
}
export const EASE = 'cubic-bezier(0.16, 0.84, 0.44, 1)';

// squash on press, spring back on release; sound + haptic on press
export function press(el, { scale = 0.94, sound = 'tap', buzz = 'tap' } = {}) {
  if (!el || el._press) return el;
  el._press = true;
  let a = null;
  el.addEventListener('pointerdown', (e) => {
    if (el.disabled || el.getAttribute('aria-disabled') === 'true' || (e.button != null && e.button > 0)) return;
    if (sound) ui(sound);
    if (buzz) haptic(buzz);
    if (reduced() || !el.animate) return;
    if (a) a.cancel();
    a = el.animate([{ transform: 'scale(1)' }, { transform: `scale(${scale})` }], { duration: 110, easing: EASE, fill: 'forwards' });
  });
  const up = () => {
    if (!a) return;
    a.cancel();
    a = el.animate([{ transform: `scale(${scale})` }, { transform: 'scale(1)' }], { duration: 480, easing: spring() });
    a.onfinish = () => { a = null; };
  };
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) el.addEventListener(ev, up);
  return el;
}
// the "no" wobble
export function deny(el) {
  ui('deny'); haptic('warn');
  if (reduced() || !el || !el.animate) return;
  el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(0)' }], { duration: 360, easing: EASE });
}
// staggered spring entrance
export function popIn(nodes, { delay = 0, step = 35, from = 14 } = {}) {
  if (reduced()) return;
  [...nodes].forEach((n, i) => {
    if (!n.animate) return;
    n.animate([{ opacity: 0, transform: `translateY(${from}px) scale(0.98)` }, { opacity: 1, transform: 'none' }], { duration: 420, delay: delay + i * step, easing: spring(), fill: 'backwards' });
  });
}
// counts a number up in an element
export function countUp(el, from, to, { ms = 900, fmt = (v) => String(Math.round(v)) } = {}) {
  if (reduced() || from === to) { el.textContent = fmt(to); return; }
  const t0 = performance.now();
  const tick = (now) => {
    const k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 3);
    el.textContent = fmt(from + (to - from) * e);
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// --- toast and modal -------------------------------------------------------------------------
let toastHost = null;
export function toast(text, { kind = 'info', ms = 1800 } = {}) {
  if (!toastHost) { toastHost = h('div.toasts', { role: 'status', 'aria-live': 'polite' }); document.body.appendChild(toastHost); }
  const n = h(`div.toast-ui.cut.${kind}`, text);
  toastHost.appendChild(n);
  if (!reduced() && n.animate) n.animate([{ opacity: 0, transform: 'translateY(-10px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: spring() });
  setTimeout(() => {
    const done = () => n.remove();
    if (reduced() || !n.animate) return done();
    n.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(-6px)' }], { duration: 200, easing: EASE }).onfinish = done;
  }, ms);
}

// modal({ title, body: Node|string, actions: [{ label, kind, fn }] }) → close()
export function modal({ title, kicker, body, actions = [], dismiss = true }) {
  const close = () => {
    document.removeEventListener('keydown', onKey);
    if (reduced() || !box.animate) return wrap.remove();
    box.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(0.97)' }], { duration: 140, easing: EASE }).onfinish = () => wrap.remove();
  };
  const btns = actions.map((a) => press(h(`button.btn.${a.kind || 'secondary'}.cut`, { type: 'button', onclick: () => { if (a.fn) a.fn(close); else close(); } }, a.label)));
  const box = h('div.modal.cut', { role: 'dialog', 'aria-modal': 'true' },
    kicker && h('div.eyebrow.accent', kicker), title && h('h2.m-title', title),
    h('div.m-body', typeof body === 'string' ? h('p', body) : body),
    btns.length && h('div.m-actions', btns));
  const wrap = h('div.scrim', { onclick: (e) => { if (dismiss && e.target === wrap) { ui('back'); close(); } } }, box);
  const onKey = (e) => { if (e.key === 'Escape' && dismiss) close(); };
  document.addEventListener('keydown', onKey);
  document.body.appendChild(wrap);
  if (!reduced() && box.animate) box.animate([{ opacity: 0, transform: 'translateY(12px) scale(0.98)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: spring() });
  return close;
}
