const express = require('express')
const {
  createOrder,
  createCheckoutSession,
  completeCardCheckout,
  getMyOrders,
  getOrderById,
  getAdminOrders,
  cancelMyOrder,
  updateOrderStatus,
} = require('../controllers/orderController')
const { auth, adminOnly } = require('../middleware/auth')

const router = express.Router()

router.post('/', auth, createOrder)
router.post('/checkout-session', auth, createCheckoutSession)
router.post('/checkout-session/:id/complete-card', auth, completeCardCheckout)
router.get('/my', auth, getMyOrders)
router.get('/admin', auth, adminOnly, getAdminOrders)
router.patch('/:id/cancel', auth, cancelMyOrder)
router.patch('/:id/status', auth, adminOnly, updateOrderStatus)
router.get('/:id', auth, getOrderById)

module.exports = router
