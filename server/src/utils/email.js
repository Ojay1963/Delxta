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

const createHttpError = (message, status) => {
  const error = new Error(message)
  error.status = status
  return error
}

async function sendEmail({ to, subject, html, text }) {
  const transporter = createTransporter()
  if (!transporter) {
    throw createHttpError('Email service is not configured on the server.', 503)
  }

  const from =
    process.env.SMTP_FROM ||
    process.env.EMAIL ||
    process.env.SMTP_USER ||
    'Delxta <no-reply@delxta.com>'

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text,
    })
  } catch (error) {
    console.error('Email delivery failed:', {
      message: error.message,
      code: error.code,
      response: error.response,
      responseCode: error.responseCode,
      command: error.command,
      to,
      from,
    })

    throw createHttpError('Failed to send email. Check SMTP configuration and sender approval.', 502)
  }
}

module.exports = { sendEmail }
