// Vercel serverless function: receives an order from the page and emails it to the shop via Resend.

const PRODUCTS = {
  "jasmine": "Јасмин",
  "lavender": "Лаванда",
  "gardenia": "Гарденија",
  "vanilla": "Ванила",
  "apple-cinnamon": "Јаболко и цимет",
  "lemon": "Лимон",
};

// 1 = 990, 2 = 1690, 3 = 2490; every full set of 3 at 2490, remainder at the 1 or 2 price.
const priceFor = (n) => Math.floor(n / 3) * 2490 + [0, 990, 1690][n % 3];
const fmt = (n) => n.toLocaleString("de-DE") + " ден.";
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clean = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  // Honeypot: bots fill the hidden "website" field; pretend success and send nothing.
  if (clean(body.website, 200)) return res.status(200).json({ ok: true, ref: "OK", total: 0 });

  const name = clean(body.name, 120);
  const phone = clean(body.phone, 40);
  const address = clean(body.address, 300);
  const notes = clean(body.notes, 1000);
  const pickup = body.delivery === "pickup";
  const digits = phone.replace(/\D/g, "");

  const items = (Array.isArray(body.items) ? body.items : [])
    .map((i) => ({ id: String(i && i.id), qty: Math.floor(Number(i && i.qty)) }))
    .filter((i) => PRODUCTS[i.id] && i.qty >= 1 && i.qty <= 50)
    .map((i) => ({ ...i, name: PRODUCTS[i.id] }));

  const count = items.reduce((a, i) => a + i.qty, 0);

  if (name.length < 3 || digits.length < 8 || digits.length > 15 || (!pickup && address.length < 5) || !count || count > 100) {
    return res.status(400).json({ ok: false, error: "invalid_order" });
  }

  const total = priceFor(count);
  const ref = "CMK-" + Date.now().toString(36).toUpperCase().slice(-6);
  const when = new Date().toLocaleString("mk-MK", { timeZone: "Europe/Skopje", dateStyle: "medium", timeStyle: "short" });

  const rows = items.map((i) => `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee">${esc(i.name)}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">${i.qty}</td></tr>`).join("");

  const html = `
  <div style="font-family:Arial,sans-serif;color:#221A33;max-width:560px">
    <h2 style="color:#7E58B2;margin:0 0 4px">Нова нарачка ${ref}</h2>
    <p style="margin:0 0 16px;color:#675E7C">${esc(when)}</p>
    <table style="border-collapse:collapse;width:100%;margin-bottom:16px">
      <tr><th style="text-align:left;padding:6px 12px;background:#F3EEFA">Мирис</th><th style="text-align:right;padding:6px 12px;background:#F3EEFA">Количина</th></tr>
      ${rows}
      <tr><td style="padding:8px 12px"><strong>Вкупно (${count} ${count === 1 ? "свеќа" : "свеќи"})</strong></td><td style="padding:8px 12px;text-align:right"><strong>${fmt(total)}</strong></td></tr>
    </table>
    <p style="margin:0 0 4px;padding:10px 12px;background:${pickup ? "#FFF4DE" : "#F3EEFA"};border-radius:8px"><strong>${pickup ? "ПОДИГАЊЕ ЛИЧНО во Скопје" : "ДОСТАВА до адреса (бесплатна)"}</strong> · плаќање во готово ${pickup ? "при подигање" : "при достава"}</p>
    <h3 style="margin:20px 0 8px">Купувач</h3>
    <p style="margin:0 0 4px"><strong>Име:</strong> ${esc(name)}</p>
    <p style="margin:0 0 4px"><strong>Телефон:</strong> <a href="tel:${esc(digits)}">${esc(phone)}</a></p>
    ${pickup ? "" : `<p style="margin:0 0 4px"><strong>Адреса:</strong> ${esc(address)}</p>`}
    ${notes ? `<p style="margin:0 0 4px"><strong>Дополнителни детали:</strong> ${esc(notes)}</p>` : ""}
  </div>`;

  const text = [
    `Нова нарачка ${ref} (${when})`,
    ...items.map((i) => `${i.name} × ${i.qty}`),
    `Вкупно: ${fmt(total)}`,
    pickup ? "ПОДИГАЊЕ ЛИЧНО во Скопје, плаќање при подигање" : "ДОСТАВА до адреса, плаќање при достава",
    ``,
    `Име: ${name}`,
    `Телефон: ${phone}`,
    pickup ? "" : `Адреса: ${address}`,
    notes ? `Детали: ${notes}` : "",
  ].join("\n");

  try {
    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.ORDER_TO;
    if (!apiKey || !to) throw new Error("Missing RESEND_API_KEY or ORDER_TO environment variable");
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        // onboarding@resend.dev works without domain setup, but only delivers to your Resend account's own email.
        // After verifying candles.mk in Resend, set ORDER_FROM to e.g. "candles.mk <naracki@candles.mk>".
        from: process.env.ORDER_FROM || "candles.mk нарачки <onboarding@resend.dev>",
        to: [to],
        subject: `Нова нарачка ${ref} · ${pickup ? "ПОДИГАЊЕ · " : ""}${name} · ${fmt(total)}`,
        text,
        html,
      }),
    });
    if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
  } catch (err) {
    console.error("Email failed:", err);
    return res.status(500).json({ ok: false, error: "email_failed" });
  }

  return res.status(200).json({ ok: true, ref, total });
};
