import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../utils/api'

function formatCurrency(amount) {
  const value = Number(amount) || 0
  return `NGN ${value.toLocaleString()}`
}

function formatDate(dateValue) {
  if (!dateValue) return '-'
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString()
}

function formatOrderNumber(id) {
  if (!id) return 'ORD-0000'
  return `ORD-${String(id).slice(-6).toUpperCase()}`
}

function OrderDetails() {
  const { id } = useParams()
  const { token } = useAuth()
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [order, setOrder] = useState(null)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setError('Please sign in to view order details.')
      return
    }

    setStatus('loading')
    setError('')
    apiRequest(`/api/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((data) => {
        setOrder(data.order || null)
        setStatus('success')
      })
      .catch((err) => {
        setError(err.message || 'Unable to load order details.')
        setStatus('error')
      })
  }, [id, token])

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: '980px' }}>
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>Order Details</h2>
          {status === 'loading' && <p className="loading">Loading order...</p>}
          {status === 'error' && (
            <>
              <div className="form-error">{error}</div>
              <div style={{ marginTop: '12px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Link className="btn" to="/login">
                  Sign In
                </Link>
                <Link className="btn btn-outline" to="/profile">
                  Go to Dashboard
                </Link>
              </div>
            </>
          )}
          {status === 'success' && order && (
            <>
              <p>
                <strong>Order:</strong> {formatOrderNumber(order._id)}
              </p>
              <p>
                <strong>Status:</strong> {order.orderStatus}
              </p>
              <p>
                <strong>Payment:</strong> {order.paymentMethod} ({order.paymentStatus})
              </p>
              <p>
                <strong>Delivery Type:</strong> {order.deliveryType}
              </p>
              {order.deliveryType === 'home_delivery' && (
                <p>
                  <strong>Delivery Address:</strong> {order.deliveryAddress || '-'}
                </p>
              )}
              <p>
                <strong>Customer:</strong> {order.customerName} ({order.email})
              </p>
              <p>
                <strong>Phone:</strong> {order.phone}
              </p>
              <p>
                <strong>Placed On:</strong> {formatDate(order.createdAt)}
              </p>
              <div className="panel" style={{ marginTop: '14px' }}>
                <h3 style={{ marginTop: 0 }}>Items</h3>
                <div className="dashboard-list">
                  {(order.items || []).map((item, index) => (
                    <div className="dashboard-item" key={`${item.name}-${index}`}>
                      <span>{item.name}</span>
                      <span>{item.servingLabel || item.servingOption}</span>
                      <span>x{item.quantity}</span>
                      <span>{formatCurrency(item.lineTotal)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="panel" style={{ marginTop: '14px' }}>
                <p>
                  <strong>Subtotal:</strong> {formatCurrency(order.subTotal)}
                </p>
                <p>
                  <strong>Delivery Fee:</strong> {formatCurrency(order.deliveryFee)}
                </p>
                <p>
                  <strong>Total:</strong> {formatCurrency(order.total)}
                </p>
              </div>
              <div style={{ marginTop: '14px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Link className="btn" to="/profile">
                  Back to Dashboard
                </Link>
                <Link className="btn btn-outline" to="/menu">
                  Continue Shopping
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

export default OrderDetails
