# KOR — Cinderfall'ın yerine geçiş yapısı

Bu belge, şimdiye kadar `public/lab` altında "KOR LAB" adıyla geliştirilen
KOR'un depodaki ve mağazadaki asıl oyun olmasının yapısını ve adımlarını
tanımlar. Uygulama bu belgeye göre yapılır; değişen bir karar önce burada
güncellenir.

---

## 0. Kararlar

| Konu | Karar | Neden |
| --- | --- | --- |
| Oyun | KOR, Cinderfall'ın yerine geçer; Cinderfall emekliye ayrılır | Asıl oyun artık KOR |
| Paket kimliği | `com.cinderfall.sector9` **aynı kalır** | Kimlik değişirse Play'de yeni bir uygulama olur; mevcut kurulumlar ve mağaza sayfası güncellenmez. Kimlik oyuncuya görünmez |
| Telefondaki ad | `KOR` | Görünen ad |
| İmza | Cinderfall'ın yükleme anahtarı (aynı) | Play yalnız aynı anahtarla imzalı güncellemeyi kabul eder; anahtar depoya hiçbir zaman girmez |
| Sürüm | `versionCode` artmaya devam eder; `versionName` 2.0.x | Yeni oyun, büyük sürüm |
| Cinderfall kodu | Ağaçtan çıkar; son hâli `main` geçmişinde **`821c36c`** commit'inde durur | Depo sade kalır; geri dönüş tek komut |
| `public/game2` | Silinir | Eski deneme kopyası, hiçbir derleme kullanmıyor |
| Ayrı LAB uygulaması (`com.kor.lab`) | Kaldırılır | Ana derleme artık KOR |
| Depo adı | `cinderfall` aynı kalır | Gizlilik sayfasının adresi (GitHub Pages) depo adına bağlı; Play'deki bağlantı kırılmasın |
| Kayıt anahtarları | `kor.lab.save`, `kor.legal.v1` aynı kalır | Sabit iç adlar; değiştirmek kimseye bir şey kazandırmaz |

## 1. Klasör yapısı

Önce:

```
public/game/     Cinderfall (yayındaki oyun)
public/game2/    Cinderfall'ın eski deneme kopyası
public/lab/      KOR
tools/lab/       KOR testleri, plaka izleyici, seri
```

Sonra:

```
public/game/          KOR (public/lab'ın kendisi, git mv ile; geçmişi korunur)
  index.html          giriş
  css/  js/           oyun
  assets/             yazı tipleri, izlenmiş plakalar
  dev/                geliştirici sayfaları (çizim tabloları, sinematik önizleme);
                      uygulamaya girmez
tools/game/           testler (*.test.mjs), plaka izleyici (plate/), seri (series/)
mobile/               Capacitor kabuğu; www'ye public/game kopyalanır
site/                 yasal sayfalar (public/game/js/legal'den üretilir)
store/                KOR mağaza metni ve görselleri
docs/
  KOR_STORY_CINEMATIC.md   ana tasarım ve hikâye belgesi
  KOR_YAPI.md              bu belge
  LAB_REWRITE_PLAN.md      yeniden yazımın tarihçesi (değişmez)
  RELEASE.md               KOR'un yayın kılavuzu
```

## 2. Uygulama kimliği (mobile/)

- `capacitor.config.json`: `appName` → `KOR`; arka plan ve açılış rengi KOR'un
  zemini `#0c0a09`. `appId` aynı.
- `mobile/assets/icon.png` (1024²) ve `splash.png` (2732²): KOR'un kendi
  görselleri. Simge: koyu zemin üstünde şablon harflerle KOR, altında kor
  lekesi; açılış: aynı logo, ortada, bol boşluk. Her derlemede bunlardan bütün
  boyutlar üretilir (`npm run assets`).
- `scripts/sync-www.mjs`: `public/game`'i kopyalar; `dev/` klasörünü atlar.
- `package.json`: ad ve açıklama KOR'a göre. Eklentiler aynı (haptik,
  durum çubuğu, açılış ekranı, reklam).
- Reklam: KOR şu an reklam göstermiyor, ama reklam onayı akışı oyunda ve
  reklam SDK'sı kabukta duruyor (ileride ödüllü reklam için). Bu bir ürün
  kararı; değişmez, yalnız belgelenir.

## 3. Derleme ve yayın hattı (.github/workflows)

| İş akışı | Önce | Sonra |
| --- | --- | --- |
| `build-android.yml` | `build-cinderfall-android.yml`: Cinderfall'ın hata ayıklama APK'sı | **KOR**'un hata ayıklama APK'sı; `public/game/**` ve `mobile/**` değişince çalışır; `kor-build-N` sürümünü yayınlar |
| `build-lab-android.yml` | LAB APK'sı (`com.kor.lab`) | **Silinir** |
| `release-android-aab.yml` | Cinderfall AAB | **KOR** AAB; `versionName` `2.0.N`; imzalama aynı (sırlar varsa CI'da, yoksa yerelde jarsigner) |
| `pages.yml` | Yasal sayfalar `public/game/js/legal`'den | Aynı yol, artık KOR'un yasal modülü |

## 4. Kayıtlar ve veri

- KOR'un kaydı `localStorage` → `kor.lab.save` (+ `.bak`), yasal onay
  `kor.legal.v1`, pişirilmiş çizimler IndexedDB'de sürüm anahtarıyla.
- Cinderfall'ın kayıtları KOR'da okunmaz; iki oyun farklıdır, ilerleme
  taşınmaz. Güncellemeden sonra KOR ilk açılışta yasal onayı yeniden ister.

## 5. Yasal

- KOR'un yasal metinleri Cinderfall adını içermez (9 dil, 16 bölge).
- `site/` yeniden üretilir:
  `node --experimental-default-type=module scripts/build-legal-site.mjs`.
- Gizlilik adresi aynı kalır.

## 6. Mağaza (store/)

- `listing.md`, `play/short-*.txt`, `play/full-*.txt`: KOR'un metinleri
  (TR, EN): hikâye (Vanta'nın tuttuğu şehir, ocak, beş hücre), görevler,
  operatörler ve yetenekler, silahlar, sandıklar, gerçekçi çizim, çevrimdışı.
- `screenshots/`: KOR'dan 1920×1080 görüntüler (Play en-boy oranını 2:1 ile
  sınırlar): lobi, kapı, pazar, valilik, operatörler, kampanya, sandıklar,
  cephanelik. Eski Cinderfall görüntüleri silinir.
- `feature-graphic.png` (1024×500) ve `icon-512.png`: KOR.
- Play Console'da yalnız hesap sahibinin yapabileceği işler: yeni metin ve
  görselleri yüklemek; "Reklam içerir" ve Veri güvenliği beyanını gözden
  geçirmek; içerik derecelendirme anketini KOR'a göre yeniden doldurmak;
  yeni AAB'yi yüklemek.

## 7. Adlandırma

- Görünen her yerde "KOR LAB" → "KOR": sayfa başlığı, dosya başı yorumları,
  README'ler.
- İç kimlikler (operatör id'leri, görev id'leri, kayıt anahtarları) aynı.

## 8. Geçiş adımları (sırayla)

1. Cinderfall'ın son hâlinin commit'i: `821c36c` (bu belgenin eklendiği commit).
2. `git rm -r public/game public/game2`; `git mv public/lab public/game`;
   `git mv tools/lab tools/game`; her yolu düzelt (testler, araçlar,
   belgeler).
3. Mobil kabuk: ad, renkler, simge ve açılış görselleri, `sync-www` (dev/
   atlanır), açıklamalar, README.
4. İş akışları: tek APK iş akışı (KOR), LAB iş akışı silinir, AAB sürüm adı.
5. Yasal siteyi yeniden üret.
6. Mağaza metinleri ve görselleri.
7. Ana README, `docs/RELEASE.md`, `mobile/README.md`, `public/game/README.md`.
8. Doğrulama (§9), commit, push, APK.

## 9. Doğrulama listesi

- [x] `for f in tools/game/*.test.mjs; do node $f; done` hepsi geçer
- [x] Bütün ekranlar ve üç görev sayfa hatası olmadan açılır
- [x] `node mobile/scripts/sync-www.mjs` KOR'u kopyalar, `dev/` yok
- [x] `node --experimental-default-type=module scripts/build-legal-site.mjs` çalışır
- [x] APK: adı KOR, simgesi KOR, `assets/public/index.html` KOR'un girişi (`kor-build-1`)
- [x] Depoda `public/lab`, `public/game2` ve LAB iş akışı yok;
      "KOR LAB" görünen bir yerde geçmiyor

## 10. Geri dönüş

Cinderfall'ın tamamı `main` geçmişinde, `821c36c` commit'inde durur:

```bash
git checkout 821c36c -- public/game public/game2 .github/workflows mobile store site
```
