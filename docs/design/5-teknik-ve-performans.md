# KOR — Teknik ve performans

> Phone performance (start-up, films, frame pacing, GPU load, quality tiers), ragdolls and the measurements behind each change.
>
> Bölüm numaraları (§) ana belgedekiyle aynı; dizin: [`../KOR_STORY_CINEMATIC.md`](../KOR_STORY_CINEMATIC.md). English summary: [`../README.md`](../README.md).

### 10.17 Performans: telefonda açılış, filmler, oyun içi
Şikâyet: oyun bilgisayarda bile takılıyor, telefonda açılmadan çöküyor, ışın
izlenmiş sahneler (filmler) çok kasıyor. Ölçüm (başsız Chromium; telefon
benzetimi 844×390 @3×, 4 GB, işlemci 4 kat yavaş):

| | önce | sonra |
|---|---|---|
| ilk açılış (önbelleksiz pişirme) | 42 s | 7,2 s (orta), 5,1 s (düşük) |
| sprite atlası, ekran kartında | 14 sayfa, 298 MB | 9 sayfa 192 MB (orta), 4 sayfa 85 MB (düşük) |
| atlas için ayrıca tutulan bellek | 402 MB (hiç bırakılmıyordu) | 0 (yüklenince bırakılır) |
| kare başına çizim çağrısı (görev 1 / 2 / 3) | 320 / 214 / 302 | 60 / 38 / 74 |
| oyun içi çözünürlük (o telefon) | 2110×975 | 1688×780 (orta), 1266×585 (düşük) |
| lobi portreleri (5 operatör) | 4,5 s ana iş parçacığı | 0,8 s |
| film sahnesi | her karede canlı çizim; kesmelerde piksel piksel zemin hesabı (bir karede 58 000 çizim) | video, yedi film toplam 12 MB |

Masaüstünde (1280×720) görüntü aynı kalırken çizimin işlemci payı kare başına
3,0 → 2,4 ms (görev 1), 2,8 → 2,1 ms (görev 3).

Yapılanlar:

- **Atlas belleği:** her sprite paketlendiği anda sayfasına çizilip atılıyor;
  sayfaların 2B tuvalleri ekran kartına (ve önbelleğe) gidince bırakılıyor.
  Önbellekten açılışta görüntüler yüklenince kapatılıyor.
- **Tek doku dizisi:** sayfalar 6'şarlık doku dizilerinin katmanları; çizici
  yalnız dizi ya da karışım değişince boşaltıyor. Tek parça ayırma ~100 MB'ı
  geçmiyor (bazı telefon sürücüleri büyük bloğu reddediyor).
- **Cihaza göre kalite (Oto):** telefon ve tablet orta, az bellekli ya da az
  çekirdekli cihaz düşük, bilgisayar yüksek. Sprite yoğunluğu ekranın en
  yakın kamerada (lobi, 150 birim) gösterebileceği kadar; 4 GB ve altı en çok
  orta, 2 GB düşük. Ayarlar her zaman başka seçebilir.
- **Piksel sınırı:** düşük 0,9, orta 1,6, yüksek 2,8 Mpx. 4K monitör ya da
  3× telefon artık 1080p'nin dört katı doldurma yapmıyor; tarayıcı büyütüyor.
- **Kare hızı (Ayarlar › Grafik):** 30 / 60 / Ekran, varsayılan 60. 120 Hz
  telefonda ekran kartı yükü yarıya iniyor; 144 Hz monitörde kare dengesi
  bozulmuyor.
- **Paralel pişirme:** ilk açılışta sprite'lar 1–4 işçide (Web Worker) çiziliyor,
  ana iş parçacığı yalnız paketliyor. Bir işçi açılmazsa kalan kısım eskisi
  gibi ana iş parçacığında çiziliyor.
- **Filmler video:** açılış, onun kömür döngüsü, prolog, görev öncesi üç sahne
  ve birinci perde sonu `tools/game/film/render.mjs` ile aynı çekim koduyla
  kare kare çizilip H.264'e (1280×536, 24 kare) kodlandı
  (`assets/film/*.mp4`, toplam 12 MB). Film greni videoya konmadı (gürültü
  videonun bitlerinin çoğunu yiyordu; grenli dosyalar 4–5 kat büyüktü):
  oynarken üstüne aynı gren CSS katmanı olarak saniyede 24 kez kayıyor.
  Kömür döngüsü uçları çapraz geçişle eklendiği için dikişsiz. Ses, altyazı, ara yazılar ve
  geç düğmesi canlı. Video oynatılamazsa (dosya yok, codec yok) film eskisi
  gibi canlı çiziliyor; o yol da en çok 30 karede çiziyor ve bir çekim hata
  verirse film donmak yerine bitiyor. Açılış videosu oynarken pişirme işlemciyi
  tek başına kullanıyor; yazı ve yükleme çizgisi DOM'da. Android kabuğu
  (`mobile/scripts/patch-android-sdk.mjs`) sessiz videonun dokunmadan
  başlamasına açıkça izin veriyor.
- **Lobi portreleri:** operatör kartlarında yalnız baş ve omuz görünürken
  figürün tamamı (portrenin ~21 katı alan) çizilip kırpılıyordu; artık yalnız
  portrenin karesi, %12 payla (~14 kat az piksel). Telefonda lobinin ilk
  açılışta ~10 s donması buydu. Görünüş birebir aynı.
- **Prolog hatası:** fırın çekimi (3–10 s ve 15–19 s) her karede `this.men`
  hatası verip filmi donduruyordu (figürler kaldırılırken bir satır kalmıştı).

Bir çekim değişirse filmi yeniden çizmek için: `node tools/game/film/render.mjs
[id…]` (Playwright'ın Chromium'u ve ffmpeg/libx264 gerekir). Geliştirme
için `?livefilm` filmleri, `?liveintro` açılışı canlı çizer; `?bakemain`
pişirmeyi ana iş parçacığında yapar; `?fps=0|30|60` kare sınırı.

### 10.18 Kare temposu ve ekran kartı yükü (KOR-10 sonrası)
Şikâyet: KOR-10'da oyun hâlâ takılıyor. İki ayrı neden bulundu.

**1. Takılma (kare temposu).** 60 kare sınırı, ekranın kare aralığının katı
olmayan bir aralıkla kare atlıyordu. 90 Hz ekranda (pek çok Android telefon;
Android kabuğu da en hızlı modu istiyordu) kareler bir 11 ms, bir 22 ms
geliyordu: ortalama 60 kare, göze takılma. Ayrıca kare süresi 90 Hz bütçesine
(11 ms) göre ölçüldüğü için otomatik çözünürlük her zaman "yetişemiyor" sanıp
çözünürlüğü ve sokak efektlerini boşuna düşürüyordu. Simülasyon (rAF zamanları
±0,3 ms titreşimle):

| ekran / sınır | KOR-10 | şimdi |
|---|---|---|
| 90 Hz / 60 | 60 kare, 11,1–22,5 ms (takılma) | Android: 60 Hz modu, düz 16,7 ms; tarayıcı: düz 90 kare |
| 120 Hz / 60 | 60 kare, 16,1–17,1 ms | aynı |
| 144 Hz / 60 | 72 kare | aynı |
| 165 Hz / 60 | 55 kare, bütçe 50 sanılıyordu | 55 kare, bütçe 55 |

- Döngü artık her k'inci ekran karesini çiziyor (k tam sayı: 120 Hz → 2,
  144 Hz → 2, 165 Hz → 3). Sınırın 1,6 katından yavaş ekran (75, 90 Hz) her
  karede çizilir; bir kısmını atlamak takılma demek.
- Android kabuğu en hızlı modu değil, 60'ın katı olan en hızlı modu istiyor
  (120 Hz varsa 120, yoksa 60). 90 Hz'lik telefonda oyun 60 Hz'de, düzgün.

**2. Ekran kartı işi.** Oyun içinde kare başına ekran kartı süresi, aşama aşama
(SwiftShader'da her çizimden sonra eşitleme; yazılım ekran kartı, oranlar
anlamlı, mutlak süreler değil; telefon benzetimi, orta kalite, görev 2):

| aşama | önce | sonra |
|---|---|---|
| sahne sprite'ları | 68 ms | 71 ms |
| son geçiş (renk, hale, ıslak yol) | 43 ms | 32 ms |
| karakterler (gölgelendirme + duvara gölge) | 37 ms | 19 ms |
| geri kalan (ışık, bloom, birleştirme, parçacık) | 36 ms | 36 ms |
| toplam | 184 ms | 158 ms (−%14) |

- **Son geçiş render çözünürlüğünde:** tuvalin kendisi render boyutunda;
  büyütmeyi tarayıcı sayfayı birleştirirken bedavaya yapıyor. Önceden en
  pahalı piksel işi (9'a varan doku okuması) ekran çözünürlüğünde dönüyordu.
  Yüksek kalitede (ölçek 1) değişen bir şey yok.
- **Karakterler yalnız kullandıkları alanda:** her figürün yuvası, yukarı ya
  da aşağı nişan alan uzun bir tüfeğe yetecek kadar geniş (108×108 birim) ve
  çoğu boş; o kutunun tamamı karede 29 doku okumalı gölgelendiriciden
  geçiyordu. Artık parçaların o kare kapladığı kutu (gölge payıyla) çiziliyor;
  duvara düşen gölge de öyle. Görüntü aynı.
- Sahne sprite'larının toplam örtüşmesi 4,5 ekran; bunun 1,7'si lambaların
  altındaki ve katmanlar arasındaki sis/hale (çok düşük opaklıklı geniş
  dörtgenler). Görüntünün parçası olduğu için dokunulmadı.

### 10.19 Ölen muhafızların yerdeki vücutları
Şikâyet: Vorsa muhafızları ölünce vücutları yerde bozuluyor. Ragdoll'da
(`anim/ragdoll.js`) beş ayrı hata vardı; beşi de KOR-10/11 öncesinden beri
duruyordu.

- **Yukarıdaki yüzeye ışınlanma:** zemin araması bir noktanın 24 birim
  üstüne kadar bakıp oradaki en yüksek yüzeye koyuyordu. Konteyner ya da
  iskele üstünde ölen muhafızın kolu, ayağı platform kenarına takılıp gövde
  baş aşağı sarkıyordu; duvara değen bir uzuv her adımda biraz daha yukarı
  "tırmanıyordu" (testte 243 birime kadar). Artık bir nokta yalnız bir adım
  önce altının bulunduğu yerle şimdiki yeri arasındaki yüzeye konuyor; zaten
  altında kaldığı bir yüzeye hiç çıkmıyor. Yana doğru katı bir karoya giren
  nokta eski x'ine dönüyor.
- **Üst kat platformu:** iskelede başı bir üst katın içinden geçen muhafız
  ölünce boynu o kata oturuyor, vücut boynundan asılı dik duruyor ve kayıyordu.
  Tek yönlü platformlar artık yalnız öldüğü andaki ayaklarının hizasında ya da
  altındaysa vücudu taşıyor.
- **Çökmeme:** eklemlerde hiç gevşeklik olmadığından vücut dik, diz çökmüş ya
  da duvara yaslı amuda kalkmış halde dengede kalabiliyordu. İlk üç saniye,
  dik (ya da ters dönmüş) gövdenin üstteki ucu son kurşunun yönüne devriliyor,
  gövdenin altında dümdüz kalan bacak dizden katlanıyor; duvar varsa öbür
  yöne. Üç saniyeden sonra itiş yok, rampa üstündeki vücut kaymaz.

- **Sandığın içinde başlayan kalça:** sandığa bitişik ölen muhafızın kalça
  noktası ilk andan sandığın içindeydi; baş bir yanından, bacaklar öbür
  yanından sarkıp orada kalıyordu (devirme yönü de iki yan dolu görünüp her
  adımda dönüyordu). Katı karonun içinde kalmış nokta en kısa yoldan (üstüne
  ya da iki yanından birine) çıkıyor; devirme yönü yalnız öbür yan boşsa
  değişiyor.

- **Başı sandıkta, kalçası havada:** sırtüstü bir sandığa düşen muhafızın
  boynu sandığın üstüne oturuyor, kalçası yerden 16 birim yukarıda asılı
  kalıyordu (bükülü bacaklar ve gövde sert bir üçgen oluşturuyor). Dik gövdenin
  kalçası yere değmiyor ve düşmüyorsa (bir şey tutuyorsa) ilk saniyelerde
  başın yaslandığı yerden dışarı kayıyor, baş da aynı yöne, sandığın
  kenarından aşağı devriliyor.

`tools/game/ragdoll.test.mjs` bu durumlar için 18 yeni kontrol içeriyor
(üst platformun altında ölmek, duvara doğru vurulmak, duvara yaslı ölmek,
kalçası sandıkta ölmek, sandığa sırtüstü düşmek); eski kod 5'inde kalıyor.

### 10.20 Her telefonda 60: işlemci, ekran kartı, kendini ayarlayan kalite
Hedef: zayıf telefonlarda da düz 60 kare. Ölçümler Chromium'da, işlemci 6 kat
yavaşlatılmış (giriş seviyesi bir telefon kadar), 60 karelik bir kare başına
işlemci süresi:

| sahne | önce | sonra |
|---|---|---|
| görev 1 | 10,9 ms | 7,9 ms |
| görev 2 (sokak, kalabalık) | 17,8 ms | 11,8 ms |
| görev 3 | 14,6 ms | 11,4 ms |

**İşlemci:**
- **Düzen okuması:** her karede tuvalin CSS boyutu (`clientWidth`) okunuyordu;
  her okuma tarayıcıyı sayfa düzenini yeniden hesaplamaya zorlayabiliyor.
  Boyut artık yalnız değiştiğinde (`ResizeObserver`) alınıyor; nişan,
  hedef oku ve kamera oranı bu saklı değeri kullanıyor.
- **Ekran dışındaki karakterler çizilmiyor:** sokağın uzak ucundaki timler
  her karede karakter çiziminden geçiyordu. Görüşün 130 birim dışındakiler
  listeye girmiyor.
- **Uzaktaki karakterlerin pozu seyrek:** görüşün 160 birim dışındaki
  muhafızın iskeleti, pozu ve kumaşı dört adımda bir hesaplanıyor. Yürüyüşü,
  aklı ve vurulabilir yeri her adım güncel; görünmeyen tek şey poz.
- **Duran vücutlar uyuyor:** yerde 0,6 saniyedir kıpırdamayan vücudun
  ragdoll adımı atlanıyor; bir kurşun ya da patlama itince uyanıyor. Ekran
  dışındaki ölü vücut hiç pozlanmıyor.
- **Ses efektleri ayrı iş parçacığında:** oyunun açılışında 40 ses
  efekti dilimler halinde ana iş parçacığında üretiliyordu (ilk saniyelerde
  kare başına 6 ms'ye kadar). Artık bir Web Worker'da üretilip hazır
  geliyor; worker açılamazsa eski dilimli yol devrede.

**Ekran kartı:**
- **Çip tanıma:** tarayıcının bildirdiği grafik çipi okunuyor. Giriş
  seviyesi ya da eski çipli telefonlar (Mali-4xx, Mali-T, Mali-G31…G57,
  Adreno 2xx–5xx ve 600–616, PowerVR, Vivante, VideoCore) ilk açılışta düşük
  kalitede başlıyor. Çipin adı performans panelinde görünüyor.
- **Düşük kalitede ucuz gölgelendiriciler:** karakter dış çizgisi 12 yerine 6
  yön örnekliyor (piksel başına 29 yerine 17 doku okuması), ıslak yol
  yansıması 4 yerine 2 okuma. Düşük kalitede lambaların duvara düşürdüğü
  karakter gölgeleri yok.
- Görev 2'de kare başına ekran kartı süresi (SwiftShader, oranlar anlamlı):
  orta kalite 156,8 ms, düşük kalite 63,6 ms (−%59).

**Kendini ayarlayan kalite (Oto):** otomatik çözünürlük en dibe inmiş, sokak
efektleri (yağmur, yansıma, buhar) tamamen kısılmış ve kare hâlâ 3 saniye
boyunca bütçeyi aşıyorsa kalite bir kademe düşüyor (yüksek → orta → düşük) ve
bu telefona kaydediliyor: sonraki açılışlar oradan başlıyor. Yalnız Ayarlar'da
kalite "Oto" iken çalışıyor; elle seçilmiş kaliteye dokunmuyor.

### 10.26 Telefonun yazı boyutu

Android'de yazı boyutunu büyüten oyuncu oyunda bir şey görmüyordu: Android
WebView'ın kendi büyütmesi (`textZoom`) yerleşimi bozduğu için kapalıydı ve
yerine bir şey konmamıştı.

- **Uygulama yazı ölçeğini oyuna söylüyor:** `MainActivity` açılışta ve her
  geri dönüşte telefonun yazı ölçeğini (`fontScale`, ör. 1,3) okuyup oyuna
  `korfontscale` olayıyla gönderiyor (`mobile/scripts/patch-android-sdk.mjs`).
  WebView'ın kendi büyütmesi kapalı kalıyor (`setTextZoom(100)`).
- **Menüler:** oyuncu Ayarlar > Erişilebilirlik'te arayüz ölçeğine hiç
  dokunmadıysa arayüz ölçeği yazı ölçeğini izliyor (0,85–1,15 aralığında,
  0,05'lik adımlarla; 1,3 → 1,15). Oyuncu ölçeği kendisi değiştirdiyse
  (`uiScaleBy: 'player'`) telefon ona dokunmuyor.
- **Görev ekranı:** hedef satırı, patron çubuğu, süre, bildirimler ve
  yetenek yazıları ayrıca büyüyor (`--hudk`, 1–1,2), çünkü oyun alanının
  ölçeği değişmiyor.
- Tarayıcıda denendi: yazı 1,3 → ölçek 1,15; 0,9 → 0,9; oyuncunun seçtiği
  1,1 yazı 1,15 gelince 1,1 kaldı.

### 10.27 Gerçek telefonda ölçmek: performans testi ve hata kaydı

Buraya kadarki bütün kare hızları öykünülmüş telefondan (yazılım ekran kartı,
yavaşlatılmış işlemci). Gerçek telefonun ne yaptığını oyunun kendisi ölçüyor.

**Performans testi** (Ayarlar > Grafik > Performans testi,
`js/game/bench.js`):
- Görev 2'nin (Pazar Baskını) 30 saniyesini oyun kendi oynuyor: operatör
  koşuyor, en yakın muhafızı görünce durup ateş ediyor, ölmüyor. Kalite,
  çözünürlük ve kare sınırı oyuncunun ayarları; ilk 3 saniye ısınma, sayılmıyor.
  Ekranın altında "Performans testi · 27" gibi bir etiket kalan saniyeyi
  gösteriyor. Kariyere hiçbir şey yazılmıyor.
- Sonunda bir kart: başlık özet ("Akıcı çalışıyor" / "Neredeyse akıcı" /
  "Bu telefonda zorlanıyor"), altında kopyalanabilir rapor. Rapor İngilizce ve
  düz metin, çünkü bize gönderilecek:

```
KOR performance test · 2026-11-14 11:17 · build KOR 2.1 · 2026-11-14
Device: SM-A146B · GPU: Mali-G57 MC2 · 8 cores · 4 GB
Screen: 860×400 @2.75 · 60 Hz · cap 60
Quality: med → low · render 1180×549 · lowest dynamic x0.80 · effects 1
FPS avg 58.9 · 1% low 41.2 · p95 18.4 ms · worst 52 ms · over 20 ms 3.1%
CPU: sim 0.68 ms · draw 0.64 ms · 1766 frames · errors logged 0
```
  (Satırların anlamı: cihaz modeli ve grafik çipi; ekran ve tazeleme hızı;
  testte kalitenin düşüp düşmediği, en düşük otomatik çözünürlük, efekt
  kademesi; ortalama kare hızı, en kötü %1, kare sürelerinin %95'i, en uzun
  kare, 20 ms'yi aşan karelerin payı; kare başına simülasyon ve çizim
  komutlarının işlemci süresi. Örnek değerler biçimi göstermek için.)
- "Akıcı": ortalama kare sınırının 3 altına kadar (60'ta 57) ve karelerin
  %95'i 20 ms altında. "Neredeyse": ortalama 45 ve üstü.
- Ölçüm oyunun kendi döngüsünden: her çizilen karenin süresi ve o karede
  simülasyon ile çizim komutlarının süresi (`core/loop.js`).

**Hata kaydı** (`js/core/errlog.js`, Ayarlar > Gizlilik ve yasal > Hata
kaydı):
- Oyunda yakalanmayan her hata (`error`, `unhandledrejection`) ve açılışın
  çöktüğü durum telefonda tutuluyor: son 20 hata, zamanı, sürümü, nerede
  olduğu, yığının ilk 6 satırı. Aynı hata bir saniye içinde tekrarlarsa sayısı
  artıyor, kayıt dolmuyor.
- Hiçbir şey telefondan çıkmıyor (veri toplamıyoruz, gizlilik metniyle
  uyumlu). Oyuncu kaydı görüp kopyalayabiliyor ve silebiliyor; satırda kaç
  hata olduğu yazıyor.
- Tarayıcıda denendi: SwiftShader'da test 46 saniyede bitti, rapor çıktı
  ("zorlanıyor", 25,7 kare/sn: yazılım ekran kartı); atılan bir hata ve bir
  reddedilen söz kayda yığınlarıyla düştü.

### 10.28 İlk açılış: önce lobi, sokaklar arkadan

İlk açılışta (ve her güncellemeden sonraki ilk açılışta, çünkü çizimler
sürümle birlikte yeniden boyanıyor) oyun 384 parçanın hepsini boyamadan lobiyi
açmıyordu. Lobide görünen bunların yarısından azı.

- **İki aşama** (`gfx/baker.js`, `game/mission.js` → `forLobby`): önce lobinin
  gördüğü 209 parça (sığınak, beş operatör ve bütün silahları, efektler, küçük
  eşyalar) boyanıp ekran kartına yükleniyor ve lobi açılıyor. Kalan 175 parça
  (sokak katmanları, binalar, görev parçaları, Vorsa) lobinin arkasında
  boyanıyor.
- **Arkadaki iş lobiyi sarsmasın diye:** ikinci aşama lobi ilk karelerini
  çizene kadar bekliyor; sonra işçiler boyuyor, ana iş parçacığı parçaları
  sayfalara kare aralarında 6 ms'lik dilimlerle yerleştiriyor, işçiler en
  fazla 12 parça öne geçiyor. Sayfalar artık işlemci belleğinde
  (`willReadFrequently`): her parça yerleştiği anda sayfaya çiziliyor,
  yüklemede birikmiş bir çizim yığını patlamıyor. Bitince yeni sayfalar ekran
  kartına kare başına bir sayfa yükleniyor.
- **Ayrı doku grubu:** ilk aşamanın sayfaları mühürleniyor; ikinci aşama yeni
  bir doku grubunda başlıyor (aradaki boş sayfa numaraları bellek tutmuyor),
  böylece lobinin dokusu bir daha yüklenmiyor.
- **Görev beklerse:** oyuncu boyama bitmeden göreve basarsa "Sokaklar
  boyanıyor · %53" kartı çıkıyor, bitince görev kendiliğinden başlıyor
  (performans testi de aynı). Hikâye filmi olan görevde film zaten o süreyi
  dolduruyor.
- **Önbellek** aynı: iki aşama da bitince bütün sayfalar tek kayıt olarak
  saklanıyor (boş numaralar dahil); ikinci açılış önbellekten tek seferde
  (0,6 sn, bu ölçümlerde). Açılış filmi oynarken ikinci aşama filmin arkasında
  sürüyor. `?onestage` eski tek aşamalı yolu açar.

Ölçüm (öykünülmüş orta telefon: 844×390 @3, 4 GB, işlemci 4× yavaş,
yazılım ekran kartı, önbelleksiz, filmsiz; `perf/lobbytime.mjs`):

| | Tek aşama | İki aşama |
| --- | --- | --- |
| Lobinin ilk karesi | 8,8–10,6 sn | 6,4–7,0 sn |
| Lobiden önceki boyama | 4,5–5,0 sn | 2,2–2,8 sn |
| Her şey hazır | lobiyle birlikte | lobiden ~5–6 sn sonra |
| Sayfa (ekran kartı) | 9 (191 MB) | 10 (212 MB) |

İlk aşamanın son sayfası yarı boş kaldığı için bir sayfa fazla. Öykünücüde
arka plandaki sayfa yüklemeleri 0,6–0,8 sn'lik kareler yapıyor (yazılım ekran
kartı 16 MB'lık sayfayı işlemciyle kopyalıyor); gerçek telefonda bu bir
sayfa için onlarca milisaniye. Gerçek değeri performans testi (§10.27)
gösterecek.
