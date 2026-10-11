// Country -> legal regime. Each regime decides which privacy notice and terms
// addendum a player sees, in which languages, how advertising consent works
// (opt-in everywhere except the US, where the law is notice + opt-out), the
// age below which a player cannot consent to ad processing themselves, and
// whether ads are served at all in that market.
//
// Defaults are deliberately strict: an unknown country gets the opt-in regime,
// and personalised ads are never offered to anyone under 18 anywhere.

const EU = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE',
  'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'IS', 'LI', 'NO'];
// GDPR Art. 8 age of digital consent, as each Member State set it.
const EU_AGE = { AT: 14, BE: 13, BG: 14, HR: 16, CY: 14, CZ: 15, DK: 13, EE: 13, FI: 13, FR: 15,
  DE: 16, GR: 15, HU: 16, IE: 16, IT: 14, LV: 13, LT: 14, LU: 16, MT: 13, NL: 16, PL: 16, PT: 13,
  RO: 16, SK: 16, SI: 15, ES: 14, SE: 13, IS: 13, LI: 16, NO: 13 };
const MENA = ['SA', 'AE', 'QA', 'BH', 'KW', 'OM', 'EG', 'JO', 'LB', 'MA', 'DZ', 'TN', 'IQ', 'LY', 'YE', 'PS', 'SY', 'SD'];
const US = ['US', 'PR', 'GU', 'VI', 'AS', 'MP', 'UM'];
const SPANISH = ['ES', 'MX', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC', 'GT', 'CU', 'BO', 'DO', 'HN', 'PY',
  'SV', 'NI', 'CR', 'PA', 'UY', 'PR', 'GQ'];
const FRENCH = ['FR', 'BE', 'LU', 'MC', 'SN', 'CI', 'CM', 'ML', 'BF', 'NE', 'TG', 'BJ', 'GA', 'CG',
  'CD', 'MG', 'HT'];
const PORTUGUESE = ['PT', 'BR', 'AO', 'MZ', 'CV', 'GW', 'ST', 'TL'];
const GERMAN = ['DE', 'AT', 'LI', 'CH', 'LU'];
const RUSSIAN = ['RU', 'BY', 'KZ', 'KG'];

export const DOC_LANGS = ['en', 'tr', 'de', 'es', 'fr', 'pt', 'ru', 'ar', 'hi'];

// regime id -> base profile
const REGIMES = {
  tr:    { model: 'optin',  consentAge: 18, ads: true },
  eu:    { model: 'optin',  consentAge: 16, ads: true },
  uk:    { model: 'optin',  consentAge: 13, ads: true },
  ch:    { model: 'optin',  consentAge: 16, ads: true },
  us:    { model: 'optout', consentAge: 13, ads: true },
  br:    { model: 'optin',  consentAge: 18, ads: true },
  ca:    { model: 'optin',  consentAge: 14, ads: true },
  kr:    { model: 'optin',  consentAge: 14, ads: true },
  jp:    { model: 'optin',  consentAge: 16, ads: true },
  in:    { model: 'optin',  consentAge: 18, ads: true },
  au:    { model: 'optin',  consentAge: 16, ads: true },
  za:    { model: 'optin',  consentAge: 18, ads: true },
  mena:  { model: 'optin',  consentAge: 18, ads: true },
  // Google does not serve ads in Russia or mainland China, and both regimes
  // restrict cross-border transfer of their residents' data: no ads at all.
  ru:    { model: 'optin',  consentAge: 18, ads: false },
  cn:    { model: 'optin',  consentAge: 18, ads: false },
  other: { model: 'optin',  consentAge: 16, ads: true },
};

export function regimeOf(country) {
  const c = (country || '').toUpperCase();
  if (c === 'TR') return 'tr';
  if (EU.includes(c)) return 'eu';
  if (['GB', 'GG', 'JE', 'IM', 'GI'].includes(c)) return 'uk';
  if (c === 'CH') return 'ch';
  if (US.includes(c)) return 'us';
  if (c === 'BR') return 'br';
  if (c === 'CA') return 'ca';
  if (c === 'KR') return 'kr';
  if (c === 'JP') return 'jp';
  if (c === 'IN') return 'in';
  if (c === 'AU') return 'au';
  if (c === 'ZA') return 'za';
  if (MENA.includes(c)) return 'mena';
  if (c === 'RU') return 'ru';
  if (c === 'CN') return 'cn';
  return 'other';
}

export function profileOf(country) {
  const id = regimeOf(country);
  const p = { id, country: (country || '').toUpperCase(), ...REGIMES[id] };
  if (id === 'eu') p.consentAge = EU_AGE[p.country] || 16;
  return p;
}

// Languages a regime's documents can be read in, best first. English is
// always offered; the local language leads where we have it.
export function docLangsFor(country) {
  const c = (country || '').toUpperCase();
  const out = [];
  if (c === 'TR') out.push('tr');
  if (GERMAN.includes(c)) out.push('de');
  if (FRENCH.includes(c) || c === 'CA' || c === 'CH') out.push('fr');
  if (SPANISH.includes(c) || US.includes(c)) out.push('es');
  if (PORTUGUESE.includes(c)) out.push('pt');
  if (RUSSIAN.includes(c)) out.push('ru');
  if (MENA.includes(c)) out.push('ar');
  if (c === 'IN') out.push('hi');
  if (!out.includes('en')) out.push('en');
  // the remaining languages stay selectable, after the local ones
  for (const l of DOC_LANGS) if (!out.includes(l)) out.push(l);
  return out;
}

// Best guess of the player's country, to pre-fill the picker. Region subtag of
// the browser language first, then the time zone. The player always confirms.
const TZ_COUNTRY = {
  'Europe/Istanbul': 'TR', 'Europe/Berlin': 'DE', 'Europe/Vienna': 'AT', 'Europe/Paris': 'FR',
  'Europe/Madrid': 'ES', 'Europe/Lisbon': 'PT', 'Europe/Rome': 'IT', 'Europe/London': 'GB',
  'Europe/Amsterdam': 'NL', 'Europe/Brussels': 'BE', 'Europe/Zurich': 'CH', 'Europe/Moscow': 'RU',
  'Europe/Warsaw': 'PL', 'Europe/Stockholm': 'SE', 'Europe/Athens': 'GR', 'Europe/Dublin': 'IE',
  'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US', 'America/Los_Angeles': 'US',
  'America/Phoenix': 'US', 'America/Anchorage': 'US', 'Pacific/Honolulu': 'US', 'America/Toronto': 'CA',
  'America/Vancouver': 'CA', 'America/Montreal': 'CA', 'America/Sao_Paulo': 'BR', 'America/Mexico_City': 'MX',
  'America/Argentina/Buenos_Aires': 'AR', 'America/Bogota': 'CO', 'America/Santiago': 'CL', 'America/Lima': 'PE',
  'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR', 'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN', 'Asia/Shanghai': 'CN',
  'Asia/Riyadh': 'SA', 'Asia/Dubai': 'AE', 'Asia/Qatar': 'QA', 'Africa/Cairo': 'EG', 'Africa/Johannesburg': 'ZA',
  'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Australia/Perth': 'AU', 'Asia/Baku': 'AZ',
};
export function guessCountry() {
  try {
    for (const tag of navigator.languages || [navigator.language]) {
      const m = /-([A-Za-z]{2})\b/.exec(tag || '');
      if (m) return m[1].toUpperCase();
    }
  } catch (e) { /* no navigator */ }
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (TZ_COUNTRY[tz]) return TZ_COUNTRY[tz];
  } catch (e) { /* no Intl */ }
  return '';
}

// Every ISO 3166 country code, for the picker. Names come from
// Intl.DisplayNames in the reader's language, so nothing here needs
// translating.
export const COUNTRIES = ('AF AX AL DZ AS AD AO AI AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM BT BO BA BW BR '
  + 'BN BG BF BI CV KH CM CA KY CF TD CL CN CO KM CG CD CK CR CI HR CU CW CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET '
  + 'FK FO FJ FI FR GF PF GA GM GE DE GH GI GR GL GD GP GU GT GG GN GW GY HT HN HK HU IS IN ID IR IQ IE IM IL IT JM '
  + 'JP JE JO KZ KE KI KP KR XK KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MQ MR MU YT MX FM MD MC MN '
  + 'ME MS MA MZ MM NA NR NP NL NC NZ NI NE NG NU MK MP NO OM PK PW PS PA PG PY PE PH PL PT PR QA RE RO RU RW BL SH '
  + 'KN LC MF PM VC WS SM ST SA SN RS SC SL SG SX SK SI SB SO ZA SS ES LK SD SR SE CH SY TW TJ TZ TH TL TG TO TT TN '
  + 'TR TM TC TV UG UA AE GB US UY UZ VU VA VE VN VG VI WF YE ZM ZW').split(' ');
