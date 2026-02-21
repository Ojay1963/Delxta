const mongoose = require('mongoose')

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true,
    },
    name: { type: String, required: true },
    servingOption: {
      type: String,
      required: true,
      trim: true,
    },
    servingLabel: { type: String, required: true },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true },
  },
  { _id: false }
)

const orderSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    items: { type: [orderItemSchema], required: true },
    subTotal: { type: Number, required: true },
    deliveryType: {
      type: String,
      enum: ['pickup', 'home_delivery'],
      default: 'pickup',
    },
    deliveryAddress: { type: String, trim: true },
    deliveryFee: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['paystack', 'card', 'cash_on_delivery'],
      required: true,
    },
    paymentDetails: {
      paystackReference: { type: String, trim: true },
      paystackTransactionId: { type: Number },
      paystackChannel: { type: String, trim: true },
      cardReference: { type: String, trim: true },
      cardLast4: { type: String, trim: true },
      cardHolderName: { type: String, trim: true },
      expiry: { type: String, trim: true },
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending',
    },
    orderStatus: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'preparing',
        'out_for_delivery',
        'ready_for_pickup',
        'completed',
        'cancelled',
      ],
      default: 'pending',
    },
    notes: { type: String, trim: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Order', orderSchema)
