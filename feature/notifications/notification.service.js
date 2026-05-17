const { sendEmail } = require("./email.service.js");

const fs = require("fs");
const path = require("path");

const loadTemplate = (templateName) => {
  const templatePath = path.join(__dirname, "templates", templateName);

  return fs.readFileSync(templatePath, "utf-8");
};

// payment success email
const sendPaymentSuccessNotification = async (user, payment) => {
  let html = loadTemplate("payment-success.html");

  html = html.replace("{{name}}", user.name);
  html = html.replace("{{amount}}", payment.amount);
  html = html.replace("{{reference}}", payment.reference);

  console.log("📩 Sending success email...");
  console.log("Recipient:", user.email);
  console.log("Payment ref:", payment.reference);

  await sendEmail({
    to: user.email,
    subject: "Payment Successful",
    html,
  });
};

// payment failure email
const sendPaymentFailureNotification = async (user, payment) => {
  let html = loadTemplate("payment-failure.html");

  html = html.replace("{{name}}", user.name);
  html = html.replace("{{amount}}", payment.amount);
  html = html.replace("{{reference}}", payment.reference);

  await sendEmail({
    to: user.email,
    subject: "Payment Failed",
    html,
  });
};
