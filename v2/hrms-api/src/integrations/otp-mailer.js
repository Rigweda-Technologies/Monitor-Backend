import nodemailer from 'nodemailer';
import fs from 'node:fs';
import path from 'node:path';

const renderTemplate = (template, data = {}, extension) => {
  const file = path.join(import.meta.dirname, '..', 'templates', `${template}.${extension}`);
  if (!fs.existsSync(file)) return null;
  let content = fs.readFileSync(file, 'utf8');
  for (const key of Object.keys(data)) content = content.replace(new RegExp(`{{${key}}}`, 'g'), String(data[key] ?? ''));
  return content;
};

export const createOtpMailer = ({ config, timeoutMs, createTransport = nodemailer.createTransport }) => {
  const transport = config.host && config.user && config.pass ? createTransport({ host: config.host, port: config.port, secure: config.secure, auth: { user: config.user, pass: config.pass }, connectionTimeout: timeoutMs, greetingTimeout: timeoutMs, socketTimeout: timeoutMs, logger: false, debug: false }) : null;
  return {
    async sendOtp({ email, otp }) {
      if (!transport) return false;
      try { await transport.sendMail({ from: config.from, to: email, subject: 'Your OTP', text: `Your OTP is: ${otp}`, html: `<p>Your OTP is:</p><h2>${otp}</h2><p>This OTP is valid for 10 minutes.</p>` }); return true; }
      catch { return false; }
    },
    async sendMail(template, toName, subject, content, toEmail) {
      if (!transport) return false;
      try {
        let html = ''; let text = '';
        if (typeof content === 'object' && content !== null) {
          html = renderTemplate(template, content, 'html');
          text = renderTemplate(template, content, 'txt');
          if (!html) return false;
        } else {
          html = `<p>${String(content ?? '')}</p>`;
          text = String(content ?? '');
        }
        await transport.sendMail({ from: config.from, to: toEmail, subject, html, text });
        return true;
      } catch { return false; }
    },
    close: () => transport?.close(),
  };
};
