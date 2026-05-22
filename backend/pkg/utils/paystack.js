// Minimal Paystack helper. Talks to the live API when PAYSTACK_SECRET_KEY is set,
// otherwise the service layer falls back to a dev-mode shim that simulates success.

const BASE = "https://api.paystack.co";

const isEnabled = () => Boolean(process.env.PAYSTACK_SECRET_KEY);

const authHeaders = () => ({
  Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
  "Content-Type": "application/json",
});

async function initializeTransaction({ email, amountKobo, reference, callbackUrl, metadata }) {
  const res = await fetch(`${BASE}/transaction/initialize`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      email,
      amount: amountKobo,
      reference,
      callback_url: callbackUrl,
      metadata,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.status) {
    const msg = body?.message || `Paystack initialize failed (${res.status})`;
    const err = new Error(msg);
    err.providerResponse = body;
    throw err;
  }
  return body.data; // { authorization_url, access_code, reference }
}

async function verifyTransaction(reference) {
  const res = await fetch(`${BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: authHeaders(),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.status) {
    const msg = body?.message || `Paystack verify failed (${res.status})`;
    const err = new Error(msg);
    err.providerResponse = body;
    throw err;
  }
  return body.data; // { status: "success" | "failed" | ..., amount, paid_at, ... }
}

module.exports = { isEnabled, initializeTransaction, verifyTransaction };
