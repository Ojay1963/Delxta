const express = require('express')
const {
  createOrder,
  createCheckoutSession,
  completeCardCheckout,
  getMyOrders,
  getOrderById,
  getAdminOrders,
  updateOrderStatus,
} = require('../controllers/orderController')
const { auth, adminOnly } = require('../middleware/auth')

const router = express.Router()

router.post('/', auth, createOrder)
router.post('/checkout-session', auth, createCheckoutSession)
router.post('/checkout-session/:id/complete-card', auth, completeCardCheckout)
router.get('/my', auth, getMyOrders)
router.get('/:id', auth, getOrderById)
router.get('/admin', auth, adminOnly, getAdminOrders)
router.patch('/:id/status', auth, adminOnly, updateOrderStatus)

module.exports = router
