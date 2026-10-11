// Textes juridiques en français (RGPD, Loi 25 du Québec, nLPD). Suivent la version anglaise.

const GOOGLE = 'https://policies.google.com/privacy';
const GOOGLE_PARTNERS = 'https://policies.google.com/technologies/partner-sites';

export default {
  ui: {
    title: 'Avant de jouer',
    intro: 'Choisis ton pays, confirme ton année de naissance et consulte les documents ci-dessous. Tes choix sont enregistrés uniquement sur cet appareil.',
    country: 'Pays / région de résidence',
    docLang: 'Langue des documents',
    birthYear: 'Année de naissance',
    select: 'Choisir…',
    readPrivacy: 'Lire la Politique de confidentialité',
    readTerms: 'Lire les Conditions d’utilisation',
    readConsent: 'Lire le texte de consentement',
    acceptTerms: 'J’ai lu et j’accepte les Conditions d’utilisation.',
    ackPrivacy: 'J’ai lu la Politique de confidentialité.',
    guardian: 'J’ai moins de 18 ans et mon parent ou tuteur légal a lu ces documents et les accepte.',
    adsSection: 'Facultatif — publicités récompensées',
    adsOptin: 'Je consens à l’affichage de publicités récompensées par Google AdMob, y compris au traitement des identifiants de mon appareil et de mon adresse IP et à leur transfert à l’étranger, comme décrit dans le texte de consentement. (Facultatif — tu peux jouer sans.)',
    adsPersonal: 'Je consens également aux publicités personnalisées. (Facultatif)',
    doNotSell: 'Ne pas vendre ni partager mes renseignements personnels.',
    adsUnavailable: 'Les publicités récompensées ne sont pas disponibles dans ta région ; aucune donnée publicitaire n’est traitée.',
    adsAge: 'En raison de ton âge, les publicités récompensées sont désactivées et aucune donnée publicitaire n’est traitée.',
    accept: 'Accepter et continuer',
    save: 'Enregistrer mes choix',
    close: 'Fermer',
    back: 'Retour',
    manage: 'Confidentialité et mentions légales',
    manageHint: 'Documents, consentements, tes données.',
    deleteData: 'Supprimer toutes mes données sur cet appareil',
    deleteConfirm: 'Cela supprime définitivement ta progression, tes objets, tes réglages et tes consentements sur cet appareil. Continuer ?',
    footer: 'Tu peux consulter les documents, modifier tes choix ou retirer ton consentement à tout moment dans Réglages › Confidentialité et mentions légales.',
    privacyTitle: 'Politique de confidentialité',
    privacyTitleTR: 'Avis d’information KVKK et Politique de confidentialité',
    termsTitle: 'Conditions d’utilisation',
    consentTitle: 'Consentement aux publicités récompensées',
    consentTitleTR: 'Consentement explicite (KVKK)',
    updated: 'Dernière mise à jour',
    langNote: 'Cette section est affichée en anglais car elle n’est pas encore disponible dans la langue choisie.',
    required: 'Obligatoire',
    adsOff: 'Les publicités récompensées sont désactivées. Tu peux les activer dans Réglages › Confidentialité et mentions légales.',
    summary: [
      'Pas de compte, pas d’inscription : ta progression est enregistrée uniquement sur cet appareil.',
      'Nous n’exploitons aucun serveur et ne recevons aucune de tes données de jeu.',
      'Les publicités Google n’apparaissent que si tu choisis d’en regarder une et, lorsque la loi l’exige, uniquement avec ton consentement.',
    ],
  },

  privacy(ctx) {
    const { C, P, date } = ctx;
    return [
      { p: [`Cette politique explique comment ${C.game} (« le jeu ») traite les données personnelles. Elle s’applique aux joueurs situés en/au ${ctx.countryName}. Version : ${date}.`] },
      { h: '1. Responsable du traitement', p: [
        `Le responsable du traitement est ${C.name}, développeur indépendant établi en Turquie. Contact : ${C.email}.`,
      ] },
      { h: '2. En bref', ul: [
        'Le jeu ne nécessite aucun compte et ne demande jamais ton nom, ton adresse e-mail, tes contacts, tes photos, ton micro ou ta position précise.',
        'Ta progression, tes objets, tes réglages et tes consentements sont stockés uniquement sur ton appareil. Nous ne pouvons ni les voir ni y accéder.',
        P.ads
          ? 'Si tu choisis de regarder une publicité récompensée, Google AdMob traite des données sur ton appareil pour l’afficher — lorsque la loi l’exige, uniquement après ton consentement.'
          : 'Aucune publicité n’est affichée dans ta région ; aucune donnée publicitaire n’est traitée.',
        'Nous ne vendons pas de données personnelles et ne créons pas de profil sur toi.',
      ] },
      { h: '3. Données traitées, finalités et bases légales', ul: [
        'Données de jeu sur ton appareil — niveau, statistiques, monnaie du jeu, objets débloqués, équipement, point de sauvegarde, réglages, un code d’installation aléatoire pour les codes d’invitation et un registre de tes choix juridiques. Finalité : fournir le jeu. Base légale : exécution du contrat (les Conditions). Ces données ne quittent pas ton appareil.',
        ...(P.ads ? [
          'Publicités récompensées (uniquement quand tu touches « Regarder une pub ») — identifiant publicitaire de l’appareil, adresse IP, localisation approximative déduite de l’IP, informations sur l’appareil et l’application, interactions avec la publicité. Finalités : afficher la publicité, verser la récompense, mesurer et prévenir la fraude ; et, seulement si tu y consens séparément, personnaliser les publicités. Base légale : ton consentement. Google LLC / Google Ireland Ltd. traitent ces données selon leurs propres règles : ' + GOOGLE + ' et ' + GOOGLE_PARTNERS + '.',
        ] : []),
        'Version web uniquement — le serveur qui héberge la page peut enregistrer ton adresse IP et ton type de navigateur pour servir la page et la protéger contre les abus. Base légale : intérêt légitime à exploiter un service sûr.',
        'Si tu nous écris — ton adresse e-mail et ton message, pour te répondre. Base légale : intérêt légitime (et obligation légale si tu exerces un droit).',
      ] },
      { h: '4. Destinataires et transferts internationaux', p: [
        P.ads
          ? 'Les données publicitaires sont reçues par Google (Google LLC, États-Unis, et Google Ireland Ltd., Irlande), qui peut les traiter sur des serveurs hors de ton pays, notamment aux États-Unis, sur la base de la décision d’adéquation relative au cadre de protection des données UE–États-Unis, des clauses contractuelles types et de ton consentement. Personne d’autre ne reçoit tes données, sauf obligation légale.'
          : 'Nous ne transférons tes données à personne, sauf obligation légale.',
      ] },
      { h: '5. Durées de conservation', ul: [
        'Données de jeu sur ton appareil : jusqu’à ce que tu les supprimes (Réglages › Confidentialité › Supprimer mes données), vides les données de l’application ou désinstalles le jeu.',
        P.ads ? 'Données publicitaires : selon la politique de conservation de Google ; tu peux réinitialiser ton identifiant publicitaire dans les réglages de l’appareil.' : 'Données publicitaires : aucune n’est collectée.',
        'E-mails reçus : le temps nécessaire au traitement de ta demande, 2 ans maximum.',
      ] },
      { h: '6. Tes choix', ul: [
        'Tu peux donner, modifier ou retirer ton consentement publicitaire à tout moment dans Réglages › Confidentialité et mentions légales. Le retrait n’affecte pas les traitements antérieurs.',
        'Tu peux réinitialiser ou supprimer ton identifiant publicitaire dans les réglages Android / iOS.',
        'Tu peux supprimer tout ce que le jeu a stocké sur ton appareil dans Réglages › Confidentialité › Supprimer mes données.',
      ] },
      ...ctx.rights(ctx),
      { h: 'Enfants', p: [
        `Nous demandons ton année de naissance de manière neutre. Les joueurs de moins de ${P.consentAge} ans — et partout, de moins de 13 ans — ne voient jamais de publicité et aucune donnée publicitaire n’est traitée. Aucune personne de moins de 18 ans ne reçoit de publicité personnalisée. Si tu as moins de 18 ans, ton parent ou tuteur doit examiner ces documents avec toi. Si tu penses qu’un enfant nous a transmis des données, écris à ${C.email} ; nous les supprimerons.`,
      ] },
      { h: 'Sécurité', p: [
        'Les données de jeu sont protégées par le bac à sable du système d’exploitation. Le trafic publicitaire utilise des connexions chiffrées. Nous n’exploitons aucun serveur stockant des données personnelles.',
      ] },
      { h: 'Modifications', p: [
        'En cas de modification importante, le jeu affichera à nouveau cette politique et te demandera d’en prendre connaissance avant de continuer.',
      ] },
    ];
  },

  consent(ctx) {
    const { C } = ctx;
    return [
      { p: [`En cochant la case des publicités récompensées, tu donnes à ${C.name} (responsable du traitement) un consentement libre, spécifique et éclairé pour ce qui suit. Il est facultatif : sans lui, tu peux jouer à tout le jeu ; seules les fonctions facultatives « regarder une pub contre une récompense » sont indisponibles.`] },
      { h: 'Ce à quoi tu consens', ul: [
        'Lorsque tu regardes une publicité récompensée, Google AdMob (Google LLC, États-Unis / Google Ireland Ltd.) traite ton identifiant publicitaire, ton adresse IP, ta localisation approximative déduite de l’IP, des informations sur l’appareil et l’application et tes interactions, pour afficher la publicité, verser la récompense, la mesurer et prévenir la fraude.',
        'Ces données sont transférées vers des serveurs de Google hors de ton pays, notamment aux États-Unis, et y sont traitées.',
        'Seulement si tu coches aussi la case des publicités personnalisées (18 ans et plus) : Google peut utiliser ces données pour te montrer des publicités selon tes centres d’intérêt.',
      ] },
      { h: 'Retrait du consentement', p: [
        'Tu peux le retirer à tout moment, aussi facilement que tu l’as donné, dans Réglages › Confidentialité et mentions légales, sans effet sur la licéité des traitements antérieurs. Règles de Google : ' + GOOGLE + '.',
      ] },
    ];
  },

  terms(ctx) {
    const { C } = ctx;
    return [
      { p: [`Les présentes Conditions d’utilisation (« Conditions ») constituent un accord entre toi et ${C.name} (« nous »), développeur de ${C.game}. En les acceptant dans le jeu, tu t’engages à les respecter. Si tu n’es pas d’accord, n’utilise pas le jeu.`] },
      { h: '1. Qui peut jouer', p: [
        'Tu dois avoir l’âge requis par la loi de ton pays pour accepter ces Conditions. Si tu as moins de 18 ans (ou n’as pas atteint la majorité là où tu vis), ton parent ou tuteur légal doit les examiner et les accepter pour toi.',
      ] },
      { h: '2. Licence', p: [
        'Nous t’accordons une licence personnelle, non exclusive, non transférable et révocable pour installer le jeu et y jouer à des fins privées et non commerciales sur des appareils que tu possèdes ou contrôles.',
      ] },
      { h: '3. Utilisation acceptable', ul: [
        'Ne pas faire d’ingénierie inverse, décompiler ou modifier le jeu, sauf dans la mesure où la loi l’autorise expressément malgré cette restriction.',
        'Ne pas tricher, exploiter des bogues ou distribuer des copies modifiées.',
        'Ne pas utiliser le jeu de manière illicite ou contraire aux conditions de la boutique d’applications.',
      ] },
      { h: '4. Monnaie et objets virtuels', p: [
        'La ferraille (scrap), les caisses, les apparences et les autres objets virtuels se gagnent en jouant, n’ont aucune valeur monétaire, ne peuvent être achetés, vendus ni échangés contre de l’argent réel et te sont concédés sous licence, non vendus. Le contenu des caisses est aléatoire et les probabilités sont fixées par le jeu. Les objets sont stockés uniquement sur ton appareil et sont perdus si ces données sont supprimées. Nous pouvons les rééquilibrer lors de mises à jour.',
      ] },
      { h: '5. Publicités', p: [
        'Le jeu peut proposer des publicités récompensées facultatives fournies par Google. Les regarder n’est jamais obligatoire. Elles sont régies par la Politique de confidentialité et tes choix de consentement.',
      ] },
      { h: '6. Propriété intellectuelle', p: [
        `${C.game} ainsi que l’ensemble de son code, de ses graphismes, sons, personnages et textes nous appartiennent et sont protégés par la loi. Tous les personnages, factions et lieux sont fictifs ; toute ressemblance avec des personnes ou organisations réelles est fortuite.`,
      ] },
      { h: '7. Mises à jour et disponibilité', p: [
        'Nous pouvons mettre à jour, modifier ou arrêter le jeu ou une fonctionnalité. Nous ne garantissons pas sa disponibilité sur tous les appareils ni sans interruption.',
      ] },
      { h: '8. Garanties', p: [
        'Le jeu est fourni gratuitement « tel quel ». Dans la mesure permise par la loi, nous ne garantissons pas qu’il soit exempt d’erreurs ou adapté à un usage particulier. Tes droits légaux de consommateur, notamment la garantie légale de conformité, ne sont pas affectés.',
      ] },
      { h: '9. Responsabilité', p: [
        'Dans la mesure permise par la loi, nous ne sommes pas responsables des dommages indirects ni de la perte d’objets virtuels ou de progression. Rien dans ces Conditions ne limite ou n’exclut la responsabilité en cas de faute intentionnelle, de faute lourde, de décès ou de dommage corporel, ni aucune responsabilité qui ne peut légalement être limitée ou exclue.',
      ] },
      { h: '10. Résiliation', p: [
        'Tu peux cesser d’utiliser le jeu et le supprimer à tout moment. Nous pouvons mettre fin à ta licence en cas de manquement grave. Les sections 4, 6, 8, 9 et 12 survivent à la résiliation.',
      ] },
      { h: '11. Modification des Conditions', p: [
        'En cas de modification importante, le jeu affichera la nouvelle version et te demandera de l’accepter avant de continuer.',
      ] },
      { h: '12. Droit applicable et litiges', p: [
        'Les présentes Conditions sont régies par le droit de la République de Turquie. Ce choix ne te prive pas de la protection des dispositions impératives du droit de la consommation de ton pays de résidence, et tu peux saisir les tribunaux de ton pays de résidence lorsque ta loi le permet.',
      ] },
      ...ctx.termsLocal(ctx),
      { h: 'Boutiques d’applications', p: [
        'Ces Conditions lient uniquement toi et nous, et non Apple ou Google. Apple et Google n’ont aucune obligation de maintenance ou d’assistance et ne sont pas responsables du jeu ni des réclamations le concernant. Si tu as téléchargé le jeu sur l’App Store d’Apple, Apple et ses filiales sont tiers bénéficiaires de ces Conditions et peuvent les faire appliquer. Tu confirmes ne pas te trouver dans un pays soumis à un embargo du gouvernement des États-Unis ni figurer sur une liste de parties interdites.',
      ] },
      { h: 'Contact', p: [`${C.name} — ${C.email}`] },
    ];
  },

  rights: {
    eu: (ctx) => [
      { h: 'Tes droits selon le RGPD', ul: [
        'Tu disposes des droits d’accès, de rectification, d’effacement, de limitation, de portabilité et d’opposition aux traitements fondés sur l’intérêt légitime (articles 15 à 21 du RGPD), et tu peux retirer ton consentement à tout moment (article 7, paragraphe 3).',
        'Nous ne prenons aucune décision fondée exclusivement sur un traitement automatisé produisant des effets juridiques ou similaires.',
        'Notre propre traitement étant occasionnel et non à grande échelle, nous n’avons pas désigné de représentant dans l’UE (article 27, paragraphe 2, du RGPD).',
        `Contact : ${ctx.C.email}. Nous répondons dans un délai d’un mois.`,
        'Tu peux introduire une réclamation auprès de l’autorité de contrôle de ton État membre (en France, la CNIL : https://www.cnil.fr) ; la liste complète figure sur https://edpb.europa.eu/about-edpb/about-edpb/members_en',
      ] },
    ],
    ca: (ctx) => [
      { h: 'Tes droits au Canada (LPRPDE et lois provinciales, dont la Loi 25 du Québec)', ul: [
        'Tu peux demander l’accès à tes renseignements personnels et leur rectification, et retirer ton consentement à tout moment.',
        `Responsable de la protection des renseignements personnels : ${ctx.C.name}, ${ctx.C.email}.`,
        'Au Québec, le consentement d’une personne de moins de 14 ans est donné par le titulaire de l’autorité parentale ou le tuteur.',
        'Tu peux porter plainte auprès du Commissariat à la protection de la vie privée du Canada (https://www.priv.gc.ca) ou, au Québec, de la Commission d’accès à l’information (https://www.cai.gouv.qc.ca).',
      ] },
    ],
    ch: (ctx) => [
      { h: 'Tes droits selon la loi fédérale sur la protection des données (nLPD, Suisse)', ul: [
        'Tu as le droit d’accès, de rectification, d’effacement et de remise des données, et tu peux retirer ton consentement à tout moment.',
        `Contact : ${ctx.C.email}.`,
        'Tu peux t’adresser au Préposé fédéral à la protection des données et à la transparence (PFPDT) : https://www.edoeb.admin.ch',
      ] },
    ],
    other: (ctx) => [
      { h: 'Tes droits', ul: [
        'Où que tu vives, nous appliquons les mêmes protections : tu peux demander quelles données sont traitées, les faire rectifier ou supprimer et retirer ton consentement à tout moment.',
        `Contact : ${ctx.C.email}. Tu peux aussi saisir l’autorité de protection des données de ton pays, s’il en existe une.`,
      ] },
    ],
  },

  termsLocal: {
    eu: () => [
      { h: 'Consommateurs dans l’UE / l’EEE', p: [
        'Tu conserves tous les droits que te confère le droit impératif de la consommation de ton pays de résidence, y compris la garantie légale de conformité des contenus numériques. Le jeu étant gratuit et sans achat, aucun droit de rétractation ne s’applique.',
      ] },
    ],
    other: () => [],
  },
};
