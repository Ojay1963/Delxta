const nodemailer = require('nodemailer')

const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined) return defaultValue
  return String(value).trim().toLowerCase() === 'true'
}

const parseNumber = (value, fallback) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const createTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env
  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    const port = Number(SMTP_PORT)
    const secure =
      process.env.SMTP_SECURE !== undefined ? parseBoolean(process.env.SMTP_SECURE) : port === 465

    return nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure,
      family: 4,
      requireTLS: parseBoolean(process.env.SMTP_REQUIRE_TLS, !secure),
      connectionTimeout: parseNumber(process.env.SMTP_CONNECTION_TIMEOUT_MS, 15000),
      greetingTimeout: parseNumber(process.env.SMTP_GREETING_TIMEOUT_MS, 10000),
      socketTimeout: parseNumber(process.env.SMTP_SOCKET_TIMEOUT_MS, 20000),
      tls: {
        servername: SMTP_HOST,
      },
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

const mapEmailError = (error) => {
  const smtpPort = Number(process.env.SMTP_PORT)
  const runningOnRender = Boolean(process.env.RENDER || process.env.RENDER_EXTERNAL_URL)

  if (error?.code === 'ETIMEDOUT') {
    if (runningOnRender && [25, 465, 587].includes(smtpPort)) {
      return 'SMTP connection timed out. Free Render web services block outbound SMTP on ports 25, 465, and 587. Use Brevo port 2525 or move email sending to a paid instance/API provider.'
    }

    return 'SMTP connection timed out. Check the SMTP host, port, and provider network access.'
  }

  return 'Failed to send email. Check SMTP configuration and sender approval.'
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
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      to,
      from,
    })

    throw createHttpError(mapEmailError(error), 502)
  }
}

module.exports = { sendEmail }
