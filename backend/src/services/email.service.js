// Email transport with two implementations selected at startup:
//   1. SMTP via nodemailer — used when SMTP_HOST/SMTP_USER/SMTP_PASS are set
//   2. Console fallback   — logs to stdout, useful in dev
// Same send({ to, subject, text, html, from? }) interface either way.

const nodemailer = require("nodemailer");

let cachedTransport = null;

function buildTransport() {
  if (cachedTransport !== null) return cachedTransport;

  const host = process.env.SMTP_HOST;
  if (!host) {
    cachedTransport = { kind: "console" };
    return cachedTransport;
  }

  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });

  cachedTransport = { kind: "smtp", transporter };
  console.log(`📧 Email transport: SMTP (${host}:${port}, secure=${secure})`);
  return cachedTransport;
}

const defaultFrom = () =>
  process.env.EMAIL_FROM || "Eventu <no-reply@localhost>";

const send = async ({ to, subject, text, html, from }) => {
  if (!to) return { delivered: false, reason: "no recipient" };

  const t = buildTransport();

  if (t.kind === "console") {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[email] no SMTP configured in production — message dropped:",
        { to, subject },
      );
      return { delivered: false, reason: "no transport configured" };
    }
    const preview = (text || html || "")
      .toString()
      .slice(0, 200)
      .replace(/\s+/g, " ")
      .trim();
    console.log(`[email→${to}] ${subject}\n  ${preview}`);
    return { delivered: true, transport: "console" };
  }

  try {
    const info = await t.transporter.sendMail({
      from: from || defaultFrom(),
      to,
      subject,
      text,
      html,
    });
    return { delivered: true, transport: "smtp", messageId: info.messageId };
  } catch (err) {
    console.error("[email] SMTP send failed:", err.message);
    return { delivered: false, reason: err.message };
  }
};

const isConfigured = () => Boolean(process.env.SMTP_HOST);

module.exports = { send, isConfigured };
