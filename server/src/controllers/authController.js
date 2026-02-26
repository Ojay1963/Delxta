const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const User = require('../models/User')
const Reservation = require('../models/Reservation')
const Order = require('../models/Order')
const { sendEmail } = require('../utils/email')

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone || '',
  gender: user.gender || 'prefer_not_to_say',
  city: user.city || '',
  country: user.country || '',
  bio: user.bio || '',
  avatarUrl: user.avatarUrl || '',
  isEmailVerified: Boolean(user.isEmailVerified),
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
})

const createToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  })

const isEmailVerificationRequired = () => process.env.REQUIRE_EMAIL_VERIFICATION === 'true'

const generateEmailOtp = () => String(Math.floor(100000 + Math.random() * 900000))

const hashOtp = (otp) => crypto.createHash('sha256').update(String(otp)).digest('hex')

const issueEmailVerificationOtp = async (user) => {
  const otp = generateEmailOtp()

  user.emailVerificationOtpHash = hashOtp(otp)
  user.emailVerificationOtpExpires = Date.now() + 10 * 60 * 1000
  user.emailVerificationOtpAttempts = 0
  user.emailVerificationToken = undefined
  user.emailVerificationExpires = undefined
  await user.save()

  await sendEmail({
    to: user.email,
    subject: 'Your Delxta verification code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="margin-bottom: 8px;">Verify your email</h2>
        <p style="margin-top: 0;">Hi ${user.name || 'there'}, use this one-time code to verify your Delxta account.</p>
        <div style="background:#13b4ff; color:#fff; padding:16px 20px; border-radius:8px; text-align:center; letter-spacing:6px; font-size:28px; font-weight:700;">
          ${otp}
        </div>
        <p style="margin-top: 14px;">This code expires in 10 minutes.</p>
      </div>
    `,
    text: `Your Delxta verification code is ${otp}. It expires in 10 minutes.`,
  })

  return otp
}

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' })
    }
    const normalizedEmail = String(email).trim().toLowerCase()
    const existing = await User.findOne({ email: normalizedEmail })

    if (!isEmailVerificationRequired()) {
      if (existing) {
        if (existing.isEmailVerified) {
          return res.status(409).json({ message: 'Email already in use.' })
        }

        existing.name = name
        existing.password = password
        existing.isEmailVerified = true
        existing.emailVerificationToken = undefined
        existing.emailVerificationExpires = undefined
        await existing.save()

        return res.status(200).json({
          message: 'Registration successful. You can sign in now.',
        })
      }

      await User.create({
        name,
        email: normalizedEmail,
        password,
        isEmailVerified: true,
      })

      return res.status(201).json({
        message: 'Registration successful. You can sign in now.',
      })
    }

    if (existing) {
      if (existing.isEmailVerified) {
        return res.status(409).json({ message: 'Email already in use.' })
      }

      existing.name = name
      existing.password = password
      const verificationOtp = await issueEmailVerificationOtp(existing)

      const response = {
        message:
          'An account with this email is pending verification. We sent a new OTP code.',
        verificationMethod: 'otp',
        email: existing.email,
      }

      if (
        !process.env.SMTP_HOST &&
        !process.env.EMAIL &&
        process.env.NODE_ENV !== 'production'
      ) {
        response.verificationOtp = verificationOtp
      }

      return res.status(200).json(response)
    }
    const user = await User.create({ name, email: normalizedEmail, password })
    const verificationOtp = await issueEmailVerificationOtp(user)

    const response = {
      message: 'Registration successful. Please verify your email with the OTP sent.',
      verificationMethod: 'otp',
      email: user.email,
    }

    if (
      !process.env.SMTP_HOST &&
      !process.env.EMAIL &&
      process.env.NODE_ENV !== 'production'
    ) {
      response.verificationOtp = verificationOtp
    }

    return res.status(201).json(response)
  } catch (error) {
    return next(error)
  }
}

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required.' })
    }
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' })
    }
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' })
    }
    if (isEmailVerificationRequired() && !user.isEmailVerified) {
      return res.status(403).json({
        message: 'Please verify your email before signing in.',
        code: 'EMAIL_NOT_VERIFIED',
      })
    }
    const token = createToken(user)
    return res.json({
      token,
      user: serializeUser(user),
    })
  } catch (error) {
    return next(error)
  }
}

const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }
    return res.json({ user: serializeUser(user) })
  } catch (error) {
    return next(error)
  }
}

const updateMe = async (req, res, next) => {
  try {
    const body = req.body || {}
    const allowedFields = [
      'name',
      'phone',
      'gender',
      'city',
      'country',
      'bio',
    ]

    const updates = {}
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        updates[field] = body[field]
      }
    }

    if (updates.name !== undefined && !String(updates.name).trim()) {
      return res.status(400).json({ message: 'Name cannot be empty.' })
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    }).select('-password')

    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }

    return res.json({
      message: 'Profile updated successfully.',
      user: serializeUser(user),
    })
  } catch (error) {
    return next(error)
  }
}

const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Avatar image is required.' })
    }

    const avatarUrl = `/uploads/${req.file.filename}`
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatarUrl },
      { new: true, runValidators: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }

    return res.json({
      message: 'Profile photo updated.',
      user: serializeUser(user),
    })
  } catch (error) {
    return next(error)
  }
}

const verifyEmail = async (req, res, next) => {
  try {
    const token = req.query.token || req.body.token
    if (!token) {
      return res.status(400).json({ message: 'Verification token is required.' })
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const user = await User.findOne({
      emailVerificationToken: tokenHash,
      emailVerificationExpires: { $gt: new Date() },
    })

    if (!user) {
      return res.status(400).json({ message: 'Verification link is invalid or has expired.' })
    }

    user.isEmailVerified = true
    user.emailVerificationToken = undefined
    user.emailVerificationExpires = undefined
    user.emailVerificationOtpHash = undefined
    user.emailVerificationOtpExpires = undefined
    user.emailVerificationOtpAttempts = 0
    await user.save()

    return res.json({ message: 'Email verified successfully. You can now sign in.' })
  } catch (error) {
    return next(error)
  }
}

const verifyEmailOtp = async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase()
    const otp = String(req.body?.otp || '').trim()

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required.' })
    }

    const user = await User.findOne({ email }).select(
      '+emailVerificationOtpHash +emailVerificationOtpExpires +emailVerificationOtpAttempts'
    )

    if (!user) {
      return res.status(404).json({ message: 'No account found for that email.' })
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        message: 'This email is already verified. You can sign in.',
        code: 'EMAIL_ALREADY_VERIFIED',
      })
    }

    if (!user.emailVerificationOtpHash || !user.emailVerificationOtpExpires) {
      return res.status(400).json({
        message: 'No OTP is active for this email. Request a new verification code.',
        code: 'OTP_NOT_REQUESTED',
      })
    }

    if (user.emailVerificationOtpExpires <= new Date()) {
      return res.status(400).json({
        message: 'OTP has expired. Request a new verification code.',
        code: 'OTP_EXPIRED',
      })
    }

    if ((user.emailVerificationOtpAttempts || 0) >= 5) {
      return res.status(429).json({
        message: 'Too many incorrect OTP attempts. Request a new verification code.',
        code: 'OTP_ATTEMPTS_EXCEEDED',
      })
    }

    const isMatch = user.emailVerificationOtpHash === hashOtp(otp)
    if (!isMatch) {
      user.emailVerificationOtpAttempts = (user.emailVerificationOtpAttempts || 0) + 1
      await user.save()
      return res.status(400).json({
        message: 'Invalid OTP code.',
        code: 'OTP_INVALID',
      })
    }

    user.isEmailVerified = true
    user.emailVerificationOtpHash = undefined
    user.emailVerificationOtpExpires = undefined
    user.emailVerificationOtpAttempts = 0
    user.emailVerificationToken = undefined
    user.emailVerificationExpires = undefined
    await user.save()

    return res.json({ message: 'Email verified successfully. You can now sign in.' })
  } catch (error) {
    return next(error)
  }
}

const resendVerificationEmail = async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase()
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: 'No account found for that email.' })
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        message: 'This email is already verified. You can sign in.',
        code: 'EMAIL_ALREADY_VERIFIED',
      })
    }

    const verificationOtp = await issueEmailVerificationOtp(user)
    const response = {
      message: 'Verification OTP sent. Please check your inbox.',
      verificationMethod: 'otp',
      email: user.email,
    }

    if (
      !process.env.SMTP_HOST &&
      !process.env.EMAIL &&
      process.env.NODE_ENV !== 'production'
    ) {
      response.verificationOtp = verificationOtp
    }

    return res.json(response)
  } catch (error) {
    return next(error)
  }
}

const getDashboard = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }

    const userOrderQuery = { $or: [{ email: user.email }, { user: user._id }] }
    const totalReservations = await Reservation.countDocuments({ email: user.email })
    const pendingReservations = await Reservation.countDocuments({
      email: user.email,
      status: 'pending',
    })

    const recentReservations = await Reservation.find({ email: user.email })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('date time guests status createdAt')

    const totalOrders = await Order.countDocuments(userOrderQuery)
    const activeOrders = await Order.countDocuments({
      ...userOrderQuery,
      orderStatus: { $in: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'ready_for_pickup'] },
    })
    const paidOrders = await Order.countDocuments({
      ...userOrderQuery,
      paymentStatus: 'paid',
    })

    const recentOrders = await Order.find(userOrderQuery)
      .sort({ createdAt: -1 })
      .limit(5)
      .select('total orderStatus paymentStatus deliveryType paymentMethod createdAt items')

    let adminOrderSummary = null
    if (user.role === 'admin') {
      const grouped = await Order.aggregate([
        {
          $group: {
            _id: '$orderStatus',
            count: { $sum: 1 },
          },
        },
      ])

      adminOrderSummary = {
        all: grouped.reduce((sum, item) => sum + item.count, 0),
        pending: 0,
        confirmed: 0,
        preparing: 0,
        out_for_delivery: 0,
        ready_for_pickup: 0,
        completed: 0,
        cancelled: 0,
      }

      for (const item of grouped) {
        if (Object.prototype.hasOwnProperty.call(adminOrderSummary, item._id)) {
          adminOrderSummary[item._id] = item.count
        }
      }
    }

    return res.json({
      stats: {
        totalReservations,
        pendingReservations,
        totalOrders,
        activeOrders,
        paidOrders,
        profileCompletion: Math.round(
          ([user.name, user.phone, user.city, user.country, user.bio].filter(Boolean).length / 5) *
            100
        ),
        memberSince: user.createdAt,
      },
      recentReservations,
      recentOrders,
      adminOrderSummary,
    })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  register,
  login,
  me,
  updateMe,
  updateAvatar,
  verifyEmail,
  verifyEmailOtp,
  resendVerificationEmail,
  getDashboard,
}
