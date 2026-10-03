// Türkçe hukuki metinler. KVKK kapsamında aydınlatma (md. 10) ve açık rıza
// (md. 5/1, 9) birbirinden ayrı tutulur; açık rıza hiçbir zaman oyunu
// oynamanın şartı değildir.

const GOOGLE = 'https://policies.google.com/privacy';
const GOOGLE_PARTNERS = 'https://policies.google.com/technologies/partner-sites';

export default {
  ui: {
    title: 'Oynamadan önce',
    intro: 'Lütfen ülkeni seç, doğum yılını onayla ve aşağıdaki metinleri incele. Seçimlerin yalnızca bu cihazda saklanır.',
    country: 'Yaşadığın ülke / bölge',
    docLang: 'Metin dili',
    birthYear: 'Doğum yılı',
    select: 'Seç…',
    readPrivacy: 'Aydınlatma Metni ve Gizlilik Politikası’nı oku',
    readTerms: 'Kullanım Koşulları’nı oku',
    readConsent: 'Açık Rıza Metni’ni oku',
    acceptTerms: 'Kullanım Koşulları’nı okudum ve kabul ediyorum.',
    ackPrivacy: 'KVKK Aydınlatma Metni ve Gizlilik Politikası’nı okudum, bilgilendirildim.',
    guardian: '18 yaşından küçüğüm; velim veya yasal temsilcim bu metinleri okudu ve onaylıyor.',
    adsSection: 'İsteğe bağlı — ödüllü reklamlar',
    adsOptin: 'Açık Rıza Metni’nde açıklandığı şekilde, Google AdMob tarafından ödüllü reklam gösterilmesine; cihaz reklam kimliğimin ve IP adresimin işlenmesine ve yurt dışına aktarılmasına açık rıza veriyorum. (İsteğe bağlıdır — vermeden de oyunun tamamını oynayabilirsin.)',
    adsPersonal: 'Kişiselleştirilmiş reklamlara da açık rıza veriyorum. (İsteğe bağlı)',
    doNotSell: 'Kişisel bilgilerimi satma veya paylaşma.',
    adsUnavailable: 'Bölgende ödüllü reklam sunulmuyor; bu nedenle reklam verisi işlenmez.',
    adsAge: 'Yaşın nedeniyle ödüllü reklamlar kapalıdır ve reklam verisi işlenmez.',
    accept: 'Kabul et ve devam et',
    save: 'Seçimleri kaydet',
    close: 'Kapat',
    back: 'Geri',
    manage: 'Gizlilik ve yasal',
    manageHint: 'Metinler, rıza seçimleri, verilerin.',
    deleteData: 'Bu cihazdaki tüm verilerimi sil',
    deleteConfirm: 'Bu işlem bu cihazdaki ilerlemeni, eşyalarını, ayarlarını ve rıza seçimlerini kalıcı olarak siler. Devam edilsin mi?',
    footer: 'Metinleri görüntüleyebilir, seçimlerini değiştirebilir veya rızanı istediğin zaman Ayarlar › Gizlilik ve yasal bölümünden geri alabilirsin.',
    privacyTitle: 'Gizlilik Politikası',
    privacyTitleTR: 'KVKK Aydınlatma Metni ve Gizlilik Politikası',
    termsTitle: 'Kullanım Koşulları',
    consentTitle: 'Ödüllü Reklamlar İçin Rıza Metni',
    consentTitleTR: 'Açık Rıza Metni',
    updated: 'Son güncelleme',
    langNote: 'Bu bölüm seçilen dilde henüz bulunmadığı için İngilizce gösteriliyor.',
    required: 'Zorunlu',
    adsOff: 'Ödüllü reklamlar kapalı. Ayarlar › Gizlilik ve yasal bölümünden açabilirsin.',
    summary: [
      'Hesap yok, kayıt yok: ilerlemen yalnızca bu cihazda saklanır.',
      'Sunucumuz yok; oyun verilerinin hiçbiri bize ulaşmaz.',
      'Google reklamları yalnızca sen izlemeyi seçersen ve yasanın gerektirdiği yerlerde yalnızca açık rızanla gösterilir.',
    ],
  },

  privacy(ctx) {
    const { C, P, date } = ctx;
    return [
      { p: [`Bu metin, ${C.game} oyununun ("oyun") kişisel verileri nasıl işlediğini, 6698 sayılı Kişisel Verilerin Korunması Kanunu’nun ("KVKK") 10. maddesi ve diğer ilgili mevzuat uyarınca açıklar. ${ctx.countryName} için geçerlidir. Sürüm: ${date}.`] },
      { h: '1. Veri sorumlusu', p: [
        `Veri sorumlusu: ${C.name} (Türkiye’de yerleşik bireysel geliştirici). İletişim: ${C.email}.`,
      ] },
      { h: '2. Kısaca', ul: [
        'Oyun hesap gerektirmez; adını, e-posta adresini, rehberini, fotoğraflarını, mikrofonunu veya kesin konumunu asla istemez.',
        'İlerlemen, eşyaların, ayarların ve rıza seçimlerin yalnızca cihazında saklanır. Bunları göremeyiz ve erişemeyiz.',
        P.ads
          ? 'Ödüllü bir reklam izlemeyi seçersen, reklamı göstermek için Google AdMob cihazına ilişkin verileri işler. Yasanın rıza gerektirdiği yerlerde bu yalnızca açık rızan alındıktan sonra olur.'
          : 'Bölgende reklam gösterilmez; bu nedenle reklam verisi işlenmez.',
        'Kişisel verileri para karşılığı satmayız ve hakkında profil oluşturmayız.',
      ] },
      { h: '3. İşlenen veriler, amaçlar, toplama yöntemi ve hukuki sebepler', ul: [
        'Cihazındaki oyun verileri — seviye, istatistikler, oyun içi para, açılan eşyalar, teçhizat, kayıt noktası, ayarlar, davet kodları için rastgele bir kurulum kodu ve yasal seçimlerinin kaydı. Toplama yöntemi: oyun uygulaması tarafından otomatik olarak, yalnızca cihazında. Amaç: talep ettiğin oyun hizmetini sunmak. Hukuki sebep: bir sözleşmenin (Kullanım Koşulları) kurulması veya ifasıyla doğrudan ilgili olması (KVKK md. 5/2-c). Bu veriler cihazından çıkmaz.',
        ...(P.ads ? [
          'Ödüllü reklam (yalnızca "Reklam izle"ye dokunduğunda) — cihaz reklam kimliğin, IP adresin, IP adresinden çıkarılan yaklaşık konum, cihaz ve uygulama bilgileri ve reklamla etkileşimin. Toplama yöntemi: oyuna entegre Google Mobile Ads yazılımı aracılığıyla otomatik olarak. Amaç: reklamı göstermek, ödülü vermek, reklamı ölçmek ve dolandırıcılığı önlemek; ayrıca ayrı onay verirsen reklamları kişiselleştirmek. Hukuki sebep: açık rızan (KVKK md. 5/1) ve yurt dışına aktarım için açık rızan (KVKK md. 9). Google LLC / Google Ireland Ltd. bu verileri kendi politikaları kapsamında işler: ' + GOOGLE + ' ve ' + GOOGLE_PARTNERS + '.',
        ] : []),
        'Yalnızca web sürümü — sayfayı barındıran sunucu, sayfayı sunmak ve kötüye kullanıma karşı korumak için IP adresini ve tarayıcı türünü kaydedebilir. Hukuki sebep: temel hak ve özgürlüklerine zarar vermemek kaydıyla meşru menfaatimiz (KVKK md. 5/2-f).',
        'Bize e-posta gönderirsen — e-posta adresin ve mesajın, sana yanıt vermek için. Hukuki sebep: meşru menfaat (md. 5/2-f); bir hakkını kullanıyorsan hukuki yükümlülüğümüz (md. 5/2-ç).',
      ] },
      { h: '4. Verilerin aktarıldığı taraflar ve yurt dışına aktarım', p: [
        P.ads
          ? 'Reklam verileri Google’a (Google LLC, ABD ve Google Ireland Ltd., İrlanda) aktarılır; Google bu verileri ABD dahil yurt dışındaki sunucularda işleyebilir. Yurt dışına aktarım, KVKK md. 9 uyarınca yalnızca açık rızana dayanılarak yapılır; açık rıza vermezsen reklam gösterilmez ve aktarım yapılmaz. Kanunen zorunlu olan haller dışında verilerin başka hiç kimseye aktarılmaz.'
          : 'Kanunen zorunlu olan haller dışında verilerin hiç kimseye aktarılmaz.',
      ] },
      { h: '5. Saklama süreleri', ul: [
        'Cihazındaki oyun verileri: sen silene kadar (Ayarlar › Gizlilik ve yasal › Verilerimi sil), uygulama verilerini temizleyene veya oyunu kaldırana kadar.',
        P.ads ? 'Reklam verileri: Google’ın saklama politikasına göre; reklam kimliğini cihaz ayarlarından istediğin zaman sıfırlayabilirsin.' : 'Reklam verileri: toplanmaz.',
        'Bize gönderilen e-postalar: talebinin sonuçlandırılması için gereken süre boyunca ve en fazla 2 yıl; süre sonunda silinir veya yok edilir.',
      ] },
      { h: '6. Seçimlerin', ul: [
        'Reklam için açık rızanı Ayarlar › Gizlilik ve yasal bölümünden istediğin zaman verebilir, değiştirebilir veya geri alabilirsin. Geri alma, önceki işlemlerin hukuka uygunluğunu etkilemez.',
        'Reklam kimliğini Android / iOS ayarlarından sıfırlayabilir, silebilir ve reklam takibini sınırlayabilirsin.',
        'Oyunun cihazında sakladığı her şeyi Ayarlar › Gizlilik ve yasal › Verilerimi sil ile silebilirsin.',
      ] },
      ...ctx.rights(ctx),
      { h: 'Çocuklar', p: [
        `Doğum yılını tarafsız bir soruyla soruyoruz. ${P.consentAge} yaşından küçük oyunculara — ve her ülkede 13 yaşından küçüklere — hiçbir zaman reklam gösterilmez ve reklam verisi işlenmez. 18 yaşından küçük hiç kimseye kişiselleştirilmiş reklam gösterilmez. 18 yaşından küçüksen, velin veya yasal temsilcin bu metinleri seninle birlikte incelemelidir. Bir çocuğun bize kişisel veri verdiğini düşünüyorsan ${C.email} adresine yaz; veriyi sileriz.`,
      ] },
      { h: 'Veri güvenliği', p: [
        'Oyun verileri cihazının işletim sistemi korumalı alanında (sandbox) saklanır. Reklam trafiği şifreli bağlantı kullanır. Kişisel veri saklayan bir sunucu işletmiyoruz.',
      ] },
      { h: 'Bu metindeki değişiklikler', p: [
        'Bu metni esaslı şekilde değiştirirsek oyun, oynamaya devam etmeden önce metni tekrar gösterir ve incelemeni ister.',
      ] },
    ];
  },

  consent(ctx) {
    const { C, P } = ctx;
    return [
      { p: [`Ödüllü reklam kutusunu işaretleyerek, veri sorumlusuna (${C.name}) aşağıdaki işlemler için belirli bir konuya ilişkin, bilgilendirilmaya dayanan ve özgür iradenle açıkladığın rızanı vermiş olursun. Rıza isteğe bağlıdır: vermezsen oyunun tamamını yine oynayabilirsin; yalnızca isteğe bağlı "ödül için reklam izle" özellikleri kullanılamaz.`] },
      { h: 'Rıza verdiğin işlemler', ul: [
        'Ödüllü bir reklam izlemeyi seçtiğinde Google AdMob (Google LLC, ABD / Google Ireland Ltd.) reklamı göstermek, ödülü vermek, ölçmek ve dolandırıcılığı önlemek amacıyla cihaz reklam kimliğini, IP adresini, IP adresinden çıkarılan yaklaşık konumu, cihaz ve uygulama bilgilerini ve reklam etkileşimlerini işler.',
        'Bu veriler, ABD dahil yurt dışındaki Google sunucularına aktarılır ve orada işlenir (KVKK md. 9).',
        'Yalnızca kişiselleştirilmiş reklam kutusunu da işaretlersen (yalnızca 18 yaş ve üzeri): Google bu verileri ilgi alanlarına göre reklam göstermek için kullanabilir.',
      ] },
      { h: 'Rızanın geri alınması', p: [
        'Rızanı, verdiğin kadar kolay bir şekilde, Ayarlar › Gizlilik ve yasal bölümünden istediğin zaman geri alabilirsin. Geri alma, öncesinde yapılan işlemlerin hukuka uygunluğunu etkilemez. Google’ın politikası: ' + GOOGLE + '.',
      ] },
      ...(P.id === 'tr' ? [{ p: ['Bu rıza, 6698 sayılı Kişisel Verilerin Korunması Kanunu’nun 5. maddesinin 1. fıkrası ve 9. maddesi kapsamında açık rızadır.'] }] : []),
    ];
  },

  terms(ctx) {
    const { C } = ctx;
    return [
      { p: [`Bu Kullanım Koşulları ("Koşullar"), sen ile ${C.game} oyununun geliştiricisi ${C.name} ("biz") arasında bir sözleşmedir. Oyunda kabul ettiğinde bu Koşullara uymayı kabul etmiş olursun. Kabul etmiyorsan oyunu kullanma.`] },
      { h: '1. Kimler oynayabilir', p: [
        'Bu Koşulları ülkendeki hukuka göre kabul edebilecek yaşta olmalısın. 18 yaşından (veya yaşadığın yerdeki ergin olma yaşından) küçüksen velin veya yasal temsilcin bu Koşulları senin adına incelemeli ve kabul etmelidir; oyunu kullanmandan o sorumludur.',
      ] },
      { h: '2. Lisans', p: [
        'Sana, oyunu sahip olduğun veya kontrol ettiğin cihazlara kurman ve özel, ticari olmayan eğlence amacıyla oynaman için kişisel, münhasır olmayan, devredilemez ve geri alınabilir bir lisans veriyoruz.',
      ] },
      { h: '3. Kabul edilebilir kullanım', ul: [
        'Kanunun bu kısıtlamaya rağmen açıkça izin verdiği ölçü dışında oyunu tersine mühendisliğe tabi tutma, kaynak koda dönüştürme veya değiştirme.',
        'Hile yapma, hatalardan haksız yararlanma veya değiştirilmiş kopyalar dağıtma.',
        'Oyunu hukuka aykırı şekilde veya indirdiğin uygulama mağazasının koşullarına aykırı kullanma.',
      ] },
      { h: '4. Sanal para ve eşyalar', p: [
        'Hurda (scrap), kasalar, görünümler ve diğer sanal eşyalar oyunda kazanılır; parasal değerleri yoktur, gerçek para ile satın alınamaz, satılamaz veya değiştirilemez ve sana satılmaz, yalnızca kullanım lisansı verilir. Kasa içerikleri rastgeledir; düşme olasılıkları oyun tarafından sabittir. Sanal eşyalar yalnızca cihazında saklanır ve bu veriler silinirse kaybolur. Güncellemelerle sanal eşyaları yeniden dengeleyebilir veya değiştirebiliriz.',
      ] },
      { h: '5. Reklamlar', p: [
        'Oyun, Google tarafından sağlanan isteğe bağlı ödüllü reklamlar sunabilir. Reklam izlemek hiçbir zaman zorunlu değildir. Reklamlar Aydınlatma Metni ve rıza seçimlerine tabidir.',
      ] },
      { h: '6. Fikri mülkiyet', p: [
        `${C.game} ve tüm kodu, görselleri, sesleri, karakterleri ve metinleri bize aittir ve 5846 sayılı Fikir ve Sanat Eserleri Kanunu dahil ilgili mevzuatla korunur. Tüm karakterler, gruplar ve yerler kurgusaldır; gerçek kişi veya kuruluşlarla benzerlik tesadüfidir.`,
      ] },
      { h: '7. Güncellemeler ve erişilebilirlik', p: [
        'Oyunu veya herhangi bir özelliğini güncelleyebilir, değiştirebilir veya sonlandırabiliriz. Oyunun her cihazda veya kesintisiz çalışacağını garanti etmeyiz.',
      ] },
      { h: '8. Garanti', p: [
        'Oyun ücretsiz olarak "olduğu gibi" ve "mevcut olduğu şekilde" sunulur. Kanunun izin verdiği ölçüde hatasız olacağına veya belirli bir amaca uygun olduğuna dair garanti vermeyiz. Tüketici olarak kanuni hakların saklıdır.',
      ] },
      { h: '9. Sorumluluk', p: [
        'Kanunun izin verdiği ölçüde dolaylı zararlardan veya sanal eşya ya da ilerleme kaybından sorumlu değiliz. Bu Koşulların hiçbir hükmü kast, ağır kusur, ölüm veya bedensel zarardan doğan sorumluluğu ya da kanunen sınırlanamayan veya kaldırılamayan herhangi bir sorumluluğu sınırlamaz veya kaldırmaz.',
      ] },
      { h: '10. Sözleşmenin sona ermesi', p: [
        'Oyunu kullanmayı istediğin zaman bırakıp silebilirsin. Bu Koşulları ağır şekilde ihlal edersen lisansını sona erdirebiliriz. 4, 6, 8, 9 ve 12. maddeler sona ermeden sonra da geçerlidir.',
      ] },
      { h: '11. Koşullardaki değişiklikler', p: [
        'Bu Koşulları esaslı şekilde değiştirirsek oyun yeni sürümü gösterir ve oynamaya devam etmeden önce kabul etmeni ister.',
      ] },
      { h: '12. Uygulanacak hukuk ve uyuşmazlıklar', p: [
        'Bu Koşullara Türkiye Cumhuriyeti hukuku uygulanır. Bu hukuk seçimi, yaşadığın ülkenin emredici tüketici hukukunun sağladığı korumayı ortadan kaldırmaz; hukukunun izin verdiği durumlarda yerleşim yerindeki mahkemelerde dava açabilirsin.',
      ] },
      ...ctx.termsLocal(ctx),
      { h: 'Uygulama mağazaları', p: [
        'Bu Koşullar Apple veya Google ile değil, yalnızca seninle bizim aramızdadır. Apple ve Google’ın bakım veya destek sağlama yükümlülüğü yoktur ve oyundan ya da oyunla ilgili taleplerden sorumlu değildir. Oyunu Apple App Store’dan indirdiysen Apple ve bağlı şirketleri bu Koşulların üçüncü taraf lehtarıdır ve bunları uygulayabilir. ABD Hükümeti ambargosuna tabi bir ülkede bulunmadığını ve ABD Hükümeti yasaklı taraflar listelerinde yer almadığını beyan edersin.',
      ] },
      { h: 'İletişim', p: [`${C.name} — ${C.email}`] },
    ];
  },

  rights: {
    tr: (ctx) => [
      { h: 'KVKK kapsamındaki hakların (6698 sayılı Kanun md. 11)', ul: [
        'Kişisel verilerinin işlenip işlenmediğini öğrenme; işlenmişse buna ilişkin bilgi talep etme; işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme; yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme; eksik veya yanlış işlenmişse düzeltilmesini isteme; KVKK md. 7’deki şartlar çerçevesinde silinmesini veya yok edilmesini isteme; düzeltme, silme ve yok etme işlemlerinin aktarıldığı üçüncü kişilere bildirilmesini isteme; münhasıran otomatik sistemlerle analiz edilmesi suretiyle aleyhine bir sonucun ortaya çıkmasına itiraz etme; kanuna aykırı işlenmesi sebebiyle zarara uğraman halinde zararın giderilmesini talep etme haklarına sahipsin.',
        `Başvurunu, Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ’e uygun olarak yazılı şekilde veya ${ctx.C.email} adresine e-posta ile iletebilirsin. Başvurun en geç 30 gün içinde ücretsiz olarak sonuçlandırılır.`,
        'Başvurun reddedilirse, verilen cevabı yetersiz bulursan veya süresinde cevap verilmezse; cevabı öğrendiğin tarihten itibaren 30 gün ve her halde başvuru tarihinden itibaren 60 gün içinde Kişisel Verileri Koruma Kurulu’na şikâyette bulunabilirsin: https://www.kvkk.gov.tr',
      ] },
    ],
    other: (ctx) => [
      { h: 'Hakların', ul: [
        'Nerede yaşarsan yaşa aynı korumaları uygularız: hakkında hangi verilerin işlendiğini sorabilir, düzeltilmesini veya silinmesini isteyebilir ve rızanı istediğin zaman geri alabilirsin.',
        `İletişim: ${ctx.C.email}. Varsa ülkenin veri koruma otoritesine de şikâyette bulunabilirsin.`,
      ] },
    ],
  },

  termsLocal: {
    tr: () => [
      { h: 'Türkiye’deki tüketiciler', p: [
        '6502 sayılı Tüketicinin Korunması Hakkında Kanun’dan doğan hakların saklıdır. Her yıl belirlenen parasal sınırlar dahilinde, yerleşim yerindeki veya işlemin yapıldığı yerdeki tüketici hakem heyetine ya da tüketici mahkemesine başvurabilirsin.',
      ] },
    ],
    other: () => [],
  },
};
