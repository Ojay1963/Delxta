const MenuItem = require('../models/MenuItem')
const Order = require('../models/Order')
const User = require('../models/User')
const CheckoutSession = require('../models/CheckoutSession')
const { verifyTransaction } = require('../utils/paystack')
const { findUnitOption } = require('../utils/servingUnits')

const DELIVERY_FEE = 1500
const PHONE_11_DIGITS_REGEX = /^\d{11}$/
const CARD_NUMBER_REGEX = /^\d{13,19}$/
const CARD_EXPIRY_REGEX = /^(0[1-9]|1[0-2])\/\d{2}$/
const CARD_CVV_REGEX = /^\d{3,4}$/

const parsePrice = (price) => {
  if (typeof price === 'number') return price
  const normalized = String(price || '')
    .replace(/[^0-9.]/g, '')
    .trim()
  return Number(normalized) || 0
}

const buildUserOrderQuery = (user) => ({
  $or: [{ email: user.email }, { user: user._id || user.id }],
})

const validateCardDetails = (paymentDetails = {}) => {
  const cardNumberDigits = String(paymentDetails.cardNumber || '').replace(/\D/g, '')
  const cardHolderName = String(paymentDetails.cardHolderName || '').trim()
  const expiry = String(paymentDetails.expiry || '').trim()
  const cvv = String(paymentDetails.cvv || '').trim()

  if (
    !CARD_NUMBER_REGEX.test(cardNumberDigits) ||
    !cardHolderName ||
    !CARD_EXPIRY_REGEX.test(expiry) ||
    !CARD_CVV_REGEX.test(cvv)
  ) {
    const error = new Error('Complete valid card details are required.')
    error.status = 400
    throw error
  }

  return {
    cardReference: `card_${Date.now()}`,
    cardLast4: cardNumberDigits.slice(-4),
    cardHolderName,
    expiry,
  }
}

const buildOrderDraft = async (payload = {}, userId = null) => {
  const {
    customerName,
    email,
    phone,
    items = [],
    deliveryType = 'pickup',
    deliveryAddress = '',
    notes = '',
  } = payload

  if (!customerName?.trim() || !email?.trim() || !phone?.trim()) {
    const error = new Error('Name, email, and phone are required.')
    error.status = 400
    throw error
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
    const error = new Error('A valid email is required.')
    error.status = 400
    throw error
  }
  if (!PHONE_11_DIGITS_REGEX.test(String(phone).trim())) {
    const error = new Error('Phone number must be exactly 11 digits.')
    error.status = 400
    throw error
  }

  if (!Array.isArray(items) || items.length === 0) {
    const error = new Error('Add at least one menu item to place an order.')
    error.status = 400
    throw error
  }

  if (!['pickup', 'home_delivery'].includes(deliveryType)) {
    const error = new Error('Invalid delivery type selected.')
    error.status = 400
    throw error
  }

  if (deliveryType === 'home_delivery' && !deliveryAddress.trim()) {
    const error = new Error('Delivery address is required for home delivery.')
    error.status = 400
    throw error
  }

  const normalizedItems = items
    .map((item) => {
      const servingOption = String(item.servingOption || '')
      const quantity = Math.max(1, Number(item.quantity) || 1)
      return { menuItemId: item.menuItemId, quantity, servingOption }
    })
    .filter((item) => item.menuItemId)

  if (normalizedItems.length === 0) {
    const error = new Error('Order items are invalid.')
    error.status = 400
    throw error
  }

  const menuIds = normalizedItems.map((item) => item.menuItemId)
  const menuDocs = await MenuItem.find({ _id: { $in: menuIds } })
    .select('_id name price category')
    .lean()

  if (menuDocs.length !== normalizedItems.length) {
    const error = new Error('Some selected menu items were not found.')
    error.status = 400
    throw error
  }

  const menuMap = new Map(menuDocs.map((doc) => [String(doc._id), doc]))

  const orderItems = normalizedItems.map((item) => {
    const menuDoc = menuMap.get(String(item.menuItemId))
    const unit = findUnitOption(menuDoc, item.servingOption)
    const basePrice = parsePrice(menuDoc.price)
    const unitPrice = Math.round(basePrice * unit.multiplier)
    const lineTotal = unitPrice * item.quantity

    return {
      menuItem: menuDoc._id,
      name: menuDoc.name,
      servingOption: unit.value,
      servingLabel: unit.label,
      unitPrice,
      quantity: item.quantity,
      lineTotal,
    }
  })

  const subTotal = orderItems.reduce((sum, item) => sum + item.lineTotal, 0)
  const deliveryFee = deliveryType === 'home_delivery' ? DELIVERY_FEE : 0
  const total = subTotal + deliveryFee

  return {
    customerName: customerName.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    items: orderItems,
    subTotal,
    deliveryType,
    deliveryAddress: deliveryType === 'home_delivery' ? deliveryAddress.trim() : '',
    deliveryFee,
    total,
    notes: notes.trim(),
    user: userId || undefined,
    orderStatus: deliveryType === 'pickup' ? 'ready_for_pickup' : 'confirmed',
  }
}

const materializeOrderFromSession = async (session, payment) => {
  if (payment?.method === 'paystack') {
    const reference = String(payment?.details?.paystackReference || '').trim()
    if (reference) {
      const existingByReference = await Order.findOne({
        'paymentDetails.paystackReference': reference,
      })
      if (existingByReference) return existingByReference
    }
  }

  if (session.order) {
    const existing = await Order.findById(session.order)
    if (existing) return existing
  }

  const order = await Order.create({
    ...session.orderDraft,
    paymentMethod: payment.method,
    paymentStatus: payment.status,
    paymentDetails: payment.details || {},
  })

  session.order = order._id
  session.status = 'completed'
  await session.save()
  return order
}

const createCheckoutSession = async (req, res, next) => {
  try {
    const { paymentMethod } = req.body || {}
    if (!['paystack', 'card'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Invalid payment method selected.' })
    }

    const orderDraft = await buildOrderDraft(req.body, req.user?.id)
    const session = await CheckoutSession.create({
      email: orderDraft.email,
      amountKobo: orderDraft.total * 100,
      paymentMethod,
      orderDraft,
      user: req.user?.id,
      status: 'pending',
    })

    return res.status(201).json({
      message: 'Checkout session created.',
      checkoutSession: {
        id: session._id,
        paymentMethod: session.paymentMethod,
        amountKobo: session.amountKobo,
        total: orderDraft.total,
        expiresAt: session.expiresAt,
      },
    })
  } catch (error) {
    return next(error)
  }
}

const completeCardCheckout = async (req, res, next) => {
  try {
    const { id } = req.params
    const session = await CheckoutSession.findById(id)
    if (!session) return res.status(404).json({ message: 'Checkout session not found.' })
    if (session.paymentMethod !== 'card') {
      return res.status(400).json({ message: 'This session is not for card checkout.' })
    }
    if (session.status === 'expired') {
      return res.status(400).json({ message: 'Checkout session expired.' })
    }
    if (
      req.user?.role !== 'admin' &&
      (!session.user || String(session.user) !== String(req.user.id))
    ) {
      return res.status(403).json({ message: 'Not allowed for this checkout session.' })
    }

    const cardPaymentDetails = validateCardDetails(req.body?.paymentDetails)
    const order = await materializeOrderFromSession(session, {
      method: 'card',
      status: 'paid',
      details: cardPaymentDetails,
    })

    return res.json({
      message: 'Card payment successful and order placed.',
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

const createOrder = async (req, res, next) => {
  try {
    const { paymentMethod, paymentDetails = {} } = req.body || {}
    if (!['paystack', 'card', 'cash_on_delivery'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Invalid payment method selected.' })
    }

    const orderDraft = await buildOrderDraft(req.body, req.user?.id)

    if (paymentMethod === 'paystack') {
      const reference = String(paymentDetails.paystackReference || '').trim()
      if (!reference) {
        return res.status(400).json({ message: 'Paystack reference is required.' })
      }

      const existingByReference = await Order.findOne({
        'paymentDetails.paystackReference': reference,
      })
      if (existingByReference) {
        return res.json({
          message: 'Order already placed for this Paystack payment.',
          order: {
            id: existingByReference._id,
            total: existingByReference.total,
            paymentMethod: existingByReference.paymentMethod,
            paymentStatus: existingByReference.paymentStatus,
            deliveryType: existingByReference.deliveryType,
            orderStatus: existingByReference.orderStatus,
          },
        })
      }

      const verification = await verifyTransaction(reference)
      const paymentData = verification.data
      if (paymentData.status !== 'success') {
        return res.status(400).json({ message: 'Paystack payment is not successful.' })
      }
      if (Number(paymentData.amount) !== orderDraft.total * 100) {
        return res.status(400).json({ message: 'Paystack amount does not match order total.' })
      }

      const order = await Order.create({
        ...orderDraft,
        paymentMethod: 'paystack',
        paymentStatus: 'paid',
        paymentDetails: {
          paystackReference: String(paymentData.reference),
          paystackTransactionId: paymentData.id,
          paystackChannel: paymentData.channel,
        },
      })

      return res.status(201).json({
        message: 'Order placed successfully.',
        order: {
          id: order._id,
          total: order.total,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          deliveryType: order.deliveryType,
          orderStatus: order.orderStatus,
        },
      })
    }

    const cardPaymentDetails =
      paymentMethod === 'card' ? validateCardDetails(paymentDetails) : {}
    const order = await Order.create({
      ...orderDraft,
      paymentMethod,
      paymentStatus: paymentMethod === 'cash_on_delivery' ? 'pending' : 'paid',
      paymentDetails: cardPaymentDetails,
    })

    return res.status(201).json({
      message: 'Order placed successfully.',
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

const getMyOrders = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('email')
    if (!user) return res.status(404).json({ message: 'User not found.' })

    const orders = await Order.find(buildUserOrderQuery(user))
      .sort({ createdAt: -1 })
      .limit(50)
      .select('items total orderStatus paymentStatus deliveryType paymentMethod createdAt')

    return res.json({ orders })
  } catch (error) {
    return next(error)
  }
}

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params
    const order = await Order.findById(id).select(
      'customerName email phone items total subTotal deliveryFee orderStatus paymentStatus deliveryType deliveryAddress paymentMethod notes createdAt user'
    )
    if (!order) return res.status(404).json({ message: 'Order not found.' })

    if (req.user.role !== 'admin') {
      const user = await User.findById(req.user.id).select('email')
      if (!user) return res.status(404).json({ message: 'User not found.' })
      const isOwnerByUserId = order.user && String(order.user) === String(req.user.id)
      const isOwnerByEmail = String(order.email).toLowerCase() === String(user.email).toLowerCase()
      if (!isOwnerByUserId && !isOwnerByEmail) {
        return res.status(403).json({ message: 'Not allowed to view this order.' })
      }
    }

    return res.json({ order })
  } catch (error) {
    return next(error)
  }
}

const getAdminOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(250)
      .select(
        'customerName email phone items total subTotal deliveryFee orderStatus paymentStatus deliveryType paymentMethod createdAt'
      )
    return res.json({ orders })
  } catch (error) {
    return next(error)
  }
}

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { orderStatus } = req.body || {}

    const allowed = [
      'pending',
      'confirmed',
      'preparing',
      'out_for_delivery',
      'ready_for_pickup',
      'completed',
      'cancelled',
    ]
    if (!allowed.includes(orderStatus)) {
      return res.status(400).json({ message: 'Invalid order status.' })
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { orderStatus },
      { new: true, runValidators: true }
    ).select(
      'customerName email phone items total orderStatus paymentStatus deliveryType paymentMethod createdAt'
    )

    if (!order) return res.status(404).json({ message: 'Order not found.' })

    return res.json({ message: `Order marked as ${orderStatus}.`, order })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  createOrder,
  createCheckoutSession,
  completeCardCheckout,
  getMyOrders,
  getOrderById,
  getAdminOrders,
  updateOrderStatus,
  materializeOrderFromSession,
}
