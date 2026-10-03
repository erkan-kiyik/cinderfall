// English legal texts — the master version every translation follows.
// Sections are plain text (rendered with textContent); URLs and e-mail
// addresses are turned into links by the renderer.

const GOOGLE = 'https://policies.google.com/privacy';
const GOOGLE_PARTNERS = 'https://policies.google.com/technologies/partner-sites';

export default {
  ui: {
    title: 'Before you play',
    intro: 'Please choose your country, confirm your year of birth and review the documents below. Your choices are stored only on this device.',
    country: 'Country / region of residence',
    docLang: 'Document language',
    birthYear: 'Year of birth',
    select: 'Select…',
    readPrivacy: 'Read the Privacy Notice',
    readTerms: 'Read the Terms of Service',
    readConsent: 'Read the consent text',
    acceptTerms: 'I have read and accept the Terms of Service.',
    ackPrivacy: 'I have read the Privacy Notice.',
    guardian: 'I am under 18 and my parent or legal guardian has read these documents and agrees to them.',
    adsSection: 'Optional — rewarded ads',
    adsOptin: 'I consent to rewarded ads being shown by Google AdMob, including the processing of my device identifiers and IP address and their transfer abroad, as described in the consent text. (Optional — you can play without it.)',
    adsPersonal: 'I also consent to personalised ads. (Optional)',
    doNotSell: 'Do Not Sell or Share My Personal Information.',
    adsUnavailable: 'Rewarded ads are not available in your region, so no advertising data is processed.',
    adsAge: 'Because of your age, rewarded ads are switched off and no advertising data is processed.',
    accept: 'Accept and continue',
    save: 'Save choices',
    close: 'Close',
    back: 'Back',
    manage: 'Privacy & legal',
    manageHint: 'Documents, consent choices, your data.',
    deleteData: 'Delete all my data on this device',
    deleteConfirm: 'This permanently deletes your progress, items, settings and consent choices on this device. Continue?',
    footer: 'You can view the documents, change your choices or withdraw consent at any time in Settings › Privacy & legal.',
    privacyTitle: 'Privacy Notice',
    privacyTitleTR: 'KVKK Information Notice and Privacy Policy',
    termsTitle: 'Terms of Service',
    consentTitle: 'Consent to rewarded advertising',
    consentTitleTR: 'Explicit Consent Text (KVKK)',
    updated: 'Last updated',
    langNote: 'This section is shown in English because it is not yet available in the selected language.',
    required: 'Required',
    adsOff: 'Rewarded ads are off. You can turn them on in Settings › Privacy & legal.',
    summary: [
      'No account, no sign-up: your progress is saved only on this device.',
      'We run no servers and receive none of your gameplay data.',
      'Rewarded ads by Google appear only if you choose to watch one — and, where the law requires, only with your consent.',
    ],
  },

  privacy(ctx) {
    const { C, P, date } = ctx;
    return [
      { p: [`This notice explains how ${C.game} ("the game") handles personal data. It applies to players in ${ctx.countryName}. Version: ${date}.`] },
      { h: '1. Who is responsible', p: [
        `The data controller is ${C.name}, an individual developer based in Türkiye. Contact: ${C.email}.`,
      ] },
      { h: '2. The short version', ul: [
        'The game needs no account and never asks for your name, e-mail address, contacts, photos, microphone or precise location.',
        'Your progress, items, settings and consent choices are stored only on your device. We cannot see or access them.',
        P.ads
          ? 'If you choose to watch a rewarded ad, Google AdMob processes data about your device to show it. Where the law requires consent, this happens only after you give it.'
          : 'No advertising is shown in your region, so no advertising data is processed.',
        'We do not sell personal data for money and we do not build profiles of you.',
      ] },
      { h: '3. What is processed, why, and on what legal basis', ul: [
        'Game data on your device — level, statistics, currency, unlocked items, loadout, checkpoint, settings, a random install code used for invite codes, and a record of your legal choices. Purpose: to provide the game you asked for. Legal basis: performance of our agreement with you (the Terms). This data stays on your device.',
        ...(P.ads ? [
          'Rewarded advertising (only when you tap "Watch ad") — your device advertising identifier, IP address, approximate location derived from the IP address, device and app information, and how you interact with the ad. Purpose: to show the ad, pay out the reward, measure the ad and prevent fraud; and, only if you separately agree, to personalise ads. Legal basis: your consent' + (P.model === 'optout' ? ' or, where the law allows, our legitimate interest, with a right to opt out of selling and sharing' : '') + '. Google LLC / Google Ireland Ltd. process this data under their own policy: ' + GOOGLE + ' and ' + GOOGLE_PARTNERS + '.',
        ] : []),
        'Web version only — the server hosting the page may log your IP address and browser type to deliver the page and protect it from abuse. Legal basis: legitimate interest in running a secure service.',
        'If you e-mail us — your e-mail address and message, to answer you. Legal basis: legitimate interest in replying to requests (and legal obligation where you exercise a privacy right).',
      ] },
      { h: '4. Who receives data and international transfers', p: [
        P.ads
          ? 'Advertising data is received by Google (Google LLC, USA, and Google Ireland Ltd., Ireland), which may process it on servers outside your country, including in the United States. Where your law restricts transfers abroad, we rely on your explicit consent and on the safeguards Google maintains (such as the EU Standard Contractual Clauses and the EU–US Data Privacy Framework). Nobody else receives your data, except where we are legally required to disclose it.'
          : 'We do not transfer your data to anyone, except where we are legally required to disclose it.',
      ] },
      { h: '5. How long data is kept', ul: [
        'Game data on your device: until you delete it (Settings › Privacy & legal › Delete my data), clear the app data or uninstall the game.',
        P.ads ? 'Advertising data: according to Google\'s retention policy; you can reset your advertising ID in your device settings at any time.' : 'Advertising data: none is collected.',
        'E-mails to us: as long as needed to handle your request, and at most 2 years.',
      ] },
      { h: '6. Your choices', ul: [
        'You can give, change or withdraw advertising consent at any time in Settings › Privacy & legal. Withdrawing consent does not affect processing done before.',
        'You can reset or delete your advertising ID in your Android / iOS settings, and limit ad tracking there.',
        'You can delete everything the game stored on your device in Settings › Privacy & legal › Delete my data.',
      ] },
      ...ctx.rights(ctx),
      { h: 'Children', p: [
        `We ask for your year of birth with a neutral question. Players under ${P.consentAge} — and under 13 everywhere — never see ads and no advertising data is processed for them. Nobody under 18 is shown personalised ads. If you are under 18, your parent or legal guardian must review these documents with you. If you believe a child has given us personal data, contact ${C.email} and we will delete it.`,
      ] },
      { h: 'Security', p: [
        'Game data is protected by your device\'s operating-system sandbox. Advertising traffic uses encrypted connections. We do not operate servers that store personal data.',
      ] },
      { h: 'Changes to this notice', p: [
        'If we change this notice materially, the game will show it again and ask for your review before you continue playing.',
      ] },
    ];
  },

  consent(ctx) {
    const { C, P } = ctx;
    return [
      { p: [`By ticking the rewarded-ads box you give ${C.name} (data controller) your free, specific and informed consent to the following. Consent is optional: if you do not give it, you can still play the whole game — only the optional "watch an ad for a reward" features are unavailable.`] },
      { h: 'What you consent to', ul: [
        'When you choose to watch a rewarded ad, Google AdMob (Google LLC, USA / Google Ireland Ltd.) processes your device advertising identifier, IP address, approximate location derived from the IP address, device and app information and ad interactions, to show the ad, pay out the reward, measure it and prevent fraud.',
        'This data is transferred to and processed on Google servers outside your country, including in the United States.',
        'Only if you also tick the personalised-ads box (18+ only): Google may use this data to show ads based on your interests.',
      ] },
      { h: 'Withdrawing consent', p: [
        'You can withdraw consent at any time in Settings › Privacy & legal, as easily as you gave it. Withdrawal does not affect the lawfulness of processing before it. Google\'s own policy: ' + GOOGLE + '.',
      ] },
      ...(P.id === 'tr' ? [{ p: ['For players in Türkiye this is explicit consent under Articles 5(1) and 9 of Law No. 6698 on the Protection of Personal Data.'] }] : []),
    ];
  },

  terms(ctx) {
    const { C } = ctx;
    return [
      { p: [`These Terms of Service ("Terms") are an agreement between you and ${C.name} ("we"), the developer of ${C.game}. By accepting them in the game you agree to them. If you do not agree, do not use the game.`] },
      { h: '1. Who may play', p: [
        'You must be old enough to accept these Terms under the law of your country. If you are under 18 (or the age of majority where you live), your parent or legal guardian must review and accept these Terms for you and is responsible for your use of the game.',
      ] },
      { h: '2. Licence', p: [
        'We grant you a personal, non-exclusive, non-transferable, revocable licence to install and play the game for private, non-commercial entertainment on devices you own or control.',
      ] },
      { h: '3. Acceptable use', ul: [
        'Do not reverse engineer, decompile or modify the game, except to the extent the law expressly allows despite this restriction.',
        'Do not cheat, exploit bugs, or distribute modified copies.',
        'Do not use the game unlawfully or in breach of the terms of the app store you got it from.',
      ] },
      { h: '4. Virtual currency and items', p: [
        'Scrap, crates, skins and other virtual items are earned in the game, have no monetary value, cannot be bought, sold or exchanged for real money, and are licensed to you — not sold. Crate contents are random; drop chances are fixed by the game. Virtual items are stored only on your device and are lost if that data is deleted. We may rebalance or change virtual items in updates.',
      ] },
      { h: '5. Ads', p: [
        'The game may offer optional rewarded ads supplied by Google. Watching them is never required. Ads are governed by the Privacy Notice and your consent choices.',
      ] },
      { h: '6. Intellectual property', p: [
        `${C.game} and all of its code, artwork, audio, characters and text are owned by us and protected by law. All characters, factions and places are fictional; any resemblance to real persons or organisations is coincidental.`,
      ] },
      { h: '7. Updates and availability', p: [
        'We may update, change or discontinue the game or any feature. We do not guarantee that the game will be available on every device or without interruption.',
      ] },
      { h: '8. Warranties', p: [
        'The game is provided free of charge "as is" and "as available". To the extent permitted by law, we give no warranty that it is error-free or fit for a particular purpose. Your statutory rights as a consumer are not affected.',
      ] },
      { h: '9. Liability', p: [
        'To the extent permitted by law, we are not liable for indirect or consequential loss, or for loss of virtual items or progress. Nothing in these Terms limits or excludes liability for intent, gross negligence, death or personal injury, or any liability that cannot be limited or excluded by law.',
      ] },
      { h: '10. Ending this agreement', p: [
        'You can stop using the game and delete it at any time. We may end your licence if you seriously breach these Terms. Sections 4, 6, 8, 9 and 12 survive termination.',
      ] },
      { h: '11. Changes to these Terms', p: [
        'If we change these Terms materially, the game will show the new version and ask you to accept it before you continue playing.',
      ] },
      { h: '12. Governing law and disputes', p: [
        'These Terms are governed by the laws of the Republic of Türkiye. This choice of law does not deprive you of the protection of the mandatory consumer laws of the country where you live, and you may bring a claim in the courts of your country of residence where your law allows it.',
      ] },
      ...ctx.termsLocal(ctx),
      { h: 'App stores', p: [
        'These Terms are between you and us only, not Apple or Google. Apple and Google have no obligation to provide maintenance or support and are not responsible for the game or any claims about it. If you downloaded the game from the Apple App Store, Apple and its subsidiaries are third-party beneficiaries of these Terms and may enforce them. You confirm that you are not in a country subject to a U.S. Government embargo and are not on any U.S. Government list of prohibited parties.',
      ] },
      { h: 'Contact', p: [`${C.name} — ${C.email}`] },
    ];
  },

  // Regime-specific privacy rights. Each returns sections.
  rights: {
    tr: (ctx) => [
      { h: 'Your rights under KVKK (Law No. 6698, Türkiye)', ul: [
        'Under Article 11 you may ask us whether your personal data is processed; request information about it; learn the purpose of processing and whether it is used accordingly; know the third parties in Türkiye or abroad to whom it is transferred; request correction of incomplete or inaccurate data; request deletion or destruction under Article 7; request that third parties be notified of corrections or deletions; object to a result arising against you from analysis exclusively by automated systems; and claim compensation for damage caused by unlawful processing.',
        `Send your request in writing or by e-mail to ${ctx.C.email}, under the Communiqué on the Procedures and Principles of Application to the Data Controller. We reply free of charge within 30 days at the latest.`,
        'If your request is refused, our reply is insufficient or we do not reply in time, you may complain to the Personal Data Protection Board (Kişisel Verileri Koruma Kurulu) within 30 days of our reply, and in any case within 60 days of your request: https://www.kvkk.gov.tr',
      ] },
    ],
    eu: (ctx) => [
      { h: 'Your rights under the GDPR', ul: [
        'You have the right to access your data, to rectification, to erasure, to restriction of processing, to data portability, and to object to processing based on legitimate interests (Articles 15–21 GDPR). You can withdraw consent at any time (Article 7(3)).',
        'We do not make decisions based solely on automated processing that produce legal or similarly significant effects on you.',
        'Because our own processing is occasional and not large-scale, we have not appointed a representative in the EU (Article 27(2) GDPR).',
        `Contact us at ${ctx.C.email}. We reply within one month.`,
        'You have the right to lodge a complaint with the data protection authority of your Member State; the list is at https://edpb.europa.eu/about-edpb/about-edpb/members_en',
      ] },
    ],
    uk: (ctx) => [
      { h: 'Your rights under the UK GDPR and the Data Protection Act 2018', ul: [
        'You have the rights of access, rectification, erasure, restriction, data portability and objection, and you can withdraw consent at any time.',
        'We follow the ICO Age Appropriate Design Code: high-privacy settings by default, no personalised ads for anyone under 18.',
        `Contact us at ${ctx.C.email}. We reply within one month.`,
        'You can complain to the Information Commissioner\'s Office: https://ico.org.uk',
      ] },
    ],
    ch: (ctx) => [
      { h: 'Your rights under the Swiss Federal Act on Data Protection (nFADP)', ul: [
        'You have the right to information, rectification, deletion and data portability, and you can withdraw consent at any time.',
        `Contact us at ${ctx.C.email}.`,
        'You can contact the Federal Data Protection and Information Commissioner (FDPIC): https://www.edoeb.admin.ch',
      ] },
    ],
    us: (ctx) => [
      { h: 'California privacy notice (CCPA / CPRA) and other U.S. state laws', ul: [
        'Notice at collection — categories of personal information processed when you watch a rewarded ad: identifiers (advertising ID, IP address); internet or other network activity (ad interactions); approximate geolocation derived from the IP address; inferences drawn by Google for ad personalisation. Source: your device. Purposes: showing ads, paying rewards, measurement, fraud prevention and, unless you opt out, cross-context behavioural advertising. Recipient: Google. Retention: see section 5. We collect no sensitive personal information.',
        'Sale or sharing: making this data available to Google for cross-context behavioural advertising may be a "sale" or "sharing" under California law. You can opt out at any time with the "Do Not Sell or Share My Personal Information" switch in the game (Settings › Privacy & legal). On the web version we honour the Global Privacy Control signal. We do not sell or share personal information of anyone we know is under 16 (in fact, of anyone under 18).',
        'Your rights: to know and access the personal information we hold, to delete it, to correct it, to opt out of sale and sharing, and not to be discriminated against for exercising these rights. You can use an authorised agent. Because we hold no personal data on servers, most requests are answered by the controls in the game; otherwise e-mail ' + ctx.C.email + '. We respond within 45 days.',
        'Residents of Virginia, Colorado, Connecticut, Utah, Texas, Oregon, Montana, Iowa, Delaware, New Hampshire, New Jersey, Tennessee, Minnesota, Maryland, Indiana, Kentucky, Nebraska, Rhode Island and other states with similar laws have comparable rights, including to opt out of targeted advertising. If we refuse a request you may appeal by e-mailing us with the subject "Appeal"; if the appeal is denied, you may contact your state Attorney General.',
        'Children (COPPA): the game is not directed to children under 13. We do not knowingly collect personal information from children under 13 — no ads are shown to them. Parents can contact ' + ctx.C.email + '.',
      ] },
    ],
    br: (ctx) => [
      { h: 'Your rights under the LGPD (Law No. 13.709/2018, Brazil)', ul: [
        'Legal bases: performance of a contract (Art. 7, V) for game data; consent (Art. 7, I) for advertising; legitimate interest (Art. 7, IX) for web server logs. International transfer to Google is based on your specific consent (Art. 33, VIII) and Google\'s contractual safeguards.',
        'Under Article 18 you may obtain confirmation and access, correction, anonymisation, blocking or deletion, portability, information about sharing and about the consequences of refusing consent, and revoke consent.',
        `Our contact for data protection requests (encarregado): ${ctx.C.name}, ${ctx.C.email}.`,
        'You may petition the National Data Protection Authority (ANPD): https://www.gov.br/anpd',
      ] },
    ],
    ca: (ctx) => [
      { h: 'Your rights in Canada (PIPEDA and provincial laws, including Québec Law 25)', ul: [
        'You can request access to and correction of your personal information and withdraw consent at any time.',
        `Person in charge of the protection of personal information: ${ctx.C.name}, ${ctx.C.email}.`,
        'In Québec, consent for a person under 14 is given by the parent or guardian.',
        'You can complain to the Office of the Privacy Commissioner of Canada (https://www.priv.gc.ca) or, in Québec, the Commission d\'accès à l\'information (https://www.cai.gouv.qc.ca).',
      ] },
    ],
    kr: (ctx) => [
      { h: 'Your rights under the Personal Information Protection Act (Korea)', ul: [
        'You may request access, correction, deletion and suspension of processing of your personal information, and withdraw consent.',
        'Overseas transfer: when you watch a rewarded ad, the items listed in section 3 are transferred to Google LLC (USA) over the network at that moment, for ad delivery and fraud prevention, and kept according to Google\'s retention policy. You can refuse by not giving advertising consent; the game remains fully playable.',
        'Children under 14 need the consent of a legal representative; we do not show ads to them.',
        `Privacy officer: ${ctx.C.name}, ${ctx.C.email}. You can also contact the Personal Information Protection Commission (https://www.pipc.go.kr) or the Privacy Infringement Report Center (call 118).`,
      ] },
    ],
    jp: (ctx) => [
      { h: 'Information under the Act on the Protection of Personal Information (Japan)', ul: [
        'Advertising data is provided to Google LLC in the United States only with your consent. The United States has no single comprehensive federal data protection law; Google maintains its own safeguards described in its privacy policy.',
        `You may request disclosure, correction, suspension of use or deletion of retained personal data: ${ctx.C.email}.`,
        'You can contact the Personal Information Protection Commission: https://www.ppc.go.jp',
      ] },
    ],
    in: (ctx) => [
      { h: 'Your rights under the Digital Personal Data Protection Act, 2023 (India)', ul: [
        'Advertising data is processed only with your consent, which you can withdraw at any time as easily as you gave it.',
        'You have the right to a summary of your personal data and its processing, to correction and erasure, to grievance redressal, and to nominate another person to exercise your rights.',
        'We do not show ads to anyone under 18 and we do not track or target advertising at children.',
        `Grievance officer: ${ctx.C.name}, ${ctx.C.email}. If your grievance is not resolved, you may approach the Data Protection Board of India.`,
      ] },
    ],
    au: (ctx) => [
      { h: 'Your rights under the Privacy Act 1988 (Australia)', ul: [
        'You can request access to and correction of your personal information.',
        'When you consent to ads, data is disclosed overseas to Google LLC in the United States.',
        `Contact ${ctx.C.email}. If you are not satisfied, you can complain to the Office of the Australian Information Commissioner: https://www.oaic.gov.au`,
      ] },
    ],
    za: (ctx) => [
      { h: 'Your rights under POPIA (South Africa)', ul: [
        'You may request access to, correction or deletion of your personal information, object to processing and withdraw consent.',
        'Personal information of a child under 18 is processed only with the consent of a competent person; we show no ads to children.',
        `Information officer: ${ctx.C.name}, ${ctx.C.email}. You can complain to the Information Regulator: https://inforegulator.org.za`,
      ] },
    ],
    mena: (ctx) => [
      { h: 'Your rights under the data protection laws of your country', ul: [
        'This includes the Saudi Personal Data Protection Law, the UAE Federal Decree-Law No. 45 of 2021, Qatar Law No. 13 of 2016, Bahrain Law No. 30 of 2018, Egypt Law No. 151 of 2020 and similar laws.',
        'Advertising data is processed and transferred abroad to Google only with your explicit consent, which you can withdraw at any time.',
        'You may request access to, correction and deletion of your personal data.',
        `Contact ${ctx.C.email}. You may also complain to your national data protection authority (for example SDAIA in Saudi Arabia: https://sdaia.gov.sa).`,
      ] },
    ],
    ru: (ctx) => [
      { h: 'Information for players in Russia (Federal Law No. 152-FZ)', ul: [
        'No advertising is shown in Russia and no personal data of players is transferred abroad or to us. Game data is processed only on your device.',
        `You may request information about the processing of your data and its deletion: ${ctx.C.email}. You may contact Roskomnadzor: https://rkn.gov.ru`,
      ] },
    ],
    cn: (ctx) => [
      { h: 'Information for players in mainland China (PIPL)', ul: [
        'No advertising is shown and no personal data is transferred abroad or to us. Game data is processed only on your device.',
        `You may request information about the processing of your data and its deletion: ${ctx.C.email}.`,
      ] },
    ],
    other: (ctx) => [
      { h: 'Your rights', ul: [
        'Wherever you live, we apply the same protections: you can ask what data is processed about you, have it corrected or deleted, and withdraw consent at any time.',
        `Contact ${ctx.C.email}. You may also complain to the data protection authority of your country, if there is one.`,
      ] },
    ],
  },

  // Regime-specific consumer terms.
  termsLocal: {
    tr: () => [
      { h: 'Consumers in Türkiye', p: [
        'Your rights under Law No. 6502 on the Protection of the Consumer are reserved. You may apply to the consumer arbitration committee or consumer court of your place of residence or where the transaction took place, within the monetary limits set each year.',
      ] },
    ],
    eu: () => [
      { h: 'Consumers in the EU / EEA', p: [
        'You keep all rights granted by the mandatory consumer law of your country of residence, including the legal guarantee of conformity for digital content. Because the game is free and no purchase is made, no right of withdrawal applies.',
      ] },
    ],
    uk: () => [
      { h: 'Consumers in the United Kingdom', p: [
        'Your statutory rights under the Consumer Rights Act 2015 are not affected.',
      ] },
    ],
    us: () => [
      { h: 'Users in the United States', p: [
        'Some states do not allow the exclusion of implied warranties or the limitation of certain damages, so parts of sections 8 and 9 may not apply to you.',
      ] },
    ],
    br: () => [
      { h: 'Consumers in Brazil', p: [
        'Your rights under the Consumer Defence Code (Law No. 8.078/1990) are preserved, and you may bring claims in the courts of your domicile.',
      ] },
    ],
    au: () => [
      { h: 'Consumers in Australia', p: [
        'Nothing in these Terms excludes, restricts or modifies any guarantee, right or remedy under the Australian Consumer Law that cannot lawfully be excluded.',
      ] },
    ],
    other: () => [],
  },
};
