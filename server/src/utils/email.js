const nodemailer = require('nodemailer')

const createTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env
  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      family: 4,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  }

  const gmailUser = process.env.EMAIL
  const gmailPass = process.env.EMAILSECRET
  if (gmailUser && gmailPass) {
    return nodemailer.createTransport({
      service: 'gmail',
      family: 4,
      auth: { user: gmailUser, pass: gmailPass },
    })
  }

  return null
}

async function sendEmail({ to, subject, html, text }) {
  const transporter = createTransporter()
  if (!transporter) {
    console.log('Email skipped (SMTP not configured):', subject)
    return
  }

  const from =
    process.env.SMTP_FROM ||
    process.env.EMAIL ||
    process.env.SMTP_USER ||
    'Delxta <no-reply@delxta.com>'

  await transporter.sendMail({
    from,
    to,
    subject,
    html,
    text,
  })
}

module.exports = { sendEmail }
