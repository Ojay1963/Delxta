const express = require('express')
const {
  initializePaystackPayment,
  completePaystackPayment,
  verifyPaystackPayment,
} = require('../controllers/paymentController')
const { auth } = require('../middleware/auth')

const router = express.Router()

router.post('/paystack/initialize', auth, initializePaystackPayment)
router.post('/paystack/complete', auth, completePaystackPayment)
router.get('/paystack/verify/:reference', auth, verifyPaystackPayment)

module.exports = router
