const jwt = require('jsonwebtoken')
const User = require('../models/User')

const isEmailVerificationRequired = () => process.env.REQUIRE_EMAIL_VERIFICATION === 'true'

const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ message: 'Missing authorization header.' })
  }

  const token = authHeader.split(' ')[1]
  if (!token) {
    return res.status(401).json({ message: 'Missing token.' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (isEmailVerificationRequired()) {
      const user = await User.findById(decoded.id).select('isEmailVerified role')
      if (!user) {
        return res.status(401).json({ message: 'User not found.' })
      }
      if (!user.isEmailVerified) {
        return res.status(403).json({
          message: 'Please verify your email before signing in.',
          code: 'EMAIL_NOT_VERIFIED',
        })
      }
      req.user = { ...decoded, role: user.role }
      return next()
    }

    req.user = decoded
    return next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token.' })
  }
}

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' })
  }
  return next()
}

module.exports = { auth, adminOnly }
