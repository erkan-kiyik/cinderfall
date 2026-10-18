#!/usr/bin/env python3
"""Derives the website's optimised images and fonts from their sources.

Sources are never touched:
  store/screenshots/*.png          official Play store screenshots
  store/feature-graphic.png        Play feature graphic (key art)
  store/icon-512.png               app icon
  website/tools/captures/*.webp    frames captured from the real game build
  public/game/assets/fonts/*.woff2 the fonts the game itself ships

Outputs (committed, then copied by scripts/build-website.mjs):
  website/assets/img/*.webp        responsive WebP widths for every screenshot
  website/assets/img/icons/*       favicon / touch icon / manifest icons
  website/assets/fonts/*.woff2     Latin subsets of the game's fonts

Dev-only — needs Pillow (and fontTools + brotli for the font step, skipped
with a warning if missing). Run from anywhere:

  python3 website/tools/build-images.py
"""

from pathlib import Path
import shutil
import sys

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
IMG = ROOT / 'website/assets/img'
ICONS = IMG / 'icons'
FONTS = ROOT / 'website/assets/fonts'

WIDTHS = (640, 1280, 1920)
QUALITY = 80

SCREENSHOTS = {
    'shot-menu': 'store/screenshots/01-menu.png',
    'shot-firefight': 'store/screenshots/02-firefight.png',
    'shot-loadout': 'store/screenshots/03-loadout.png',
    'shot-trader': 'store/screenshots/04-trader.png',
    'shot-crate-reel': 'store/screenshots/05-crate-reel.png',
    'shot-reveal': 'store/screenshots/06-reveal.png',
}
CAPTURES = ['threat-searching', 'takedown-prompt', 'reload-dry', 'boss-warlord', 'operator-down', 'firefight']


def widths(name, src):
    im = Image.open(src).convert('RGB')
    for w in WIDTHS:
        if w > im.width:
            continue
        h = round(im.height * w / im.width)
        out = IMG / f'{name}-{w}.webp'
        im.resize((w, h), Image.LANCZOS).save(out, 'WEBP', quality=QUALITY, method=6)
    print(f'  {name}: {im.width}x{im.height} -> {", ".join(str(w) for w in WIDTHS if w <= im.width)}')


def keyart():
    # The feature graphic carries its own title lockup in the top half; the
    # final call-to-action has its own title, so it uses only the skyline and
    # the operator below that lockup.
    im = Image.open(ROOT / 'store/feature-graphic.png').convert('RGB')
    crop = im.crop((0, 246, im.width, im.height))
    crop.save(IMG / 'keyart-skyline-1024.webp', 'WEBP', quality=84, method=6)
    print(f'  keyart-skyline: {crop.width}x{crop.height}')


def icons():
    ICONS.mkdir(parents=True, exist_ok=True)
    src = Image.open(ROOT / 'store/icon-512.png').convert('RGBA')
    flat = Image.new('RGB', src.size, (11, 14, 19))
    flat.paste(src, mask=src.split()[3])
    flat.resize((32, 32), Image.LANCZOS).save(ICONS / 'favicon-32.png', optimize=True)
    flat.save(ICONS / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
    flat.resize((180, 180), Image.LANCZOS).save(ICONS / 'apple-touch-icon.png', optimize=True)
    flat.resize((192, 192), Image.LANCZOS).save(ICONS / 'icon-192.png', optimize=True)
    flat.save(ICONS / 'icon-512.png', optimize=True)
    print('  icons: favicon.ico, favicon-32, apple-touch-icon, icon-192, icon-512')


def fonts():
    try:
        from fontTools import subset
    except ImportError:
        print('  fonts: skipped (pip install fonttools brotli)', file=sys.stderr)
        return
    FONTS.mkdir(parents=True, exist_ok=True)
    src = ROOT / 'public/game/assets/fonts'
    # Basic Latin, Latin-1, Latin Extended-A (Turkish names), general
    # punctuation, arrows and a few symbols the page prints.
    unicodes = 'U+0000-00FF,U+0100-017F,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2122,U+2190-2199,U+2212,U+2215,U+25A0-25FF,U+FEFF,U+FFFD'
    for name in ('orbitron-800', 'rajdhani-600', 'rajdhani-700', 'inter-400', 'inter-600'):
        args = [
            str(src / f'{name}.woff2'), f'--unicodes={unicodes}', '--flavor=woff2',
            '--layout-features=kern,liga,calt,tnum,case', f'--output-file={FONTS / (name + ".woff2")}',
        ]
        subset.main(args)
        print(f'  font {name}: {(FONTS / (name + ".woff2")).stat().st_size // 1024} KB')
    for f in ('OFL.txt', 'ATTRIBUTION.txt'):
        shutil.copy(src / f, FONTS / f)


if __name__ == '__main__':
    IMG.mkdir(parents=True, exist_ok=True)
    print('screenshots')
    for name, rel in SCREENSHOTS.items():
        widths(name, ROOT / rel)
    print('captures')
    for name in CAPTURES:
        widths(f'play-{name}', ROOT / f'website/tools/captures/{name}.webp')
    print('key art')
    keyart()
    print('icons')
    icons()
    print('fonts')
    fonts()
