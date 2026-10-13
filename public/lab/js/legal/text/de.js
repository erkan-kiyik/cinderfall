// Deutsche Rechtstexte (DSGVO, nDSG). Folgt der englischen Fassung.

const GOOGLE = 'https://policies.google.com/privacy';
const GOOGLE_PARTNERS = 'https://policies.google.com/technologies/partner-sites';

export default {
  ui: {
    title: 'Bevor du spielst',
    intro: 'Bitte wähle dein Land, bestätige dein Geburtsjahr und lies die folgenden Dokumente. Deine Auswahl wird nur auf diesem Gerät gespeichert.',
    country: 'Land / Region deines Wohnsitzes',
    docLang: 'Sprache der Dokumente',
    birthYear: 'Geburtsjahr',
    select: 'Auswählen…',
    readPrivacy: 'Datenschutzerklärung lesen',
    readTerms: 'Nutzungsbedingungen lesen',
    readConsent: 'Einwilligungstext lesen',
    acceptTerms: 'Ich habe die Nutzungsbedingungen gelesen und akzeptiere sie.',
    ackPrivacy: 'Ich habe die Datenschutzerklärung gelesen.',
    guardian: 'Ich bin unter 18 und meine Eltern bzw. mein gesetzlicher Vertreter haben diese Dokumente gelesen und stimmen ihnen zu.',
    adsSection: 'Freiwillig — Belohnungswerbung',
    adsOptin: 'Ich willige ein, dass Google AdMob Belohnungswerbung anzeigt und dabei meine Gerätekennungen und IP-Adresse verarbeitet und ins Ausland übermittelt, wie im Einwilligungstext beschrieben. (Freiwillig — du kannst auch ohne spielen.)',
    adsPersonal: 'Ich willige zusätzlich in personalisierte Werbung ein. (Freiwillig)',
    doNotSell: 'Meine personenbezogenen Daten nicht verkaufen oder weitergeben.',
    adsUnavailable: 'In deiner Region ist keine Belohnungswerbung verfügbar; es werden keine Werbedaten verarbeitet.',
    adsAge: 'Aufgrund deines Alters ist Belohnungswerbung ausgeschaltet und es werden keine Werbedaten verarbeitet.',
    accept: 'Akzeptieren und fortfahren',
    save: 'Auswahl speichern',
    close: 'Schließen',
    back: 'Zurück',
    manage: 'Datenschutz & Rechtliches',
    manageHint: 'Dokumente, Einwilligungen, deine Daten.',
    deleteData: 'Alle meine Daten auf diesem Gerät löschen',
    deleteConfirm: 'Dadurch werden dein Fortschritt, deine Gegenstände, Einstellungen und Einwilligungen auf diesem Gerät dauerhaft gelöscht. Fortfahren?',
    footer: 'Du kannst die Dokumente jederzeit unter Einstellungen › Datenschutz & Rechtliches ansehen, deine Auswahl ändern oder Einwilligungen widerrufen.',
    privacyTitle: 'Datenschutzerklärung',
    privacyTitleTR: 'KVKK-Informationspflicht und Datenschutzerklärung',
    termsTitle: 'Nutzungsbedingungen',
    consentTitle: 'Einwilligung in Belohnungswerbung',
    consentTitleTR: 'Ausdrückliche Einwilligung (KVKK)',
    updated: 'Zuletzt aktualisiert',
    langNote: 'Dieser Abschnitt wird auf Englisch angezeigt, weil er in der gewählten Sprache noch nicht verfügbar ist.',
    required: 'Erforderlich',
    adsOff: 'Belohnungswerbung ist ausgeschaltet. Du kannst sie unter Einstellungen › Datenschutz & Rechtliches einschalten.',
    summary: [
      'Kein Konto, keine Registrierung: Dein Fortschritt wird nur auf diesem Gerät gespeichert.',
      'Wir betreiben keine Server und erhalten keine deiner Spieldaten.',
      'Werbung von Google erscheint nur, wenn du selbst eine ansehen möchtest — und nur mit deiner Einwilligung.',
    ],
  },

  privacy(ctx) {
    const { C, P, date } = ctx;
    return [
      { p: [`Diese Erklärung beschreibt, wie ${C.game} („das Spiel") personenbezogene Daten verarbeitet. Sie gilt für Spieler in ${ctx.countryName}. Fassung: ${date}.`] },
      { h: '1. Verantwortlicher', p: [
        `Verantwortlicher ist ${C.name}, ein in der Türkei ansässiger Einzelentwickler. Kontakt: ${C.email}.`,
      ] },
      { h: '2. Kurz gesagt', ul: [
        'Das Spiel benötigt kein Konto und fragt nie nach deinem Namen, deiner E-Mail-Adresse, deinen Kontakten, Fotos, deinem Mikrofon oder deinem genauen Standort.',
        'Fortschritt, Gegenstände, Einstellungen und Einwilligungen werden nur auf deinem Gerät gespeichert. Wir können sie weder sehen noch abrufen.',
        P.ads
          ? 'Wenn du eine Belohnungswerbung ansehen möchtest, verarbeitet Google AdMob Daten über dein Gerät, um sie anzuzeigen — erst nachdem du eingewilligt hast.'
          : 'In deiner Region wird keine Werbung angezeigt; es werden keine Werbedaten verarbeitet.',
        'Wir verkaufen keine personenbezogenen Daten und erstellen keine Profile über dich.',
      ] },
      { h: '3. Welche Daten, wozu und auf welcher Rechtsgrundlage', ul: [
        'Spieldaten auf deinem Gerät — Level, Statistiken, Spielwährung, freigeschaltete Gegenstände, Ausrüstung, Speicherpunkt, Einstellungen, ein zufälliger Installationscode für Einladungscodes und ein Nachweis deiner rechtlichen Entscheidungen. Zweck: Bereitstellung des Spiels. Rechtsgrundlage: Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO); die Speicherung auf deinem Gerät ist hierfür unbedingt erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG). Diese Daten verlassen dein Gerät nicht.',
        ...(P.ads ? [
          'Belohnungswerbung (nur wenn du auf „Werbung ansehen" tippst) — Werbe-ID deines Geräts, IP-Adresse, daraus abgeleiteter ungefährer Standort, Geräte- und App-Informationen sowie deine Interaktion mit der Werbung. Zweck: Anzeige der Werbung, Auszahlung der Belohnung, Messung und Betrugsprävention; nur bei gesonderter Einwilligung zusätzlich Personalisierung. Rechtsgrundlage: deine Einwilligung (Art. 6 Abs. 1 lit. a DSGVO, § 25 Abs. 1 TDDDG). Google LLC / Google Ireland Ltd. verarbeiten diese Daten nach ihren eigenen Richtlinien: ' + GOOGLE + ' und ' + GOOGLE_PARTNERS + '.',
        ] : []),
        'Nur Webversion — der Server, der die Seite bereitstellt, kann deine IP-Adresse und deinen Browsertyp protokollieren, um die Seite auszuliefern und vor Missbrauch zu schützen. Rechtsgrundlage: berechtigtes Interesse an einem sicheren Betrieb (Art. 6 Abs. 1 lit. f DSGVO).',
        'Wenn du uns eine E-Mail schreibst — deine E-Mail-Adresse und Nachricht, um dir zu antworten. Rechtsgrundlage: berechtigtes Interesse (Art. 6 Abs. 1 lit. f) bzw. rechtliche Verpflichtung, wenn du ein Datenschutzrecht ausübst (lit. c).',
      ] },
      { h: '4. Empfänger und Übermittlungen ins Ausland', p: [
        P.ads
          ? 'Werbedaten erhält Google (Google LLC, USA, und Google Ireland Ltd., Irland), das sie auch auf Servern außerhalb der EU, etwa in den USA, verarbeiten kann. Die Übermittlung stützt sich auf den Angemessenheitsbeschluss zum EU-US Data Privacy Framework, unter dem Google zertifiziert ist, sowie auf EU-Standardvertragsklauseln. Andere Empfänger gibt es nicht, außer wir sind gesetzlich zur Offenlegung verpflichtet.'
          : 'Wir übermitteln deine Daten an niemanden, außer wir sind gesetzlich dazu verpflichtet.',
      ] },
      { h: '5. Speicherdauer', ul: [
        'Spieldaten auf deinem Gerät: bis du sie löschst (Einstellungen › Datenschutz & Rechtliches › Daten löschen), die App-Daten leerst oder das Spiel deinstallierst.',
        P.ads ? 'Werbedaten: gemäß den Aufbewahrungsrichtlinien von Google; deine Werbe-ID kannst du jederzeit in den Geräteeinstellungen zurücksetzen.' : 'Werbedaten: werden nicht erhoben.',
        'E-Mails an uns: so lange wie zur Bearbeitung nötig, höchstens 2 Jahre.',
      ] },
      { h: '6. Deine Wahlmöglichkeiten', ul: [
        'Du kannst deine Werbeeinwilligung jederzeit unter Einstellungen › Datenschutz & Rechtliches erteilen, ändern oder widerrufen. Der Widerruf berührt die Rechtmäßigkeit der bis dahin erfolgten Verarbeitung nicht.',
        'Du kannst deine Werbe-ID in den Android-/iOS-Einstellungen zurücksetzen oder löschen und Werbe-Tracking einschränken.',
        'Alles, was das Spiel auf deinem Gerät gespeichert hat, löschst du unter Einstellungen › Datenschutz & Rechtliches › Daten löschen.',
      ] },
      ...ctx.rights(ctx),
      { h: 'Kinder', p: [
        `Wir fragen dein Geburtsjahr neutral ab. Spieler unter ${P.consentAge} Jahren — und überall unter 13 — sehen nie Werbung, und es werden keine Werbedaten über sie verarbeitet. Niemand unter 18 erhält personalisierte Werbung. Wenn du unter 18 bist, müssen deine Eltern oder dein gesetzlicher Vertreter diese Dokumente mit dir durchgehen. Wenn du glaubst, dass ein Kind uns Daten übermittelt hat, schreibe an ${C.email}; wir löschen sie.`,
      ] },
      { h: 'Sicherheit', p: [
        'Spieldaten sind durch die Sandbox des Betriebssystems geschützt. Werbeverkehr läuft über verschlüsselte Verbindungen. Wir betreiben keine Server, die personenbezogene Daten speichern.',
      ] },
      { h: 'Änderungen dieser Erklärung', p: [
        'Bei wesentlichen Änderungen zeigt das Spiel diese Erklärung erneut an und bittet dich vor dem Weiterspielen um Kenntnisnahme.',
      ] },
    ];
  },

  consent(ctx) {
    const { C } = ctx;
    return [
      { p: [`Mit dem Ankreuzen des Feldes für Belohnungswerbung erteilst du ${C.name} (Verantwortlicher) eine freiwillige, bestimmte und informierte Einwilligung in Folgendes. Die Einwilligung ist freiwillig: Ohne sie kannst du das ganze Spiel spielen — nur die freiwilligen Funktionen „Werbung ansehen für eine Belohnung" sind nicht verfügbar.`] },
      { h: 'Worin du einwilligst', ul: [
        'Wenn du eine Belohnungswerbung ansiehst, verarbeitet Google AdMob (Google LLC, USA / Google Ireland Ltd.) Werbe-ID, IP-Adresse, daraus abgeleiteten ungefähren Standort, Geräte- und App-Informationen und Werbeinteraktionen, um die Werbung anzuzeigen, die Belohnung auszuzahlen, sie zu messen und Betrug zu verhindern. Dazu wird auf dein Gerät zugegriffen (§ 25 Abs. 1 TDDDG).',
        'Diese Daten werden an Google-Server außerhalb deines Landes, auch in die USA, übermittelt und dort verarbeitet.',
        'Nur wenn du zusätzlich das Feld für personalisierte Werbung ankreuzt (nur ab 18): Google darf die Daten nutzen, um Werbung nach deinen Interessen anzuzeigen.',
      ] },
      { h: 'Widerruf', p: [
        'Du kannst die Einwilligung jederzeit so einfach, wie du sie erteilt hast, unter Einstellungen › Datenschutz & Rechtliches widerrufen. Der Widerruf berührt die Rechtmäßigkeit der vorherigen Verarbeitung nicht. Richtlinie von Google: ' + GOOGLE + '.',
      ] },
    ];
  },

  terms(ctx) {
    const { C } = ctx;
    return [
      { p: [`Diese Nutzungsbedingungen („Bedingungen") sind eine Vereinbarung zwischen dir und ${C.name} („wir"), dem Entwickler von ${C.game}. Indem du sie im Spiel akzeptierst, stimmst du ihnen zu. Wenn du nicht zustimmst, nutze das Spiel nicht.`] },
      { h: '1. Wer spielen darf', p: [
        'Du musst nach dem Recht deines Landes alt genug sein, diese Bedingungen zu akzeptieren. Bist du unter 18 (bzw. minderjährig nach deinem Recht), müssen deine Eltern oder dein gesetzlicher Vertreter diese Bedingungen für dich prüfen und akzeptieren.',
      ] },
      { h: '2. Lizenz', p: [
        'Wir räumen dir eine persönliche, nicht ausschließliche, nicht übertragbare, widerrufliche Lizenz ein, das Spiel auf Geräten, die dir gehören oder die du kontrollierst, zu installieren und zur privaten, nicht kommerziellen Unterhaltung zu spielen.',
      ] },
      { h: '3. Zulässige Nutzung', ul: [
        'Kein Reverse Engineering, Dekompilieren oder Verändern des Spiels, soweit das Gesetz dies nicht trotz dieser Einschränkung ausdrücklich erlaubt.',
        'Kein Cheaten, kein Ausnutzen von Fehlern, keine Verbreitung veränderter Kopien.',
        'Keine rechtswidrige Nutzung und keine Nutzung entgegen den Bedingungen des App-Stores.',
      ] },
      { h: '4. Spielwährung und virtuelle Gegenstände', p: [
        'Schrott (Scrap), Kisten, Skins und andere virtuelle Gegenstände werden im Spiel verdient, haben keinen Geldwert, können nicht gegen echtes Geld gekauft, verkauft oder getauscht werden und werden dir nur lizenziert, nicht verkauft. Kisteninhalte sind zufällig; die Wahrscheinlichkeiten sind im Spiel festgelegt. Virtuelle Gegenstände werden nur auf deinem Gerät gespeichert und gehen verloren, wenn diese Daten gelöscht werden. Wir können sie durch Updates anpassen.',
      ] },
      { h: '5. Werbung', p: [
        'Das Spiel kann freiwillige Belohnungswerbung von Google anbieten. Das Ansehen ist nie Pflicht. Für Werbung gelten die Datenschutzerklärung und deine Einwilligungen.',
      ] },
      { h: '6. Geistiges Eigentum', p: [
        `${C.game} und sämtlicher Code, Grafiken, Audio, Figuren und Texte gehören uns und sind gesetzlich geschützt. Alle Figuren, Fraktionen und Orte sind fiktiv; Ähnlichkeiten mit realen Personen oder Organisationen sind zufällig.`,
      ] },
      { h: '7. Updates und Verfügbarkeit', p: [
        'Wir können das Spiel oder einzelne Funktionen aktualisieren, ändern oder einstellen. Wir garantieren nicht, dass das Spiel auf jedem Gerät oder unterbrechungsfrei verfügbar ist.',
      ] },
      { h: '8. Gewährleistung', p: [
        'Das Spiel wird kostenlos bereitgestellt. Deine gesetzlichen Rechte als Verbraucher, einschließlich der gesetzlichen Gewährleistung für digitale Inhalte, bleiben unberührt.',
      ] },
      { h: '9. Haftung', p: [
        'Wir haften unbeschränkt für Vorsatz und grobe Fahrlässigkeit, für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit sowie nach zwingenden gesetzlichen Vorschriften. Im Übrigen ist unsere Haftung für das unentgeltlich bereitgestellte Spiel, soweit gesetzlich zulässig, ausgeschlossen, insbesondere für mittelbare Schäden und den Verlust virtueller Gegenstände oder Spielfortschritte.',
      ] },
      { h: '10. Beendigung', p: [
        'Du kannst das Spiel jederzeit nicht mehr nutzen und löschen. Bei schwerwiegenden Verstößen gegen diese Bedingungen können wir deine Lizenz beenden. Die Abschnitte 4, 6, 8, 9 und 12 gelten fort.',
      ] },
      { h: '11. Änderungen dieser Bedingungen', p: [
        'Bei wesentlichen Änderungen zeigt das Spiel die neue Fassung an und bittet dich vor dem Weiterspielen, sie zu akzeptieren.',
      ] },
      { h: '12. Anwendbares Recht und Streitigkeiten', p: [
        'Es gilt das Recht der Republik Türkei. Diese Rechtswahl entzieht dir nicht den Schutz der zwingenden Verbraucherschutzvorschriften des Landes, in dem du lebst; du kannst Ansprüche vor den Gerichten deines Wohnsitzlandes geltend machen, soweit dein Recht dies erlaubt.',
      ] },
      ...ctx.termsLocal(ctx),
      { h: 'App-Stores', p: [
        'Diese Bedingungen gelten nur zwischen dir und uns, nicht mit Apple oder Google. Apple und Google sind nicht zu Wartung oder Support verpflichtet und nicht für das Spiel oder Ansprüche daraus verantwortlich. Wenn du das Spiel aus dem Apple App Store geladen hast, sind Apple und seine Tochtergesellschaften Drittbegünstigte dieser Bedingungen und können sie durchsetzen. Du bestätigst, dass du dich nicht in einem Land befindest, das einem US-Embargo unterliegt, und nicht auf einer US-Sanktionsliste stehst.',
      ] },
      { h: 'Kontakt', p: [`${C.name} — ${C.email}`] },
    ];
  },

  rights: {
    eu: (ctx) => [
      { h: 'Deine Rechte nach der DSGVO', ul: [
        'Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch gegen Verarbeitungen auf Grundlage berechtigter Interessen (Art. 15–21 DSGVO). Einwilligungen kannst du jederzeit widerrufen (Art. 7 Abs. 3).',
        'Wir treffen keine ausschließlich automatisierten Entscheidungen mit rechtlicher oder ähnlich erheblicher Wirkung.',
        'Da unsere eigene Verarbeitung nur gelegentlich und nicht umfangreich erfolgt, haben wir keinen Vertreter in der EU benannt (Art. 27 Abs. 2 DSGVO).',
        `Kontakt: ${ctx.C.email}. Wir antworten innerhalb eines Monats.`,
        'Du hast das Recht, dich bei der Datenschutzaufsichtsbehörde deines Mitgliedstaats zu beschweren; die Liste findest du unter https://edpb.europa.eu/about-edpb/about-edpb/members_en',
      ] },
    ],
    ch: (ctx) => [
      { h: 'Deine Rechte nach dem Datenschutzgesetz (nDSG, Schweiz)', ul: [
        'Du hast das Recht auf Auskunft, Berichtigung, Löschung und Datenherausgabe und kannst Einwilligungen jederzeit widerrufen.',
        `Kontakt: ${ctx.C.email}.`,
        'Du kannst dich an den Eidgenössischen Datenschutz- und Öffentlichkeitsbeauftragten (EDÖB) wenden: https://www.edoeb.admin.ch',
      ] },
    ],
    other: (ctx) => [
      { h: 'Deine Rechte', ul: [
        'Wo immer du lebst, gelten dieselben Schutzmaßnahmen: Du kannst fragen, welche Daten verarbeitet werden, sie berichtigen oder löschen lassen und Einwilligungen jederzeit widerrufen.',
        `Kontakt: ${ctx.C.email}. Du kannst dich auch an die Datenschutzbehörde deines Landes wenden, sofern es eine gibt.`,
      ] },
    ],
  },

  termsLocal: {
    eu: () => [
      { h: 'Verbraucher in der EU / im EWR', p: [
        'Dir stehen alle Rechte nach dem zwingenden Verbraucherrecht deines Wohnsitzlandes zu, einschließlich der gesetzlichen Gewährleistung für digitale Inhalte. Da das Spiel kostenlos ist und kein Kauf erfolgt, besteht kein Widerrufsrecht.',
      ] },
    ],
    other: () => [],
  },
};
