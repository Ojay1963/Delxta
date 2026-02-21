const CheckoutSession = require('../models/CheckoutSession')
const Order = require('../models/Order')
const { initializeTransaction, verifyTransaction } = require('../utils/paystack')
const { materializeOrderFromSession } = require('./orderController')

const isSessionOwner = (session, user) =>
  Boolean(session?.user) && String(session.user) === String(user?.id)

const initializePaystackPayment = async (req, res, next) => {
  try {
    const { checkoutSessionId, callbackUrl } = req.body || {}
    if (!checkoutSessionId) {
      return res.status(400).json({ message: 'checkoutSessionId is required.' })
    }

    const session = await CheckoutSession.findById(checkoutSessionId)
    if (!session) return res.status(404).json({ message: 'Checkout session not found.' })
    if (session.paymentMethod !== 'paystack') {
      return res.status(400).json({ message: 'This checkout session is not for Paystack.' })
    }
    if (session.status === 'completed') {
      return res.status(400).json({ message: 'Checkout session already completed.' })
    }
    if (req.user?.role !== 'admin' && !isSessionOwner(session, req.user)) {
      return res.status(403).json({ message: 'Not allowed for this checkout session.' })
    }

    const reference = `delxta_${Date.now()}_${String(session._id).slice(-6)}`
    const callback_url = callbackUrl || process.env.PAYSTACK_CALLBACK_URL

    const data = await initializeTransaction({
      email: session.email,
      amount: session.amountKobo,
      reference,
      callback_url,
      metadata: {
        checkoutSessionId: String(session._id),
      },
    })

    session.paystackReference = reference
    session.status = 'payment_initiated'
    await session.save()

    return res.status(201).json({
      message: 'Payment initialized.',
      payment: {
        reference: data.data.reference,
        authorizationUrl: data.data.authorization_url,
        accessCode: data.data.access_code,
      },
    })
  } catch (error) {
    return next(error)
  }
}

const completePaystackPayment = async (req, res, next) => {
  try {
    const { reference } = req.body || {}
    if (!reference) return res.status(400).json({ message: 'Payment reference is required.' })

    const existingOrder = await Order.findOne({
      'paymentDetails.paystackReference': reference,
    }).select('_id')

    if (existingOrder) {
      return res.json({
        message: 'Payment already verified and order completed.',
        order: { id: existingOrder._id },
      })
    }

    const existingSession = await CheckoutSession.findOne({ paystackReference: reference })
      .select('order')
      .lean()

    if (existingSession?.order) {
      return res.json({
        message: 'Payment already verified and order completed.',
        order: { id: existingSession.order },
      })
    }

    const verified = await verifyTransaction(reference)
    const payment = verified.data
    if (payment.status !== 'success') {
      return res.status(400).json({ message: 'Paystack payment is not successful.' })
    }

    const metadataSessionId = payment.metadata?.checkoutSessionId
    let session = null
    if (metadataSessionId) {
      session = await CheckoutSession.findById(metadataSessionId)
    }
    if (!session) {
      session = await CheckoutSession.findOne({ paystackReference: reference })
    }
    if (!session) {
      return res.status(404).json({ message: 'Checkout session not found for this payment.' })
    }
    if (req.user?.role !== 'admin' && !isSessionOwner(session, req.user)) {
      return res.status(403).json({ message: 'Not allowed for this checkout session.' })
    }

    if (Number(payment.amount) !== Number(session.amountKobo)) {
      return res.status(400).json({ message: 'Payment amount does not match checkout total.' })
    }

    const order = await materializeOrderFromSession(session, {
      method: 'paystack',
      status: 'paid',
      details: {
        paystackReference: String(payment.reference),
        paystackTransactionId: payment.id,
        paystackChannel: payment.channel,
      },
    })

    return res.json({
      message: 'Payment verified and order completed.',
      order: {
        id: order._id,
        total: order.total,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        deliveryType: order.deliveryType,
        orderStatus: order.orderStatus,
      },
    })
  } catch (error) {
    return next(error)
  }
}

const verifyPaystackPayment = async (req, res, next) => {
  try {
    const { reference } = req.params
    if (!reference) return res.status(400).json({ message: 'Payment reference is required.' })
    const data = await verifyTransaction(reference)
    return res.json({ message: 'Payment verified.', payment: data.data })
  } catch (error) {
    return next(error)
  }
}

module.exports = { initializePaystackPayment, completePaystackPayment, verifyPaystackPayment }
