import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiRequest, API_BASE_URL } from '../utils/api'

function formatDate(dateValue) {
  if (!dateValue) return '-'
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString()
}

function profileCompletion(user) {
  const checks = [
    user?.name,
    user?.phone,
    user?.city,
    user?.country,
    user?.bio,
  ]
  const complete = checks.filter(Boolean).length
  return Math.round((complete / checks.length) * 100)
}

function formatReservationNumber(id) {
  if (!id) return 'RSV-0000'
  return `RSV-${String(id).slice(-6).toUpperCase()}`
}

function formatOrderNumber(id) {
  if (!id) return 'ORD-0000'
  return `ORD-${String(id).slice(-6).toUpperCase()}`
}

function formatCurrency(amount) {
  const value = Number(amount) || 0
  return `NGN ${value.toLocaleString()}`
}

function onKeyboardActivate(event, callback) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    callback()
  }
}

function Profile() {
  const { user, token, logout } = useAuth()
  const location = useLocation()
  const [dashboard, setDashboard] = useState({
    stats: {
      totalReservations: 0,
      pendingReservations: 0,
      totalOrders: 0,
      activeOrders: 0,
      paidOrders: 0,
      profileCompletion: 0,
      memberSince: null,
    },
    recentReservations: [],
    recentOrders: [],
    adminOrderSummary: null,
  })
  const [adminReservations, setAdminReservations] = useState([])
  const [adminOrders, setAdminOrders] = useState([])
  const [adminActionMessage, setAdminActionMessage] = useState('')
  const [adminActionError, setAdminActionError] = useState('')
  const [updatingReservationId, setUpdatingReservationId] = useState('')
  const [updatingOrderId, setUpdatingOrderId] = useState('')
  const [adminFilter, setAdminFilter] = useState('pending')
  const [adminOrderFilter, setAdminOrderFilter] = useState('pending')
  const [selectedReservationId, setSelectedReservationId] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [selectedRecentReservationId, setSelectedRecentReservationId] = useState('')
  const [selectedRecentOrderId, setSelectedRecentOrderId] = useState('')
  const [selectedQueryOrder, setSelectedQueryOrder] = useState(null)
  const [orderNotice, setOrderNotice] = useState('')
  const [showAllOrders, setShowAllOrders] = useState(false)
  const [allOrders, setAllOrders] = useState([])
  const [allOrdersStatus, setAllOrdersStatus] = useState('idle')
  const [allOrdersError, setAllOrdersError] = useState('')

  const handleShowAllOrders = async () => {
    setShowAllOrders(true)
    if (allOrdersStatus === 'idle') {
      await loadAllOrders()
    }
    window.setTimeout(() => {
      const el = document.getElementById('all-orders')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
  }

  const queryOrderId = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('order') || ''
  }, [location.search])

  const queryPlaced = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('placed') === '1'
  }, [location.search])

  useEffect(() => {
    if (!token) return
    apiRequest('/api/auth/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((data) => setDashboard(data))
      .catch(() => {})
  }, [token])

  const loadAdminReservations = async () => {
    if (!token || user?.role !== 'admin') return
    const data = await apiRequest('/api/reservations/admin', {
      headers: { Authorization: `Bearer ${token}` },
    })
    setAdminReservations(data.reservations || [])
  }

  const loadAdminOrders = async () => {
    if (!token || user?.role !== 'admin') return
    const data = await apiRequest('/api/orders/admin', {
      headers: { Authorization: `Bearer ${token}` },
    })
    setAdminOrders(data.orders || [])
  }

  useEffect(() => {
    loadAdminReservations().catch(() => {})
    loadAdminOrders().catch(() => {})
  }, [token, user?.role])

  useEffect(() => {
    setOrderNotice(queryPlaced ? 'Order successful. You can view all details below.' : '')
  }, [queryPlaced])

  const loadAllOrders = async () => {
    if (!token) return
    setAllOrdersStatus('loading')
    setAllOrdersError('')
    try {
      const data = await apiRequest('/api/orders/my', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setAllOrders(data.orders || [])
      setAllOrdersStatus('success')
    } catch (error) {
      setAllOrdersError(error.message || 'Unable to load orders.')
      setAllOrdersStatus('error')
    }
  }

  const initials = useMemo(() => {
    const source = user?.name || 'U'
    return source
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((chunk) => chunk[0]?.toUpperCase())
      .join('')
  }, [user?.name])

  const avatarSrc = useMemo(() => {
    if (!user?.avatarUrl) return ''
    if (user.avatarUrl.startsWith('http')) return user.avatarUrl
    return `${API_BASE_URL}${user.avatarUrl}`
  }, [user?.avatarUrl])

  const handleAdminStatusUpdate = async (reservationId, nextStatus) => {
    try {
      setUpdatingReservationId(reservationId)
      setAdminActionError('')
      setAdminActionMessage('')
      const data = await apiRequest(`/api/reservations/${reservationId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: nextStatus }),
      })
      setAdminActionMessage(data?.message || `Reservation marked ${nextStatus}.`)
      await loadAdminReservations()
      setAdminFilter(nextStatus)
      setSelectedReservationId(reservationId)
    } catch (error) {
      setAdminActionError(error.message || 'Unable to update reservation status.')
    } finally {
      setUpdatingReservationId('')
    }
  }

  const handleAdminOrderStatusUpdate = async (orderId, nextStatus) => {
    try {
      setUpdatingOrderId(orderId)
      setAdminActionError('')
      setAdminActionMessage('')
      const data = await apiRequest(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderStatus: nextStatus }),
      })
      setAdminActionMessage(data?.message || `Order marked ${nextStatus}.`)
      await loadAdminOrders()
      setAdminOrderFilter(nextStatus)
      setSelectedOrderId(orderId)
    } catch (error) {
      setAdminActionError(error.message || 'Unable to update order status.')
    } finally {
      setUpdatingOrderId('')
    }
  }

  const reservationCounts = useMemo(() => {
    const counts = { all: 0, pending: 0, confirmed: 0, cancelled: 0 }
    for (const item of adminReservations) {
      counts.all += 1
      if (counts[item.status] !== undefined) counts[item.status] += 1
    }
    return counts
  }, [adminReservations])

  const filteredAdminReservations = useMemo(() => {
    if (adminFilter === 'all') return adminReservations
    return adminReservations.filter((item) => item.status === adminFilter)
  }, [adminReservations, adminFilter])

  const selectedReservation =
    adminReservations.find((item) => item._id === selectedReservationId) || null

  const orderCounts = useMemo(() => {
    const counts = {
      all: 0,
      pending: 0,
      confirmed: 0,
      preparing: 0,
      out_for_delivery: 0,
      ready_for_pickup: 0,
      completed: 0,
      cancelled: 0,
    }
    for (const item of adminOrders) {
      counts.all += 1
      if (counts[item.orderStatus] !== undefined) counts[item.orderStatus] += 1
    }
    return counts
  }, [adminOrders])

  const filteredAdminOrders = useMemo(() => {
    if (adminOrderFilter === 'all') return adminOrders
    return adminOrders.filter((item) => item.orderStatus === adminOrderFilter)
  }, [adminOrders, adminOrderFilter])

  const selectedOrder = adminOrders.find((item) => item._id === selectedOrderId) || null
  const selectedRecentReservation =
    dashboard.recentReservations.find((item) => item._id === selectedRecentReservationId) || null
  const selectedRecentOrderFromDashboard =
    dashboard.recentOrders.find((item) => item._id === selectedRecentOrderId) || null
  const selectedRecentOrder = selectedRecentOrderFromDashboard || selectedQueryOrder

  useEffect(() => {
    if (!token || !queryOrderId) return

    const inDashboard = dashboard.recentOrders.find((item) => item._id === queryOrderId)
    if (inDashboard) {
      setSelectedRecentOrderId(inDashboard._id)
      setSelectedQueryOrder(null)
      return
    }

    apiRequest('/api/orders/my', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((data) => {
        const found = (data.orders || []).find((item) => item._id === queryOrderId) || null
        setSelectedQueryOrder(found)
      })
      .catch(() => {})
  }, [dashboard.recentOrders, queryOrderId, token])

  return (
    <section className="section">
      <div className="container profile-layout">
        <aside className="profile-summary" id="profile-summary">
          <div className="profile-avatar-wrap">
            {avatarSrc ? (
              <img className="profile-avatar" src={avatarSrc} alt={user?.name || 'Profile'} />
            ) : (
              <div className="profile-avatar profile-avatar-fallback">{initials}</div>
            )}
          </div>
          <h3>{user?.name || 'User'}</h3>
          <p>{user?.email || '-'}</p>
          <div className="profile-badge-row">
            <span className="pill">Role: {user?.role || 'user'}</span>
            <span className="pill">
              {user?.isEmailVerified ? 'Email Verified' : 'Email Not Verified'}
            </span>
          </div>
          <div className="panel" style={{ marginTop: '18px' }}>
            <p><strong>Profile completion:</strong> {profileCompletion(user)}%</p>
            <p><strong>Joined:</strong> {formatDate(user?.createdAt)}</p>
            <p><strong>Last updated:</strong> {formatDate(user?.updatedAt)}</p>
          </div>
          <button className="btn btn-outline" type="button" onClick={logout}>
            Logout
          </button>
        </aside>

        <div>
          <div className="dashboard-grid">
            <div
              className="panel dashboard-item-clickable"
              role="button"
              tabIndex={0}
              onClick={() => {
                const el = document.getElementById('recent-reservations')
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              onKeyDown={(event) =>
                onKeyboardActivate(event, () => {
                  const el = document.getElementById('recent-reservations')
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                })
              }
            >
              <p className="form-label">Total Reservations</p>
              <h3 style={{ marginTop: 0 }}>{dashboard.stats.totalReservations}</h3>
            </div>
            <div
              className="panel dashboard-item-clickable"
              role="button"
              tabIndex={0}
              onClick={() => {
                const el = document.getElementById('recent-reservations')
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              onKeyDown={(event) =>
                onKeyboardActivate(event, () => {
                  const el = document.getElementById('recent-reservations')
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                })
              }
            >
              <p className="form-label">Pending Reservations</p>
              <h3 style={{ marginTop: 0 }}>{dashboard.stats.pendingReservations}</h3>
            </div>
            <div
              className="panel dashboard-item-clickable"
              role="button"
              tabIndex={0}
              onClick={() => {
                const el = document.getElementById('profile-summary')
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              onKeyDown={(event) =>
                onKeyboardActivate(event, () => {
                  const el = document.getElementById('profile-summary')
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                })
              }
            >
              <p className="form-label">Profile Completion</p>
              <h3 style={{ marginTop: 0 }}>{dashboard.stats.profileCompletion}%</h3>
            </div>
            <div
              className="panel dashboard-item-clickable"
              role="button"
              tabIndex={0}
              onClick={handleShowAllOrders}
              onKeyDown={(event) => onKeyboardActivate(event, handleShowAllOrders)}
            >
              <p className="form-label">Total Orders</p>
              <h3 style={{ marginTop: 0 }}>{dashboard.stats.totalOrders}</h3>
            </div>
            <div
              className="panel dashboard-item-clickable"
              role="button"
              tabIndex={0}
              onClick={() => {
                const el = document.getElementById('recent-orders')
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              onKeyDown={(event) =>
                onKeyboardActivate(event, () => {
                  const el = document.getElementById('recent-orders')
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                })
              }
            >
              <p className="form-label">Active Orders</p>
              <h3 style={{ marginTop: 0 }}>{dashboard.stats.activeOrders}</h3>
            </div>
            <div
              className="panel dashboard-item-clickable"
              role="button"
              tabIndex={0}
              onClick={() => {
                const el = document.getElementById('recent-orders')
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              onKeyDown={(event) =>
                onKeyboardActivate(event, () => {
                  const el = document.getElementById('recent-orders')
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                })
              }
            >
              <p className="form-label">Paid Orders</p>
              <h3 style={{ marginTop: 0 }}>{dashboard.stats.paidOrders}</h3>
            </div>
            <div
              className="panel dashboard-item-clickable"
              role="button"
              tabIndex={0}
              onClick={() => {
                const el = document.getElementById('profile-summary')
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              onKeyDown={(event) =>
                onKeyboardActivate(event, () => {
                  const el = document.getElementById('profile-summary')
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                })
              }
            >
              <p className="form-label">Member Since</p>
              <h3 style={{ marginTop: 0 }}>{formatDate(dashboard.stats.memberSince)}</h3>
            </div>
          </div>

          <div className="panel" style={{ marginTop: '16px' }} id="recent-reservations">
            <h3 style={{ marginTop: 0 }}>Recent Reservations</h3>
            {dashboard.recentReservations.length === 0 && <p>No reservations yet.</p>}
            {dashboard.recentReservations.length > 0 && (
              <div className="dashboard-list">
                {dashboard.recentReservations.map((item) => (
                  <div
                    key={item._id}
                    role="button"
                    tabIndex={0}
                    className={`dashboard-item dashboard-item-clickable ${selectedRecentReservationId === item._id ? 'active' : ''}`}
                    onClick={() => setSelectedRecentReservationId(item._id)}
                    onKeyDown={(event) =>
                      onKeyboardActivate(event, () => setSelectedRecentReservationId(item._id))
                    }
                  >
                    <span>{item.date} at {item.time}</span>
                    <span>{item.guests} guest(s)</span>
                    <span>{item.status}</span>
                  </div>
                ))}
              </div>
            )}
            {selectedRecentReservation && (
              <div className="panel" style={{ marginTop: '12px' }}>
                <h4 style={{ marginTop: 0 }}>
                  Reservation Details: {formatReservationNumber(selectedRecentReservation._id)}
                </h4>
                <p><strong>Date/Time:</strong> {selectedRecentReservation.date} at {selectedRecentReservation.time}</p>
                <p><strong>Guests:</strong> {selectedRecentReservation.guests}</p>
                <p><strong>Status:</strong> {selectedRecentReservation.status}</p>
                <p><strong>Created:</strong> {formatDate(selectedRecentReservation.createdAt)}</p>
              </div>
            )}
          </div>

          <div className="panel" style={{ marginTop: '16px' }} id="recent-orders">
            <h3 style={{ marginTop: 0 }}>Recent Orders</h3>
            {orderNotice && <div className="form-success">{orderNotice}</div>}
            {dashboard.recentOrders.length === 0 && <p>No orders yet.</p>}
            {dashboard.recentOrders.length > 0 && (
              <div className="dashboard-list">
                {dashboard.recentOrders.map((item) => (
                  <div
                    key={item._id}
                    role="button"
                    tabIndex={0}
                    className={`dashboard-item dashboard-item-clickable ${selectedRecentOrderId === item._id ? 'active' : ''}`}
                    onClick={() => setSelectedRecentOrderId(item._id)}
                    onKeyDown={(event) =>
                      onKeyboardActivate(event, () => setSelectedRecentOrderId(item._id))
                    }
                  >
                    <span>
                      <strong>{formatOrderNumber(item._id)}</strong><br />
                      {item.items?.[0]?.name || 'Order Item'}
                      {item.items?.length > 1 ? ` +${item.items.length - 1} more` : ''}
                    </span>
                    <span>{item.deliveryType}</span>
                    <span>{item.orderStatus} / {item.paymentStatus}</span>
                    <span>
                      {formatCurrency(item.total)}<br />
                      <Link
                        className="btn btn-outline"
                        to={`/orders/${item._id}`}
                        onClick={(event) => event.stopPropagation()}
                      >
                        View Details
                      </Link>
                    </span>
                  </div>
                ))}
              </div>
            )}
            {selectedRecentOrder && (
              <div className="panel" style={{ marginTop: '12px' }}>
                <h4 style={{ marginTop: 0 }}>Order Details: {formatOrderNumber(selectedRecentOrder._id)}</h4>
                <p><strong>Delivery:</strong> {selectedRecentOrder.deliveryType}</p>
                <p><strong>Payment:</strong> {selectedRecentOrder.paymentMethod} ({selectedRecentOrder.paymentStatus})</p>
                <p><strong>Status:</strong> {selectedRecentOrder.orderStatus}</p>
                <p><strong>Total:</strong> {formatCurrency(selectedRecentOrder.total)}</p>
                <p>
                  <strong>Items:</strong>{' '}
                  {(selectedRecentOrder.items || [])
                    .map((it) => `${it.name} (${it.servingLabel || it.servingOption}) x${it.quantity}`)
                    .join(', ') || '-'}
                </p>
                <p><strong>Created:</strong> {formatDate(selectedRecentOrder.createdAt)}</p>
                <Link className="btn btn-outline" to={`/orders/${selectedRecentOrder._id}`}>
                  Open Full Order Page
                </Link>
              </div>
            )}
            <div style={{ marginTop: '12px' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  const next = !showAllOrders
                  setShowAllOrders(next)
                  if (next && allOrdersStatus === 'idle') {
                    loadAllOrders()
                  }
                }}
              >
                {showAllOrders ? 'Hide All Orders' : 'View All Orders'}
              </button>
            </div>
          </div>

          {showAllOrders && (
            <div className="panel" style={{ marginTop: '16px' }} id="all-orders">
              <h3 style={{ marginTop: 0 }}>All Orders</h3>
              {allOrdersStatus === 'loading' && <p className="loading">Loading orders...</p>}
              {allOrdersStatus === 'error' && <div className="form-error">{allOrdersError}</div>}
              {allOrdersStatus === 'success' && allOrders.length === 0 && <p>No orders yet.</p>}
              {allOrdersStatus === 'success' && allOrders.length > 0 && (
                <div className="dashboard-list">
                  {allOrders.map((item) => (
                    <div
                      key={item._id}
                      role="button"
                      tabIndex={0}
                      className="dashboard-item dashboard-item-clickable"
                      onClick={() => setSelectedRecentOrderId(item._id)}
                      onKeyDown={(event) =>
                        onKeyboardActivate(event, () => setSelectedRecentOrderId(item._id))
                      }
                    >
                      <span>
                        <strong>{formatOrderNumber(item._id)}</strong><br />
                        {item.items?.[0]?.name || 'Order Item'}
                        {item.items?.length > 1 ? ` +${item.items.length - 1} more` : ''}
                      </span>
                      <span>{item.deliveryType}</span>
                      <span>{item.orderStatus} / {item.paymentStatus}</span>
                      <span>
                        {formatCurrency(item.total)}<br />
                        <Link
                          className="btn btn-outline"
                          to={`/orders/${item._id}`}
                          onClick={(event) => event.stopPropagation()}
                        >
                          View Details
                        </Link>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: '16px' }} id="profile-actions">
            <Link className="btn" to="/profile/edit">
              Edit Profile
            </Link>
          </div>

          {user?.role === 'admin' && (
            <div className="panel" style={{ marginTop: '16px' }}>
              <h3 style={{ marginTop: 0 }}>Admin Reservation Queue</h3>
              <div className="admin-filter-row">
                {[
                  ['pending', 'Pending'],
                  ['confirmed', 'Confirmed'],
                  ['cancelled', 'Cancelled'],
                  ['all', 'All'],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={`admin-filter-btn ${adminFilter === key ? 'active' : ''}`}
                    onClick={() => setAdminFilter(key)}
                  >
                    {label} ({reservationCounts[key]})
                  </button>
                ))}
              </div>
              {adminActionError && <div className="form-error">{adminActionError}</div>}
              {adminActionMessage && <div className="form-success">{adminActionMessage}</div>}
              {filteredAdminReservations.length === 0 && <p>No reservations found.</p>}
              {filteredAdminReservations.length > 0 && (
                <div className="dashboard-list">
                  {filteredAdminReservations.map((item) => (
                    <div
                      key={item._id}
                      role="button"
                      tabIndex={0}
                      className={`dashboard-item dashboard-item-clickable ${selectedReservationId === item._id ? 'active' : ''}`}
                      onClick={() => setSelectedReservationId(item._id)}
                      onKeyDown={(event) =>
                        onKeyboardActivate(event, () => setSelectedReservationId(item._id))
                      }
                    >
                      <span>
                        <strong>{formatReservationNumber(item._id)}</strong><br />
                        {item.name} ({item.email})<br />
                        {item.date} at {item.time}
                      </span>
                      <span>{item.guests} guest(s)</span>
                      <span>{item.status}</span>
                      <span className="admin-actions">
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={(event) => {
                            event.stopPropagation()
                            handleAdminStatusUpdate(item._id, 'confirmed')
                          }}
                          disabled={item.status === 'confirmed' || updatingReservationId === item._id}
                        >
                          {updatingReservationId === item._id ? 'Updating...' : 'Confirm'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={(event) => {
                            event.stopPropagation()
                            handleAdminStatusUpdate(item._id, 'cancelled')
                          }}
                          disabled={item.status === 'cancelled' || updatingReservationId === item._id}
                        >
                          {updatingReservationId === item._id ? 'Updating...' : 'Cancel'}
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {selectedReservation && (
                <div className="panel" style={{ marginTop: '14px' }}>
                  <h4 style={{ marginTop: 0 }}>
                    Reservation Details: {formatReservationNumber(selectedReservation._id)}
                  </h4>
                  <p>
                    <strong>Guest:</strong> {selectedReservation.name} ({selectedReservation.email})
                  </p>
                  <p><strong>Phone:</strong> {selectedReservation.phone || '-'}</p>
                  <p><strong>Date/Time:</strong> {selectedReservation.date} at {selectedReservation.time}</p>
                  <p><strong>Guests:</strong> {selectedReservation.guests}</p>
                  <p><strong>Status:</strong> {selectedReservation.status}</p>
                  <p><strong>Requests:</strong> {selectedReservation.requests || '-'}</p>
                  <p><strong>Created:</strong> {formatDate(selectedReservation.createdAt)}</p>
                </div>
              )}
            </div>
          )}

          {user?.role === 'admin' && (
            <div className="panel" style={{ marginTop: '16px' }}>
              <h3 style={{ marginTop: 0 }}>Admin Order Queue</h3>
              <div className="admin-filter-row">
                {[
                  ['pending', 'Pending'],
                  ['confirmed', 'Confirmed'],
                  ['preparing', 'Preparing'],
                  ['out_for_delivery', 'Out for Delivery'],
                  ['ready_for_pickup', 'Ready for Pickup'],
                  ['completed', 'Completed'],
                  ['cancelled', 'Cancelled'],
                  ['all', 'All'],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={`admin-filter-btn ${adminOrderFilter === key ? 'active' : ''}`}
                    onClick={() => setAdminOrderFilter(key)}
                  >
                    {label} ({orderCounts[key]})
                  </button>
                ))}
              </div>
              {filteredAdminOrders.length === 0 && <p>No orders found.</p>}
              {filteredAdminOrders.length > 0 && (
                <div className="dashboard-list">
                  {filteredAdminOrders.map((item) => (
                    <div
                      key={item._id}
                      role="button"
                      tabIndex={0}
                      className={`dashboard-item dashboard-item-clickable ${selectedOrderId === item._id ? 'active' : ''}`}
                      onClick={() => setSelectedOrderId(item._id)}
                      onKeyDown={(event) =>
                        onKeyboardActivate(event, () => setSelectedOrderId(item._id))
                      }
                    >
                      <span>
                        <strong>{formatOrderNumber(item._id)}</strong><br />
                        {item.customerName} ({item.email})
                      </span>
                      <span>{item.deliveryType}</span>
                      <span>{item.orderStatus}</span>
                      <span className="admin-actions">
                        <Link
                          className="btn btn-outline"
                          to={`/orders/${item._id}`}
                          onClick={(event) => event.stopPropagation()}
                        >
                          View
                        </Link>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={(event) => {
                            event.stopPropagation()
                            handleAdminOrderStatusUpdate(item._id, 'preparing')
                          }}
                          disabled={updatingOrderId === item._id || item.orderStatus === 'preparing'}
                        >
                          {updatingOrderId === item._id ? 'Updating...' : 'Prepare'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={(event) => {
                            event.stopPropagation()
                            handleAdminOrderStatusUpdate(
                              item._id,
                              item.deliveryType === 'home_delivery'
                                ? 'out_for_delivery'
                                : 'ready_for_pickup'
                            )
                          }}
                          disabled={
                            updatingOrderId === item._id ||
                            item.orderStatus === 'out_for_delivery' ||
                            item.orderStatus === 'ready_for_pickup'
                          }
                        >
                          {updatingOrderId === item._id ? 'Updating...' : 'Dispatch'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={(event) => {
                            event.stopPropagation()
                            handleAdminOrderStatusUpdate(item._id, 'completed')
                          }}
                          disabled={updatingOrderId === item._id || item.orderStatus === 'completed'}
                        >
                          {updatingOrderId === item._id ? 'Updating...' : 'Complete'}
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {selectedOrder && (
                <div className="panel" style={{ marginTop: '14px' }}>
                  <h4 style={{ marginTop: 0 }}>Order Details: {formatOrderNumber(selectedOrder._id)}</h4>
                  <p>
                    <strong>Customer:</strong> {selectedOrder.customerName} ({selectedOrder.email})
                  </p>
                  <p><strong>Phone:</strong> {selectedOrder.phone || '-'}</p>
                  <p><strong>Delivery:</strong> {selectedOrder.deliveryType}</p>
                  <p><strong>Payment:</strong> {selectedOrder.paymentMethod} ({selectedOrder.paymentStatus})</p>
                  <p><strong>Status:</strong> {selectedOrder.orderStatus}</p>
                  <p><strong>Total:</strong> {formatCurrency(selectedOrder.total)}</p>
                  <p><strong>Items:</strong> {(selectedOrder.items || []).map((it) => `${it.name} x${it.quantity}`).join(', ') || '-'}</p>
                  <p><strong>Created:</strong> {formatDate(selectedOrder.createdAt)}</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </section>
  )
}

export default Profile
