// Textos jurídicos em português (LGPD, RGPD). Seguem a versão inglesa.

const GOOGLE = 'https://policies.google.com/privacy';
const GOOGLE_PARTNERS = 'https://policies.google.com/technologies/partner-sites';

export default {
  ui: {
    title: 'Antes de jogar',
    intro: 'Escolha seu país, confirme seu ano de nascimento e leia os documentos abaixo. Suas escolhas ficam salvas apenas neste dispositivo.',
    country: 'País / região de residência',
    docLang: 'Idioma dos documentos',
    birthYear: 'Ano de nascimento',
    select: 'Selecionar…',
    readPrivacy: 'Ler o Aviso de Privacidade',
    readTerms: 'Ler os Termos de Uso',
    readConsent: 'Ler o termo de consentimento',
    acceptTerms: 'Li e aceito os Termos de Uso.',
    ackPrivacy: 'Li o Aviso de Privacidade.',
    guardian: 'Tenho menos de 18 anos e meu responsável legal leu estes documentos e concorda com eles.',
    adsSection: 'Opcional — anúncios premiados',
    adsOptin: 'Consinto que o Google AdMob exiba anúncios premiados, incluindo o tratamento dos identificadores do meu dispositivo e do meu endereço IP e sua transferência internacional, conforme o termo de consentimento. (Opcional — você pode jogar sem isso.)',
    adsPersonal: 'Também consinto com anúncios personalizados. (Opcional)',
    doNotSell: 'Não vender nem compartilhar minhas informações pessoais.',
    adsUnavailable: 'Anúncios premiados não estão disponíveis na sua região; nenhum dado publicitário é tratado.',
    adsAge: 'Devido à sua idade, os anúncios premiados estão desativados e nenhum dado publicitário é tratado.',
    accept: 'Aceitar e continuar',
    save: 'Salvar escolhas',
    close: 'Fechar',
    back: 'Voltar',
    manage: 'Privacidade e jurídico',
    manageHint: 'Documentos, consentimentos, seus dados.',
    deleteData: 'Apagar todos os meus dados deste dispositivo',
    deleteConfirm: 'Isto apaga permanentemente seu progresso, itens, configurações e consentimentos neste dispositivo. Continuar?',
    footer: 'Você pode ver os documentos, mudar suas escolhas ou revogar o consentimento a qualquer momento em Configurações › Privacidade e jurídico.',
    privacyTitle: 'Aviso de Privacidade',
    privacyTitleTR: 'Aviso informativo KVKK e Política de Privacidade',
    termsTitle: 'Termos de Uso',
    consentTitle: 'Consentimento para anúncios premiados',
    consentTitleTR: 'Consentimento explícito (KVKK)',
    updated: 'Última atualização',
    langNote: 'Esta seção é exibida em inglês porque ainda não está disponível no idioma selecionado.',
    required: 'Obrigatório',
    adsOff: 'Os anúncios premiados estão desativados. Você pode ativá-los em Configurações › Privacidade e jurídico.',
    summary: [
      'Sem conta, sem cadastro: seu progresso fica salvo apenas neste dispositivo.',
      'Não temos servidores e não recebemos nenhum dos seus dados de jogo.',
      'Anúncios do Google só aparecem se você escolher assistir a um e, onde a lei exige, apenas com seu consentimento.',
    ],
  },

  privacy(ctx) {
    const { C, P, date } = ctx;
    return [
      { p: [`Este aviso explica como ${C.game} ("o jogo") trata dados pessoais. Aplica-se a jogadores em ${ctx.countryName}. Versão: ${date}.`] },
      { h: '1. Controlador', p: [
        `O controlador dos dados é ${C.name}, desenvolvedor individual sediado na Turquia. Contato: ${C.email}.`,
      ] },
      { h: '2. Em resumo', ul: [
        'O jogo não exige conta e nunca pede seu nome, e-mail, contatos, fotos, microfone ou localização precisa.',
        'Seu progresso, itens, configurações e consentimentos ficam apenas no seu dispositivo. Não podemos vê-los nem acessá-los.',
        P.ads
          ? 'Se você escolher assistir a um anúncio premiado, o Google AdMob trata dados do seu dispositivo para exibi-lo — apenas após o seu consentimento.'
          : 'Nenhum anúncio é exibido na sua região; nenhum dado publicitário é tratado.',
        'Não vendemos dados pessoais e não criamos perfis sobre você.',
      ] },
      { h: '3. Dados tratados, finalidades e bases legais', ul: [
        'Dados do jogo no seu dispositivo — nível, estatísticas, moeda do jogo, itens desbloqueados, equipamento, ponto de salvamento, configurações, um código de instalação aleatório para convites e um registro das suas escolhas jurídicas. Finalidade: fornecer o jogo. Base legal: execução de contrato (os Termos). Esses dados não saem do seu dispositivo.',
        ...(P.ads ? [
          'Anúncios premiados (só quando você toca em "Assistir anúncio") — identificador de publicidade, endereço IP, localização aproximada derivada do IP, informações do dispositivo e do app e interação com o anúncio. Finalidades: exibir o anúncio, entregar a recompensa, medir e prevenir fraudes; e, somente se você consentir à parte, personalizar anúncios. Base legal: seu consentimento. Google LLC / Google Ireland Ltd. tratam esses dados segundo as próprias políticas: ' + GOOGLE + ' e ' + GOOGLE_PARTNERS + '.',
        ] : []),
        'Somente versão web — o servidor que hospeda a página pode registrar seu IP e navegador para entregar a página e protegê-la contra abusos. Base legal: legítimo interesse.',
        'Se você nos escrever — seu e-mail e mensagem, para responder. Base legal: legítimo interesse (e obrigação legal se você exercer um direito).',
      ] },
      { h: '4. Compartilhamento e transferência internacional', p: [
        P.ads
          ? 'Os dados publicitários são recebidos pelo Google (Google LLC, EUA, e Google Ireland Ltd., Irlanda), que pode tratá-los em servidores fora do seu país, inclusive nos EUA. A transferência baseia-se no seu consentimento específico e nas salvaguardas contratuais do Google. Ninguém mais recebe seus dados, salvo obrigação legal.'
          : 'Não compartilhamos seus dados com ninguém, salvo obrigação legal.',
      ] },
      { h: '5. Prazos de retenção', ul: [
        'Dados do jogo no dispositivo: até você apagá-los (Configurações › Privacidade › Apagar meus dados), limpar os dados do app ou desinstalar o jogo.',
        P.ads ? 'Dados publicitários: conforme a política de retenção do Google; você pode redefinir o ID de publicidade nas configurações do aparelho.' : 'Dados publicitários: nenhum é coletado.',
        'E-mails recebidos: pelo tempo necessário para atender a solicitação, no máximo 2 anos.',
      ] },
      { h: '6. Suas escolhas', ul: [
        'Você pode dar, alterar ou revogar o consentimento publicitário a qualquer momento em Configurações › Privacidade e jurídico. A revogação não afeta tratamentos anteriores.',
        'Você pode redefinir ou excluir seu ID de publicidade nas configurações do Android / iOS.',
        'Você pode apagar tudo o que o jogo salvou no dispositivo em Configurações › Privacidade › Apagar meus dados.',
      ] },
      ...ctx.rights(ctx),
      { h: 'Crianças e adolescentes', p: [
        `Perguntamos seu ano de nascimento de forma neutra. Jogadores com menos de ${P.consentAge} anos — e, em todo lugar, menores de 13 — nunca veem anúncios e nenhum dado publicitário é tratado. Ninguém com menos de 18 anos recebe anúncios personalizados. Se você tem menos de 18 anos, seu responsável deve revisar estes documentos com você. Se acreditar que uma criança nos forneceu dados, escreva para ${C.email} e os apagaremos.`,
      ] },
      { h: 'Segurança', p: [
        'Os dados do jogo são protegidos pelo sandbox do sistema operacional. O tráfego de anúncios usa conexões criptografadas. Não operamos servidores que armazenem dados pessoais.',
      ] },
      { h: 'Alterações', p: [
        'Se alterarmos este aviso de forma relevante, o jogo o exibirá novamente e pedirá sua revisão antes de continuar.',
      ] },
    ];
  },

  consent(ctx) {
    const { C } = ctx;
    return [
      { p: [`Ao marcar a caixa de anúncios premiados, você dá a ${C.name} (controlador) seu consentimento livre, informado, inequívoco e para finalidade determinada para o seguinte. É opcional: sem ele você joga o jogo inteiro; apenas as funções opcionais de "assistir a um anúncio por uma recompensa" ficam indisponíveis.`] },
      { h: 'Com o que você consente', ul: [
        'Ao assistir a um anúncio premiado, o Google AdMob (Google LLC, EUA / Google Ireland Ltd.) trata seu identificador de publicidade, endereço IP, localização aproximada derivada do IP, informações do dispositivo e do app e interações, para exibir o anúncio, entregar a recompensa, medir e prevenir fraudes.',
        'Esses dados são transferidos e tratados em servidores do Google fora do seu país, inclusive nos EUA (art. 33, VIII, da LGPD).',
        'Somente se você marcar também a caixa de anúncios personalizados (maiores de 18): o Google pode usar esses dados para exibir anúncios conforme seus interesses.',
      ] },
      { h: 'Revogação', p: [
        'Você pode revogar o consentimento a qualquer momento, de forma gratuita e facilitada, em Configurações › Privacidade e jurídico, sem afetar tratamentos anteriores. Política do Google: ' + GOOGLE + '.',
      ] },
    ];
  },

  terms(ctx) {
    const { C } = ctx;
    return [
      { p: [`Estes Termos de Uso ("Termos") são um acordo entre você e ${C.name} ("nós"), desenvolvedor de ${C.game}. Ao aceitá-los no jogo, você concorda com eles. Se não concordar, não use o jogo.`] },
      { h: '1. Quem pode jogar', p: [
        'Você deve ter idade suficiente para aceitar estes Termos pela lei do seu país. Se tiver menos de 18 anos, seu responsável legal deve revisá-los e aceitá-los por você.',
      ] },
      { h: '2. Licença', p: [
        'Concedemos a você uma licença pessoal, não exclusiva, intransferível e revogável para instalar e jogar o jogo, para entretenimento privado e não comercial, em dispositivos que você possua ou controle.',
      ] },
      { h: '3. Uso aceitável', ul: [
        'Não faça engenharia reversa, descompile ou modifique o jogo, exceto quando a lei permitir expressamente.',
        'Não trapaceie, não explore falhas e não distribua cópias modificadas.',
        'Não use o jogo de forma ilícita ou contrária aos termos da loja de aplicativos.',
      ] },
      { h: '4. Moeda e itens virtuais', p: [
        'Sucata (scrap), caixas, skins e outros itens virtuais são obtidos jogando, não têm valor monetário, não podem ser comprados, vendidos nem trocados por dinheiro real e são licenciados, não vendidos. O conteúdo das caixas é aleatório e as chances são fixadas pelo jogo. Os itens ficam apenas no seu dispositivo e são perdidos se esses dados forem apagados. Podemos rebalanceá-los em atualizações.',
      ] },
      { h: '5. Anúncios', p: [
        'O jogo pode oferecer anúncios premiados opcionais fornecidos pelo Google. Assistir nunca é obrigatório. Eles seguem o Aviso de Privacidade e suas escolhas de consentimento.',
      ] },
      { h: '6. Propriedade intelectual', p: [
        `${C.game} e todo o seu código, arte, áudio, personagens e textos pertencem a nós e são protegidos por lei. Todos os personagens, facções e lugares são fictícios; qualquer semelhança com pessoas ou organizações reais é coincidência.`,
      ] },
      { h: '7. Atualizações e disponibilidade', p: [
        'Podemos atualizar, alterar ou descontinuar o jogo ou qualquer recurso. Não garantimos disponibilidade em todos os dispositivos nem sem interrupções.',
      ] },
      { h: '8. Garantias', p: [
        'O jogo é fornecido gratuitamente "no estado em que se encontra". Na medida permitida pela lei, não garantimos que esteja livre de erros. Seus direitos legais como consumidor não são afetados.',
      ] },
      { h: '9. Responsabilidade', p: [
        'Na medida permitida pela lei, não respondemos por danos indiretos nem pela perda de itens virtuais ou progresso. Nada nestes Termos limita ou exclui responsabilidade por dolo, culpa grave, morte ou lesão corporal, ou qualquer responsabilidade que não possa ser limitada por lei.',
      ] },
      { h: '10. Encerramento', p: [
        'Você pode parar de usar o jogo e apagá-lo a qualquer momento. Podemos encerrar sua licença se você violar gravemente estes Termos. As seções 4, 6, 8, 9 e 12 continuam válidas após o encerramento.',
      ] },
      { h: '11. Alterações dos Termos', p: [
        'Se alterarmos estes Termos de forma relevante, o jogo exibirá a nova versão e pedirá sua aceitação antes de continuar.',
      ] },
      { h: '12. Lei aplicável e disputas', p: [
        'Estes Termos são regidos pelas leis da República da Turquia. Essa escolha não afasta a proteção das normas imperativas de defesa do consumidor do país onde você vive, e você pode propor ação no foro do seu domicílio quando sua lei permitir.',
      ] },
      ...ctx.termsLocal(ctx),
      { h: 'Lojas de aplicativos', p: [
        'Estes Termos valem apenas entre você e nós, não com a Apple ou o Google. Apple e Google não têm obrigação de manutenção ou suporte e não são responsáveis pelo jogo ou por reclamações sobre ele. Se você baixou o jogo da App Store da Apple, a Apple e suas subsidiárias são terceiras beneficiárias destes Termos e podem exigi-los. Você declara não estar em país sujeito a embargo do governo dos EUA nem constar de listas de partes proibidas.',
      ] },
      { h: 'Contato', p: [`${C.name} — ${C.email}`] },
    ];
  },

  rights: {
    br: (ctx) => [
      { h: 'Seus direitos pela LGPD (Lei nº 13.709/2018)', ul: [
        'Bases legais: execução de contrato (art. 7º, V) para os dados do jogo; consentimento (art. 7º, I) para anúncios; legítimo interesse (art. 7º, IX) para registros do servidor web. A transferência internacional ao Google baseia-se no seu consentimento específico (art. 33, VIII).',
        'Pelo art. 18 você pode obter confirmação e acesso, correção, anonimização, bloqueio ou eliminação, portabilidade, informação sobre compartilhamento e sobre as consequências de não consentir, e revogar o consentimento.',
        `Encarregado pelo tratamento de dados: ${ctx.C.name}, ${ctx.C.email}.`,
        'Você pode peticionar à Autoridade Nacional de Proteção de Dados (ANPD): https://www.gov.br/anpd',
      ] },
    ],
    eu: (ctx) => [
      { h: 'Os seus direitos ao abrigo do RGPD', ul: [
        'Tem direito de acesso, retificação, apagamento, limitação, portabilidade e oposição ao tratamento baseado em interesses legítimos (artigos 15.º a 21.º do RGPD), e pode retirar o consentimento a qualquer momento (artigo 7.º, n.º 3).',
        'Não tomamos decisões exclusivamente automatizadas com efeitos jurídicos ou similares.',
        'Como o nosso tratamento é ocasional e não em grande escala, não designámos representante na UE (artigo 27.º, n.º 2, do RGPD).',
        `Contacto: ${ctx.C.email}. Respondemos no prazo de um mês.`,
        'Pode apresentar reclamação à autoridade de controlo do seu Estado-Membro (em Portugal, a CNPD: https://www.cnpd.pt); lista completa em https://edpb.europa.eu/about-edpb/about-edpb/members_en',
      ] },
    ],
    other: (ctx) => [
      { h: 'Seus direitos', ul: [
        'Onde quer que você viva, aplicamos as mesmas proteções: você pode perguntar quais dados são tratados, pedir correção ou eliminação e revogar o consentimento a qualquer momento.',
        `Contato: ${ctx.C.email}. Você também pode reclamar à autoridade de proteção de dados do seu país, se houver.`,
      ] },
    ],
  },

  termsLocal: {
    br: () => [
      { h: 'Consumidores no Brasil', p: [
        'Seus direitos pelo Código de Defesa do Consumidor (Lei nº 8.078/1990) são preservados, e você pode propor ações no foro do seu domicílio.',
      ] },
    ],
    eu: () => [
      { h: 'Consumidores na UE / EEE', p: [
        'Mantém todos os direitos conferidos pela legislação imperativa de defesa do consumidor do seu país de residência, incluindo a garantia legal de conformidade dos conteúdos digitais. Sendo o jogo gratuito e sem compra, não se aplica o direito de livre resolução.',
      ] },
    ],
    other: () => [],
  },
};
