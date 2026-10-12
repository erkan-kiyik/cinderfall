// CINDERFALL LAB — art style tokens.
//
// Clean stylised look: flat colour blocks, three tones per material (light,
// mid, shade) plus a line tone, a dark outer outline, and one key light from
// the upper right (the direction characters face). Everything that is drawn
// takes its colours from here, so a palette change is a one-file change.

// Key light, pointing from the subject toward the light (upper right, front).
export const LIGHT = { x: 0.55, y: -0.84 };

// Outer outline: colour and thickness in world units (character = 64 tall).
export const INK = '#0f1218';
export const OUTLINE = 0.85;

// tone(light, mid, shade, line)
export const tone = (l, m, d, k) => ({ l, m, d, k });

// Neutral slate ramp, n0 (darkest) … n8 (warm white).
export const N = ['#0d1015', '#151a21', '#1e252e', '#2a323d', '#3c4654', '#5d6878', '#939dab', '#d9dee5', '#f4f1ea'];

// Brand and gameplay colours.
export const C = {
  ember: '#ff6b2c', emberHi: '#ff9a5c', emberLo: '#c4441a',
  cream: '#f2dfbf',
  steel: '#48627e', steelHi: '#6f8ba8', steelLo: '#2b3b4f',
  danger: '#ff3347',
  interact: '#3ee8e0',
  gold: '#ffc93c',
};

// Rarity frame colours (UI and skin tiers).
export const RARITY = {
  common: '#9aa4b1', rare: '#4aa8ff', epic: '#b26bff',
  legendary: '#ffb22e', mythic: '#ff4f6d', ultra: '#3ee8e0',
};

// Shared materials.
export const M = {
  skinA: tone('#f3c3a0', '#dca07c', '#b37355', '#7c4634'),
  skinB: tone('#c98a5e', '#a86a44', '#7e4a2f', '#4f2c1c'),
  skinC: tone('#8a5a3c', '#6d4430', '#4e2f21', '#2e1a12'),
  skinD: tone('#f0d0b4', '#d9b293', '#ad836a', '#6f4d3d'),
  black: tone('#3a3f4a', '#262a33', '#181b21', '#0b0d11'),
  charcoal: tone('#4a5361', '#353c48', '#232831', '#12151b'),
  gunmetal: tone('#5d6673', '#3f4652', '#2a3039', '#14171c'),
  rubber: tone('#34383f', '#25282e', '#191b20', '#0c0d10'),
  leather: tone('#8c5a3a', '#6b4129', '#4a2b1b', '#26150c'),
  brass: tone('#ffe39a', '#e8b65a', '#a9792f', '#5e3f14'),
  white: tone('#ffffff', '#e6ebf0', '#b9c3ce', '#6e7987'),
  lens: tone('#c8fbff', '#3ee8e0', '#1a8c95', '#0b3c42'),
  visor: tone('#ff8a95', '#ff3347', '#b0172a', '#5a0a14'),
};
