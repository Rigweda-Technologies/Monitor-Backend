const test = require('node:test');
const assert = require('node:assert/strict');
const nodemailer = require('nodemailer');

test('email utility remains compatible with the audited Nodemailer release', async () => {
  const original = nodemailer.createTransport;
  const delivered = [];
  nodemailer.createTransport = () => {
    const transport = original({ jsonTransport: true });
    return { sendMail: async options => {
      const result = await transport.sendMail(options);
      delivered.push(JSON.parse(result.message));
      return result;
    } };
  };
  const modulePath = require.resolve('../src/utils/sendMail');
  delete require.cache[modulePath];
  try {
    const sendMail = require(modulePath);
    assert.equal(await sendMail('otp', 'Test User', 'Sign in', '123456', 'user@example.invalid'), true);
    assert.equal(delivered[0].subject, 'Sign in');
    assert.match(delivered[0].html, /123456/);
    assert.equal(delivered[0].to[0].address, 'user@example.invalid');
    assert.equal(await sendMail('plain', 'Test User', 'Notice', 'Example body', 'user@example.invalid'), true);
    assert.equal(delivered[1].text, 'Example body');
  } finally {
    nodemailer.createTransport = original;
    delete require.cache[modulePath];
  }
});
