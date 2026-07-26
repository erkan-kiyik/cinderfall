// Cashout provider abstraction for the "watch N ads, earn TL" reward
// (Progression.adTLRewardsAvailable / claimAdTLReward). Modular per spec —
// ready to connect to a real payout API later (a custom backend, a payment
// processor's payout endpoint, etc.) — this file only defines the swap
// point; no such backend exists yet, so the default provider records the
// claim locally for testing, same pattern as engine/payments.js.
//
// CashoutProvider shape:
//   claim(amountTL): Promise<{ ok: boolean, reference?: string }>
class SimulatedCashoutProvider {
  claim(amountTL) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'pay-sim-overlay';
      overlay.innerHTML = `
        <div class="pay-sim-box">
          <div class="pay-sim-label">TEST CASHOUT — NO PAYOUT BACKEND WIRED UP</div>
          <div class="pay-sim-pkg">AD WATCH REWARD</div>
          <div class="pay-sim-price">${amountTL} TL</div>
          <div class="pay-sim-sub">This confirms instantly for testing (see engine/cashout.js). Paying real money needs a backend payout API.</div>
          <button class="btn primary" id="pay-sim-confirm">CLAIM REWARD</button>
          <button class="pay-sim-cancel" id="pay-sim-cancel">CANCEL</button>
        </div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('#pay-sim-confirm').addEventListener('click', () => {
        overlay.remove();
        resolve({ ok: true, reference: `SIM-${Date.now()}` });
      });
      overlay.querySelector('#pay-sim-cancel').addEventListener('click', () => {
        overlay.remove();
        resolve({ ok: false });
      });
    });
  }
}

let cached = null;
export function getCashoutProvider() {
  if (cached) return cached;
  cached = new SimulatedCashoutProvider();
  return cached;
}
