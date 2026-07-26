// Payment provider abstraction for real-money Diamond purchases.
//
// Modular by design, per spec: `getPaymentProvider()` swaps in a native
// store provider when one is registered on the Capacitor plugin bridge, or
// a simulated purchase flow otherwise — same shape as engine/ads.js's
// rewarded-ad bridge (native-if-present, else a testable web fallback).
//
// PaymentProvider shape (duck-typed, no base class needed):
//   getProducts(): Promise<Array<{ id, priceLabel }>>   — store-reported
//     prices, when the platform has them; the UI falls back to
//     store.js's priceTL when this is empty.
//   purchase(pkg): Promise<{ ok: boolean, receipt?: any }>
//   restorePurchases(): Promise<string[]>  — product ids already owned
//     (Diamonds are consumable, so this is normally empty; kept for
//     non-consumable products added later).
//
// SHIPPING CHECKLIST — this file does not do any of this on its own:
//   1. Register each DIAMOND_PACKAGES id (game/store.js) as a consumable
//      product in Google Play Console and App Store Connect, matching the
//      TL prices shown there (in-app prices are set per-store, not here).
//   2. Install a native billing plugin and register it on
//      window.Capacitor.Plugins under the name NATIVE_PLUGIN_NAME below,
//      exposing purchase()/getProducts()/restorePurchases() with this
//      file's PaymentProvider shape.
//   3. Until then every purchase — on native or web — resolves through
//      SimulatedPaymentProvider, which mimics success for testing. Do not
//      ship without step 2, or every install gets free Diamonds.
const NATIVE_PLUGIN_NAME = 'InAppPurchase';

class NativePaymentProvider {
  constructor(plugin) { this.plugin = plugin; }
  async getProducts() {
    try { return await this.plugin.getProducts(); } catch (e) { return []; }
  }
  async purchase(pkg) {
    try { return await this.plugin.purchase({ productId: pkg.id }); } catch (e) { return { ok: false }; }
  }
  async restorePurchases() {
    try { return await this.plugin.restorePurchases(); } catch (e) { return []; }
  }
}

// Simulated store — shows a mock confirmation sheet, then resolves as if
// the purchase succeeded. Mirrors engine/ads.js's simulateAd() fallback so
// the whole store is testable without any store account configured.
class SimulatedPaymentProvider {
  async getProducts() { return []; }

  purchase(pkg) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'pay-sim-overlay';
      overlay.innerHTML = `
        <div class="pay-sim-box">
          <div class="pay-sim-label">TEST PURCHASE — NO STORE WIRED UP</div>
          <div class="pay-sim-pkg">${pkg.name}</div>
          <div class="pay-sim-price">${pkg.priceTL} TL</div>
          <div class="pay-sim-sub">This confirms instantly for testing (see engine/payments.js). Real billing needs a native provider.</div>
          <button class="btn primary" id="pay-sim-confirm">CONFIRM PURCHASE</button>
          <button class="pay-sim-cancel" id="pay-sim-cancel">CANCEL</button>
        </div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('#pay-sim-confirm').addEventListener('click', () => {
        overlay.remove();
        resolve({ ok: true, receipt: { simulated: true, productId: pkg.id } });
      });
      overlay.querySelector('#pay-sim-cancel').addEventListener('click', () => {
        overlay.remove();
        resolve({ ok: false });
      });
    });
  }

  async restorePurchases() { return []; }
}

let cached = null;
export function getPaymentProvider() {
  if (cached) return cached;
  const native = window.Capacitor?.isNativePlatform?.() && window.Capacitor.Plugins?.[NATIVE_PLUGIN_NAME];
  cached = native ? new NativePaymentProvider(native) : new SimulatedPaymentProvider();
  return cached;
}
