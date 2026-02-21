const nodemailer = require('nodemailer')

const createTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })
}

async function sendEmail({ to, subject, html }) {
  const transporter = createTransporter()
  if (!transporter) {
    console.log('Email skipped (SMTP not configured):', subject)
    return
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'Delxta <no-reply@delxta.com>',
    to,
    subject,
    html,
  })
}

module.exports = { sendEmail }
