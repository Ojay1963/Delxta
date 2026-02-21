import { Link, useParams } from 'react-router-dom'

function formatOrderNumber(id) {
  if (!id) return 'ORD-0000'
  return `ORD-${String(id).slice(-6).toUpperCase()}`
}

function OrderSuccess() {
  const { id } = useParams()

  return (
    <section className="section">
      <div className="container">
        <div className="form-card" style={{ maxWidth: '760px', margin: '0 auto' }}>
          <h2 className="section-title" style={{ marginTop: 0 }}>
            Order Successful
          </h2>
          <div className="form-success">
            Your order has been placed successfully.
          </div>
          <p>
            Order Number: <strong>{formatOrderNumber(id)}</strong>
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
            <Link className="btn" to={`/orders/${id}`}>
              View Order Details
            </Link>
            <Link className="btn btn-outline" to="/profile">
              Open Dashboard
            </Link>
            <Link className="btn btn-outline" to="/menu">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default OrderSuccess
