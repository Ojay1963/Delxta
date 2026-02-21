const mongoose = require('mongoose')

const checkoutSessionSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true },
    amountKobo: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['paystack', 'card'],
      required: true,
    },
    orderDraft: { type: mongoose.Schema.Types.Mixed, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    paystackReference: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'payment_initiated', 'paid', 'completed', 'failed', 'expired'],
      default: 'pending',
    },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 2 * 60 * 60 * 1000),
      index: { expires: 0 },
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('CheckoutSession', checkoutSessionSchema)
