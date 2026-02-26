const express = require('express')
const {
  login,
  me,
  register,
  updateMe,
  updateAvatar,
  verifyEmail,
  verifyEmailOtp,
  resendVerificationEmail,
  getDashboard,
} = require('../controllers/authController')
const { auth } = require('../middleware/auth')
const { uploadAvatar } = require('../middleware/upload')

const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.post('/resend-verification', resendVerificationEmail)
router.post('/verify-email-otp', verifyEmailOtp)
router.get('/me', auth, me)
router.put('/me', auth, updateMe)
router.post('/avatar', auth, uploadAvatar, updateAvatar)
router.get('/dashboard', auth, getDashboard)
router.get('/verify-email', verifyEmail)

module.exports = router
