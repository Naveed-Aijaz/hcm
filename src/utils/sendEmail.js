import { createMailTransport } from '../config/nodemailerConfig.js';

// Uses the SMTP_* variables documented in .env.example
const sendEmail = async ({ email, subject, message }) => {
  const transporter = createMailTransport();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject,
    text: message,
  });
};

export default sendEmail;
