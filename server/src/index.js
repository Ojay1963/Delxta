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

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

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
