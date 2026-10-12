# CROW — karakter tasarım belgesi (v6, önden düz yüz)

## 1. Önceki sürümlerin dürüst eleştirisi
| Sürüm | Sorun |
|---|---|
| v1 kapüşon + vizör | Hazır "gizemli satıcı" kalıbı; yüz yok |
| v2 gagalı maske | Yüzsüz; konuşacak biri yok |
| v3 yaşlı adam, bere | Eller "sosis kulesi"; adı silüette yok |
| v4 tepe saç, büyüteç | Clip-art yüz (yuvarlatılmış dikdörtgen kafa, rastgele çizgiler, düz ışık); diken diken tüy yığını; afişte yüz çok küçük |
| v5 3/4 yüz, gaga burun, puro | Abartılı ve karikatür; oyuncu "düz, normal bir yüz" istedi |

Ortak kök neden: şekiller koordinata göre "tahmin edildi", anatomi kurgusu yoktu; gölge = rastgele gradyan; inceleme yalnızca küçük boyutta yapıldı.

## 2. Konsept
Sektör 9'un hurda tüccarı. 50'lerinde, sıska ama sert, her şeyin fiyatını bilen biri. Karşısındakini tartan yarı alaycı bakış. Yanında evcil kargası.

**Silüet (tek renk siyahta bile "CROW" okunmalı):**
1. Geniş kenarlı, eskimiş, tepesi ezik şapka — en güçlü şekil
2. Önden, simetrik, normal oranlı yüz; kısa kır sakal
3. Sol omuzda deri tünek omuzluğu ve üstünde karga
4. Dik yakalı uzun palto

## 3. Anatomi (karakter birimi, boyun tabanı = 0,0)
- Kafa: tepe −52, çene −15 → 37 birim. Göz hattı −34 (yarı yükseklik)
- Üçte birler: saç çizgisi −46 / kaş −37.5 / burun tabanı −25.5 / çene −15
- Kulaklar: kaş ile burun tabanı arasında, iki yanda simetrik
- Önden görünüş: gözler x ±4.6, yüz yatayda %10 genişletilir (`FACE_W` 1.1)
- Omuz genişliği ±32 (≈2.6 kafa genişliği)

## 4. Işık
- **Ana:** Sağ üstteki lamba, sıcak `#ffd9a8`. Işık düzlemleri: yüzün sağ yarısı, burun sırtı, sağ elmacık, şapkanın sağı
- **Kenar:** Soldaki neon, kırmızı `#ff4a52`. Şapka, saç, palto omzu ve karganın sol kenarları
- **Şapka gölgesi:** Kaşları ve göz çukurunu örter, gözleri değil. Gözlerde ışık parlaması kalır
- Gölge şekilleri elle çizilir ve yumuşak kenarlıdır; gradyan "leke" kullanılmaz

## 5. Renk paleti (sınırlı)
| | açık | orta | gölge | derin |
|---|---|---|---|---|
| Ten | #e2a983 | #bf7f5a | #84503d | #4f2c27 |
| Saç/sakal | #8f8a85 (gri) | #2b2a2d | #18171a | |
| Şapka | #5a4636 | #3a2d24 | #22191a | |
| Palto | #3a424d | #222831 | #14181d | |
| Atkı | #c13a46 | #8e2330 | #571219 | |
| Pirinç | #f0d08a | #c9a35e | #7a5a2c | |
| Göz | #d6dfe4 iris (soluk gri, karga gibi keskin) | | | |

## 6. Kostüm detayları
- Şapka: ezik tepe, öne eğik kenar, deri bant + pirinç toka, bantta karga tüyü, tepede yuvarlak pirinç camlı gözlük
- Saç: şapka altında kısa; şakaktan sakala inen ince favoriler
- Sakal: çene hattında kısa kır sakal + sade, simetrik bıyık; puro yok
- Boyun: aşağı indirilmiş kırmızı toz atkısı, kıvrımlı
- Palto: dik yaka, yelek + pirinç düğmeler, sağ omuzdan sola fişeklik (kırmızı av fişekleri), yakada karga kafatası rozeti
- Sol omuz: tırnak izli deri tünek ve altında tüy yaka

## 7. Canlılık
- Nefes alma, kafanın yavaş salınımı
- Gözbebekleri: sana bakar → kargaya kayar → geri döner
- Göz kırpma
- Karga: kesik kafa hareketleri, göz kırpma, kanat silkeleme, gaga açma
- Neon titremesi, yağmur, toz

## 8. Kabul kontrol listesi (teslimden önce)
1. Silüet (tam siyah) "geniş kenarlı şapkalı, yanında karga" diye okunuyor
2. Gri ton kontrolü: odak noktası yüz; en açık değerler yüzde
3. Anatomi oranları §3'e uyuyor; kulak, göz ve burun yerinde
4. Işık tutarlı: lamba sağdan, neon soldan; gölgeler solda
5. Gerçek boyutta (afiş 405×156) çöp iz, rastgele çizgi ya da boşluk yok
6. Animasyonun uç karelerinde dikiş veya kopma yok
7. Tabela, lamba ve raflar kafayla çakışmıyor
8. Portre kırpması düzgün
