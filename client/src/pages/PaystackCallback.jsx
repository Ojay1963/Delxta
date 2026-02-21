import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../utils/api'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

function PaystackCallback() {
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('Finalizing your payment...')
  const [orderId, setOrderId] = useState('')
  const { clearCart } = useCart()
  const { token } = useAuth()
  const hasFinalizedRef = useRef(false)

  useEffect(() => {
    if (hasFinalizedRef.current) return
    hasFinalizedRef.current = true

    const finalize = async () => {
      const params = new URLSearchParams(window.location.search)
      const reference = params.get('reference') || params.get('trxref')

      if (!reference) {
        setStatus('error')
        setMessage('Missing Paystack reference in callback URL.')
        return
      }

      try {
        const data = await apiRequest('/api/payments/paystack/complete', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            reference,
          }),
        })

        clearCart()
        setStatus('success')
        setOrderId(data.order.id)
        setMessage(data.message || 'Payment verified and order placed successfully.')
      } catch (error) {
        setStatus('error')
        setMessage(error.message || 'Could not complete your payment/order.')
      }
    }

    finalize()
  }, [clearCart, token])

  return (
    <section className="section">
      <div className="container">
        <div className="form-card" style={{ maxWidth: '720px', margin: '0 auto' }}>
          <h2 className="section-title" style={{ marginTop: 0 }}>
            Paystack Checkout
          </h2>
          {status === 'loading' && <p className="loading">{message}</p>}
          {status === 'success' && (
            <>
              <div className="form-success">{message}</div>
              <p>Order ID: {orderId}</p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Link className="btn" to={`/order/success/${orderId}`}>
                  Continue
                </Link>
                <Link className="btn btn-outline" to="/menu">
                  Continue Ordering
                </Link>
              </div>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="form-error">{message}</div>
              <div style={{ marginTop: '12px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Link className="btn btn-outline" to="/order">
                  Back to Checkout
                </Link>
                <Link className="btn" to="/profile">
                  Go to Dashboard
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

export default PaystackCallback
