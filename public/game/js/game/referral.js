// Invite codes.
//
// ---------------------------------------------------------------------------
// What this can and cannot be, and why
// ---------------------------------------------------------------------------
// Cinderfall has no backend. Not "a backend that is turned off" — there is no
// network call anywhere in the game, and every byte of progress lives in this
// device's localStorage. That single fact decides the whole shape of this
// feature, so it is worth being explicit about what follows from it.
//
// A referral system normally leans on a server for four things: proving a code
// belongs to a real other player, stopping someone redeeming their own code,
// stopping one device farming many codes, and paying the INVITER once their
// friend actually plays. Only the first three can be done offline, and only
// approximately. The fourth needs a channel back from the friend's device,
// which does not exist.
//
// So the loop is built out of two codes instead of one:
//
//   1. Every install derives a stable INVITE code from its own id. The player
//      shares it. A friend enters it on their device and is paid a joining
//      bonus immediately.
//   2. Redeeming prints a THANK-YOU code, minted against BOTH the inviter's
//      code and a tag for the redeemer's device. The friend sends that back;
//      the inviter enters it and is paid their half. The inviter can verify it
//      really was minted against their own code, and the tag is recorded on
//      claim, so one friend pays out exactly once however many times their
//      code is entered.
//
// That is a genuine two-sided referral with no server. What it is NOT is
// tamper-proof: the checksum below stops typos and casual guessing, not a
// determined player who reads this file — it ships in the client, so the
// algorithm is public by construction. There is no way to fix that offline,
// and pretending otherwise would be worse than saying it. The defence is
// therefore economic rather than cryptographic: the rewards are capped, small
// enough not to distort the scrap economy, and cannot be farmed indefinitely
// (see INVITE_MAX_CLAIMS). If a real backend ever lands, verification moves
// there and these caps can be relaxed.

// Crockford-style alphabet: no I, L, O or U, so a code read off one phone and
// typed into another cannot be lost to 1/I or 0/O confusion — which on a
// hand-copied code is a far more likely failure than any attack.
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const CODE_LEN = 6;          // 5 payload characters + 1 checksum
const INSTALL_KEY = 'cinderfall.install.v1';

// Rewards. Deliberately modest and finite — see the note above about the
// defence being economic. A crate costs 300 scrap, so a join is worth about
// one and a half crates and the whole invite programme about eight.
export const INVITE_JOIN_REWARD = 450;    // paid to the player who enters a code
export const INVITE_THANKS_REWARD = 300;  // paid to the inviter, per friend
export const INVITE_MAX_CLAIMS = 8;       // most friends one install can be paid for

// ---------------------------------------------------------------- install id
// A random, device-local id. It is the only thing that makes "this is a
// different device" mean anything offline, so it is generated once and then
// left alone. It is never sent anywhere — nothing here can send anything.
export function installId() {
  try {
    let id = localStorage.getItem(INSTALL_KEY);
    if (id && id.length >= 8) return id;
    id = randomId();
    localStorage.setItem(INSTALL_KEY, id);
    return id;
  } catch (e) {
    // Private browsing or storage denied: fall back to a session-lifetime id
    // so the screen still works, accepting that it will not persist.
    if (!memoryId) memoryId = randomId();
    return memoryId;
  }
}
let memoryId = null;

function randomId() {
  const buf = new Uint8Array(10);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(buf);
  } else {
    for (let i = 0; i < buf.length; i++) buf[i] = (Math.random() * 256) | 0;
  }
  let out = '';
  for (const b of buf) out += ALPHABET[b % ALPHABET.length];
  return out;
}

// ------------------------------------------------------------------ codes
// FNV-1a. Not a security primitive and not used as one — it is here to spread
// an id across the alphabet and to catch mistyping. See the header.
function hash32(str, seed = 0x811c9dc5) {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function encode(n, len) {
  let out = '';
  let v = n >>> 0;
  for (let i = 0; i < len; i++) { out = ALPHABET[v % ALPHABET.length] + out; v = Math.floor(v / ALPHABET.length); }
  return out;
}

// One checksum character over the payload. Catches every single-character
// typo and every transposition of adjacent characters.
function checkChar(payload) {
  let sum = 0;
  for (let i = 0; i < payload.length; i++) {
    sum += (ALPHABET.indexOf(payload[i]) + 1) * (i + 2);
  }
  return ALPHABET[sum % ALPHABET.length];
}

function build(payloadNum) {
  const payload = encode(payloadNum, CODE_LEN - 1);
  return payload + checkChar(payload);
}

export function isWellFormed(code) {
  const c = normalize(code);
  if (c.length !== CODE_LEN) return false;
  for (const ch of c) if (ALPHABET.indexOf(ch) < 0) return false;
  return checkChar(c.slice(0, CODE_LEN - 1)) === c[CODE_LEN - 1];
}

// Accepts what a human actually types: lower case, spaces, dashes, and the
// letters the alphabet drops mapped onto the digits they look like.
export function normalize(code) {
  return String(code || '')
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/[IL]/g, '1')
    .replace(/O/g, '0')
    .replace(/U/g, 'V');
}

// This install's shareable invite code.
export function myInviteCode() {
  return build(hash32('invite:' + installId()));
}

// ---------------------------------------------------------- thank-you codes
// The inviter has to be able to CHECK this code, and offline they have only
// two things: their own invite code, and whatever the six characters carry.
// A code derived from the redeemer's install id alone would be unverifiable —
// the inviter has no idea what that id is — so the id has to travel inside the
// code. Hence the layout:
//
//     [ TT ][ PPP ][ C ]
//       |      |     `- checksum over the first five
//       |      `------- 3 chars binding TT to the INVITER's code
//       `-------------- 2-char tag identifying the redeemer
//
// The inviter recomputes PPP from their own invite code plus the TT they were
// handed: it matches only if the code really was minted against their code.
// TT is what makes one friend one payout — it is recorded on claim, so the
// same friend's code cannot be entered twice. Two chars is 1024 tags, which
// collides eventually, but INVITE_MAX_CLAIMS caps a run at 8, where the odds
// of a collision blocking a legitimate friend are under 3%.
const TAG_LEN = 2;
const THANKS_PAYLOAD = CODE_LEN - TAG_LEN - 1;   // 3

function tagFor(id) {
  return encode(hash32('tag:' + String(id)), TAG_LEN);
}

// The code a redeemer shows their inviter, naming one specific friendship
// rather than acting as a bearer token for any reward.
export function thanksCodeFor(inviterCode) {
  const tag = tagFor(installId());
  const body = encode(hash32('thanks:' + normalize(inviterCode) + ':' + tag), THANKS_PAYLOAD);
  return tag + body + checkChar(tag + body);
}

// The friend tag inside a thank-you code — what gets recorded so one friend
// pays out once.
export function thanksTag(thanksCode) {
  return normalize(thanksCode).slice(0, TAG_LEN);
}

// Verifies a thank-you code was minted against THIS install's invite code.
export function isThanksForMe(thanksCode) {
  const c = normalize(thanksCode);
  if (!isWellFormed(c)) return false;
  const tag = c.slice(0, TAG_LEN);
  const body = encode(hash32('thanks:' + myInviteCode() + ':' + tag), THANKS_PAYLOAD);
  return c.slice(TAG_LEN, TAG_LEN + THANKS_PAYLOAD) === body;
}

// Formats a code for display: XXX-XXX reads back over a voice call far more
// reliably than six unbroken characters.
export function formatCode(code) {
  const c = normalize(code);
  return c.length === CODE_LEN ? `${c.slice(0, 3)}-${c.slice(3)}` : c;
}

// ------------------------------------------------------------------ results
// Redemption outcomes, as data rather than thrown errors — every one of these
// is a normal thing for a player to do, and each needs its own message.
export const REDEEM = {
  OK: 'ok',
  BAD_FORMAT: 'badFormat',
  OWN_CODE: 'ownCode',
  ALREADY: 'alreadyRedeemed',
  NOT_MINE: 'notMine',      // a thank-you code minted against someone else
  CAP: 'capReached',        // INVITE_MAX_CLAIMS friends already paid
};
