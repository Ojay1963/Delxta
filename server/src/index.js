const express = require('express')
const path = require('path')
const cors = require('cors')
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const morgan = require('morgan')
const authRoutes = require('./routes/authRoutes')
const menuRoutes = require('./routes/menuRoutes')
const reservationRoutes = require('./routes/reservationRoutes')
const contactRoutes = require('./routes/contactRoutes')
const orderRoutes = require('./routes/orderRoutes')
const paymentRoutes = require('./routes/paymentRoutes')
const errorHandler = require('./middleware/error')
const seedDatabase = require('./utils/seed')
const ensureAdminUser = require('./utils/ensureAdminUser')

dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

const app = express()
const PORT = process.env.PORT || 5000
const hasSmtpConfig = Boolean(
  process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
)
const hasGmailConfig = Boolean(process.env.EMAIL && process.env.EMAILSECRET)

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'https://delxta.vercel.app'
    ],
    credentials: true
  })
)
app.use(express.json())
app.use(morgan('dev'))
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/menu', menuRoutes)
app.use('/api/reservations', reservationRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/payments', paymentRoutes)

app.use(errorHandler)

const mongoUri = process.env.MONGO_URI

if (!mongoUri) {
  console.error('Missing MONGO_URI in environment variables.')
  process.exit(1)
}

if (process.env.REQUIRE_EMAIL_VERIFICATION === 'true' && !hasSmtpConfig && !hasGmailConfig) {
  console.warn(
    'Email verification is enabled but no email transport credentials were loaded. OTP emails will fail.'
  )
}

if (
  Boolean(process.env.RENDER || process.env.RENDER_EXTERNAL_URL) &&
  [25, 465, 587].includes(Number(process.env.SMTP_PORT))
) {
  console.warn(
    'SMTP is configured on a commonly blocked port for free Render web services. If email delivery times out, switch SMTP_PORT to 2525 for providers like Brevo.'
  )
}

console.log('Runtime config:', {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: PORT,
  emailVerificationEnabled: process.env.REQUIRE_EMAIL_VERIFICATION === 'true',
  smtpConfigured: hasSmtpConfig,
  gmailConfigured: hasGmailConfig,
  smtpHostConfigured: Boolean(process.env.SMTP_HOST),
  smtpPortConfigured: Boolean(process.env.SMTP_PORT),
  smtpUserConfigured: Boolean(process.env.SMTP_USER),
  smtpPassConfigured: Boolean(process.env.SMTP_PASS),
  smtpFromConfigured: Boolean(process.env.SMTP_FROM),
  clientUrlConfigured: Boolean(process.env.CLIENT_URL),
  adminEmailConfigured: Boolean(process.env.ADMIN_EMAIL),
  adminPasswordConfigured: Boolean(process.env.ADMIN_PASSWORD),
})

mongoose
  .connect(mongoUri)
  .then(async () => {
    await seedDatabase()
    await ensureAdminUser()
    app.listen(PORT, () => {
      console.log(`Server running on ${PORT}`)
    })
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message)
    process.exit(1)
  })
