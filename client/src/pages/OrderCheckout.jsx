import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest } from '../utils/api'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

const deliveryFeeValue = 1500

const formatCurrency = (amount) => `NGN ${amount.toLocaleString()}`

const initialForm = {
  customerName: '',
  email: '',
  phone: '',
  deliveryType: 'pickup',
  deliveryAddress: '',
  paymentMethod: 'cash_on_delivery',
  notes: '',
}

const initialCardDetails = {
  cardNumber: '',
  cardHolderName: '',
  expiry: '',
  cvv: '',
}

function OrderCheckout() {
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart()
  const { token } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [cardDetails, setCardDetails] = useState(initialCardDetails)
  const [showCvv, setShowCvv] = useState(false)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')
  const isSubmittingRef = useRef(false)

  const deliveryFee = form.deliveryType === 'home_delivery' ? deliveryFeeValue : 0
  const total = useMemo(() => subtotal + deliveryFee, [subtotal, deliveryFee])

  const validate = () => {
    const next = {}
    if (items.length === 0) next.items = 'Your order is empty.'
    if (!form.customerName.trim()) next.customerName = 'Name is required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Valid email required.'
    if (!form.phone.trim()) next.phone = 'Phone is required.'
    if (!/^\d{11}$/.test(form.phone.trim())) next.phone = 'Phone number must be exactly 11 digits.'
    if (!['pickup', 'home_delivery'].includes(form.deliveryType)) {
      next.deliveryType = 'Delivery option is required.'
    }
    if (!['cash_on_delivery', 'paystack', 'card'].includes(form.paymentMethod)) {
      next.paymentMethod = 'Payment method is required.'
    }
    if (form.deliveryType === 'home_delivery' && !form.deliveryAddress.trim()) {
      next.deliveryAddress = 'Delivery address is required.'
    }
    if (form.paymentMethod === 'card') {
      const digits = cardDetails.cardNumber.replace(/\D/g, '')
      if (digits.length < 13 || digits.length > 19) {
        next.cardNumber = 'Enter a valid card number.'
      }
      if (!cardDetails.cardHolderName.trim()) {
        next.cardHolderName = 'Card holder name is required.'
      }
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardDetails.expiry.trim())) {
        next.expiry = 'Use expiry format MM/YY.'
      }
      if (!/^\d{3,4}$/.test(cardDetails.cvv.trim())) {
        next.cvv = 'CVV must be 3 or 4 digits.'
      }
    }
    return next
  }

  const submitOrder = async (event) => {
    event.preventDefault()
    if (isSubmittingRef.current) return

    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    isSubmittingRef.current = true
    const orderPayload = {
      customerName: form.customerName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      deliveryType: form.deliveryType,
      deliveryAddress: form.deliveryType === 'home_delivery' ? form.deliveryAddress.trim() : '',
      paymentMethod: form.paymentMethod,
      notes: form.notes.trim(),
      items: items.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        servingOption: item.servingOption,
      })),
    }

    setStatus('loading')
    try {
      if (form.paymentMethod === 'card') {
        const sessionData = await apiRequest('/api/orders/checkout-session', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            ...orderPayload,
            paymentMethod: 'card',
          }),
        })
        const checkoutSessionId = sessionData?.checkoutSession?.id
        if (!checkoutSessionId) throw new Error('Could not create checkout session.')

        const data = await apiRequest(`/api/orders/checkout-session/${checkoutSessionId}/complete-card`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            paymentDetails: {
              cardNumber: cardDetails.cardNumber,
              cardHolderName: cardDetails.cardHolderName,
              expiry: cardDetails.expiry,
              cvv: cardDetails.cvv,
            },
          }),
        })

        clearCart()
        setStatus('success')
        setErrors({})
        setCardDetails(initialCardDetails)
        navigate(`/order/success/${data.order.id}`)
        return
      }

      if (form.paymentMethod === 'cash_on_delivery') {
        const data = await apiRequest('/api/orders', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            ...orderPayload,
            paymentMethod: 'cash_on_delivery',
          }),
        })
        clearCart()
        setStatus('success')
        setErrors({})
        setCardDetails(initialCardDetails)
        navigate(`/order/success/${data.order.id}`)
        return
      }

      const sessionData = await apiRequest('/api/orders/checkout-session', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...orderPayload,
          paymentMethod: 'paystack',
        }),
      })
      const checkoutSessionId = sessionData?.checkoutSession?.id
      if (!checkoutSessionId) throw new Error('Could not create checkout session.')

      const callbackUrl = `${window.location.origin}/payment/callback`
      const data = await apiRequest('/api/payments/paystack/initialize', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          checkoutSessionId,
          callbackUrl,
        }),
      })

      const { authorizationUrl } = data.payment
      window.location.assign(authorizationUrl)
    } catch (error) {
      setStatus('error')
      setErrors({
        submit:
          error.message ||
          (form.paymentMethod === 'card'
            ? 'Could not process card payment.'
            : form.paymentMethod === 'cash_on_delivery'
              ? 'Could not place your order.'
            : 'Could not initialize Paystack payment.'),
      })
    } finally {
      isSubmittingRef.current = false
    }
  }

  return (
    <section className="section">
      <div className="container">
        <h2 className="section-title">Review Order & Payment</h2>
        <p className="section-subtitle">Delivery details, payment option, and final confirmation.</p>
        <div className="panel" style={{ marginBottom: '16px' }}>
          <strong>Checkout Steps:</strong> 1) Order Summary 2) Delivery Information 3) Payment Method 4) Place Order
        </div>

        <div className="checkout-layout">
          <div className="panel">
            <h3>Order Summary</h3>
            {items.length === 0 && (
              <div className="loading">
                Your order is empty. <Link to="/menu">Go to menu</Link>
              </div>
            )}

            {items.length > 0 && (
              <div className="order-list">
                {items.map((item) => (
                  <div className="order-item" key={item.key}>
                    <div>
                      <strong>{item.name}</strong>
                      <div className="order-item-price">
                        {item.servingLabel} x {formatCurrency(item.unitPrice)}
                      </div>
                    </div>
                    <input
                      className="input qty-input"
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.key, e.target.value)}
                    />
                    <button type="button" className="btn btn-muted" onClick={() => removeItem(item.key)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="order-total">
              <div>
                Subtotal <strong>{formatCurrency(subtotal)}</strong>
              </div>
              <div>
                Delivery Fee <strong>{formatCurrency(deliveryFee)}</strong>
              </div>
              <div className="order-grand-total">
                Total <strong>{formatCurrency(total)}</strong>
              </div>
            </div>
          </div>

          <form className="form-card" onSubmit={submitOrder}>
            <h3 style={{ marginTop: 0 }}>Delivery Information</h3>
            <div className="form-grid">
              <div>
                <label className="form-label">Name</label>
                <input
                  className="input"
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                />
                {errors.customerName && <div className="form-error">{errors.customerName}</div>}
              </div>
              <div>
                <label className="form-label">Email</label>
                <input
                  className="input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                {errors.email && <div className="form-error">{errors.email}</div>}
              </div>
              <div>
                <label className="form-label">Phone</label>
                <input
                  className="input"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="08012345678"
                  maxLength={11}
                  inputMode="numeric"
                />
                {errors.phone && <div className="form-error">{errors.phone}</div>}
              </div>
              <div>
                <label className="form-label">Delivery Option</label>
                <select
                  className="select"
                  value={form.deliveryType}
                  onChange={(e) => setForm({ ...form, deliveryType: e.target.value })}
                >
                  <option value="pickup">Pickup</option>
                  <option value="home_delivery">Home Delivery (+NGN 1,500)</option>
                </select>
                {errors.deliveryType && <div className="form-error">{errors.deliveryType}</div>}
              </div>
              <div>
                <label className="form-label">Payment Method</label>
                <div className="panel" style={{ padding: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash_on_delivery"
                      checked={form.paymentMethod === 'cash_on_delivery'}
                      onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    />{' '}
                    Cash on Delivery
                  </label>
                  <label style={{ display: 'block', marginBottom: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paystack"
                      checked={form.paymentMethod === 'paystack'}
                      onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    />{' '}
                    Paystack (Card/Transfer)
                  </label>
                  <label style={{ display: 'block', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={form.paymentMethod === 'card'}
                      onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    />{' '}
                    Card (Simulated)
                  </label>
                </div>
                {errors.paymentMethod && <div className="form-error">{errors.paymentMethod}</div>}
              </div>
            </div>

            {form.paymentMethod === 'card' && (
              <div className="panel" style={{ marginTop: '16px', padding: '16px' }}>
                <h4 style={{ marginTop: 0 }}>Card Details</h4>
                <div className="form-grid">
                  <div>
                    <label className="form-label">Card Number</label>
                    <input
                      className="input"
                      value={cardDetails.cardNumber}
                      onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value })}
                      placeholder="4111 1111 1111 1111"
                      inputMode="numeric"
                    />
                    {errors.cardNumber && <div className="form-error">{errors.cardNumber}</div>}
                  </div>
                  <div>
                    <label className="form-label">Card Holder Name</label>
                    <input
                      className="input"
                      value={cardDetails.cardHolderName}
                      onChange={(e) => setCardDetails({ ...cardDetails, cardHolderName: e.target.value })}
                      placeholder="JOHN DOE"
                    />
                    {errors.cardHolderName && <div className="form-error">{errors.cardHolderName}</div>}
                  </div>
                  <div>
                    <label className="form-label">Expiry (MM/YY)</label>
                    <input
                      className="input"
                      value={cardDetails.expiry}
                      onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                      placeholder="12/28"
                    />
                    {errors.expiry && <div className="form-error">{errors.expiry}</div>}
                  </div>
                  <div>
                    <label className="form-label">CVV</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="input"
                        type={showCvv ? 'text' : 'password'}
                        value={cardDetails.cvv}
                        onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                        placeholder="123"
                        inputMode="numeric"
                        maxLength={4}
                        style={{ paddingRight: '68px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCvv((prev) => !prev)}
                        aria-label={showCvv ? 'Hide CVV' : 'Show CVV'}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--text-300)',
                          cursor: 'pointer',
                          padding: 0,
                          lineHeight: 0,
                        }}
                      >
                        {showCvv ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path
                              d="M3 3L21 21M10.58 10.58C10.21 10.95 10 11.46 10 12C10 13.1 10.9 14 12 14C12.54 14 13.05 13.79 13.42 13.42M9.88 5.09C10.56 4.86 11.27 4.75 12 4.75C17.25 4.75 21 12 21 12C20.43 13.06 19.71 14.03 18.88 14.88M6.61 6.61C4.48 8.12 3 10.5 3 12C3 12 6.75 19.25 12 19.25C13.5 19.25 14.91 18.95 16.19 18.42"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path
                              d="M1.5 12S5.5 4.5 12 4.5S22.5 12 22.5 12S18.5 19.5 12 19.5S1.5 12 1.5 12Z"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {errors.cvv && <div className="form-error">{errors.cvv}</div>}
                  </div>
                </div>
              </div>
            )}

            {form.deliveryType === 'home_delivery' && (
              <div style={{ marginTop: '16px' }}>
                <label className="form-label">Delivery Address</label>
                <textarea
                  className="textarea"
                  value={form.deliveryAddress}
                  onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
                />
                {errors.deliveryAddress && <div className="form-error">{errors.deliveryAddress}</div>}
              </div>
            )}

            <div style={{ marginTop: '16px' }}>
              <label className="form-label">Notes (Optional)</label>
              <textarea
                className="textarea"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <button className="btn" type="submit" disabled={status === 'loading'}>
              {status === 'loading'
                ? form.paymentMethod === 'card'
                  ? 'Processing Card...'
                  : form.paymentMethod === 'cash_on_delivery'
                    ? 'Placing Order...'
                  : 'Redirecting to Paystack...'
                : form.paymentMethod === 'card'
                  ? `Pay ${formatCurrency(total)}`
                  : form.paymentMethod === 'cash_on_delivery'
                    ? `Place Order (${formatCurrency(total)})`
                    : `Pay ${formatCurrency(total)}`}
            </button>

            {errors.items && <div className="form-error">{errors.items}</div>}
            {errors.submit && <div className="form-error">{errors.submit}</div>}
          </form>
        </div>
      </div>
    </section>
  )
}

export default OrderCheckout
