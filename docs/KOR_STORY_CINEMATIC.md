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
| 6 | 29.0–35.0 | **Sokak, birikinti hizası.** Üç kişilik Vanta devriyesi soldan sağa yürür (riglenmiş yürüyüş), birikintide yansımaları; duvarda yırtık *DÜZEN · GÜVENLİK · İTAAT* afişi, üstüne küçük sprey *KOR* ve kor işareti. Odak birikintiden afişe kayar. | 85 mm, alçak (yerden 25 cm), sabit; odak 31.8'de 1.5 sn | Sokak lambası 2000 K üstten, afiş üstünde arıza yapan floresan 5000 K (titreme) | Bot + su sesi (adım senkron), telsiz cızırtısı | VESPER (telsiz): *Devriye geçti. Doksan saniye.* (33.0–35.0) |
| 7 | 35.0–42.0 | **Bodrum.** Tek ampul sallanıyor; masada kâğıt harita, telsiz (yeşil LED), kupalar; masanın etrafında dört siluet (WARDEN, SKYE, BULWARK, VESPER kulaklıkla); ampul sallandıkça gölgeleri duvarda sallanır. | 40 mm, 7 sn'de yavaş ileri kaydırma (dolly) | Ampul 2700 K tek kaynak, sallanma 0.45 Hz, 14° | Ampul vızıltısı, kâğıt hışırtısı, uzaktan yukarıdan geçen araç | WARDEN: *Kapıyı beş dakika tutarım. Fazlası olmaz.* (35.6–38.6) · SKYE: *Çatılar temiz. Kule bu tarafa bakmıyor.* (38.9–41.8) |
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

## 3. Başlık animasyonu (her açılış, 4.5 sn + yükleme)

Çekim 10'un kısa hâli: kül, korlar, *KOR*, slogan, altta ince yükleme çizgisi
(ilerleme). Yükleme bitmediyse korlar nefes almaya devam eder. Dokunma 0.45
sn'den sonra atlar. Mevcut `Intro` arayüzü korunur (`run`, `setProgress`,
`assetsDone`, `onHandoff`, `__introManual/__intro.seek`).

---

## 4. Görev hikâye sahneleri

Her biri tek bir gerçekçi çekim üzerine telsiz konuşması; 14–20 sn;
görev ilk kez başlatılırken oynar, kampanyada "Sahne" düğmesiyle tekrar izlenir.

| Sahne | Çekim | Satırlar |
|---|---|---|
| `m1` öncesi | Gece kapı: bariyer, kulübe ışığı, konteyner yığını, yağmur; nöbetçi siluetleri | VESPER: *Kapıda iki nöbetçi, bir kulübe. Kamera yok, sadece göz.* · WARDEN: *Terminal avluda. Ben açarım, siz tutun.* · FLINT: *Girelim.* |
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
| `cine/human.js` | 3B insan iskeleti, yürüyüş/duruş/uzanma, IK, kumaş zinciri, siluet + kenar ışığı çizimi |
| `cine/fx.js` | Yağmur (3 derinlik), sıçrama, buhar, kıvılcım, hacimsel huzme, ıslak zemin yansıması |
| `cine/post.js` | Renk düzenleme, halation, gren, vinyet, sinema bandı, kapı titremesi (gate weave), pozlama titremesi, geçişler |
| `cine/audio.js` | Ses: ambiyans katmanları ve zamanlı olaylar (WebAudio, dosyasız) |
| `cine/player.js` | Oynatıcı: tuval, döngü, altyazı (DOM), geç düğmesi, bitiş |
| `cine/shots.js` | Çekimlerin çizimleri (önsöz + görev sahneleri) |
| `cine/scenes.js` | Sahne tanımları: çekim sırası, süreler, altyazı ve ses ipuçları |
| `ui/intro.js` | Başlık animasyonu (yeni), eski arayüzle |

### 5.2 İnsan iskeleti (3B, metre)
Kemik uzunlukları boy `H` cinsinden (H = 1.78 m varsayılan; BULWARK 1.92,
SKYE 1.70, VESPER 1.68, WARDEN 1.80, FLINT 1.79, Vanta 1.82):

| Kemik | Uzunluk / H | Kalınlık (çap, m) | Not |
|---|---|---|---|
| pelvis (kök) | — | 0.34 genişlik | yerden 0.53 H |
| omurga alt (pelvis→bel) | 0.10 | 0.30 | |
| omurga üst (bel→göğüs) | 0.16 | 0.36 | yelek/zırh burada |
| boyun | 0.05 | 0.12 | |
| baş | 0.13 | 0.20 × 0.24 | kask/kapüşon ayrı şekil |
| omuz genişliği | 0.26 | — | |
| üst kol | 0.172 | 0.105 | |
| ön kol | 0.157 | 0.085 | |
| el | 0.10 | 0.08 | eldiven |
| kalça genişliği | 0.19 | — | |
| uyluk | 0.245 | 0.15 | |
| baldır | 0.246 | 0.11 | |
| ayak (topuk→uç) | 0.15 | 0.10 | bilek yerden 0.045 H |

Eklem sınırları: diz 0–150°, dirsek 0–145°, omurga öne eğilme ±12°, baş
sapma ±50°. Diz ve dirsek için iki-kemik IK; diz ipucu ileri, dirsek ipucu
aşağı-dışarı.

### 5.3 Yürüyüş (adım döngüsü)
- Faz φ ∈ [0,1): sağ ayak φ, sol ayak φ+0.5.
- Basma %62, salınım %38. Basmada ayak dünyada sabit (kayma yok); salınımda
  yay: yükseklik 0.11 m × sin(π·u), ayak ucu %70'te iner (topuk önce).
- Adım uzunluğu (iki adım = bir döngü): temkinli 1.30 m, normal 1.50 m,
  ağır yük 1.20 m. Kadans: temkinli 96, normal 110, ağır 88 adım/dk.
- Pelvis: dikey salınım 2×/döngü, genlik 0.025 m (en alçak: topuk vuruşu);
  yanal salınım 0.02 m; pelvis dönüşü ±4°, göğüs ters yönde ±3°.
- Gövde öne eğik: temkinli 8°, normal 4°, yüklü 6°. Baş dengelenir (bakış sabit).
- Kollar: silahsız ±16° omuz, dirsek 15–35°; tüfek tutan: eller silahta (sağ
  el kabzada, sol el el kundağında), silah göğüs hizasında, adımla ±1.5 cm
  sekme, namlu aşağı 25° (taşıma).
- Ses: her topuk vuruşu bir ayak sesi olayı üretir (zemin türüne göre).

### 5.4 Duruş ve küçük hareketler
- Nefes: göğüs 0.22 Hz, genlik 0.6 cm; omuzlar 0.3 cm.
- Ağırlık aktarma: 6–9 sn'de bir, pelvis 2 cm yana, karşı diz bükülür.
- Mikro hareket: baş 0.1–0.4 Hz gürültü ±2°.
- Bodrumdaki dört siluet: biri haritaya eğilir (gövde 25°), biri kollarını
  kavuşturur, biri kupayı kaldırır (4.1 sn'de), VESPER kulaklığa dokunur.

### 5.5 Çizim (siluet + kenar ışığı)
1. Karakter ayrı bir tuvale tek renk maske olarak çizilir (uzuvlar konik
   kapsül, gövde/yelek/kask/sırt çantası ayrı şekiller, uzak taraf önce).
2. Kenar ışığı: maske, ışığa doğru kaydırılmış maskeden çıkarılır →
   sadece ışık tarafında 1–2 piksellik kenar; rengi ışığın Kelvin rengi.
3. Gövde: çok koyu (#0a0c0f–#14171c), üstten-alta hafif degrade, ön dolgu ışığı
   varsa %6–10 aydınlatma.
4. Vizör/telsiz LED'i gibi küçük ışık noktaları en son, 1–2 piksel.
5. Derinlik: uzaktaki karakterler sise karışır (renk sise doğru lerp).

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
7. Yüz yok: karakterler siluet, kask ve kenar ışığıyla anlatılır (tekinsiz
   vadiye düşmemek için).
8. Metin: somut, kısa, deyimli Türkçe; rakam ve ayrıntı.

## 7. Kabul ölçütleri
- 844×390 ve 2400×1080'de her çekimden 2 kare; hiçbirinde taşma yok.
- Önsöz baştan sona hatasız; geç düğmesi çalışır; ikinci açılışta tekrar oynamaz.
- Başlık animasyonu yükleme bitene kadar bekler, bitince lobiye devreder.
- Ayak kayması yok: basma fazında ayak dünya konumu ≤ 1 mm değişir (test).
- Kemik uzunlukları her karede sabit (IK testi, ≤ 0.5 mm).
- i18n testleri geçer; tüm altyazılar TR/EN.
- Telefonda (orta sınıf) ≥ 30 fps hedefi: iç çözünürlük düşer, katmanlar
  önceden pişer.
