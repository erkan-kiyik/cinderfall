# CINDERFALL — Akıcılık (120 FPS) + UI Yapı Planı

Bu doküman işin **yapısıdır**: önce neyin ölçüldüğü, sonra hangi katmanda
neyin değiştiği, her adımın kabul ölçütü. Uygulama bu sırayı izler.

> Gerçekçi hedef tanımı: oyun **ekranın yenileme hızının altına hiçbir zaman
> kendiliğinden kilitlenmez**. 120 Hz ekranlarda hedef 120 FPS (kare başı
> 8.3 ms), 90 Hz'de 90, 144 Hz'de 144. 60 Hz bir ekran fiziksel olarak 60'tan
> fazlasını gösteremez — orada hedef "tek kare bile kaçırmadan 60".

---

## 0. Başlangıç ölçümü (değişiklik öncesi)

Ölçüm: masaüstü CPU, 844×390 @ DPR 2.5, demo savaş sahnesi.

| Ölçüt | LOW | MEDIUM | HIGH |
|---|---|---|---|
| `game.render()` ort. | 3.6 ms | 4.8–5.4 ms | 10.0–11.2 ms |
| `game.update()` / kare | 0.16 ms | 0.3–0.7 ms | 0.7–0.9 ms |
| Çizilen kare tavanı | 60 | 60 | 60 |
| Bellek çöpü (GC) | 3.8 MB/s | 3.4–4.9 MB/s | 3.2 MB/s |
| >16.7 ms kare (6 sn) | 94 | 153 | 163 |

Telefon CPU'su masaüstünün ~¼'ü → MEDIUM render telefonda ≈ 20 ms ⇒ ~50 FPS.
120 FPS için render'ın **~2.5–3× küçülmesi** gerekiyor.

### Bulunan takılma (stutter) kaynakları
1. **FPS tavanı 60** (`quality.js → fpsCap: 60`): 120 Hz ekranda her kare iki kez gösteriliyor.
2. **Simülasyon 60 Hz sabit adım** (`STEP = 1/60`), ara-değerleme yok: tavan kalksa bile hareket 60 Hz'de kalır.
3. **Dinamik çözünürlük her adımda tüm tamponları yeniden yaratıyor** (`resize()`): ana canvas + ışık + glow + arka plan canvas'ı yeniden ayrılıyor ve `applyDeviceProfile()` tüm DOM'a stil yeniden hesaplatıyor. Ağır sahnede 0.9 sn'de bir → periyodik takılma.
4. **GC baskısı**: saniyede 3–5 MB çöp (ışık listesi dizileri, her karede yeni gradient nesneleri, şablon string'ler) → telefonda düzenli 2–6 ms duraklamalar.
5. **Işık haritası her karede `createRadialGradient`** (6–11 adet) + ayrı tuvale çizim + `multiply` birleştirme.
6. **Arka plan** her karede 7 tam ekran geçiş (gökyüzü, bulut, bina, sis, yağmur, saat tonu) yeniden çiziliyor.
7. Menü arkası 24 FPS ile çiziliyor → yarı saydam paneller arkasında takılmalı görünüyor.

---

## 1. Ölçüm altyapısı (A)

| # | İş | Çıktı |
|---|---|---|
| A1 | `fps.mjs`: update/render CPU süresi, kare aralığı p50/p95/p99, takılma sayısı, GC churn | ✅ hazır |
| A2 | `phase.mjs`: render alt-fazları (bg, dünya, karakter, parçacık, ışık, grade), draw-call ve doluluk (overdraw) sayımı | ✅ hazır |
| A3 | Oyun içi **performans katmanı** (debug): kare süresi grafiği, ekran Hz, dyn çözünürlük, sim adımı | yapılacak |
| A4 | Stres senaryosu: 30 düşman + patlamalar + boss | yapılacak |

**Kabul**: her optimizasyon commit'i öncesi/sonrası A1+A2 sayıları.

---

## 2. Döngü & 120 Hz (B)

| # | İş | Detay |
|---|---|---|
| B1 | **FPS tavanını kaldır** | Oyun her vsync'te çizer. Ayarlara "KARE HIZI: OTOMATİK / 60 / 30 (pil)" eklenir; varsayılan OTOMATİK = ekran Hz. |
| B2 | **Değişken alt-adımlı simülasyon** | Kare süresi ≤ 1/120 sn'lik eşit alt adımlara bölünür (60 Hz'de 2×, 120 Hz'de 1×, 90 Hz'de 2× kısa adım). Kod `dt` tabanlı + üstel sönümleme kullandığından (denetlendi) fizik her Hz'de aynı davranır; sabit adım titremesi (judder) olmaz. |
| B3 | **Ekran Hz tespiti** | rAF aralıklarının kayan medyanı → 60/90/120/144. Dyn-çözünürlük hedef bütçesi = 1000/Hz. |
| B4 | **Android yüksek yenileme modu** | `MainActivity`: `preferredDisplayModeId` = mevcut çözünürlükteki en yüksek Hz modu. Birçok telefon (Samsung/Xiaomi) bunu istemeyen uygulamayı 60 Hz'de tutar. |
| B5 | Menü arkası | 24 → ekran Hz'inin yarısı (en az 30, en çok 60). |
| B6 | Arka plan sekmesi | Sekme gizliyken döngü durur (mevcut), dönüşte `acc` sıfırlanır (mevcut). |

**Kabul**: 120 Hz emülasyonda rAF başına 1 çizim, kopya kare yok; fizik testleri (zıplama yüksekliği, mermi menzili) 60/120 Hz'de aynı.

---

## 3. Takılma giderme (C)

| # | İş | Detay |
|---|---|---|
| C1 | **Dinamik çözünürlük yeniden yazımı** | Kademeler sabit listeye nicelenir (1.0, .9, .8, .7, .62, .55). Değişimde yalnızca sahne tamponları yeniden boyutlanır; `applyDeviceProfile()` (DOM) **çağrılmaz**. Histerezis: düşüş için 0.5 sn, yükseliş için 4 sn temiz kare; aynı oturumda başarısız kademeye 20 sn dönülmez. |
| C2 | **Sıfır-çöp sıcak döngü** | `gatherLights` → kalıcı dizi; ışık/gradient nesneleri önbellekte; HUD metin yazımları yalnız değer değişince; döngülerde closure/spread yok. Hedef churn < 0.5 MB/s. |
| C3 | **İlk kullanım ön-ısıtması** | Oyun başlamadan: patlama/kıvılcım/duman sprite'ları, ışık sprite'ları, silah/skin bake'leri (idle'da, mevcut), ses decode. Savaşın ilk patlamasında takılma olmaz. |
| C4 | HUD DOM | `contain: layout paint` HUD kutularına; yazımlar değişim-kontrollü (mevcut yapı korunur, eksikler kapatılır). |

**Kabul**: stres senaryosunda >2× bütçe kare sayısı ≈ 0; 6 sn'de GC düşüşü < 3.

---

## 4. Render maliyeti (D)

| # | İş | Detay |
|---|---|---|
| D1 | **Işık sprite önbelleği** | Her renk/yarıçap sınıfı için bir kez pişirilen radyal ışık sprite'ı; kare başına `createRadialGradient` = 0. Ortam gradyanı yalnız kamera Y/zoom değişince yeniden kurulur. |
| D2 | Arka plan geçişleri | Statik gradyanlar önbellek; arka plan tuvali yalnız kamera/saat değişince yeniden çizilir (dikey kamera sabitken). |
| D3 | Durum değişimi | Gereksiz `save/restore` çiftleri → doğrudan `setTransform`; aynı composite modundaki çizimler grup halinde. |
| D4 | Kalite kademeleri | Bütçe 8.3 ms'ye göre: MEDIUM `lightScale` .5→.4, `bgScale` .6→.5; LOW `renderScale` .7→.62. Görsel fark ölçülerek. |

**Kabul**: MEDIUM render ≤ 2.5 ms (masaüstü), HIGH ≤ 5 ms.

---

## 5. UI / UX (E)

| # | Ekran | Sorun | Çözüm |
|---|---|---|---|
| E1 | **Profil** | Dikey kart yatay ekranda taşıyor, kaydırma gerekiyor; sekme yok; "%100 sonraki seviye" yanlış görünüm | Yatay iki sütunlu oyuncu kartı + **sekmeler: ÖZET / KARİYER / CEPHANELİK**. Kaydırmasız; seviye/rütbe çubukları doğru. |
| E2 | **İstatistik** | Başlık + alt sekmeler ekranın yarısını kaplıyor, ilk bakışta 5 kart; etiketler koda gömülü İngilizce | Kompakt başlık satırı (başlık + segment sekmeler tek satır), kahraman şeridi (4 ana sayı), yoğun 3–4 sütun ızgara, tüm metinler i18n (7 dil). |
| E3 | **Başarımlar** | Özet kartı çok büyük, madalyalar hep gri, rozet başlığı kesiliyor; metinler İngilizce | İnce özet şeridi + **filtre çipleri (TÜMÜ / ALINABİLİR / DEVAM / TAMAM)**, 2 sütun yatay kartlar, "hepsini al" düğmesi, i18n. |
| E4 | Genel UI | Panel başlıkları landscape'te çok yer kaplıyor; ölçek tutarsız | Ortak `panel-head` bileşeni, sıkı boşluk ölçeği, kısa ekran (≤ 400 px yükseklik) kuralları. |

**Kabul**: 844×390 ve 740×360 yatay ekranda profil kaydırmasız; istatistik ilk ekranda ≥ 8 değer; TR/EN/DE ekran görüntüleri temiz.

---

## 6. Sıra ve teslim

1. B1–B3 + C1 (en büyük akıcılık kazancı) → ölç
2. C2 + D1 + D2 (GC + ışık) → ölç
3. D3–D4 + C3–C4 → ölç
4. B4 (Android) → CI APK
5. E1–E4 → ekran görüntüsü inceleme
6. LAB (`game2`) senkron, APK + AAB
