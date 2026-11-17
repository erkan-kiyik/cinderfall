// KOR — the title card: KOR, the ember between two rules, the line under it.
//
// It used to be painted into the opening's last shot, dark type in the coals'
// light, and on a phone it all but vanished into them. Now it is set in the
// page over the picture (the video, or the live intro's canvas): sharp at any
// size, in the player's language, with a little dark under it so it reads off
// the coals. on(): KOR comes up; tag(): the line under it.
import { t } from './i18n.js';

// the ember (the app icon's mark): an uneven stone, a hotter heart, a spark
export const EMBER = '<svg class="tc-ember" viewBox="0 0 200 185" aria-hidden="true">'
  + '<polygon points="63,3 143,13 198,80 166,160 78,183 16,125 3,70" fill="#8d3a1f"/>'
  + '<polygon points="96,35 148,53 158,115 113,147 58,137 43,85" fill="#c4612b"/>'
  + '<polygon points="108,65 136,83 110,107 85,87" fill="#eaa56c"/></svg>';

export function titleCard() {
  const el = document.createElement('div');
  el.className = 'title-card';
  el.innerHTML = '<div class="tc-word" role="img" aria-label="KOR"><span>K</span><span>O</span><span>R</span></div>'
    + `<div class="tc-rule"><i></i>${EMBER}<i></i></div><div class="tc-tag"></div>`;
  el.querySelector('.tc-tag').textContent = t('story.tagline');
  return {
    el,
    on() { el.classList.add('on'); },
    tag() { el.classList.add('on', 'tag'); },
    // the hand-off fades the whole card with the picture
    out() { el.classList.add('out'); },
  };
}
