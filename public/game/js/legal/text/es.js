// Textos legales en español. Siguen la versión inglesa.

const GOOGLE = 'https://policies.google.com/privacy';
const GOOGLE_PARTNERS = 'https://policies.google.com/technologies/partner-sites';

export default {
  ui: {
    title: 'Antes de jugar',
    intro: 'Elige tu país, confirma tu año de nacimiento y revisa los documentos. Tus elecciones se guardan solo en este dispositivo.',
    country: 'País / región de residencia',
    docLang: 'Idioma de los documentos',
    birthYear: 'Año de nacimiento',
    select: 'Seleccionar…',
    readPrivacy: 'Leer el Aviso de Privacidad',
    readTerms: 'Leer los Términos del Servicio',
    readConsent: 'Leer el texto de consentimiento',
    acceptTerms: 'He leído y acepto los Términos del Servicio.',
    ackPrivacy: 'He leído el Aviso de Privacidad.',
    guardian: 'Soy menor de 18 años y mi madre, padre o tutor legal ha leído estos documentos y está de acuerdo.',
    adsSection: 'Opcional — anuncios con recompensa',
    adsOptin: 'Consiento que Google AdMob muestre anuncios con recompensa, incluido el tratamiento de los identificadores de mi dispositivo y mi dirección IP y su transferencia al extranjero, como se describe en el texto de consentimiento. (Opcional — puedes jugar sin ello.)',
    adsPersonal: 'También consiento los anuncios personalizados. (Opcional)',
    doNotSell: 'No vender ni compartir mi información personal.',
    adsUnavailable: 'En tu región no hay anuncios con recompensa, por lo que no se tratan datos publicitarios.',
    adsAge: 'Por tu edad, los anuncios con recompensa están desactivados y no se tratan datos publicitarios.',
    accept: 'Aceptar y continuar',
    save: 'Guardar elecciones',
    close: 'Cerrar',
    back: 'Atrás',
    manage: 'Privacidad y legal',
    manageHint: 'Documentos, consentimientos, tus datos.',
    deleteData: 'Borrar todos mis datos de este dispositivo',
    deleteConfirm: 'Esto borra de forma permanente tu progreso, objetos, ajustes y consentimientos en este dispositivo. ¿Continuar?',
    footer: 'Puedes ver los documentos, cambiar tus elecciones o retirar tu consentimiento en cualquier momento en Ajustes › Privacidad y legal.',
    privacyTitle: 'Aviso de Privacidad',
    privacyTitleTR: 'Aviso informativo KVKK y Política de Privacidad',
    termsTitle: 'Términos del Servicio',
    consentTitle: 'Consentimiento para anuncios con recompensa',
    consentTitleTR: 'Consentimiento explícito (KVKK)',
    updated: 'Última actualización',
    langNote: 'Esta sección se muestra en inglés porque aún no está disponible en el idioma seleccionado.',
    required: 'Obligatorio',
    adsOff: 'Los anuncios con recompensa están desactivados. Puedes activarlos en Ajustes › Privacidad y legal.',
    summary: [
      'Sin cuenta ni registro: tu progreso se guarda solo en este dispositivo.',
      'No tenemos servidores y no recibimos ninguno de tus datos de juego.',
      'Los anuncios de Google solo aparecen si decides ver uno y, donde la ley lo exige, solo con tu consentimiento.',
    ],
  },

  privacy(ctx) {
    const { C, P, date } = ctx;
    return [
      { p: [`Este aviso explica cómo ${C.game} ("el juego") trata los datos personales. Se aplica a jugadores en ${ctx.countryName}. Versión: ${date}.`] },
      { h: '1. Responsable', p: [
        `El responsable del tratamiento es ${C.name}, desarrollador individual con sede en Turquía. Contacto: ${C.email}.`,
      ] },
      { h: '2. En resumen', ul: [
        'El juego no necesita cuenta y nunca pide tu nombre, correo electrónico, contactos, fotos, micrófono ni ubicación precisa.',
        'Tu progreso, objetos, ajustes y consentimientos se guardan solo en tu dispositivo. No podemos verlos ni acceder a ellos.',
        P.ads
          ? 'Si decides ver un anuncio con recompensa, Google AdMob trata datos de tu dispositivo para mostrarlo. Donde la ley exige consentimiento, solo después de que lo des.'
          : 'En tu región no se muestran anuncios, por lo que no se tratan datos publicitarios.',
        'No vendemos datos personales por dinero ni creamos perfiles sobre ti.',
      ] },
      { h: '3. Qué datos se tratan, para qué y con qué base jurídica', ul: [
        'Datos del juego en tu dispositivo — nivel, estadísticas, moneda del juego, objetos desbloqueados, equipamiento, punto de control, ajustes, un código de instalación aleatorio para los códigos de invitación y un registro de tus elecciones legales. Finalidad: prestar el juego. Base jurídica: ejecución del contrato (los Términos). Estos datos no salen de tu dispositivo.',
        ...(P.ads ? [
          'Anuncios con recompensa (solo cuando pulsas "Ver anuncio") — identificador publicitario del dispositivo, dirección IP, ubicación aproximada derivada de la IP, información del dispositivo y de la app e interacción con el anuncio. Finalidad: mostrar el anuncio, entregar la recompensa, medirlo y prevenir el fraude; y, solo si lo aceptas aparte, personalizar anuncios. Base jurídica: tu consentimiento' + (P.model === 'optout' ? ' o, donde la ley lo permita, nuestro interés legítimo, con derecho a oponerte a la venta y al intercambio' : '') + '. Google LLC / Google Ireland Ltd. tratan estos datos según sus propias políticas: ' + GOOGLE + ' y ' + GOOGLE_PARTNERS + '.',
        ] : []),
        'Solo versión web — el servidor que aloja la página puede registrar tu IP y tipo de navegador para servir la página y protegerla de abusos. Base jurídica: interés legítimo en un servicio seguro.',
        'Si nos escribes — tu correo y tu mensaje, para responderte. Base jurídica: interés legítimo (y obligación legal si ejerces un derecho de privacidad).',
      ] },
      { h: '4. Destinatarios y transferencias internacionales', p: [
        P.ads
          ? 'Los datos publicitarios los recibe Google (Google LLC, EE. UU., y Google Ireland Ltd., Irlanda), que puede tratarlos en servidores fuera de tu país, incluido EE. UU. Cuando tu ley restringe las transferencias, nos basamos en tu consentimiento y en las garantías de Google (como las Cláusulas Contractuales Tipo de la UE y el Marco de Privacidad de Datos UE-EE. UU.). Nadie más recibe tus datos, salvo obligación legal.'
          : 'No transferimos tus datos a nadie, salvo obligación legal.',
      ] },
      { h: '5. Plazos de conservación', ul: [
        'Datos del juego en tu dispositivo: hasta que los borres (Ajustes › Privacidad y legal › Borrar mis datos), limpies los datos de la app o desinstales el juego.',
        P.ads ? 'Datos publicitarios: según la política de conservación de Google; puedes restablecer tu ID de publicidad en los ajustes del dispositivo.' : 'Datos publicitarios: no se recogen.',
        'Correos que nos envíes: el tiempo necesario para atender tu solicitud y como máximo 2 años.',
      ] },
      { h: '6. Tus opciones', ul: [
        'Puedes dar, cambiar o retirar tu consentimiento publicitario en cualquier momento en Ajustes › Privacidad y legal. Retirarlo no afecta al tratamiento anterior.',
        'Puedes restablecer o eliminar tu ID de publicidad en los ajustes de Android / iOS.',
        'Puedes borrar todo lo que el juego guardó en tu dispositivo en Ajustes › Privacidad y legal › Borrar mis datos.',
      ] },
      ...ctx.rights(ctx),
      { h: 'Menores', p: [
        `Preguntamos tu año de nacimiento de forma neutral. Los jugadores menores de ${P.consentAge} años —y en todo el mundo, los menores de 13— nunca ven anuncios ni se tratan datos publicitarios suyos. Nadie menor de 18 recibe anuncios personalizados. Si eres menor de 18, tu madre, padre o tutor debe revisar estos documentos contigo. Si crees que un menor nos ha dado datos, escribe a ${C.email} y los borraremos.`,
      ] },
      { h: 'Seguridad', p: [
        'Los datos del juego están protegidos por el entorno aislado (sandbox) del sistema operativo. El tráfico publicitario usa conexiones cifradas. No operamos servidores que guarden datos personales.',
      ] },
      { h: 'Cambios en este aviso', p: [
        'Si cambiamos este aviso de forma sustancial, el juego lo mostrará de nuevo y te pedirá que lo revises antes de seguir jugando.',
      ] },
    ];
  },

  consent(ctx) {
    const { C } = ctx;
    return [
      { p: [`Al marcar la casilla de anuncios con recompensa das a ${C.name} (responsable) tu consentimiento libre, específico e informado para lo siguiente. Es opcional: sin él puedes jugar todo el juego; solo no estarán disponibles las funciones opcionales de "ver un anuncio a cambio de una recompensa".`] },
      { h: 'Qué consientes', ul: [
        'Cuando decides ver un anuncio con recompensa, Google AdMob (Google LLC, EE. UU. / Google Ireland Ltd.) trata tu identificador publicitario, dirección IP, ubicación aproximada derivada de la IP, información del dispositivo y de la app e interacciones con el anuncio para mostrarlo, entregar la recompensa, medirlo y prevenir el fraude.',
        'Estos datos se transfieren a servidores de Google fuera de tu país, incluido EE. UU., y se tratan allí.',
        'Solo si marcas también la casilla de anuncios personalizados (solo mayores de 18): Google puede usar estos datos para mostrarte anuncios según tus intereses.',
      ] },
      { h: 'Retirada del consentimiento', p: [
        'Puedes retirarlo en cualquier momento, tan fácilmente como lo diste, en Ajustes › Privacidad y legal. La retirada no afecta a la licitud del tratamiento anterior. Política de Google: ' + GOOGLE + '.',
      ] },
    ];
  },

  terms(ctx) {
    const { C } = ctx;
    return [
      { p: [`Estos Términos del Servicio ("Términos") son un acuerdo entre tú y ${C.name} ("nosotros"), desarrollador de ${C.game}. Al aceptarlos en el juego, quedas vinculado por ellos. Si no estás de acuerdo, no uses el juego.`] },
      { h: '1. Quién puede jugar', p: [
        'Debes tener edad suficiente para aceptar estos Términos según la ley de tu país. Si eres menor de 18 años (o de la mayoría de edad donde vives), tu madre, padre o tutor legal debe revisarlos y aceptarlos por ti y es responsable de tu uso del juego.',
      ] },
      { h: '2. Licencia', p: [
        'Te concedemos una licencia personal, no exclusiva, intransferible y revocable para instalar y jugar el juego con fines privados y no comerciales en dispositivos que poseas o controles.',
      ] },
      { h: '3. Uso aceptable', ul: [
        'No realices ingeniería inversa, descompiles ni modifiques el juego, salvo en la medida en que la ley lo permita expresamente pese a esta restricción.',
        'No hagas trampas, no explotes errores ni distribuyas copias modificadas.',
        'No uses el juego de forma ilícita ni contraria a las condiciones de la tienda de aplicaciones.',
      ] },
      { h: '4. Moneda y objetos virtuales', p: [
        'La chatarra (scrap), cajas, aspectos y demás objetos virtuales se ganan jugando, no tienen valor monetario, no pueden comprarse, venderse ni canjearse por dinero real y se te conceden bajo licencia, no se venden. El contenido de las cajas es aleatorio y sus probabilidades están fijadas por el juego. Los objetos virtuales se guardan solo en tu dispositivo y se pierden si se borran esos datos. Podemos reajustarlos en actualizaciones.',
      ] },
      { h: '5. Anuncios', p: [
        'El juego puede ofrecer anuncios con recompensa opcionales de Google. Verlos nunca es obligatorio. Se rigen por el Aviso de Privacidad y tus consentimientos.',
      ] },
      { h: '6. Propiedad intelectual', p: [
        `${C.game} y todo su código, arte, audio, personajes y textos nos pertenecen y están protegidos por la ley. Todos los personajes, facciones y lugares son ficticios; cualquier parecido con personas u organizaciones reales es casual.`,
      ] },
      { h: '7. Actualizaciones y disponibilidad', p: [
        'Podemos actualizar, cambiar o discontinuar el juego o cualquier función. No garantizamos que esté disponible en todos los dispositivos ni sin interrupciones.',
      ] },
      { h: '8. Garantías', p: [
        'El juego se ofrece gratis "tal cual" y "según disponibilidad". En la medida permitida por la ley, no garantizamos que esté libre de errores ni que sea apto para un fin concreto. Tus derechos legales como consumidor no se ven afectados.',
      ] },
      { h: '9. Responsabilidad', p: [
        'En la medida permitida por la ley, no respondemos de daños indirectos ni de la pérdida de objetos virtuales o progreso. Nada en estos Términos limita o excluye la responsabilidad por dolo, culpa grave, muerte o lesiones personales, ni ninguna responsabilidad que la ley no permita limitar o excluir.',
      ] },
      { h: '10. Terminación', p: [
        'Puedes dejar de usar el juego y borrarlo en cualquier momento. Podemos terminar tu licencia si incumples gravemente estos Términos. Las secciones 4, 6, 8, 9 y 12 siguen vigentes tras la terminación.',
      ] },
      { h: '11. Cambios en estos Términos', p: [
        'Si cambiamos estos Términos de forma sustancial, el juego mostrará la nueva versión y te pedirá que la aceptes antes de seguir jugando.',
      ] },
      { h: '12. Ley aplicable y controversias', p: [
        'Estos Términos se rigen por las leyes de la República de Turquía. Esta elección no te priva de la protección de las normas imperativas de consumo del país donde vives, y puedes reclamar ante los tribunales de tu país de residencia cuando tu ley lo permita.',
      ] },
      ...ctx.termsLocal(ctx),
      { h: 'Tiendas de aplicaciones', p: [
        'Estos Términos son solo entre tú y nosotros, no con Apple ni Google. Apple y Google no están obligadas a prestar mantenimiento ni soporte ni son responsables del juego ni de reclamaciones sobre él. Si descargaste el juego de la App Store de Apple, Apple y sus filiales son terceros beneficiarios de estos Términos y pueden hacerlos cumplir. Confirmas que no te encuentras en un país sujeto a embargo del Gobierno de EE. UU. ni figuras en sus listas de partes prohibidas.',
      ] },
      { h: 'Contacto', p: [`${C.name} — ${C.email}`] },
    ];
  },

  rights: {
    eu: (ctx) => [
      { h: 'Tus derechos según el RGPD', ul: [
        'Tienes derecho de acceso, rectificación, supresión, limitación del tratamiento, portabilidad y oposición al tratamiento basado en interés legítimo (artículos 15 a 21 del RGPD). Puedes retirar el consentimiento en cualquier momento (artículo 7.3).',
        'No tomamos decisiones basadas únicamente en tratamientos automatizados con efectos jurídicos o similares.',
        'Como nuestro propio tratamiento es ocasional y no a gran escala, no hemos designado representante en la UE (artículo 27.2 del RGPD).',
        `Contacto: ${ctx.C.email}. Respondemos en el plazo de un mes.`,
        'Puedes presentar una reclamación ante la autoridad de protección de datos de tu Estado miembro (en España, la AEPD: https://www.aepd.es); la lista completa está en https://edpb.europa.eu/about-edpb/about-edpb/members_en',
      ] },
    ],
    us: (ctx) => [
      { h: 'Aviso de privacidad de California (CCPA / CPRA) y otras leyes estatales de EE. UU.', ul: [
        'Aviso en el momento de la recogida — categorías tratadas al ver un anuncio con recompensa: identificadores (ID de publicidad, IP); actividad de internet (interacciones con anuncios); geolocalización aproximada derivada de la IP; inferencias de Google para personalizar anuncios. Origen: tu dispositivo. Finalidades: mostrar anuncios, recompensas, medición, prevención del fraude y, salvo que te opongas, publicidad conductual entre contextos. Destinatario: Google. No recogemos información personal sensible.',
        'Venta o intercambio: poner estos datos a disposición de Google para publicidad conductual puede considerarse "venta" o "intercambio" según la ley de California. Puedes oponerte en cualquier momento con el interruptor "No vender ni compartir mi información personal" (Ajustes › Privacidad y legal). En la versión web respetamos la señal Global Privacy Control. No vendemos ni compartimos información de menores de 16 años (de hecho, de menores de 18).',
        'Tus derechos: conocer y acceder, borrar, corregir, oponerte a la venta y al intercambio y no ser discriminado. Puedes usar un agente autorizado. Escribe a ' + ctx.C.email + '; respondemos en 45 días.',
        'Los residentes de otros estados con leyes similares tienen derechos comparables, incluido oponerse a la publicidad dirigida. Si rechazamos una solicitud puedes apelar escribiéndonos con el asunto "Appeal"; si se deniega, puedes contactar al Fiscal General de tu estado.',
        'Menores (COPPA): el juego no está dirigido a menores de 13 años; no les mostramos anuncios ni recogemos su información personal.',
      ] },
    ],
    other: (ctx) => [
      { h: 'Tus derechos', ul: [
        'Vivas donde vivas, aplicamos las mismas protecciones (incluidos los derechos ARCO en México y Latinoamérica): puedes preguntar qué datos se tratan sobre ti, pedir su rectificación o supresión, oponerte y retirar tu consentimiento en cualquier momento.',
        `Contacto: ${ctx.C.email}. También puedes reclamar ante la autoridad de protección de datos de tu país, si existe.`,
      ] },
    ],
  },

  termsLocal: {
    eu: () => [
      { h: 'Consumidores en la UE / EEE', p: [
        'Conservas todos los derechos que te otorga la normativa imperativa de consumo de tu país de residencia, incluida la garantía legal de conformidad del contenido digital. Como el juego es gratuito y no hay compra, no se aplica el derecho de desistimiento.',
      ] },
    ],
    us: () => [
      { h: 'Usuarios en EE. UU.', p: [
        'Algunos estados no permiten excluir garantías implícitas ni limitar ciertos daños, por lo que partes de las secciones 8 y 9 pueden no aplicarse a ti.',
      ] },
    ],
    other: () => [],
  },
};
