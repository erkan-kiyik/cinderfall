# CINDERFALL LAB — Sıfırdan Yeniden Yazım: Yapı Belgesi

> Bu belge, CF LAB'ın (`com.cinderfall.sector9.lab`) her şeyiyle sıfırdan
> yazılmasının **yapısıdır**: verilen kararlar, mimari, her sistemin tasarımı,
> içerik listesi, aşamalar ve her aşamanın kabul ölçütü.
>
> **Ana oyun (`public/game`) bu işten etkilenmez.** Bütün yeni kod LAB'a girer.
> Ana oyuna taşınma ancak LAB tamamlanıp onaylandıktan sonra, ayrı bir kararla olur.

---

## 0. Verilen kararlar

| Konu | Karar |
|---|---|
| Tür / kamera | Yandan görünüşlü 2D taktik nişancı + **görev modu** |
| Grafik motoru | **Kendi WebGL2 motorumuz**, sıfır dış bağımlılık |
| Görsel stil | **Temiz stilize** (Valorant tarzı): düz renk blokları, net silüet, okunaklı palet |
| Silah kadrosu | **Daha az ama daha derin**: 12 silah + bıçak, eklenti sistemi, tam animasyon setleri |
| Oyuncu karakteri | **Operatörler + yetenekler**: 5 operatör, her birinde 2 yetenek + 1 ulti |
| Görevler | **İkisi birden**: hikâye kampanyası + tekrar oynanabilir görev tipleri (+ Sonsuz mod) |
| Ekonomi | Para (PARÇA), sandıklar, CROW'un tezgâhı, başarımlar ve seviye **korunur, sıfırdan yazılır** |
| Kayıt | LAB **temiz kayıtla** başlar; eski veri taşınmaz |

Korunan tek görsel varlık: **CROW** (yeni onaylanan v6). Yeni stile uyması için
çizgi ve renk tonları uyarlanır; yüz tasarımı aynı kalır.

---

## 1. Hedefler ve ölçütler

| Ölçüt | Hedef |
|---|---|
| Kare hızı | Ekranın Hz'i (120 Hz telefonda 120 FPS); orta seviye Android'de en az 90 |
| Kare bütçesi (120 Hz) | Simülasyon ≤ 1.5 ms · CPU render ≤ 2.5 ms · GPU ≤ 6 ms |
| Çizim çağrısı | Savaş sahnesinde ≤ 40 draw call (batch'li) |
| Bellek çöpü (GC) | Savaş sırasında < 0.3 MB/s; sıcak döngüde nesne üretimi yok |
| Açılış | Soğuk açılıştan ana menüye ≤ 3 sn (atlas pişirme dahil, önbellekli ≤ 1 sn) |
| APK boyutu | ≤ 25 MB (çizimler hâlâ kodla üretilir; büyük resim dosyası yok) |
| Ekranlar | Yatay; 740×360'tan 2400×1080'e kadar kaydırmasız menüler |
| Diller | TR, EN, DE, ES, RU, HI, AR (AR sağdan sola) |

---

## 2. Klasör yapısı

Yeni oyun `public/lab/` altında yazılır. **M1'den itibaren LAB APK'sı bu
klasörü paketler** (`build-lab-android.yml` → `GAME_DIR: lab`). Geçiş, motorun
120 FPS hedefi gerçek telefonda ölçülebilsin diye M4'ten M1'e alındı. Eski LAB
(`public/game2`) depoda durur; artık paketlenmez.

```
public/lab/
  index.html · sw.js · manifest.webmanifest
  css/            tasarım sistemi (tokens.css, components.css, screens.css, hud.css)
  js/
    boot.js       açılış: cihaz testi → yasal onay → atlas pişirme → menü
    core/         loop, zaman, olay veri yolu, havuzlar (pool), rng, matematik,
                  kayıt (save), i18n, platform köprüsü (Capacitor, haptik)
    gfx/          WebGL2 bağlamı, shader'lar, sprite batcher, atlas, vektör→atlas
                  pişirici, kamera, ışık, gölge, post-process, GPU parçacıkları
    anim/         iskelet, klipler, blend ağacı, katmanlar, IK, yaylar, kumaş (verlet)
    phys/         çarpışma ızgarası, gövdeler, sweep testleri, ışın (raycast),
                  mermiler/balistik, ragdoll
    art/          stil token'ları + ressamlar: operators/ weapons/ enemies/ env/ fx/ ui/
    skin/         malzeme sistemi: kat (layer) tanımları, desenler, efekt shader'ları
    game/         dünya, oyuncu, operatör, yetenekler/, silahlar/, düşman/, ai/,
                  seviye/, görevler/, modlar/, fx yönetmeni, kamera yönetmeni
    meta/         ekonomi, sandık, tüccar (CROW), seviye, ustalık, başarımlar,
                  istatistik, profil, günlük rotasyon
    ui/           bileşenler, ekranlar/, hud/, dokunmatik kontroller, geçişler
    audio/        mikser, sentez, silah sesleri, ortam, müzik
    legal/ ads/   yasal onay ve ödüllü reklam (yeniden yazılır, kurallar korunur)
  data/           weapons.js · attachments.js · operators.js · abilities.js ·
                  skins.js · enemies.js · missions/ · campaign/ · loc/ (diller)
```

Kural: `data/` yalnızca veridir (sayı, metin anahtarı, renk); davranış `js/`
içindedir. Yeni silah, skin ya da görev eklemek sadece `data/` dosyasına satır
eklemek olmalı.

---

## 3. Motor (WebGL2)

### 3.1 Döngü
- **Sabit 120 Hz simülasyon adımı** + render ara değerlemesi (interpolation).
  60 Hz ekranda kare başına 2 adım, 120'de 1, 144'te ara değer.
- Kare başı en fazla 4 yakalama adımı; sekme gizliyken döngü durur.
- Ekran Hz tespiti (rAF aralıklarının medyanı) ve Android yüksek yenileme modu
  (mevcut `MainActivity` yaması yeniden kullanılır).

### 3.2 Çizim hattı
1. **Pişirme (açılışta bir kez):** Bütün çizimler bir vektör çizim dili
   (path + dolgu + gölge katmanı) ile yazılır, OffscreenCanvas'ta cihazın
   kalite kademesine uygun çözünürlükte çizilir ve **doku atlaslarına**
   paketlenir. Sonuç IndexedDB'de önbelleklenir; ikinci açılışta pişirme yok.
2. **Sprite batcher:** Tek shader, instanced quad'lar; atlas başına bir draw
   call. Derinlik sırası katman + z anahtarıyla sıralanır.
3. **Katmanlar:** gökyüzü → uzak paralaks → orta paralaks → dünya arka plan →
   dünya (karakterler, silahlar, mermiler) → ön plan → parçacıklar → UI dünyası
   (hasar sayıları, işaretçiler).
4. **Işık:** Ayrı ışık tamponu. Nokta ve koni ışıklar (namlu ateşi, lamba,
   patlama, yetenekler) additive olarak çizilir ve sahneyle çarpılır. Duvarlar ve
   siperler için yumuşak 2D gölge (ışık başına 1D gölge haritası, yalnızca
   YÜKSEK kalitede).
5. **Post-process:** bloom (yarım çözünürlük, 2 geçiş), renk derecelendirme
   (LUT), vinyet, isteğe bağlı hafif kromatik sapma. Tek tam ekran geçişte
   birleştirilir.
6. **Parçacıklar:** GPU'da konum ve hız; CPU sadece doğurur. 4096 parçacık
   bütçesi.

### 3.3 Kalite kademeleri
| | DÜŞÜK | ORTA | YÜKSEK |
|---|---|---|---|
| Render ölçeği | 0.7 | 0.85 | 1.0 |
| Atlas ölçeği | 1× | 1.5× | 2× |
| Bloom | yok | yarım çözünürlük | yarım çözünürlük + daha geniş |
| Dinamik gölge | yok | yok | var |
| Parçacık sınırı | 1024 | 2048 | 4096 |

Dinamik çözünürlük kademeleri sabit listeden seçilir (1.0 / .9 / .8 / .7);
tampon değişimi DOM'a dokunmaz (eski oyundaki takılma dersi).

WebGL2 yoksa (çok nadir): "cihaz desteklenmiyor" ekranı. Canvas 2D yedek yok;
iki renderer'ı birlikte taşımak kaliteyi yarıya böler.

---

## 4. Fizik ve hareket

- **Dünya:** 16 px'lik çarpışma ızgarası (katı, tek yönlü platform, merdiven,
  eğim 30°/45°) + serbest AABB'ler (kasalar, kapılar, kalkanlar).
- **Hareket:** ivme/sürtünme eğrileri; koşu, yürüme, çömelme, kayma (slide),
  zıplama (basılı tutma yüksekliği, coyote time 0.1 sn, zıplama tamponu 0.12 sn),
  tırmanma (mantle), merdiven, ip kayma (zipline).
- **Sweep testi:** bütün hareketli gövdeler sürekli çarpışma yapar; hızlı
  karakter ince duvardan geçemez.
- **Mermiler:**
  - Anında isabet (hitscan) silahlar: ışın + menzile göre hasar düşüşü + malzemeye
    göre delme (ahşap > sac > beton).
  - Balistik mermiler (bomba atar, yetenek mermileri): yerçekimi, sekme,
    sürtünme.
- **İsabet bölgeleri:** kafa ×2.0 · gövde ×1.0 · bacak ×0.8. Çömelmiş hedefte
  bölgeler kayar.
- **Ölüm:** 8 noktalı verlet ragdoll. Son isabetin yönünde itme alır, 3 saniye
  sonra donar ve ceset olarak pişirilir.
- **Patlamalar:** yarıçapa göre hasar düşüşü, siper arkasında azalma (ışın testi),
  itme ve kamera sarsıntısı.

Determinizm: aynı tohum + aynı girdi = aynı sonuç. Bu, testler ve görev
tekrarları (yıldız doğrulama) içindir.

---

## 5. Animasyon sistemi

- **İskelet:** 2D kemik hiyerarşisi (kalça → gövde → göğüs → boyun → kafa; omuz →
  üst kol → ön kol → el; kalça → uyluk → baldır → ayak). Parçalar kemiklere
  pişmiş sprite olarak bağlanır.
- **Klipler:** kodla yazılan anahtar kareler (kemik başına açı ve konum, eğri
  türü) ve animasyon olayları (`adım`, `şarjör_çık`, `şarjör_tak`, `mekanizma`,
  `fırlat`).
- **Blend ağacı:** hareket hızına göre bekleme ↔ yürüme ↔ koşu; havada (yükseliş,
  tepe, düşüş); çömelme; kayma.
- **Katmanlar:**
  - Alt gövde hareketi oynatır.
  - Üst gövde nişan katmanıdır: göğüs ve kafa nişan açısına döner, additive.
  - Silah katmanı ateş, şarjör ve inceleme animasyonlarını oynatır.
- **IK:**
  - İki kemikli kol IK'sı ile eller silahın kabzalarına yapışır.
  - Ayak IK'sı ile ayaklar eğim ve basamaklara oturur.
  - Bakış hedefi (look-at) ile kafa nişana bakar.
- **İkincil hareket:**
  - Yaylarla: geri tepme, silah salınımı, iniş çökmesi.
  - Verlet kumaşla: atkı, kablo, çanta kayışı ve operatör pelerinleri.
- **Silah animasyon seti (her silah için):** kuşanma, kaldırma, bekleme, yürüme,
  koşu taşıma, ateş, nişan alma, taktik şarjör, boş şarjör, mekanizma çekme,
  inceleme, dipçik vuruşu.
- **Operatör animasyonları:** her yetenek için hazırlanma, kullanma ve bitiş;
  zafer pozu; lobi bekleme hareketi.

Araç: `anim-lab` geliştirici sayfası. Her klibi kare kare gösterir, kemikleri
çizer ve PNG kare şeridi üretir; inceleme bunun üzerinden yapılır.

---

## 6. Sanat yönü (temiz stilize)

**İlkeler**
1. **Önce silüet:** Her operatör, silah ve düşman tek renk siyahta tanınmalı.
2. **3 ton gölgeleme:** Her malzemede açık / orta / gölge; yumuşak gradyan yok.
   İstisna: ışık efektleri.
3. **Düz renk blokları:** Doku yerine birkaç keskin kenarlı ayrıntı (panel çizgisi,
   dikiş, aşınma lekesi).
4. **Çizgi:** Dış hatlarda koyu ve kalın, iç hatlarda ince ve renkli (siyah değil,
   malzemenin koyu tonu).
5. **Renk dili:**
   - Oyuncu ve dost unsurlar sıcak (turuncu ve krem vurgular).
   - Düşmanlar soğuk (çelik mavisi, kırmızı vizör).
   - Etkileşimli nesneler camgöbeği.
6. **Okunaklılık:** Mermiler, tehlikeler ve yetenek alanları her zaman arka plandan
   ayrılır. Arka planın doygunluğu %35'in altında kalır.

**Palet:** 1 nötr rampa (8 ton), 1 sıcak vurgu, 1 soğuk vurgu, 1 tehlike
kırmızısı, 1 etkileşim camgöbeği, faksiyon başına 2 renk. Hepsi
`art/style.js` içinde token olarak tutulur.

**Ölçek:** Karakter 64 dünya birimi boyunda. Silahlar karaktere göre gerçekçi
oranda, okunaklılık için %15 büyütülmüş.

**M0 teslimi (onay kapısı):**
- Stil panosu PNG'si: 5 operatörün silüet ve renk taslakları, 4 silah, 2 düşman,
  1 sokak kesiti ve 2 menü ekranı taslağı.
- **Onayın gelmeden üretime geçilmez.**

---

## 7. Operatörler

Valorant'tan esinlenilir ama hiçbir isim, karakter ya da yetenek kopyalanmaz.
İsimler taslaktır, M0'da onaylanır.

| Operatör | Rol | Yetenek 1 | Yetenek 2 | Ulti |
|---|---|---|---|---|
| **VEX** | Saldırı | *Atılma:* kısa, hasarsız ileri hamle | *Flaş:* kör eden el bombası | *Aşırı Yük:* 8 sn ateş hızı ve hareket +%30 |
| **HALE** | Savunma | *Kalkan Duvarı:* konuşlanan, kırılabilir siper | *Tuzak Mayını:* yakınlıkta patlar, yavaşlatır | *Taret:* otomatik ateş eden kule (20 sn) |
| **MORROW** | Kontrol | *Duman:* görüşü kesen bulut | *Yavaşlatma Alanı:* düşmanları %40 yavaşlatır | *Karartma:* ekrandaki bütün düşmanlar 4 sn kör |
| **KITE** | Keşif | *Dron:* bir alanı tarar, düşmanları işaretler | *Isı Görüşü:* 5 sn duvar arkasındaki düşmanları ısı izinden görür | *Gözetleme:* 10 sn bütün düşmanlar görünür + kafa vuruşu hasarı +%25 |
| **BRICK** | Ağır | *Kalkan Hücumu:* öne siperli koşu, düşmanları devirir | *Zırh Paketi:* kendine/takıma zırh | *Yenilmez:* 6 sn hasar %70 azalır, ağır silah kuşanır |

- Yetenekler bekleme süresiyle dolar. Ulti, hasar ve öldürmeyle dolan barla açılır.
- Her operatörün kendi silüeti, kostümü, sesleri (barks), lobi pozu ve zafer
  animasyonu vardır. Kostüm skinleri 4 kademe (§9).
- Başlangıçta VEX açıktır. Diğerleri kampanyada ya da PARÇA ile açılır.

---

## 8. Silahlar (12 + bıçak)

| Sınıf | Silah | Rol |
|---|---|---|
| Tabanca | **Wren-9** | Hızlı, isabetli yan silah |
| Tabanca | **Mule .50** | Ağır revolver, yüksek kafa hasarı |
| Hafif makineli | **Hornet** | Çok hızlı ateş, kısa menzil |
| Hafif makineli | **Lynx** | Dengeli, susturucuya uygun |
| Tüfek | **Kestrel AR** | Tam otomatik, genel amaçlı |
| Tüfek | **Bastion BR** | 3'lü atış, orta-uzak menzil |
| Pompalı | **Ramrod-12** | Pompalı, yakında tek atış |
| Pompalı | **Saw-20** | Otomatik pompalı, şarjörlü |
| Keskin nişancı | **Marksman DMR** | Yarı otomatik, nişangâhlı |
| Keskin nişancı | **Longbow** | Sürgülü, delici mermi |
| Ağır | **Anvil LMG** | Büyük şarjör, ısınma ve yavaşlama |
| Patlayıcı | **Thumper GL** | Sekmeli bomba atar |
| Yakın dövüş | **Bıçak** | Hızlı ve ağır saldırı, arkadan anında öldürme |

**Her silahta:**
- Atış özellikleri: hasar tablosu (mesafeye göre düşüş), delme, ateş hızı, şarjör,
  doldurma süreleri (taktik/boş).
- **Geri tepme deseni:** tekrarlanabilir, öğrenilebilir.
- **Sapma (bloom):** hareket, zıplama ve çömelme etkiler.
- Ses: 3 katman (mekanik + patlama + yankı), ortama göre yankı.
- Tam animasyon seti (§5), kovan atma, namlu ateşi, duman.

**Eklentiler (4 yuva):**
- **Nişangâh:** demir, kırmızı nokta, 2×, 4×. Nişan alırken kamera yaklaşır.
- **Namlu:** susturucu (iz ve ses azalır), kompansatör (dikey tepme −%20).
- **Şarjör:** uzatılmış (+%50, doldurma yavaşlar), hızlı.
- **Alt:** tutamak (yatay tepme −), lazer (kalçadan sapma −).

Eklentiler silah ustalık seviyesiyle açılır. Her biri silahta görünür, kendi
sprite'ı ve bağlantı noktası vardır.

---

## 9. Skin sistemi

**Malzeme katmanları (shader ile):** temel renk → desen (kamuflaj, çizgi,
karbon, mermer, hex…) → çıkartmalar (logo, numara, çizik) → kenar aşınması →
ışıma (emissive) maskesi → efekt katmanı.

| Kademe | İçerik |
|---|---|
| Sıradan | Renk + basit desen |
| Nadir | Desen + çıkartma + aşınma |
| Epik | Metalik/sedef parlaklık, ışıyan detay |
| Efsanevi | Hareketli shader (akan enerji, holografik), özel namlu ateşi rengi |
| Mitik | Yukarıdakiler + özel inceleme animasyonu + öldürme efekti + ses |
| Ultra Sınırlı | Mitik + seviye atlayan skin (öldürdükçe 3 aşamada değişir) |

- **Koleksiyonlar:** Her koleksiyonda 4-6 silah skini, 1 operatör kostümü,
  1 bıçak ve 1 kart çerçevesi var.
- **Başlangıç kadrosu:**
  - 6 koleksiyon ("Kül", "Neon Kuzgun", "Paslı Kraliyet", "Buz Hattı",
    "Sektör 9 Polis", "Kuzgun Altını").
  - Silah başına en az 6 skin.
  - Operatör başına 4 kostüm.
- **Önizleme:** Her skin dünya içinde, inceleme animasyonuyla ve 360° döndürülen
  bir vitrin sahnesinde gösterilir.

---

## 10. Düşmanlar ve yapay zekâ

**Faksiyon:** *Ash Syndicate* (Sektör 9'u tutan paralı ordu).

**Tipler:**
- **Tetikçi:** tüfek, siper kullanır.
- **Hücumcu:** pompalı, yandan dolanır.
- **Kalkanlı:** önden geçilmez, arkadan zayıf.
- **Nişancı:** lazer izi görünür, uzun hazırlık.
- **Bombacı:** sekmeli bomba atar.
- **Dron:** uçar, işaretler.
- **Ağır:** LMG, yavaş, zırhlı.
- **Komutan:** diğerlerini güçlendirir.

**Yapay zekâ:**
- Davranış ağacı + fayda (utility) puanlaması.
- Algı: görüş konisi, ses yarıçapı, son bilinen konum.
- **Siper sistemi:** seviyede işaretli siper noktaları. Düşman bunları puanlar
  (oyuncuya mesafe, açık hat, dost yoğunluğu).
- **Takım jetonları:** aynı anda en fazla 2 düşman ateş eder, 1 düşman yandan
  dolanır. Bu, adil zorluk sağlar.
- **Baskılama:** ateş altındaki düşman siperde kalır, kör ateş eder.
- **Zorluk:** tepki süresi, isabet, saldırganlık ve jeton sayısı ile ayarlanır.

**Boss'lar (kampanya):**
- **Sekreter Gall:** kalkanlı, aşamalı.
- **"Ocak":** alev püskürten ağır zırh.
- **Dron Kraliçesi:** dron sürüsü.
- **Vasquez:** son boss, operatör yeteneklerini taklit eder.

---

## 11. Modlar ve görevler

### 11.1 Hikâye kampanyası: "Kül Hattı" (10 görev, 3 perde)
- **Perde 1, Giriş (1-3):** Sektör 9'a sızma; CROW ile tanışma; ilk boss Gall.
- **Perde 2, Derinlik (4-7):** Dökümhane, metro, dron fabrikası; operatörlerin
  açılması; "Ocak" ve Dron Kraliçesi.
- **Perde 3, Çöküş (8-10):** Kule baskını, ihanet, Vasquez.

Her görev:
- Elle tasarlanmış harita.
- 2-3 ara hedef.
- Konuşma balonlu diyaloglar (portreler: operatörler, CROW, düşman liderleri).
- 3 yıldız: bitir · süre · ek hedef.

Hikâye taslağı (karakterler ve ana olaylar) M8 öncesi ayrıca onaya sunulur.

### 11.2 Tekrar oynanabilir görevler (6 tip)
| Tip | Hedef |
|---|---|
| Kurtarma | Rehineye ulaş, onu çıkışa kadar koru |
| Sabotaj | 3 hedefe patlayıcı kur, kaç |
| Savunma | Bir noktayı dalgalara karşı tut |
| Suikast | Belirli hedefi bul ve indir (kaçmadan) |
| Veri | Terminalleri hackle (beklerken savun) |
| Temizlik | Sektörü sürede temizle |

- Haritalar, elle yapılmış parçaların tohumla birleştirilmesinden oluşur.
- Günlük 3 görev rotasyonu, haftalık zor görev.

### 11.3 Sonsuz Sektör
Mevcut sonsuz kampanyanın yeni hâli: artan zorluk, her 5 bölümde boss, liderlik
tablosu (cihaz içi).

---

## 12. Meta ve ekonomi

- **PARÇA (tek para birimi):** görev, öldürme, başarım ve reklam ödülü ile kazanılır.
- **Sandıklar:** 3 tür (Standart / Takviyeli / Kuzgun). Olasılıklar ekranda açıkça
  yazar. Aynı skin tekrar gelirse karşılığında PARÇA verilir. 30 sandıkta bir
  en az Epik garanti (pity).
- **CROW'un tezgâhı:**
  - Günlük 4 ürün, haftalık 1 özel ürün.
  - CROW canlı sahnede durur ve satın almalara tepki verir.
- **İlerleme:**
  - Hesap seviyesi.
  - Operatör ustalığı (kostüm ve poz açar).
  - Silah ustalığı (eklenti ve skin varyantı açar).
- **Başarımlar:** 40 başarım, 4 kademe madalya, ödül olarak PARÇA ve kart çerçevesi.
- **İstatistikler:** genel, silah başına, operatör başına, mod başına.
- **Ödüllü reklam:** yalnızca isteğe bağlı (bedava sandık, görev sonu ×2,
  canlanma). Çevrimdışı ödül yok (mevcut dürüst kural korunur).
- **Kayıt:** sürümlü şema, `localStorage` + yedek kopya, bozuk kayıtta yedekten
  dönme.

---

## 13. UI / UX

### 13.1 Tasarım sistemi
- **Token'lar:**
  - Renk: nötr rampa + vurgular.
  - Tipografi: başlık (geniş, büyük harf), gövde ve sayı (tabular).
  - Boşluk ölçeği 4'ün katları; köşe yarıçapı; gölge; hareket (süre ve yay
    eğrileri).
- **Bileşenler:** düğme ailesi (birincil / ikincil / hayalet / tehlike), sekmeler,
  çipler, kart, liste satırı, modal, toast, ilerleme çubuğu, para göstergesi,
  nadirlik çerçevesi, kilit durumu, boş durum.
- **Hareket:**
  - Her ekran geçişi 180-260 ms yay eğrisiyle.
  - Basılan her öğe ölçek ve haptik ile geri bildirim verir.
  - Ödüller sayaçla sayılır.
- **Erişilebilirlik:** en küçük dokunma alanı 44 px, metin kontrastı 4.5:1,
  renk körlüğü modları (düşman vurgusu), arayüz ölçeği (%85-115).

### 13.2 Ekran haritası
```
Açılış → Yasal onay → Ana Lobi (operatör vitrini, OYNA)
  ├─ OYNA → Mod seçimi: Kampanya (harita) · Görevler (günlük) · Sonsuz
  │          → Hazırlık (operatör + silahlar + eklentiler) → Oyun → Sonuç
  ├─ OPERATÖRLER (yetenek videoları, kostümler, ustalık)
  ├─ CEPHANELİK (silahlar, eklentiler, skinler, vitrin)
  ├─ SANDIKLAR (açılış animasyonu)
  ├─ TÜCCAR (CROW)
  ├─ PROFİL (Özet · Kariyer · Koleksiyon · Başarımlar · İstatistik)
  └─ AYARLAR (grafik, ses, kontroller + HUD düzenleyici, dil, yasal)
```

### 13.3 Oyun içi HUD ve kontroller
- **HUD:** can + zırh, mermi, yetenek düğmeleri (bekleme halkası), ulti barı,
  görev hedefi, mini harita şeridi, isabet işaretçisi, hasar yönü göstergesi.
- **Dokunmatik:**
  - Sol yarıda kayan hareket çubuğu; yukarı itmek zıplar, aşağı çömelir.
  - Sağ yarıda kayan nişan çubuğu; bırakınca ateşi keser.
  - Ayrı düğmeler: ateş, yetenek 1/2, ulti, şarjör, silah değiştir.
  - **HUD düzenleyici:** düğmeleri taşı ve boyutlandır, düzeni kaydet.
- **Klavye ve fare / gamepad:** tam destek, yeniden atanabilir tuşlar.

DOM UI (net metin, i18n, RTL) + WebGL dünya. HUD DOM'u yalnızca değer
değişince yazılır.

---

## 14. Ses

- **Mikser:** veri yolları (müzik / SFX / UI / ses). Patlama anında müzik ve
  ortam kısılır (ducking).
- **Silah sesi:** prosedürel sentez, 3 katman (§8). Mesafeye göre filtre,
  ortama göre yankı (dar sokak / iç mekân / açık alan).
- **Müzik:** adaptif katmanlar. Keşifte sakin, çatışmada davul ve bas açılır,
  boss'ta ayrı tema.
- **Operatör sesleri:** kısa sentezlenmiş "bark"lar ve altyazı.

---

## 15. Platform

- Capacitor Android (LAB app id değişmez). Yüksek yenileme yaması, haptik ve
  AdMob ödüllü reklam (test kimlikleri) yeniden kullanılır.
- **Yasal onay:** ülke bazlı kurallar ve metinler korunur, UI yeni tasarım
  sistemiyle yazılır.
- **Diller:** 7 dil. Anahtar kontrolü testi var; eksik anahtar derlemeyi kırar.
- **Çevrimdışı:** service worker ile tam çevrimdışı çalışır.

---

## 16. Doğrulama araçları

| Araç | İş |
|---|---|
| `lab-shot` | Headless Chromium (WebGL2, SwiftShader) ile ekran ve sahne görüntüleri |
| `anim-lab` | Klip kare şeritleri, kemik ve IK görselleştirme |
| `art-sheet` | Her varlık için renkli / gri / silüet / yakın plan sayfası |
| `perf` | Kare süreleri p50/p95/p99, draw call, GC; stres sahnesi (30 düşman + patlamalar) |
| `sim-test` | Fizik ve balistik birim testleri, determinizm testi (tohum + girdi kaydı) |
| `i18n-check` | 7 dilde eksik veya fazla anahtar |

Her aşama, PNG inceleme sayfaları ve ölçüm tablosuyla kapanır. Kusur varsa
teslimden önce düzeltilir.

---

## 17. Aşamalar (her biri LAB APK + PNG ile teslim)

| # | Aşama | İçerik | Kabul |
|---|---|---|---|
| **M0** | Stil panosu | §6 panosu: operatör silüetleri, 4 silah, 2 düşman, sokak kesiti, 2 menü taslağı | **Senin onayın** |
| **M1** | Motor çekirdeği | WebGL2 batcher, atlas pişirici + önbellek, kamera, ışık, bloom, parçacık, 120 Hz döngü, perf katmanı | Test sahnesi 10 bin sprite'ta 120 FPS (masaüstü) |
| **M2** | Karakter + hareket | İskelet, klipler, blend, IK, kumaş; VEX; tam hareket fiziği | `anim-lab` şeritleri temiz; hareket testi geçer — *tamamlandı* |
| **M3** | Silah çekirdeği | Wren-9, Kestrel AR, Ramrod-12, Marksman DMR + bıçak; balistik, geri tepme, tam animasyon, ses, FX | 4 silah + bıçak inceleme sayfası — *tamamlandı: varsayılan LAB sahnesi, düşmanlar karşılık veriyor, ragdoll ölümler* |
| **M4** | Dikey kesit | 3 düşman tipi + yapay zekâ, ilk kampanya görevi, HUD, dokunmatik | İlk oynanabilir görev uçtan uca — *onaylandı: Tetikçi, Hücumcu, Kalkanlı; Görev 1 "Sızma"* |
| **M5** | UI tasarım sistemi | Bütün menü ekranları, geçişler, ayarlar, HUD düzenleyici, yasal | 740×360 ve 2400×1080'de bütün ekranlar temiz — *hazır: 15 ekran, TR/EN, kayıt sistemi, otomatik yerleşim denetimi (taşma, çakışma, 44 px hedef) 740×360 · 914×411 · 2400×1080'de temiz* |
| **M6** | Operatörler + kadro | 5 operatör, 15 yetenek, kalan 8 silah, eklentiler | Her yetenek ve silah için inceleme sayfası |
| **M7** | Skin + meta | Malzeme shader'ları, 6 koleksiyon, sandık, CROW, profil, istatistik, başarımlar | Skin vitrin sayfaları; ekonomi simülasyonu |
| **M8** | İçerik | 10 kampanya görevi + boss'lar + diyaloglar, 6 görev tipi, Sonsuz Sektör | Her görev uçtan uca oynanır (otomatik demo) |
| **M9** | Cila + yayın | Ses ve müzik, 7 dil, performans cilası, erişilebilirlik, AAB | Perf tablosu hedeflerde; imzalı AAB |

Her aşama sonunda: commit → LAB APK (otomatik) → PNG'ler sana → geri bildirim.
M0, M4 ve M8 öncesi (hikâye) **onay kapılarıdır**.

---

## 18. Riskler ve önlemler

| Risk | Önlem |
|---|---|
| Kapsam çok büyük | Aşama kapıları; her aşama kendi başına oynanabilir veya görülebilir çıktı verir |
| Düşük seviye telefonda WebGL performansı | DÜŞÜK kademe + dinamik çözünürlük; M1'de gerçek cihaz testi |
| SwiftShader ölçümleri gerçek cihazı yansıtmaz | Gerçek cihaz kare süresi kaydı (perf katmanı → dışa aktarım) |
| "Valorant tarzı" ile telif sınırı | Yalnızca stil ilkeleri; isim, karakter, yetenek veya UI kopyası yok |
| Atlas pişirme açılışı yavaşlatır | IndexedDB önbelleği + kademeli pişirme (önce menü, sonra savaş) |
| Prosedürel çizimde kalite dalgalanması | `art-sheet` silüet ve gri ton kontrolleri, her varlık için kontrol listesi |
