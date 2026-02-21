const express = require('express')
const {
  createReservation,
  getAdminReservations,
  updateReservationStatus,
} = require('../controllers/reservationController')
const { auth, adminOnly } = require('../middleware/auth')

const router = express.Router()

router.post('/', auth, createReservation)
router.get('/admin', auth, adminOnly, getAdminReservations)
router.patch('/:id/status', auth, adminOnly, updateReservationStatus)

module.exports = router
