# KOR — Hikâye ve Sinematik Yapısı

Bu doküman yapılmadan önce yazıldı ve uygulama birebir buna uyar. Kapsadığı
her şey: hikâye kutsal kitabı (dünya, zaman çizelgesi, karakterler, perdeler),
önsöz sinematiği (çekim çekim, saniyesine kadar), her açılışta oynayan başlık
animasyonu, görev öncesi/sonrası hikâye sahneleri, ve bunların hepsini taşıyan
teknik "rig": insan iskeleti, yürüyüş, kamera, ışık, yağmur, post-process, ses,
altyazı. En sonda "yapay zekâ gibi durmasın" kuralları ve kabul ölçütleri var.

Kod: `public/lab/js/cine/` (yeni). Oyunun mevcut çizgi-film stili oyun içinde
kalır; sinematikler ayrı, gerçekçi bir görüntü diliyle çizilir (ışık, sis,
film greni, siluet). Ana oyun (`public/game`) değişmez.

---

## 1. Hikâye kutsal kitabı

### 1.1 Tek cümle
Söndürülen bir çelik fabrikasının şehrinde, özel bir güvenlik şirketinin
"geçici" yönetimi dördüncü yılına girerken, geride kalan beş kişi şehri geri
almaya başlar.

**Slogan:** *Kül olmadı. Kor kaldı.* (EN: *Not ash. Embers.*)
Ocakçıların eski sözü: *"Ocak söner, kor kalır."* — ekibin adı buradan.

### 1.2 Dünya
- İsimsiz bir liman şehri. Şehir bir çelikhanenin çevresinde büyümüş: yüksek
  fırın, dört sıcak hava sobası, döküm hattı, liman vinçleri. Bölge/semt adı
  kullanılmaz; yerler işlevleriyle anılır (kapı, pazar, valilik, dökümhane,
  liman, kule).
- Zaman: yakın gelecek. Teknoloji bugünkünün biraz ötesi: dronlar, gövde
  zırhı, telsiz, arama ışıkları. Uçan araba yok, lazer yok, hologram yok.
- **VANTA SYNDICATE**: özel askerî şirket. Afişleri: *DÜZEN · GÜVENLİK · İTAAT*.
  Gri-mavi zırh, kırmızı vizör yarığı. Şehirde sokağa çıkma yasağı 22:00.

### 1.3 Zaman çizelgesi
| Ne zaman | Olay |
|---|---|
| 9 yıl önce | Çelikhane bir holdinge satılır, ilk toplu çıkışlar. |
| 4 yıl önce, kasım | Son grev. İşçiler yüksek fırının başını tutar. |
| Aynı gece — **Söndürme** | Belediye meclisi "geçici güvenlik sözleşmesi"ni imzalar. Vanta fırını boşaltır, ocak soğumaya bırakılır (soğuyan yüksek fırın bir daha yakılamaz derler). 37 kişi gözaltı, 6 kişiden bir daha haber alınmaz. Biri: FLINT'in babası Halil Usta. |
| 3 yıl önce | Sözleşme altı ayda bir uzatılır; meclis "askıya" alınır. Vanta'nın Sekreteri Gall valilikten yönetir. |
| Bugün | Ocak hâlâ soğuk. Limanı, elektriği, kapıları Vanta tutar. Kaçakçı HAWK şehre giren tek maldır. Beş kişi "KOR" adıyla örgütlenmiştir. |

### 1.4 Karakterler
Oyuncu **OPERATÖR**'dür (adını kendi yazar): sahadaki ekibin koordinatörü.
Ekip ona telsizden "Operatör" der. Seslendirme yok; her şey altyazı.

| Kod adı | Yaş | Kim | Konuşma biçimi | Rol |
|---|---|---|---|---|
| FLINT | 29 | Üçüncü kuşak ocakçı. Babası Halil Usta sendikanın ocak başıydı, Söndürme gecesi kayboldu. Boynunda babasının kırmızı sendika atkısı. | Az konuşur, kısa cümle. Öfkesini yutar. | Saldırı |
| WARDEN | 41 | Kapatılan itfaiyenin son ekip amiri. Şehrin her binasının iskeletini bilir. | Kuru şaka, hesap kitap. "Beş dakika, fazlası olmaz." | Savunma |
| VESPER | 33 | Vanta'nın eski sinyal analisti. Söndürme kayıtları masasına düşünce taraf değiştirdi. Telsizdeki ses. | Rakamla konuşur. Duygu göstermez. | Kontrol / telsiz |
| SKYE | 22 | Eski kurye; çatıları ezbere bilir, hurdadan dron yapar. | Çok konuşur, hızlı. | Keşif |
| BULWARK | 47 | Liman vinç operatörü. Liman kapanınca konuşmayı da bıraktı. | Neredeyse hiç konuşmaz. Konuşunca son sözü o söyler. | Ağır |
| HAWK | 60'lar | Kaçakçı, tezgâhçı. Şehir dışında bir kızı var. | "Her şeyin bir fiyatı var, evlat." | Tüccar |
| GALL | 50'ler | Vanta'nın Sekreteri. Eski asker, şimdi bürokrat: yasakları imzalar, silahı en son çeker. | Resmî, kibar, soğuk. | Perde 1 boss |
| VASQUEZ | — | Vanta bölge komutanı, kulede. | Görülmez, sadece emirleri. | Final boss |

### 1.5 Perdeler (10 görev)
- **Perde 1 — Giriş.** (1) *Sızma*: şehre kapıdan girilir. (2) *HAWK'ın Tezgâhı*:
  tek erzak hattı korunur. (3) *Sekreter Gall*: valilik; Gall düşer, masasında
  **"Kül Planı"** bulunur: Vanta çelikhane arazisini ve limanı satmaktadır.
- **Perde 2 — Derinlik.** (4) *Dökümhane*: kaybolanların kayıtları. (5) *Metro*.
  (6) *Dron Fabrikası*. (7) *Ocak*: yüksek fırın dört yıl sonra yeniden yakılır.
- **Perde 3 — Çöküş.** (8) *Kule Baskını*. (9) *İhanet*: rotayı HAWK satmıştır
  (kızını şehirden çıkarmanın bedeli). (10) *Vasquez*.
- Perde 1'de ihanetin tohumu atılır: HAWK'ın repliği, Gall'ın masasında çalan
  telefonda arayanın adı.

### 1.6 Yazım kuralları
- Kısa, somut, Türkçe deyimle. Rakam ve ayrıntı ver: "doksan saniye", "otuz
  yedi kişi", "beş dakika".
- Yasak: "bir dünyada ki…", "kader", "seçilmiş", "son umut", "karanlık güçler",
  büyük harfle ünlem, "Hazır mısın?" tipi cümleler.
- Kimse kendini anlatmaz; karakter ne yaptığından anlaşılır.
- Altyazı satırı en fazla 42 karakter, ekranda okuma süresi ≥ 15 karakter/sn.

---

## 2. Önsöz sinematiği (ilk açılış, 62 sn, atlanabilir)

Görüntü oranı **2.39:1** (sinema), telefon ekranında üst/alt ince siyah bant.
İç çözünürlük en fazla 1280×536, ekrana yumuşak ölçeklenir. 24 kare/sn hissi
için hareketler 24 fps'e kuantalanmaz ama kamera sallantısı ve gren 24 Hz'de
değişir.

### 2.1 Çekim listesi
Zaman sütunu saniye. Odak: mm eşdeğeri (dar alan = uzun lens). Işık sıcaklığı
Kelvin.

| # | Zaman | Çekim | Kamera | Işık | Ses | Altyazı |
|---|---|---|---|---|---|---|
| 0 | 0.0–3.0 | Siyah. Sol altta küçük yazı. | — | — | Yağmur 0→-18 dB, uzak trafik uğultusu | *Dört yıl önce* (yazı) |
| 1 | 3.0–10.0 | **Söndürme gecesi, geniş.** Yüksek fırın, dört soba, eğik besleme köprüsü; fırının ağzı içeriden turuncu; buhar. Platformda küçük işçi siluetleri (12). Soldan zırhlı araç projektörleri birer birer yanar (3 adet, 0.6 sn arayla). | 135 mm, sabit, 7 sn'de %4 yaklaşma; el titremesi çok az | Fırın 1800 K turuncu (alttan), projektör 5600 K beyaz huzme, sis içinde görünür | Fırın uğultusu (alçak gürültü 60–120 Hz), projektör "klak" × 3, uzaktan megafon (anlaşılmaz) | FLINT: *Babam o gece ocağın başındaydı.* (3.6–7.8) |
| 2 | 10.0–15.0 | **Tel örgü, yakın.** Önde flu tel örgü; arkada projektör; çamura düşmüş kırmızı el feneri (meşale) cızırdıyor; bir Vanta askerinin botları kadraja girip geçer (bacak riglenmiş yürüyüş). | 50 mm, alçak; odak tel→meşale 1.2 sn'de | Meşale 1900 K kırmızı titrek; projektör arkadan | Meşale cızırtısı, bot çamur sesi senkron (topuk vuruşunda) | FLINT: *Ocağı söndürdüler. Onu da götürdüler.* (10.4–14.6) |
| 3 | 15.0–19.0 | **Fırın söner.** Çekim 1 kadrajı; içteki ışık turuncu→koyu kırmızı→siyah; buhar kesilir. | 135 mm sabit | Fırın ışığı 1.0→0 (eğri: üstel) | Uğultu düşer, tıslama 18.2'de kesilir, sessizlikte sadece yağmur | FLINT: *Ocak bir soğudu mu, bir daha yanmaz derler.* (15.3–18.8) |
| 4 | 19.0–21.0 | Siyah. | — | — | Yağmur | *Bugün* (yazı) |
| 5 | 21.0–29.0 | **Şehir, çatıdan.** Yağmur; uzakta ölü bacalar (dumansız), sodyum sokak lambası ızgarası, kuleden dönen arama ışığı, kırmızı uçak ikaz lambası; kameranın önünden bir dron yanıp sönerek geçer (hareket bulanık). | 35 mm, el kamerası (genlik 0.6%), 8 sn'de sağa 3° pan | Sodyum 2000 K, LED pencereler 4000–6500 K, arama ışığı 6500 K | Yağmur (çatı sacı), dron vızıltısı (doppler), uzak siren | FLINT: *Ocak hâlâ soğuk. Şehir hâlâ onların.* (22.0–26.5) |
| 6 | 29.0–35.0 | **Sokak, birikintide.** Kamera bir su birikintisinin bir karış üstünde, aşağı bakar. Kadrajın üstünde gerçek sokak: karşı kaldırım, duvarın dibi, geçen botlar. Kadrajın çoğu birikinti; içinde aynı sokak ters: üç kişilik Vanta devriyesi baştan ayağa (vizörleri), duvar ve üstünde yırtık *DÜZEN · GÜVENLİK · İTAAT* afişi, üstüne sprey *KOR* ve kor işareti. Yağmur suyu halkalar. Odak su yüzeyindeki halkalardan yansımaya kayar. | 50 mm (85 mm ile hem birikinti hem afiş aynı kareye girmiyor), yerden 22 cm, aşağı 6°, sabit; odak 31.8'de 1.5 sn | Sokak lambası 2000 K soldan, afiş üstünde arıza yapan floresan 5000 K (titreme) | Bot + su sesi (adım senkron), telsiz cızırtısı | VESPER (telsiz): *Devriye geçti. Doksan saniye.* (33.0–35.0) |
| 7 | 35.0–42.0 | **Bodrum, masa.** Emaye abajurlu tek lamba sallanıyor; ışık havuzu kalemle işaretlenmiş şehir haritasının üstünde gezer. Telsiz (yeşil LED, anteni), iki kupa, şarjör, mermiler, kül tablasında yanan sigara (duman ışıkta kıvrılır). Dört kişi elleriyle: WARDEN'ın yumrukları uzak kenarda (konuşurken birini kapıya indirir), SKYE'ın avuçları masada (biri kuleye kayar), BULWARK kupasını 5.5'te alır (halka izi kalır), VESPER'in eli önde kalemle rotada. Bütün gölgeler lambayla sallanır. | 40 mm, yukarıdan 41°, 7 sn'de yavaş zoom (40→43 mm) | Lamba 2700 K tek kaynak, sallanma 0.45 Hz, 14°; ışık her karede piksel başına hesaplanır | Ampul vızıltısı, kâğıt hışırtısı, uzaktan yukarıdan geçen araç | WARDEN: *Kapıyı beş dakika tutarım. Fazlası olmaz.* (35.6–38.6) · SKYE: *Çatılar temiz. Kule bu tarafa bakmıyor.* (38.9–41.8) |
| 8 | 42.0–47.0 | **Yakın plan.** Duvara iğnelenmiş siyah-beyaz eski fotoğraf (fırın önünde işçiler); yanında çivide kırmızı atkı. Bir el kadraja girer, atkıyı alır; atkı kumaş simülasyonuyla çividen kurtulur. | 100 mm makro; elin hareketine 0.15 sn gecikmeyle takip | Ampulün sıcak ışığı sağdan, dolgu yok | Kumaş, çivi tıkırtısı | FLINT: *Ocak söner. Kor kalır.* (43.2–46.6) |
| 9 | 47.0–55.0 | **Ara sokak.** Beş kişi bir kapıdan yağmura çıkar, kameraya doğru yürür; arkalarında sodyum lamba (arka ışık → kenar ışığı), ızgaradan buhar, merdivende sıçrayan su. Vizörler hafif. | 32 mm, alçak, kamera geriye kayar (kaçar); el titremesi | Arka sodyum 2000 K güçlü, önde zayıf soğuk dolgu 7000 K | Kapı gıcırtısı, beş farklı adım sesi, yağmur | VESPER: *Operatör, kanal senin.* (51.5–54.5) |
| 10 | 55.0–62.0 | **Başlık.** Siyah → kül yığını makro, korlar nefes alır gibi parlar, kıvılcımlar yükselir; *KOR* yazısı korun ışığından belirir; altında slogan. Siyaha kararır. | Makro, çok yavaş yaklaşma | Kor 1500–1900 K | Derin vuruş (sub), kor çıtırtısı, yağmur kesilir | (yazı) *Kül olmadı. Kor kaldı.* |

Toplam: 62 sn. "Geç" düğmesi 1. saniyeden sonra görünür.

### 2.2 Kurgu kuralları
- Çekimler arası **düz kesme**; sadece 3→4 ve 9→10 siyaha geçiş (0.4 sn).
- Ses kesmeden 2 kare (≈0.08 sn) önce gelir (J-cut), sinematik his.
- Geri dönüş (çekim 0–3): daha sıcak, daha çok gren (0.11 → bugün 0.07),
  daha kontrastsız siyahlar.

---

## 3. Açılış (her başlatmada, ~18 sn + yükleme)

Eski kömür başlığının yerine, ışın izlemeli beş plaka üstünde canlı katmanlarla
bir açılış. Plakalar seri sahnelerinden, açılış kameralarından pişirilir
(`node tools/lab/series/render.mjs --plates`, kameralar `js/cine/plates.js`,
sahneler `tools/lab/series/opening.js`); hareket eden her şey canlı çizilir
(`js/cine/opening.js`). Çekimler arası 0.32 sn siyaha iniş.

| Zaman | Çekim | Canlı |
|---|---|---|
| 0.0–0.8 | Siyah | — |
| 0.8–4.4 | Soğuk yüksek fırın, gece | yağmur; mühürlü kapının üstündeki lamba titrer; lens yavaşça yaklaşır |
| 4.4–8.0 | Şehir, çatıdan | kulenin arama ışığı çatıların üstünde döner (yumuşak huzme), ikaz lambaları saniyede bir yanar; yağmur; yavaş pan |
| 8.0–11.2 | Üstüne KOR yazılmış afiş | floresan arıza yapar: lambası yanan ve sönük iki plaka arasında titreme; yağmur, su halkaları |
| 11.2–14.4 | Ara sokak | ızgaradan buhar yükselir; yağmur |
| 14.4– | Korlar, yakın | korlar nefes alır (sıcak ve soğumuş iki plaka arasında yavaş geçiş), kıl inceliğinde kıvılcımlar; 15.2 KOR, 16.2 slogan |

En erken devir 17.6 sn; yükleme bitmediyse korlar nefes almaya devam eder.
Dokunma 0.45 sn'den sonra sona atlar. Hareket azaltma açıksa yalnız korlar.
Arayüz aynı (`run`, `setProgress`, `assetsDone`, `onHandoff`,
`__introManual` / `__intro.seek`). Geliştirici sayfası: `dev/opening.html?t=`.

## 4. Görev hikâye sahneleri

Her biri tek bir gerçekçi çekim üzerine telsiz konuşması; 14–20 sn;
görev ilk kez başlatılırken oynar, kampanyada "Sahne" düğmesiyle tekrar izlenir.

| Sahne | Çekim | Satırlar |
|---|---|---|
| `m1` öncesi | Gece kapı: bariyer, kulübe ışığı, konteyner yığını, yağmur | VESPER: *Kulübede iki nöbetçi. Kamera yok, sadece göz.* · WARDEN: *Terminal avluda. Ben açarım, siz tutun.* · FLINT: *Girelim.* |
| `m2` öncesi | Şafak, pazar: kepenkler yarı açık, HAWK tabelası yarım yanıyor, ıslak tezgâh örtüsü | VESPER: *Vanta bu sabah HAWK'ın tezgâhını basacak.* · SKYE: *HAWK giderse mermi de gider, ekmek de.* · HAWK (telefon): *Her şeyin bir fiyatı var, evlat. Bugün benimki sizsiniz.* |
| `m3` öncesi | Valilik cephesi: Vanta bayrakları, sütunlar, ıslak merdiven, pencerede tek yanan oda | VESPER: *Gall bu gece valilikte. Sözleşmenin aslı onda.* · SKYE: *Salonda üç kat koruma. Gall kaçmaz, bekler.* · FLINT: *Bekletmeyelim.* |
| Perde 1 sonu (`m3` bitince) | Masa lambası altında belge: başlıkta **KÜL PLANI**; yanında titreşen telefon, ekranda arayan: HAWK | VESPER: *Satmışlar. Ocağı, limanı, hepsini.* · BULWARK: *Satamazlar. Daha bizim.* · (telefon titrer, kimse açmaz) · yazı: *Perde 1 sonu* |

---

## 5. Teknik rig

### 5.1 Dosyalar
| Dosya | İş |
|---|---|
| `cine/noise.js` | Tohumlu rastgele, değer gürültüsü, fbm; önceden pişmiş dokular (gren karesi ×8, bulut/sis, kir/leke) |
| `cine/cam.js` | Perspektif kamera: konum, yön, odak uzaklığı (mm→piksel), el titremesi (3 oktav gürültü), odak kayması |
| `cine/fx.js` | Yağmur (3 derinlik), sıçrama, buhar, kıvılcım, hacimsel huzme, ıslak zemin yansıması |
| `cine/post.js` | Renk düzenleme, halation, gren, vinyet, sinema bandı, kapı titremesi (gate weave), pozlama titremesi, geçişler |
| `cine/audio.js` | Ses: ambiyans katmanları ve zamanlı olaylar (WebAudio, dosyasız) |
| `cine/player.js` | Oynatıcı: tuval, döngü, altyazı (DOM), geç düğmesi, bitiş |
| `cine/shots.js` | Çekimlerin çizimleri (önsöz + görev sahneleri) |
| `cine/scenes.js` | Sahne tanımları: çekim sırası, süreler, altyazı ve ses ipuçları |
| `ui/intro.js` | Başlık animasyonu (yeni), eski arayüzle |

### 5.2–5.5 İnsan iskeleti, yürüyüş, duruş, siluet çizimi
Kaldırıldı (bkz. 2.4): sinematiklerde insan gösterilmez.

### 5.6 Kumaş (FLINT'in atkısı, bayraklar)
Verlet zinciri: 9 düğüm, 2.6 cm; yerçekimi 9.8, rüzgâr gürültü 0.4–1.2 m/s²,
3 kısıt yinelemesi; bir uç boyna/çiviye bağlı.

### 5.7 Kamera
- Perspektif: odak uzaklığı mm → piksel: `f = (mm / 36) * genişlik`.
- El titremesi: konum 3 oktav değer gürültüsü (0.7, 1.9, 4.3 Hz), genlik
  çekim başına; dönme ±0.25°.
- Operatör gecikmesi: hedef takipte 0.12–0.2 sn kritik sönümlü yay.
- Odak: alan derinliği bulanıklığı katman başına (`filter: blur`), odak
  kaydırma `smoothstep`.

### 5.8 Işık
- Kelvin → RGB tablosu (1500, 1800, 2000, 2700, 4000, 5000, 5600, 6500, 7000 K).
- Nokta ışık: yumuşak düşüş `1 / (1 + (d/r)²)`; yüzeyler için kırpılmış
  radyal degrade.
- Hacimsel huzme: koni çokgeni, ekleyerek çizilir, sis dokusuyla modüle.
- Titreme: floresan (rastgele 40–120 ms sönme), ampul (sallanma + %3 titreme),
  ateş (2 oktav gürültü 3–9 Hz).

### 5.9 Yağmur
- 3 katman: uzak (ince, soluk, 900 damla), orta (350), yakın (40, bulanık
  geniş çizgi). Düşüş 7–9 m/sn, rüzgârla 6–10° eğik.
- Çizgi uzunluğu = hız × pozlama (1/48 sn) → gerçek hareket bulanıklığı.
- Sıçrama: zemin düzleminde, %30 damla; birikintide halka (0.35 sn).
- Islak zemin: ışık kaynaklarının dikey uzatılmış, dalgalanan yansıması.

### 5.10 Post-process (sırasıyla)
1. Halation: parlak bölgeler ¼ çözünürlükte bulanık, sıcak tonla `screen`.
2. Renk: gölge hafif camgöbeği (+), ışıklar sıcak; siyahlar hafif kaldırılmış
   (flashback'te daha çok).
3. Vinyet: oval, köşelerde %35.
4. Gren: 8 kare önceden pişmiş, 24 Hz değişir, `overlay`, yoğunluk çekime göre.
5. Kapı titremesi: 0.3 px, 24 Hz. Pozlama titremesi ±%1.5.
6. Sinema bandı: 2.39:1.

### 5.11 Ses (WebAudio, dosyasız)
- Ambiyans katmanları: yağmur (sac/asfalt/birikinti filtreleriyle 3 ayrı
  gürültü), fırın uğultusu, şehir uğultusu, ampul vızıltısı.
- Olaylar: projektör "klak", siren (doppler + yankı), dron, ayak sesleri
  (rig'den), telsiz cızırtısı (konuşma satırı başında/sonunda), kumaş, kapı,
  başlık vuruşu (sub + kor çıtırtısı).
- Yankı: üretilmiş dürtü yanıtı (2.4 sn, sokak); bodrumda kısa (0.6 sn).
- Seviye: master ses ayarını izler; lobi müziği sinematik boyunca susar.

### 5.12 Oynatma ve kayıt
- İlk açılış: yasal onay → önsöz → lobi. Daha önce onaylamış oyuncu: başlık
  animasyonu → (önsöz hiç izlenmemişse "Başlamak için dokun" + önsöz) → lobi.
- `save.story = { prologue, seen: { m1, m2, m3, act1 } }`.
- Kampanya ekranında görev detayına "Sahne" düğmesi; ayarlarda "Önsözü izle".
- Hareket azaltma açıkken: kamera titremesi, gate weave ve gren kapalı.

---

### 2.3 Uygulamada değişenler (yapım sırasında)
- Çekim 6 ve 7 yukarıdaki gibi yeniden kurgulandı; diğer çekimler tabloya uyar.
- Islak zemin (`surf.js`): piksel başına ışık, Fresnel, su birikintisi aynası, bir kerede pişirilir (lamba titremesi ayrı katman).
- Odak dışı ışıklar diyafram diski (`bokeh`), yumuşak leke değil.
- Şehir (`city.js`): dar apartmanlardan iç avlulu adalar, karışık ışık sıcaklığında pencereler, sodyum + LED sokaklar.
- Yürüyüşte ayak topuktan basar, parmak ucuyla iter (test: parmak ≤ 4 mm kayar).
- Görev sahneleri (`m1`–`m3`) artık "plaka" üzerinde: binalar, zemin, lambalar
  önceden ışın izlenir (`tools/lab/plate/`: kutu/silindir/küre/dışbükey gövde,
  gölge ışınları, ortam perdelemesi, ıslak zeminde Fresnel yansıması ve
  GGX parıltısı, sisteki ışık hüzmeleri eşit-açılı örneklemeyle, ACES), 2×
  süper örneklemeyle, WebP olarak `public/lab/assets/plates/`'e yazılır
  (`node tools/lab/plate/bake.mjs governor`). Sahne kamerası plakanınkiyle
  aynı yerde durur (`js/cine/plates.js`), el titremesi ve yavaş zum plakayı
  kaydırıp büyütür; yağmur, tabela neonları, TV ışığı, buhar canlı çizilir.
  Telefonda pişirme yok, yalnız resim yüklenir.
- `m2` pazar: göz hizası yerine karşı binanın birinci katından (VESPER'in
  gözetlediği pencere) aşağı bakan çekim; tenteler, kasalar, sisli sokak.
- `m1` kapı: kamera aynı yerde kalır, ileri kayma yerine yavaş zum.

### 2.4 Karakterler kaldırıldı
Çizilen insanlar (2B iskelet, siluetler, eller, ışın izlenmiş deneme
figürleri) gerçekçi durmadı; hiçbir sinematikte insan gösterilmez. Hikâye
yerlerle, ışıkla ve bırakılmış eşyalarla anlatılır; sesler (telsiz,
altyazı) kişileri taşır:
- Çekim 1–3 (fırın): platformda işçi yok; fırının ışığı ve projektörler.
- Çekim 2 (tel örgü): asker botları yok; odak tele, sonra çamurda yanan meşaleye.
- Çekim 6 (birikinti): devriye geçmiş; birikintide duvar, afiş, KOR yazısı.
- Çekim 7 (masa): el yok; harita, telsiz, kupalar, rotanın üstüne bırakılmış
  kalem, kül tablasında yanan sigara, sallanan lamba.
- Çekim 8 (atkı): el görünmez; atkı kadraj dışından yukarı çekilir, çividen
  kurtulup çıkar; çivi ve fotoğraf kalır.
- Çekim 9 (ara sokak): kapı açılır, odanın ışığı ıslak zemine düşer, ekip
  çoktan çıkmıştır; VESPER kanalı devrederken içerideki ışık söner.
- `m1`: nöbetçiler kulübede (TV ışığı, ısıtıcının buharı); satır: *Kulübede
  iki nöbetçi. Kamera yok, sadece göz.*
- `m2`: tezgâhta demlenen çaydanlığın buharı.
- `m3`: Gall'ın penceresi yanar, kendisi görünmez.

## 6. "Yapay zekâ gibi durmasın" kuralları
1. Neon her yerde değil: sadece gerçekten tabela olan yerde. Kadrajın çoğu
   gölgede; tek baskın ışık + zayıf dolgu.
2. Sodyum (turuncu) ve LED (beyaz) karışık; doygun pembe-camgöbeği degrade yok.
3. Asimetri ve dağınıklık: kablolar, pas izleri, eşleşmeyen pencereler,
   perdeli tek pencere, yırtık afiş, ıslak karton.
4. Kusur: lens kiri, gren, kapı titremesi, kenarlarda hafif renk kayması,
   pozlama titremesi.
5. Hareket ağırlıklı: kayan ayak yok, sekme yok; kamera aksiyonu biraz geriden
   izler.
6. Yazı: fütüristik font yok, parlama yok, "glitch" yok; altyazı Inter, konuşan
   küçük harf aralıklı.
7. İnsan yok: kişiler sesleriyle, bıraktıkları eşyayla ve ışıkla anlatılır.
8. Metin: somut, kısa, deyimli Türkçe; rakam ve ayrıntı.

## 7. Kabul ölçütleri
- 844×390 ve 2400×1080'de her çekimden 2 kare; hiçbirinde taşma yok.
- Önsöz baştan sona hatasız; geç düğmesi çalışır; ikinci açılışta tekrar oynamaz.
- Başlık animasyonu yükleme bitene kadar bekler, bitince lobiye devreder.
- Plaka ışınları sahne kamerasının yansıttığı yere düşer (test, ≤ 1e-6 px).
- i18n testleri geçer; tüm altyazılar TR/EN.
- Telefonda (orta sınıf) ≥ 30 fps hedefi: iç çözünürlük düşer, katmanlar
  önceden pişer.

## 8. Seri: otuz kare

Hikâyenin otuz durağan karesi, sırasıyla; hiçbirinde insan yok. Önsöz (01–03),
bugün (04–11), Perde 1 (12–21), Perde 2 (22–26), Perde 3 (27–29), başlık (30).
Her kare 2.39:1, 1920 × 803, 2×2 süper örnekleme.

- Çekim listesi: `tools/lab/series/shots.js` (kamera: konum, bakılan nokta,
  mm; sahne; kullandığı resimler; üstüne çizilen yağmur/buhar/kıvılcım; film).
- Sahneler: `tools/lab/series/scenes/` (çelikhane, liman, şehir ve kule,
  odalar, diğer yerler); kapı, pazar ve valilik plaka sahnelerinden gelir.
- Yüzeydeki resimler (afiş, harita, Kül Planı, defter, dosya sırtları, tabela,
  tel örgü): `tools/lab/series/textures.js`, tarayıcıda çizilir.
- Çalıştırma: `node tools/lab/series/render.mjs 01 02 … [--quick] [--w 1920] [--ss 2]`.
  Hızlı bakış ~7 sn, tam kalite ~70 sn/kare (4 çekirdek).
- Test: `node tools/lab/series.test.mjs` (otuz çekim kurulur, her şeyin
  malzemesi ve resmi var, kameralar makul).

İzleyiciye eklenenler: projektör huzmesi artık yalnız koninin içinde kalan ışın
parçasında örneklenir (ince bir huzme uzaktan noktalı görünmüyor; test kaba
kuvvet integralle karşılaştırır); dolaylı ışıkta tek örneğin parlaklığı kırpılır
(lambanın dibine düşen ışın benek yapmıyor); resimler eni ve boyu ayrı tekrar
edebilir; kâğıt ters yatırılabilir (`turn`); badanalı tuğla, örgü yün ve kor
malzemeleri. Post-process'te halation katmanı kenarda turuncu çerçeve
bırakıyordu (bulanıklık kenardan taşınca saydam kısmı renklendiriliyordu);
düzeltildi, sinematiklerde de geçerli.

## 9. Karakter tasarımı (sıfırdan, hikâyeye göre)

Bu bölüm çizimden önce yazıldı; kodlar (`public/lab/js/art/ops/*.js`,
`art/enemies/syndicate.js`, HAWK portresi) birebir buna uyar.

### 9.1 Ortak kurallar
- **Kostüm yok, iş elbisesi var.** Beşi de eski işinin giysisini giyer:
  tamir edilmiş, üstüne toplama koruma eklenmiş. Malzemeler gerçek: mumlu
  kanvas, deri, yün, yansıtıcı bant, solmuş güvenlik turuncusu, konteyner
  sacı. Neon, uzay giysisi, mor cüppe, robot zırhı yok.
- **Renkler soluk ve kirli.** Her birinin tek imza rengi geçmişinden gelir
  (FLINT'in atkısı, WARDEN'in kaskı, VESPER'in sinyal ışığı, SKYE'ın gözlüğü,
  BULWARK'ın turuncusu); gerisi is, pas, kömür, lacivert.
- **Takım işareti:** sol üst kolda aynı yerde, aynı boyda kor bandı: koyu
  kumaş üstünde turuncu bir kor lekesi. Vanta'dan ayıran ortak öğe.
- **Yüzler kapalı, ama işten gelen bir şeyle:** kaynak gözlüğü ve atkı,
  itfaiye kaskının vizörü, kulaklık ve boyunluk, kurye kaskı ve bandana,
  baret ve gaz maskesi. Lens ışıkları (portre ve intro) bu camlardan.
- **Vanta tek tip ve temizdir:** mavi-gri polimer zırh, lacivert üniforma,
  beyaz halka-şerit arması, kırmızı vizör yarığı. Takımın yamalı, eskimiş
  görünüşünün tersi: yeni, aynı, tekrarlanan.

### 9.2 Operatörler
| | Kim | Silüet | Baş | Gövde | Kollar / bacaklar | Renkler |
|---|---|---|---|---|---|---|
| **FLINT** (saldırı) | 29, üçüncü kuşak ocakçı | yuvarlak kaynak gözlüğü, örgü bere, uçuşan uzun kırmızı atkı, kalın deri ceket | siyah örgü bere; deri çerçeveli yuvarlak yeşil kaynak gözlüğü; babasının atkısı burnun üstüne çekili | yanık kahve deri ocakçı ceketi (yamalı, kıvılcım lekeli); önünde ocak çeliğinden kesilmiş paslı plaka, "3" şablonu, iki deri kayış | uzun deri kaynak eldiveni; is grisi kanvas pantolon, dizde deri yama; çelik burunlu ocakçı botu | is siyahı, yanık kahve, kül grisi, pas; **sendika kırmızısı** atkı |
| **WARDEN** (savunma) | 41, kapatılan itfaiyenin son ekip amiri | yuvarlak itfaiye kaskı, inik altın vizör, dizüstü itfaiye ceketi, sırtta halligan | **beyaz amir kaskı** (isli, siyah şerit), altın vizör, gri yanmaz başlık | kömür grisi itfaiye ceketi, göğüste ve etekte sarı-gümüş-sarı yansıtıcı bant, göğüs cebinde telsiz | sarı-kahve itfaiye eldiveni; aynı kumaştan pantolon, dizde bant; siyah itfaiye çizmesi | kömür, kum, yansıtıcı gümüş/sarı; **kask beyazı** |
| **VESPER** (kontrol) | 33, eski Vanta sinyal analisti | uzun ince; diz altı lacivert kaban; sırtta telsiz çantası ve tek esnek anten | topuzlu koyu saç; burnun üstüne boyunluk; tek kulaklık ve mikrofon; sağ gözde eski Vanta monoklü, ışığı **camgöbeğine** çevrilmiş | lacivert yün kaban, yaka kalkık; altında Vanta gri-mavi kazak, göğsünde **sökülmüş armanın izi** | sol önkolda bileğe bağlı küçük terminal; dar koyu pantolon, uzun bağcıklı bot | lacivert-siyah, Vanta gri-mavisi (sökülmüş), kemik rengi kulaklık; **camgöbeği** |
| **SKYE** (keşif) | 22, eski kurye; dron yapar | kısa, hafif; bisiklet kaskı, bol rüzgârlık, çapraz postacı çantası, dizlik; yanında hurda dron | çıkartmalı mat siyah bisiklet kaskı; aynalı **gök mavisi** spor gözlük; desenli bandana | soluk hardal rüzgârlık (sırtta yansıtıcı şerit), altında koyu sweatshirt; yamalı kanvas postacı çantası | sıvanmış kollar, parmaksız bisiklet eldiveni; siyah tayt üstüne kısa kargo şort, siyah dizlik, yıpranmış koşu ayakkabısı | hardal, kömür, krem; **gök mavisi** |
| **BULWARK** (ağır) | 47, liman vinç operatörü | en iri; baret, iki filtreli yarım maske, kalın turuncu iş ceketi, konteyner sacından göğüs ve omuz plakaları | soluk sarı baret, kafa lambası; koyu güvenlik gözlüğü; iki **magenta filtreli** yarım yüz maske | soluk **güvenlik turuncusu** iş ceketi, iki yansıtıcı bant, yağ lekeleri; üstünde konteyner kapısından kesilmiş oluklu mavi plaka, beyaz şablon kod | omuzlarda oluklu sac; kalın deri iş eldiveni; lacivert iş tulumu, dizde yansıtıcı; büyük çelik burunlu bot | güvenlik turuncusu, konteyner mavisi, gri; magenta filtre |

Arayüz renkleri (yetenek HUD'u, listeler) imza renginden: FLINT `#d9533a`,
WARDEN `#e6c25c`, VESPER `#4fd2c4`, SKYE `#7ec8ff`, BULWARK `#e2782f`.

### 9.3 Vanta
| | Ne | Ayırt edici |
|---|---|---|
| **TETİKÇİ** | standart asker | tam yüz kask, tek ince kırmızı vizör yarığı; mavi-gri göğüs/omuz/diz plakaları; lacivert üniforma; sol omuzda beyaz arma; temiz |
| **KALKANLI** | kalkanlı asker | daha ağır plakalar (kollar dahil); duman renkli polikarbon çevik kuvvet kalkanı, üstünde beyaz VANTA ve arma, gözetleme penceresi |
| **HÜCUMCU** | yakın dövüş | hafif zırh; gaz maskeli kask, iki yuvarlak kırmızı lens ve tek filtre; kırmızı birlik kol bandı; pompalı |
| **GALL** | Sekreter, perde 1 sonu | asker değil bürokrat: diz altı kruvaze lacivert-siyah resmî palto, kemerli; altında ince zırh yeleği; siperli subay şapkası (kırmızı şerit, gümüş arma); deri eldiven; yüz açık: 50'ler, kısa kır saç, sinekkaydı tıraş, ince dudak, soğuk gri gözler |

### 9.4 HAWK
Tüccar ekranında baş-omuz portresi: 60'lar, düz kasket, kır kısa sakal, yorgun
gözler, kalın yün palto, boynunda eski yün atkı, dudağında sigara; tezgâh
lambasının sıcak ışığı.

## 10. Görsel dil v3: karakter, engel, arayüz (sıfırdan)

Önceki karakterler kalın siyah konturlu, düz üç tonlu çizgi film gibiydi;
arayüz herhangi bir taktik nişancı oyunundan alınmış gibi duruyordu; engeller
neon ışıklı, hikâyeyle bağsız bariyerlerdi. Bu bölüm üçünü hikâyeden yeniden
kurar; kodlar buna uyar.

### 10.1 Karakterler: boyanmış, gerçek oranlı
- **Oran:** baş boyun ~1/7,5'i; omuz ~2 baş; kollar ve bacaklar ince ve
  gerçek (üst kol baş genişliğinin ~yarısı); eller ve botlar abartısız.
- **Boyama:** düz bantlar yerine yumuşak gölge geçişi (ışık sağ üstten),
  kenarlarda ortam gölgesi (AO), malzemeye göre doku (deri gren, kanvas
  örgü, yün tüy, örgü, kauçuk, çelik fırça izi), deri/kauçuk/metalde parlama
  çizgisi, kenarlarda aşınma, etek ve botlarda kir; ince, sıcak koyu kontur
  (siyah değil). Her karakterde en az 30 ayrı parça/ayrıntı.
- **Kim ne giyer:** §9.2 aynen; ayrıntı eklenir (dikiş, perçin, yama, etiket,
  tamir izi, kayış tokası, cep kapağı, kablo).

### 10.2 Engeller: üç taraf, üç malzeme
- **Vanta (temiz, tekrarlanan):** gri-mavi polimer jersey bariyer, beyaz
  halka-şerit arması, kırmızı LED şerit, sıra numarası; kontrol noktası çelik
  kapısı; kalkan gibi düzgün, yeni.
- **Kor direnişi (elden yapılma):** ocak sacından kaynaklı barikat (kaynak
  dikişi, pas, turuncu sprey kor işareti), eski un çuvallarından kum
  torbaları, palet + konteyner sacı, tel ve zincir; hepsi tamirli.
- **Şehir (eskimiş):** paslı çöp konteyneri, sebze kasaları, varil (içinde kor
  ateşi), soluk trafik konisi. Neon yok; ışık sokak lambası ve ateşten gelir.

### 10.3 Arayüz: "Kor Hattı'nın duvarı"
Menüler direnişin sığınağındaki duvar ve tezgâhtır; Vanta'nın soğuk
mavi-grisi yalnızca Vanta'ya ait şeylerde görünür.
- **Malzemeler:** is siyahı zemin (beton/sıva dokusu), kraft kâğıt, maskeleme
  bandı, boyalı sac plaka, tebeşir beyazı yazı, kor turuncusu (tek vurgu),
  sendika kırmızısı damga.
- **Yazı:** başlıklar Big Shoulders Stencil (çelikhane şablon harfi), etiket
  ve düğmeler Barlow Condensed, metin Barlow, dosya/brifing/alıntılar
  Special Elite (daktilo). Hepsi OFL, uygulamanın içinde.
- **Bileşenler:** turuncu boyalı sac düğme (köşesi kesik, kenarı aşınmış,
  basınca içe göçer); perçinli sac panel; bantlı kâğıt kart; mürekkep damga;
  klasör sırtı sekmeler; şablon rakamlı sayaçlar; "parça" para birimi (somun).
- **Ekranlar:** Lobi = sığınak (operatör, "GÖREVE ÇIK" levhası, duvardaki
  notlar); Kampanya = duvardaki şehir haritası (kâğıt, kırmızı ip, raptiye,
  görev fotoğrafları); Operatörler = kişi dosyaları (ataşlı fotoğraf, rol
  damgası, daktilo özgeçmiş); Cephanelik = delikli pano ve tezgâh; Sandıklar =
  el konmuş Vanta sandıkları; Tüccar = HAWK'ın tezgâhı ve portresi; Profil =
  sendika üye kartı; Görevler = panoya iğnelenmiş iş emirleri; Ayarlar = sade
  sac panel; HUD = şablon rakamlar, kor turuncusu, ince ve okunur.

### 10.4 Şehir: binalar, tabelalar, ışık
Önceki sokak her kapıda başka renkte neon yanan bir gece caddesiydi (pembe
BAR, yeşil BAKKAL, camgöbeği OTEL ve "12", mavi OTO SERVİS, HAWK'ın kırmızı
neonu). Hikâyedeki şehir bu değil: ocak dört yıldır soğuk, elektriği Vanta
tutuyor ve karneyle veriyor. Şehir, ışığın kimde olduğundan yeniden kurulur.

- **Halkın ışığı:** jeneratörden çıplak ampul (2700 K, hafif dalgalanır,
  arada bir düşer), perde arkasında gaz lambası, varil ateşi, eski sodyum
  sokak lambası. Pencerelerin çoğu karanlık; yananlar perdeli ve loş.
- **Vanta'nın ışığı:** beyaz LED projektör, kırmızı LED şerit, beyaz ışıklı
  kutu tabela (halka-şerit arması), kırmızı noktalı LED pano: *SOKAĞA ÇIKMA
  YASAĞI 22:00–06:00*. Temiz, yeni, sabit; titremez. Şehirde temiz olan tek
  şey Vanta'nınkidir.
- **Neon:** eski düzenden kalma; çoğu ölü (gri cam tüp, kırık harf). Şehirde
  tek bir yarım yanan neon var: otelin, iki harfi yanar, arada söner.
  HAWK'ın tabelası neon değildir.
- **Tabelalar:** boyalı sac ve tahta; fırça yazısı ya da şablon harf; solmuş
  boya, pas akıntısı, cıvata, eğik asılmış. Geceleri tabelayı kuğu boyunlu
  lamba aydınlatır. Esnafın dili Türkçe ve sade: BAKKAL, BERBER, OTO TAMİR,
  ÇAY OCAĞI, OTEL, SENDİKA. Vanta'nınki tek tip ve basılı: VANTA SYNDICATE ·
  DÜZEN · GÜVENLİK · İTAAT.
- **Binalar:**
  - *İşçi lojmanı:* isli tuğla, yangın merdiveni, pencereden çıkan soba
    boruları ve üstlerindeki kurum, çamaşır ipi, saksı; altta kapalı berber
    (boyalı sac direk tabela).
  - *Sıvalı apartman:* dökük sıvanın altından tuğla; köşede bakkal, camında
    elle yazılmış *EKMEK YOK*, rafların yarısı boş.
  - *Çelikhane deposu:* paslı oluklu sac, soluk şablon *ÇELİK İŞLETMELERİ ·
    DEPO 12*, üstünde Vanta'nın *EL KONULMUŞTUR* levhası; kapıda zincir ve
    mühür; Vanta'nın taktığı beyaz projektör.
  - *Vanta karakolu:* eski binaya vidalanmış yeni gri kompozit panel,
    pankart, ışıklı kutu, LED pano, kamera, jiletli tel, sıra sıra aynı afiş.
  - *Otel:* eski görkemden kalan korniş ve balkonlar, ölü dikey neon, kapı
    üstünde tek ampul, kartonda *ODA VAR*.
  - *Oto tamir:* boyalı sac *OTO TAMİR*, duvarda *LASTİK*, içeride beyaz
    floresan iş lambası, liftte araç.
  - *Sendika binası (yeni):* alınlıktaki kabartma *OCAK İŞÇİLERİ SENDİKASI*
    yazısının üstü gri boyayla kapatılmış, harfler gölgeden okunur; kapıda
    zincir ve Vanta mührü (*MÜHÜRLENMİŞTİR*); kapının önünde mumlar ve
    Söndürme gecesi kaybolanların fotoğraflı *KAYIP* ilanları; duvarda sprey:
    *6 KİŞİ NEREDE?*
  - *Çay ocağı (yeni):* buğulu camın arkasında tek ampul, boyalı tabela,
    tebeşirle *ÇAY 5*, soba borusundan duman.
  - *Yanık bina:* is lekeli boşluklar, içeride ısınmak için yakılmış ateş;
    duvarda ocakçıların sözü: *OCAK SÖNER KOR KALIR*.
  - *Ara sokak:* kafesli tek ampul, yan kapı, tel örgü, kablolar.
- **HAWK'ın dükkânı (`crow`):** yarım açık kepenk; içeride ampul ışığında
  un çuvalları, bidonlar, kasa, cephane kutusu, radyo. Elle boyanmış tahta
  tabela *HAWK · ALIM SATIM*, köşesinde şahin silueti; iki kuğu boyunlu
  lamba tabelayı aydınlatır. Yamalı branda tente, altında kabloya dizili
  çıplak ampuller; kablo yan taraftaki jeneratöre ve bidonlara iner.
  Duvarda kara tahta: *BUGÜN · UN · YAĞ · PİL · İLAÇ · MERMİ: SOR*; kepenkte
  boyayla *NE VARSA ALINIR*; yanında yarısı yırtılmış Vanta tebliği *KAYITSIZ
  TİCARET YASAKTIR*. Üst katta tek sıcak, perdeli pencere: HAWK orada
  yaşar. Çatıda tahta güvercinlik. Görev 2'deki pazar tezgâhında aynı tahta
  tabela, aynı ampuller.
- **Duvar yazıları ve kâğıtlar:** Vanta afişleri; üstlerine kor işareti ve
  *KOR* spreyi; *KAYIP* ilanları; sendika bildirisinin yırtık kalıntısı.
- **Renk ve doku:** is siyahı, pas, tuğla, kirli sıva; tuğla, beton, sac,
  tahta ve boya dokusu bina ölçeğinde. Sıcak ışık yalnız ampul ve ateşten,
  soğuk ışık yalnız Vanta'dan. Doygun pembe, camgöbeği, mor yok.
- **Ufuk:** soğuk yüksek fırın (dört soba, eğik besleme köprüsü, dumansız
  baca), liman vinçleri ve kule; ufuktaki aydınlık yangın değil, limandaki
  Vanta projektörleri ve alçak bulutlara vuran sodyum. Duman yalnız evlerin
  sobalarından çıkar.
- **Pazar (görev 2):** tezgâh tenteleri solmuş branda (kiremit, hardal,
  zeytin); teknoloji tezgâhı radyo ve pil tamircisi; ampuller jeneratörden.

### 10.5 Sokaklar ve yerler
Önceki sokak her görevde aynı, kimliksiz bir gece yoluydu: düz koyu asfalt,
ince bir bordür, beyaz ışıklı modern lambalar; kapı iki sarı-siyah direkti,
valilik rastgele binaların önünde gri sütunlardı. Bu bölüm sokağı ve üç yeri
hikâyeden kurar.

- **Sokak (her görev):**
  - *Kaldırım:* kilitli parke taşı, gri ve yer yer kırmızı; çökmüş, eksik
    taşlar, derzlerde ot.
  - *Bordür:* granit; bir zamanlar belediyenin çektiği beyaz boyanın izi.
  - *Yol:* yama yama asfalt, katran derzleri, çatlaklar, zırhlı araç izleri;
    çelikhanenin eski sanayi hattı yol boyunca asfalta gömülü, raylar ışığı
    yakalar; belediyenin döküm rögar kapakları, ızgaralı yağmur giderleri;
    birikintilerde sodyum ışığı; drondan atılmış Vanta bildirileri.
  - *Lambalar:* eski çelik direk, kuğu boyunlu kol, turuncu sodyum ışık;
    her direğe Vanta'nın hoparlörü bağlanmış (sokağa çıkma anonsları), kablo
    bantla direğe sarılmış, gövdede yasak tebliği.
- **Kapı (görev 1 · Sızma):** şehre girilen yer, Vanta'nın kontrol noktası.
  - Yaklaşma: belediyenin eski mavi *HOŞ GELDİNİZ* levhası; şehrin adının
    üstüne Vanta'nın *KONTROLLÜ BÖLGE* etiketi yapıştırılmış.
  - Çelikhanenin buhar boru köprüsü yolu alçaktan keser (altından kayılır):
    yalıtım sargılı iki boru, kafes ayaklar, *DİKKAT · ALÇAK GEÇİT*.
  - Çökmüş yol: kırık asfalt kenarı, toprak, açıkta kalmış eski kanal borusu.
  - Kontrol kulübesi Vanta grisi; yolda *KONTROL NOKTASI · YAVAŞLA* levhası.
  - Kapının kendisi: çelik portal, üstünde beyaz ışıklı *KONTROL NOKTASI ·
    DUR · KİMLİK HAZIRLAYIN* levhası, iki projektör, kamera, kırmızı LED;
    iki yanında T-duvarlar ve jiletli tel.
- **Pazar (görev 2 · HAWK'ın Tezgâhı):** §10.4'teki tezgâhlar; sokağı kesen
  Vanta T-duvarı ve tel.
- **Valilik (görev 3 · Sekreter Gall):** şehrin eski valilik binası, şimdi
  Vanta'nın sekreterliği. Şehirde temiz tutulan tek yer.
  - Bina: kesme taş, kemerli yüksek pencereler, kalın silmeler; ortada
    alınlıkta kabartma *VALİLİK*; geniş merdiven.
  - Vanta'nın eklediği: dev kırmızı pankartlar, kırmızı LED, kameralar,
    projektörler, beyaz ışıklı *VANTA SYNDICATE · SEKRETERLİK* levhası;
    kapıda tebliğ panosu: *MECLİS ASKIYA ALINMIŞTIR*, *SOKAĞA ÇIKMA YASAĞI*.
  - Meydan: revak sütunları sıcak kesme taş, budanmış çalılar, bayrak
    direkleri.

### 10.6 Pazar (görev 2 · HAWK'ın Tezgâhı)
Pazar şehrin kendi ekonomisidir: Vanta karneyle dağıtır, halk takasla ve
HAWK'ın getirdiğiyle yaşar. HAWK'ın tezgâhı şehre giren tek erzak hattıdır;
onu korumak görevin kendisidir.

- **Kural:** pazar kaldırımda, dükkânların önünde kurulur; yolu kesen tezgâh
  yoktur (sokağın ortasına çıkan tezgâhlar daha önce kaldırıldı). Oyun alanında
  tek tezgâh HAWK'ınkidir.
- **Dükkânlar ve önleri:**
  - *Manav:* çizgili soluk branda, kasalarda soğan, patates, lahana; boş
    kasalar; kartona keçeli kalemle fiyat (*SOĞAN 30*, *PATATES 35*, *ELMA
    YOK*); brandadan sarkan kantar.
  - *Eskici:* sehpada eski radyolar, çaydanlık, bir çift ayakkabı, akü,
    piller, kablo; *PİL VAR*, *TAMİR*.
  - *Fırın:* boş ekmek rafları, camda *KİŞİ BAŞI 1 EKMEK*, önünde sıra ipi.
  - *Battaniye ve palto:* askıda kışlıklar, katlanmış battaniyeler.
  - *Hal:* şehrin eski sebze-meyve hali; büyük kemerli kapısı Vanta
    mühürüyle kapalı (*KAPATILMIŞTIR*), alınlıkta soluk *SEBZE · MEYVE
    HALİ*. Kapısının önünde çuvallarla bakliyat (*MERCİMEK*, *BULGUR*,
    *NOHUT*) ve teneke yağ satılır.
  - Balkondan sarkan çarşafa spreyle: *EKMEK HAKTIR*.
- **Sokağın üstü:** binadan binaya gerilmiş halatlar, sarkan brandalar,
  jeneratörden ampuller.
- **Yerde:** lahana yaprağı, ezilmiş karton, kasa tahtası, ip.
- **HAWK'ın tezgâhı:** iskele borusundan çatı, yamalı aşı boyası branda,
  arkada paslı oluklu sac ve raflar (teneke yağ, kavanoz, mum, ilaç
  kutuları, pil); asılı soğan ve sarımsak; tezgâh kasaların üstüne çakılmış
  tahta: pirinç terazi, açık veresiye defteri, gaz lambası; tezgâhın altında
  bezle örtülmüş cephane kutusu; yanında un çuvalları ve jeneratör; üstte
  boyalı tahta tabelası ve ampuller.
- **Kordon (A):** Vanta'nın dağıtım noktası: beyaz ışıklı *DAĞITIM NOKTASI*,
  kırmızı LED *BUGÜN DAĞITIM YOK*, sıra direkleri, kepenk kapalı.
- **İskele (C):** inşaat Söndürme'den beri durmuş: *İNŞAAT ALANI · GİRİLMEZ*
  levhası, üstünde Vanta damgası *DURDURULDU*; yeşil file.

### 10.7 Valilik (görev 3 · Sekreter Gall)
Valilik, Vanta'nın şehri yönettiği yerdir: Gall buradan yasakları imzalar.
Meclis askıda, belediye kapalı; "geçici güvenlik sözleşmesi" dört yılda
sekizinci kez uzatılmak üzere. Görevin gecesi o tören için hazırlık
yapılmıştır. Gall düşünce masasında *Kül Planı* bulunur.

- **Meydan (A):** iki bina arasında: bir yanda kapatılmış *BELEDİYE*
  (saat kulesi, kapısında zincir ve *MECLİS ASKIYA ALINMIŞTIR*), öbür yanda
  valiliğin demir parmaklıklı bahçe duvarı. Zemin büyük taş plakalar.
  - Kurumuş süs havuzu; çıplak çınarlar demir ızgaralı ağaç çukurlarında.
  - Vanta'nın polis bariyerine aileler kaybolanların fotoğraflarını,
    karanfilleri bağlamış, dibinde mumlar; yanında *TOPLANMA YASAKTIR*.
  - Park etmiş zırhlı tazyikli su aracı (Vanta işaretli).
  - Taş saksılarda budanmış şimşir; bayrak direklerinde Vanta bayrakları.
- **Güvenlik kapısı (B):** bahçe duvarındaki kontrol portalı:
  *SEKRETERLİK · YETKİSİZ GİRİŞ YASAKTIR*.
- **Avlu (C):** valiliğin kemerli revakı (taş ayaklar, yarım daire kemerler),
  avlu zemini kesme taş. Kapak olarak taş saksılar ve Vanta'nın T-duvarları
  (avluda kor işareti yok: içeri girilememiş).
- **Kürsü (Gall):** valiliğin ana merdiveninin önüne kurulmuş tören
  platformu: arkasında basın duvarı (sıra sıra Vanta arması), üst bandında
  *GEÇİCİ GÜVENLİK SÖZLEŞMESİ · 8. UZATMA*; ortada armalı kürsü ve
  mikrofonlar; iki uçta hoparlör ve beyaz projektör (ateş yok).
- **Valilik binası:** kesme taş, kemerli pencereler, *VALİLİK* kabartması;
  ana kapının üstünde balkon ve Gall'ın odası: binadaki tek sıcak ışık, masa
  lambası (perde sonundaki *Kül Planı* sahnesinin lambası). Saat kulesi
  belediyededir.

### 10.8 Kapı (görev 1 · Sızma)
§10.5'teki kapı maddesinin yerine geçer. *Limanı, elektriği, kapıları Vanta
tutar.* Kapı, liman yolunun şehre girdiği yerde Vanta'nın kurduğu kontrol
noktasıdır: şehir buradan konteyner duvarıyla kapatılmıştır. Ekip dışarıdan,
limanın yanından gelir; görev kapıdan şehre girmektir. Sinematikteki satır
bağlayıcıdır: *Kulübede iki nöbetçi. Kamera yok, sadece göz.* Kapıda kamera
yoktur.

- **Dışarısı (A–D): liman yolu.** Zemin limanın beton plakaları; soluk sarı
  şerit çizgileri, lastik izleri, su birikintisi. Lambalar şehrinkiler değil:
  galvaniz sanayi direği, çift başlık, hoparlör yok. Arka plan:
  - *Antrepo:* uzun, alçak liman ambarı; numaralı kapılar (*ANTREPO 3*),
    soluk *LİMAN İŞLETMESİ* boyası, Vanta'nın *EL KONULMUŞTUR* levhası.
  - *Gümrük:* eski taş gümrük binası, kabartma *GÜMRÜK*, kapalı.
  - *Konteyner yığınları:* üç kat, renk renk, sahip kodları (*VNTU*).
  - Çelikhane deposu ve Vanta karakolu yolun üstünde.
- **Yaklaşma (A):** belediyenin *HOŞ GELDİNİZ* levhası (şehrin adı Vanta
  etiketinin altında), çelikhanenin boru köprüsü, çökmüş yol.
- **Kontrol noktası (B):** nöbetçi kulübesi: camında televizyonun titreyen
  mavi ışığı, çatıdaki sobanın buharı; kırmızı-beyaz bariyer kolu yolun
  üstüne inmiş; Vanta bariyerleri ve T-duvar; *KONTROL NOKTASI · YAVAŞLA*.
- **Konteyner sahası (C):** konteynerlerde sahip kodu (kor işareti yalnız
  birinde, alçakta); üst geçit lastik tekerlekli bir saha vincinin (RTG)
  yürüme yolu: sarı ayaklar, tekerlekler, kabin, *VNTU* yazılı kiriş.
- **Avlu ve kapı (D):** konteyner duvarı (üst üste konteynerler, tepesinde
  jiletli tel), aradaki çelik kapı; üstünde beyaz ışıklı *KONTROL NOKTASI ·
  DUR · KİMLİK HAZIRLAYIN*; bir projektör direği, yağmurda ışık konisi;
  kamera yok. Terminal avluda.
- **İçerisi (E):** kapı açılınca şehrin ilk sokağı: lojmanlar, çay ocağı ve
  HAWK'ın dükkânı (şehre giren tek mal bu kapıdan geçer); hücrenin elde
  yapılmış barikatı, işaret fişeği.

### 10.9 Lobi: KOR'un sığınağı
Menülerin arkasındaki sahne artık sokak değil, prologdaki bodrumdur (çekim 7
ve 9): ekip buradan çıkar, buraya döner. Bütün menü ekranları bu odanın
önünde açılır (§10.3'teki "sığınak" fikrinin kendisi).

- **Işık:** tek kaynak masanın üstünde sallanan emaye abajurlu lamba (2700 K,
  0,45 Hz, ±14°); ışık havuzu masada ve operatörün üstünde gezer. Ek olarak
  sobanın kapağından titreyen kor ışığı, telsizin yeşil LED'i, sokak
  seviyesindeki parmaklıklı pencereden süzülen sodyum, merdivenin
  tepesindeki kapının altından ince bir çizgi. Havada lambanın ışığında toz.
- **Oda (soldan sağa):**
  - Sokağa çıkan beton merdiven ve kapı (çekim 9: "kapı açılır").
  - Telsiz köşesi (VESPER): raf, telsiz, kulaklık, antene giden kablo;
    duvarda kaybolanların fotoğrafları ve boş bir çivi: atkı FLINT'in
    boynunda, çivide Halil Usta'nın fotoğrafı kalmış.
  - Masa (çekim 7): kalemle işaretlenmiş şehir haritası, telsiz, iki kupa,
    şarjör, mermiler, kül tablası; duvarda iplerle bağlanmış harita: kapı,
    pazar, valilik, dökümhane, liman, kule.
  - Delikli pano ve tezgâh (Cephanelik): aletler, WARDEN'ın halligan'ı,
    BULWARK'ın bareti, SKYE'ın dron parçaları.
  - Soba ve borusu, sedir/portatif yatak ve yün battaniye; üst üste el konmuş
    Vanta sandıkları (Sandıklar ekranı).
  - Duvarda elle boyanmış kor işareti ve ocakçıların sözü: *OCAK SÖNER KOR
    KALIR*.
- **Malzeme:** nemli beton ve tuğla, kireç izleri, tavanda borular ve kiriş;
  zeminde beton, eski kilim, kablolar, damlayan tavanın altına konmuş kova.
- **Arayüz:** lobi panellerinin yanında telsiz kaydı: sıradaki görevin
  telsiz satırları konuşanıyla, daktilo harfiyle (görev sahnesindeki
  satırların aynısı), yeşil LED yanıp söner, satırlar sırayla yazılır.
- **Kadraj:** lobide kamera operatörü lambanın altına, haritanın önüne alır;
  lamba kadrajda görünür, botlar operatör fotoğraflarının üstünde kalır.
  Sahnenin sol kenarı hafifçe kararır ki operatörün adı aydınlık haritanın
  üstünde okunsun.

### 10.10 Operatörler: dosya, yetenek, ayrıntı
Beşinin giysisi §9.2'de. Bu bölüm onları oyunun geri kalanına hikâyeden
bağlar: Operatörler ekranındaki kişi dosyası, görevdeki yetenekleri ve
çizimdeki ayrıntılar. Önceki hâlinde dosyalar genel övgüydü ("hızlı, keskin,
hep önde"), Vanta'ya hâlâ "Syndicate" deniyordu; yetenekler herhangi bir
nişancı oyunundan gelmişti: enerji siperi, taret, mor yavaşlatma halkası,
parlayan auralar. İkisi de bu şehre ait değil.

**Kurallar**
- Dosyayı ekip yazar: daktilo, üçüncü kişi, kısa; kimse kendini anlatmaz.
- Yetenek eski işin aletinden çıkar; ışık parlaması değil, gerçek bir nesne
  görünür (kapı, tüp, su, duman kutusu, dron, sac). Mekanik aynı kalır.
- Her yeteneğin rengi operatörün imza renginden (§9.2): FLINT `#d9533a`,
  WARDEN `#e6c25c`, VESPER `#4fd2c4`, SKYE `#7ec8ff`, BULWARK `#e2782f`.
- Etrafı parlayan aura yok; etkin olduğu kor, toz, kıvılcım, su ile anlaşılır.

**Dosya alanları:** yaş · eski iş · Söndürme gecesi (o gece neredeydi) ·
yanında taşıdığı · kendi ağzından bir söz (konuşma biçimiyle, §1.4).

| | Yaş | Eski iş | Söndürme gecesi | Taşıdığı | Sözü |
|---|---|---|---|---|---|
| FLINT | 29 | Ocakçı, üçüncü kuşak | Fırının başındaydı. Babası Halil Usta'yı o gece götürdüler. | Babasının sendika atkısı | "Sonra konuşuruz." |
| WARDEN | 41 | İtfaiye ekip amiri, 4. istasyon | Ekip çağrıldı, kapıdan çevrildi. İstasyon bir ay sonra mühürlendi. | Halligan, istasyonun anahtarı | "Beş dakika, fazlası olmaz." |
| VESPER | 33 | Vanta sinyal analisti | Nöbette değildi. Kayıtlar dört yıl sonra masasına düştü: otuz yedi gözaltı, altı kayıp, hepsi saatiyle. | Vanta monoklü, camgöbeğine çevrili | "Doksan saniye. Sonra yeniden tararlar." |
| SKYE | 22 | Kurye | On sekiz yaşındaydı. Bacadan duman kesilince ilk o fark etti, bir çatıdan. | Hurdadan yaptığı dron | "Çatıdan iki dakika, sokaktan beş. Gidelim mi?" |
| BULWARK | 47 | Liman vinç operatörü | Limanın kapandığı sabah vinçten indi. Bir daha binmedi. | Konteyner kapısından kesilmiş göğüs sacı | "Bu kadar." |

**Yetenekler** (mekanik aynı, ad ve görünüş eski işten):

| | Beceri 1 | Beceri 2 | Ulti |
|---|---|---|---|
| FLINT · ocakçı | **Kor Atılımı:** kısa hasarsız atılım, arkasında kıvılcım | **Ateşleme Fişeği:** ocak fişeği; patlayınca bakanları kör eder (magnezyum beyazı) | **Ocak Başı:** babasının yeri; 8 sn ateş hızı ve hareket +%30, atkıdan kor dökülür |
| WARDEN · itfaiyeci | **Yangın Kapısı:** katlanır çelik kapı, 10 sn gerçek siper (kırmızı boya, şablon yazı) | **Tüp Tuzağı:** tetiğe bağlı basınçlı tüp; patlar, şok dalgası yavaşlatır | **Yangın Monitörü:** tripodda pirinç lüle ve hortum; 20 sn tazyikli su vurur ve iter |
| VESPER · sinyalci | **Duman Kutusu:** Vanta'nın kendi kutusu, depodan; içinden görülmez (gri duman) | **Parazit:** yere bırakılan karıştırıcı; telsizler cızırdar, alandakiler %40 yavaş | **Karartma:** Vanta'nın vizör ağına eski şifresiyle girer; 4 sn herkes kör |
| SKYE · kurye | **Hurda Dron:** gerçek dron havalanır, tarar, 8 sn işaretler | **Termal Kamera:** dronun kamerası; 5 sn duvar arkası | **Çatı Gözcüsü:** bildiği en yüksek çatıdan; 10 sn herkes işaretli, kafa vuruşu +%25 |
| BULWARK · vinççi | **Omuz Darbesi:** sac omuzla yüklenir, devirir (toz, kıvılcım) | **Konteyner Sacı:** göğse ikinci sac; 60 puan zırh, sağlık çubuğunda mavi | **Son Söz:** 6 sn hasar %70 az, ateş hızı artar; her adımda toz |

**Çizim:** FLINT'in uzaktaki gözlük camı yüzün içine alınır; BULWARK'ın
göğüs sacındaki konteyner kodu okunur ve düzenli durur (sahip kodu, seri
numarası, tip, ağırlık), giriş kartı kodun üstünü kapatmaz; WARDEN'ın
kaskının önünde istasyon numarası.

### 10.11 İsimler: gözden geçirme
Her isim tek soruyla tartıldı: bu şehirde, bu insanların ağzından çıkar mı?
Kimlikler (`id`) değişmedi; kayıtlar ve atlaslar etkilenmez.

**Kalanlar ve nedeni**
- **KOR, Kor Hattı, Ocak Başı, Söndürme:** ocakçıların sözünden; hikâyenin kendisi.
- **FLINT, WARDEN, VESPER, SKYE, BULWARK:** kod adları; telsizde kısa,
  karışmaz, oyuncunun seçtiği hâliyle duruyor.
- **HAWK, Gall, Vasquez, VANTA SYNDICATE:** kişi ve şirket adları.
- **Görevler** (Sızma, HAWK'ın Tezgâhı, Sekreter Gall, Dökümhane, Metro, Dron
  Fabrikası, Ocak, Kule Baskını, İhanet, Vasquez) ve yerleri: işlevle anılır,
  semt adı yok.
- **Parça** (para birimi, hurda somun), **Tetikçi / Kalkanlı / Hücumcu**,
  başarımlar, yetenekler (§10.10), modlar: hikâyeye oturuyor.

**Değişenler**
| Ne | Eski | Yeni | Neden |
|---|---|---|---|
| Tabanca | WREN-9 | SERÇE-9 | Ekip silahlara Türkçe ad koyar; çalıkuşu küçük, serçe gibi |
| Tüfek | KESTREL AR | KERKENEZ AR | Kestrel'in kendisi |
| Pompalı | RAMROD-12 | HARBİ-12 | Ramrod = harbi; "harbi" sokakta "sahici" demek |
| Nişancı | MARKSMAN DMR | ATMACA DMR | Bir sınıf adıydı, ad değil |
| Ağır tabanca | MULE .50 | KATIR .50 | Aynı hayvan, aynı inat |
| SMG | HORNET | ARI | Kısa, hızlı |
| Susturuculu SMG | LYNX | VAŞAK | Sessiz av |
| 3'lü tüfek | BASTION BR | BURÇ BR | Bastion = burç |
| Otomatik pompalı | SAW-20 | TESTERE-20 | Atölyede kesen alet |
| Sürgülü | LONGBOW | KARTAL | Uzağı gören |
| Hafif makineli | ANVIL LMG | ÖRS LMG | Anvil = örs; ocakçının aleti |
| Bombaatar | THUMPER GL | TOKMAK GL | Thumper = tokmak |
| Sandık | Standart / Takviyeli / Doğan | Erzak / Mühimmat / Komuta | Bunlar el konmuş Vanta sandıkları; adları Vanta'nın lojistiğinden |
| Görünüm | Neon Buz | Su Verme | Şehirde neon yok; ocakta çeliğe su verilir |
| Sonsuz mod | Her 5 bölümde boss | Her 5 dalgada Gall gelir | Gelen bir "boss" değil, Sekreter Gall |
| Ayar | HUD düzenleyici | Düğme düzeni | Oyuncu düğmeleri taşır; kısaltma yok |

### 10.12 Gerçekçilik geçişi: ışın izlenmiş karelerin yanına
Ölçü, seri karelerdi (§8): ışığın nereden geldiği, neyin neyi gölgelediği,
ıslak yerin neyi yansıttığı belli. Çizgi yok, geometrik şekil yok.

**Karakterler**
- **Çizgi yok:** figür boyanırken her fırça izi kenarında erir (`softMarks`);
  koyu izler daha geniş ve açık yayılır, küçük koyu dolgular (havalandırma,
  kayış, dikiş, saç) kesik kenar bırakmaz. Ellerdeki silah tornadan çıkmış
  gibi keskin kalır.
- **Boyun:** kafaya doğru eğilen bir sütun; çenenin gölgesi üstünde, ışık
  önünde. SKYE'ın kask delikleri içinde köpüğü görünen delikler; BULWARK'ın
  kır saçı yumuşak bir kütle.
- **Vanta zırhı:** daha gri bir çelik mavisi; lambanın parlaklığı, kenarlarda
  boyası kalkmış yerler, çizikler, aşağıda kuru yağmur kiri.
- **HAWK:** sakal çene hattını izler (favoriden ağız köşesine, çenenin
  altından boğaza), yanak açık kalır, üst kenar kıl kıl incelir; bıyık aynı
  kırçıllıkta, yalnız sigaranın olduğu yerde sararmış; altında dudak.

**Işık**
- **Islak yol:** yürüme çizgisinin altındaki asfalt sokağı yansıtır
  (bariyerler, direkler, botlar, neon); yağmurda aşağı doğru çizgilenir, 40
  birimde söner, ıslak yer koyulaşır. İç mekân kurudur.
- **Lamba gölgesi:** en yakın lamba, önündeki kişinin gölgesini arkadaki
  duvara düşürür: lambadan büyütülmüş bir kopya, duvarın sokağa değdiği
  çizgide kesilir, uzaklaştıkça kenarı yumuşar ve solar. Lobideki sallanan
  ampul operatörün gölgesini arka duvarda sallar.
- **Kenar ışığı:** figürün kenarındaki ışık en yakın lambaya döner ve
  yakınlıkla ısınır; lambadan uzakta gecenin soğuk kenarına döner.

- **Yağmur ve kişiler:** dışarıda her yukarı bakan yüzey (omuz, kask, kol,
  silahın üstü) ince soğuk bir ıslaklıkla parlar; yağmur damlaları en çok
  lambanın konisinde görünür.
- **Hava ve objektif:** uzak şehir alttan kendi lambalarıyla aydınlanan bir
  pusa, orta mesafe ince bir sise gömülür; ikisi de sokağa odaklı bir
  objektifte olduğu gibi hafif flu. Köşelerde renk saçağı (bloom açıkken).
- **Namlu alevi:** sert yıldız değil, öne fırlayan yumuşak bir gaz patlaması,
  frenden yanlara iki dil, sıcak bir çekirdek.

**Mekân ve arayüz**
- Sığınak duvarlarında nem izleri, lekeler, duvarın zemine değdiği yerde
  biriken karanlık; zemin ve masada kir.
- Silahlar: üstten yuvarlanan ışık, üst yüzeyde lamba çizgisi, boyuna
  fırçalanmış metal, el değen kenarlarda aşınma.
- Eller dört ayrı parmakla kabzayı sarar; boğumların sırtı ışığı yakalar.
- Vanta'nın tazyikli su aracı ve kapı kulübesi: camda ışık, tekerlek arkasında
  çamur, eklerden pas akıntısı. Hücumcu'nun maskesi kalıplanmış kauçuk,
  derindeki koyu camlarda kırmızı ışık, dişli filtre; Tetikçi'nin yarığında
  füme camın ardında yanan sensör.
- Düşenlerin bedeninin altında zemine temas gölgesi.
- Operatör dosyasında kişinin fotoğrafı ataşla tutturulmuş, rol damgası
  köşesinde.
- Cephanelikte sahip olunmayan silahın fiyatı sınıf etiketinin yerini alır
  (üstüne binmez).

**Telafi geçişi (ikinci bölüm)**
- **HAWK tezgâhında:** kolları göğsünde kavuşturulmuş bekler (diz hizasındaki
  tezgâha uzanan imkânsız kol kalktı); paltosu bir beden gibi döner: uzak yanı
  karanlıkta, lamba yanı sıcak, omuzlarında tezgâh ampulü. Portrede ensesi
  karanlığa döner, kısa saç enseye doğru seyrelir, atkı kıvrımlarla sarılı.
- **Kişiler:** her parça bir biçim gibi yuvarlanır (kenarları ışıktan uzakta
  gölgeye döner, ışık yanında biraz ışık tutar). FLINT'in teni daha az
  turuncu, atkısı burnunun üstünde ve boynunda kıvrım kıvrım; SKYE'nin
  rüzgârlığında naylon kırışıkları, bandanası düğüme doğru çekilmiş;
  BULWARK'ın filtreleri gerçek filtrelerin mat macentası.
- **Kumaş ve rüzgâr:** rüzgâr yerin özelliği: bodrum sığınakta atkının uçları
  sarkar, yalnız bedenle sallanır.
- **Islak sokak:** koşan her botun altında halka halka yayılan su ve
  sıçrayan damlalar.
- **Şehir:** pencereler duvarın içine gömülü (girinti gölgesi, camda gökyüzü,
  denizlik altında gölge ve yağmurun aşağı taşıdığı kir); kemerli pencereler
  de taşın içinde. Vanta karakolunun nöbet odası panjur ardında yanar;
  gümrük binası arduvaz çatılı. Konteynerler limanda olduğu gibi yıpranmış:
  oluk oluk gölge, raylardan ve köşe dökümlerinden pas akıntısı, ezikler,
  tutmayan bir rötuş. Vanta bariyerlerinde mermi izleri, çizikler, dipte kir.
  Vanta bayrakları ağır, ıslak kumaş gibi asılı; pazarın brandaları iki bağ
  arasında sarkar, altından ampulle ısınır. Valilik meydanındaki çınarlar
  gerçek ağaç: çatallanıp incelen dallar, alacalı kabuk, tohum topları.
- **Hasar:** vurulunca görüşün kenarı koyu kan kırmızısına kararır; atışın
  geldiği yan yumuşakça parlar.
- **Giysiler:** bütün operatörlerin, Vanta'nın ve Gall'ın kumaşı kıvrımlı:
  koltuk altından bele çekilen kıvrımlar, kemer üstünde toplanan kumaş,
  kollarda dirsek kıvrımları, diz arkasında toplanan pantolon. FLINT'in eski
  deri ceketi belde ve kolda buruşuk.
- **Kalkanlı'nın kalkanı:** bir şeylerin çarptığı yerler beyaz çatlak yıldızı,
  dibi sürtünmekten çizik, yüzünde yağmur damlaları.
- **Gökyüzü:** yağmurlu gece kapalıdır: yıldız yok; tepeden bulut tabanının
  sodyum kahvesine tek bir yumuşak geçiş, alttan aydınlanan yumuşak bulut
  kümeleri.
- **Pazar hâli ve liman:** hâlin kemerli pencereleri tuğla kemerli ve duvarın
  içinde; limandaki Vanta panosu panel panel basılı, alttan projektörle
  aydınlanır, üst kenarından kir akar, ayağında bakım iskelesi var.
- **Sığınak:** kilim dokuma ve eskimiş: ortası yürünmekten solmuş, sandalye
  izleri, kenarlarında kir, yarısı dökülmüş saçak.
- **HAWK:** kasketinin balıksırtı dokusu tüccar ekranının boyunda bile kumaş
  gibi okunur (ızgara değil); atkısı oval değil, düzensiz bir sarım.
