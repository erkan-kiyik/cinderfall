// Visual score card.
//
// The share flow used to be plain text. Text doesn't travel — a screenshot
// does. This paints a real card (the attempt number as the hero stat, since
// that's the thing players actually brag about) and shares it as an *image*
// via the Web Share API's file support, which is what WhatsApp and Instagram
// accept. Where files can't be shared it degrades: text share, then a
// download, then the clipboard.

import { t } from '../engine/i18n.js';
import { paintScrap } from '../art/currency.js';

// Portrait 4:5 — the aspect both Instagram feed and WhatsApp preview crop
// least aggressively.
const CARD_W = 900, CARD_H = 1125;

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// A stat block: small label over a big value.
function statBlock(g, x, y, w, label, value, accent) {
  g.textAlign = 'center';
  g.fillStyle = 'rgba(237,234,226,0.45)';
  g.font = '600 22px Rajdhani, sans-serif';
  g.letterSpacing = '3px';
  g.fillText(label, x + w / 2, y);
  g.fillStyle = accent;
  g.font = '700 64px Orbitron, Rajdhani, sans-serif';
  g.letterSpacing = '0px';
  g.fillText(String(value), x + w / 2, y + 62);
}

// Paints the card into `cv` (sized here, caller just supplies the element).
export function paintShareCard(cv, stats) {
  cv.width = CARD_W; cv.height = CARD_H;
  const g = cv.getContext('2d');

  // ---- backdrop: deep night with a warm ember bloom behind the hero stat
  g.fillStyle = '#0a0c10';
  g.fillRect(0, 0, CARD_W, CARD_H);
  const bloom = g.createRadialGradient(CARD_W / 2, 430, 40, CARD_W / 2, 430, 520);
  bloom.addColorStop(0, 'rgba(255,92,70,0.30)');
  bloom.addColorStop(0.55, 'rgba(160,50,40,0.10)');
  bloom.addColorStop(1, 'rgba(10,12,16,0)');
  g.fillStyle = bloom;
  g.fillRect(0, 0, CARD_W, CARD_H);

  // faint scanline texture so the card reads as a readout, not a poster
  g.fillStyle = 'rgba(255,255,255,0.018)';
  for (let y = 0; y < CARD_H; y += 4) g.fillRect(0, y, CARD_W, 1);

  // ---- header
  g.textAlign = 'center';
  g.fillStyle = '#ff5c46';
  g.font = '700 26px Rajdhani, sans-serif';
  g.letterSpacing = '10px';
  g.fillText(t('lore.tag'), CARD_W / 2, 120);
  g.fillStyle = '#edeae2';
  g.font = '700 76px Orbitron, Rajdhani, sans-serif';
  g.letterSpacing = '4px';
  g.fillText('CINDERFALL', CARD_W / 2, 200);

  // divider
  const div = g.createLinearGradient(140, 0, CARD_W - 140, 0);
  div.addColorStop(0, 'rgba(214,69,58,0)');
  div.addColorStop(0.5, 'rgba(214,69,58,0.85)');
  div.addColorStop(1, 'rgba(214,69,58,0)');
  g.fillStyle = div;
  g.fillRect(140, 236, CARD_W - 280, 2);

  // ---- hero stat: the attempt count. This is the number players screenshot.
  g.fillStyle = 'rgba(237,234,226,0.5)';
  g.font = '600 30px Rajdhani, sans-serif';
  g.letterSpacing = '8px';
  g.fillText(t('share.attempts'), CARD_W / 2, 330);
  g.fillStyle = '#ff7860';
  g.font = '700 210px Orbitron, Rajdhani, sans-serif';
  g.letterSpacing = '0px';
  g.fillText(`#${stats.attempts}`, CARD_W / 2, 500);

  // ---- secondary stats row
  const rowY = 660;
  roundRect(g, 90, rowY - 60, CARD_W - 180, 170, 18);
  g.fillStyle = 'rgba(255,255,255,0.04)';
  g.fill();
  const colW = (CARD_W - 180) / 2;
  statBlock(g, 90, rowY, colW, t('share.stage'), stats.stage, '#edeae2');
  statBlock(g, 90 + colW, rowY, colW, t('share.kills'), stats.kills, '#edeae2');

  // ---- currency earned, using the real in-game coin art
  const coin = document.createElement('canvas');
  coin.width = coin.height = 92;
  paintScrap(coin.getContext('2d'), 92, 92);
  g.drawImage(coin, CARD_W / 2 - 96, 850, 72, 72);
  g.textAlign = 'left';
  g.fillStyle = '#ffd479';
  g.font = '700 54px Orbitron, Rajdhani, sans-serif';
  g.fillText(String(stats.scrap || 0), CARD_W / 2 - 8, 906);

  // ---- footer call to action
  g.textAlign = 'center';
  g.fillStyle = 'rgba(237,234,226,0.34)';
  g.font = '600 24px Rajdhani, sans-serif';
  g.letterSpacing = '5px';
  g.fillText(t('share.cta'), CARD_W / 2, 1030);

  // frame
  g.strokeStyle = 'rgba(214,69,58,0.35)';
  g.lineWidth = 3;
  roundRect(g, 22, 22, CARD_W - 44, CARD_H - 44, 26);
  g.stroke();
  g.letterSpacing = '0px';
  return cv;
}

function toBlob(cv) {
  return new Promise((resolve) => {
    if (cv.toBlob) cv.toBlob(resolve, 'image/png');
    else resolve(null);
  });
}

// Shares the painted card. Returns:
//   'shared'  — went out through the OS share sheet (image or text)
//   'saved'   — downloaded to the device instead
//   'copied'  — text landed on the clipboard
//   'failed'  — nothing worked
export async function shareCard(cv, stats) {
  const text = t('share.body', { stage: stats.stage, attempts: stats.attempts });
  const blob = await toBlob(cv);

  // 1) image share — what actually travels on WhatsApp / Instagram
  if (blob && navigator.canShare) {
    const file = new File([blob], 'cinderfall.png', { type: 'image/png' });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text, title: t('share.title') });
        return 'shared';
      } catch (e) {
        if (e && e.name === 'AbortError') return 'shared';   // user dismissed
      }
    }
  }
  // 2) text-only share sheet
  if (navigator.share) {
    try {
      await navigator.share({ text, title: t('share.title') });
      return 'shared';
    } catch (e) {
      if (e && e.name === 'AbortError') return 'shared';
    }
  }
  // 3) save the image to the device
  if (blob) {
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'cinderfall.png';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      return 'saved';
    } catch (e) { /* fall through */ }
  }
  // 4) clipboard
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch (e) {
    return 'failed';
  }
}
