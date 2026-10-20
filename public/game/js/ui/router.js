// KOR — screen stack.
//
// Screens are modules { mount(ctx, params) → { el, show?(), hide?(),
// dispose?(), back?() → true to swallow } }. go() pushes a screen with a
// spring slide; back() pops it, and on the root screen asks the app
// (onRootBack). The Android / browser back button is wired by the app.
import { spring, EASE } from './kit.js';

export class Router {
  constructor(root, ctx, screens) {
    this.root = root; this.ctx = ctx; this.screens = screens;
    this.stack = [];           // { id, inst, params }
    this.onRootBack = null;
  }
  get top() { return this.stack[this.stack.length - 1] || null; }
  reduced() { return this.ctx.reduceMotion || matchMedia('(prefers-reduced-motion: reduce)').matches; }

  mount(id, params) {
    const def = this.screens[id];
    if (!def) throw new Error('no screen ' + id);
    const inst = def.mount(this.ctx, params || {});
    inst.el.classList.add('screen', `scr-${id}`);
    inst.el.dataset.screen = id;
    return inst;
  }

  // push (or replace the top with) a screen
  go(id, params, { replace = false, root = false } = {}) {
    const prev = this.top;
    const inst = this.mount(id, params);
    this.root.appendChild(inst.el);
    if (root) {
      for (const s of this.stack) { if (s !== prev) this.drop(s); }
      this.stack = [];
    } else if (replace && prev) this.stack.pop();
    this.stack.push({ id, inst, params });
    if (prev) this.leave(prev, root || replace, 1);
    this.enter(inst, 1);
    this.ctx.onScreen?.(id, params);
    return inst;
  }

  // pop the top screen
  back() {
    const top = this.top;
    if (!top) return;
    if (top.inst.back && top.inst.back()) return;
    if (this.stack.length <= 1) { this.onRootBack?.(); return; }
    this.stack.pop();
    const under = this.top;
    this.leave(top, true, -1);
    under.inst.el.style.display = '';
    this.enter(under.inst, -1);
    this.ctx.onScreen?.(under.id, under.params);
  }

  enter(inst, dir) {
    inst.show?.();
    const el = inst.el;
    if (this.reduced() || !el.animate) return;
    el.animate([{ opacity: 0, transform: `translateX(${dir * 22}px)` }, { opacity: 1, transform: 'none' }], { duration: 240, easing: spring() });
  }
  leave(s, destroy, dir) {
    s.inst.hide?.();
    const el = s.inst.el;
    const done = () => { if (destroy) this.drop(s); else el.style.display = 'none'; };
    if (this.reduced() || !el.animate) return done();
    el.style.pointerEvents = 'none';
    el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-dir * 16}px)` }], { duration: 170, easing: EASE }).onfinish = () => { el.style.pointerEvents = ''; done(); };
  }
  drop(s) { s.inst.dispose?.(); s.inst.el.remove(); }

  // tear everything down (entering a mission)
  clear() { for (const s of this.stack) this.drop(s); this.stack = []; }

  // rebuild the top screen in place (language change)
  refresh() {
    const top = this.top;
    if (!top) return;
    const inst = this.mount(top.id, top.params);
    top.inst.el.replaceWith(inst.el);
    top.inst.dispose?.();
    top.inst = inst;
    inst.show?.();
    for (const s of this.stack) if (s !== top) { const n = this.mount(s.id, s.params); n.el.style.display = 'none'; s.inst.el.replaceWith(n.el); s.inst.dispose?.(); s.inst = n; }
  }
}
