// The player's legal choices, stored only on this device, and the advertising
// policy that follows from them. Nothing here leaves the device.
import { LEGAL_VERSION } from './controller.js';
import { profileOf } from './jurisdictions.js';

const KEY = 'cinderfall.legal.v1';
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}
let state = load();

export function getConsent() { return state; }

// True until the current version of the documents has been accepted.
export function needsAcceptance(s = state) {
  return !s || s.v !== LEGAL_VERSION || !s.terms || !s.privacy || !s.country || !s.birthYear;
}

export function saveConsent(choices) {
  state = { ...choices, v: LEGAL_VERSION, ts: new Date().toISOString() };
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable */ }
  for (const fn of listeners) { try { fn(state); } catch (e) { /* listener error */ } }
}

export function onConsentChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

// Age from year of birth, assuming the birthday has not happened yet this
// year — the conservative reading for every threshold below.
export function ageOf(birthYear) {
  if (!birthYear) return 0;
  return new Date().getFullYear() - Number(birthYear) - 1;
}

function gpc() {
  try { return navigator.globalPrivacyControl === true; } catch (e) { return false; }
}

// What advertising may happen for a set of choices (defaults to the saved
// ones). `reason` explains a refusal: 'pending' | 'region' | 'age' | 'consent'.
export function adPolicy(s = state) {
  const off = (reason) => ({ allowed: false, personalized: false, reason });
  if (!s || !s.country || !s.birthYear) return off('pending');
  const P = profileOf(s.country);
  const age = ageOf(s.birthYear);
  if (!P.ads) return off('region');
  if (age < Math.max(13, P.consentAge)) return off('age');
  if (P.model === 'optout') {
    return { allowed: true, personalized: age >= 18 && !s.doNotSell && !gpc(), reason: '' };
  }
  if (!s.ads) return off('consent');
  return { allowed: true, personalized: age >= 18 && !!s.personal, reason: '' };
}

// The live policy also requires the current documents to be accepted.
export function currentAdPolicy() {
  if (needsAcceptance()) return { allowed: false, personalized: false, reason: 'pending' };
  return adPolicy(state);
}

// Erases everything the game stored on this device.
export function deleteAllData() {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('cinderfall')) keys.push(k);
    }
    for (const k of keys) localStorage.removeItem(k);
    sessionStorage.clear();
  } catch (e) { /* storage unavailable */ }
  state = null;
}
