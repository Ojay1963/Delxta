const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    phone: { type: String, trim: true, default: '' },
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'], default: 'prefer_not_to_say' },
    city: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: '' },
    addressLine1: { type: String, trim: true, default: '' },
    addressLine2: { type: String, trim: true, default: '' },
    stateRegion: { type: String, trim: true, default: '' },
    postalCode: { type: String, trim: true, default: '' },
    deliveryNotes: { type: String, trim: true, default: '' },
    bio: { type: String, trim: true, default: '' },
    avatarUrl: { type: String, trim: true, default: '' },
    avatarPublicId: { type: String, trim: true, default: '' },
    preferredContactMethod: {
      type: String,
      enum: ['email', 'phone', 'whatsapp'],
      default: 'email',
    },
    preferredDiningTime: {
      type: String,
      enum: ['lunch', 'dinner', 'late_night', 'flexible'],
      default: 'flexible',
    },
    dietaryPreference: {
      type: String,
      enum: ['none', 'vegetarian', 'vegan', 'halal', 'gluten_free'],
      default: 'none',
    },
    marketingOptIn: { type: Boolean, default: false },
    smsOptIn: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    emailVerificationOtpHash: { type: String, select: false },
    emailVerificationOtpExpires: { type: Date, select: false },
    emailVerificationOtpAttempts: { type: Number, default: 0, select: false },
  },
  { timestamps: true }
)

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password)
}

module.exports = mongoose.model('User', userSchema)
