import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FiActivity, FiClock, FiUser } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { apiRequest, API_BASE_URL } from '../utils/api'
import { useCart } from '../context/CartContext'

const fmtDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString()
}

const fmtDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString()
}

const fmtTitle = (value) =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())

const fmtMoney = (value) => `NGN ${(Number(value) || 0).toLocaleString()}`
const fmtOrder = (id) => (id ? `ORD-${String(id).slice(-6).toUpperCase()}` : 'ORD-0000')
const fmtReservation = (id) => (id ? `RSV-${String(id).slice(-6).toUpperCase()}` : 'RSV-0000')
const pluralize = (value, singular, plural = `${singular}s`) => `${value} ${value === 1 ? singular : plural}`

const getTone = (status) => {
  const value = String(status || '').toLowerCase()
  if (['confirmed', 'paid', 'completed', 'verified', 'ready_for_pickup'].includes(value)) return 'success'
  if (['pending', 'preparing', 'active', 'out_for_delivery'].includes(value)) return 'warning'
  if (['cancelled', 'failed', 'unpaid'].includes(value)) return 'danger'
  return 'neutral'
}

const getTasks = (user) => [
  { id: 'phone', label: 'Add your phone number', complete: Boolean(user?.phone) },
  { id: 'address', label: 'Save a delivery address', complete: Boolean(user?.addressLine1) },
  { id: 'city', label: 'Add your city', complete: Boolean(user?.city) },
  { id: 'country', label: 'Add your country', complete: Boolean(user?.country) },
  { id: 'bio', label: 'Write a short bio', complete: Boolean(user?.bio) },
  { id: 'avatar', label: 'Upload a profile photo', complete: Boolean(user?.avatarUrl) },
]

const reservationStatuses = ['pending', 'confirmed', 'cancelled']
const orderStatuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'ready_for_pickup', 'completed', 'cancelled']
const menuCategories = ['Nigerian Delicacies', 'Intercontinental', 'Starters & Appetizers', 'Signature Drinks']
const initialMenuForm = {
  name: '',
  description: '',
  price: '',
  category: menuCategories[0],
  isFeatured: false,
  isAvailable: true,
}

const buildMenuForm = (item) => ({
  name: item?.name || '',
  description: item?.description || '',
  price: item?.price || '',
  category: item?.category || menuCategories[0],
  isFeatured: Boolean(item?.isFeatured),
  isAvailable: item?.isAvailable !== false,
})

function Profile() {
  const { user, token, logout } = useAuth()
  const { replaceCart } = useCart()
  const location = useLocation()
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState({ stats: {}, recentReservations: [], recentOrders: [] })
  const [activeTab, setActiveTab] = useState('overview')
  const [reservationList, setReservationList] = useState([])
  const [reservationsStatus, setReservationsStatus] = useState('idle')
  const [reservationsError, setReservationsError] = useState('')
  const [orders, setOrders] = useState([])
  const [ordersStatus, setOrdersStatus] = useState('idle')
  const [ordersError, setOrdersError] = useState('')
  const [selectedReservationId, setSelectedReservationId] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [adminReservations, setAdminReservations] = useState([])
  const [adminOrders, setAdminOrders] = useState([])
  const [adminReservationFilter, setAdminReservationFilter] = useState('pending')
  const [adminOrderFilter, setAdminOrderFilter] = useState('pending')
  const [selectedAdminReservationId, setSelectedAdminReservationId] = useState('')
  const [selectedAdminOrderId, setSelectedAdminOrderId] = useState('')
  const [menuItems, setMenuItems] = useState([])
  const [menuStatus, setMenuStatus] = useState('idle')
  const [menuError, setMenuError] = useState('')
  const [menuFilterCategory, setMenuFilterCategory] = useState('all')
  const [selectedAdminMenuId, setSelectedAdminMenuId] = useState('')
  const [menuFormMode, setMenuFormMode] = useState('create')
  const [menuForm, setMenuForm] = useState(initialMenuForm)
  const [menuImageFile, setMenuImageFile] = useState(null)
  const [menuImagePreview, setMenuImagePreview] = useState('')
  const [adminMessage, setAdminMessage] = useState('')
  const [adminError, setAdminError] = useState('')
  const [busyId, setBusyId] = useState('')

  const query = useMemo(() => new URLSearchParams(location.search), [location.search])
  const placedOrder = query.get('placed') === '1'
  const queryOrderId = query.get('order') || ''

  useEffect(() => {
    if (!token) return
    apiRequest('/api/auth/dashboard', { headers: { Authorization: `Bearer ${token}` } })
      .then((data) => setDashboard(data))
      .catch(() => {})
  }, [token])

  useEffect(() => {
    if (placedOrder) setActiveTab('orders')
  }, [placedOrder])

  useEffect(() => {
    if (activeTab !== 'reservations' || reservationsStatus !== 'idle' || !token) return
    setReservationsStatus('loading')
    apiRequest('/api/reservations/my', { headers: { Authorization: `Bearer ${token}` } })
      .then((data) => {
        setReservationList(data.reservations || [])
        setReservationsStatus('success')
      })
      .catch((error) => {
        setReservationsError(error.message || 'Unable to load reservations.')
        setReservationsStatus('error')
      })
  }, [activeTab, reservationsStatus, token])

  useEffect(() => {
    if (activeTab !== 'orders' || ordersStatus !== 'idle' || !token) return
    setOrdersStatus('loading')
    apiRequest('/api/orders/my', { headers: { Authorization: `Bearer ${token}` } })
      .then((data) => {
        setOrders(data.orders || [])
        setOrdersStatus('success')
      })
      .catch((error) => {
        setOrdersError(error.message || 'Unable to load orders.')
        setOrdersStatus('error')
      })
  }, [activeTab, ordersStatus, token])

  useEffect(() => {
    if (!token || user?.role !== 'admin' || activeTab !== 'admin') return

    let isMounted = true

    const refreshAdminData = async () => {
      try {
        const [reservationsData, ordersData, menuData] = await Promise.all([
          apiRequest('/api/reservations/admin', { headers: { Authorization: `Bearer ${token}` } }),
          apiRequest('/api/orders/admin', { headers: { Authorization: `Bearer ${token}` } }),
          apiRequest('/api/menu'),
        ])

        if (!isMounted) return

        setAdminReservations(reservationsData.reservations || [])
        setAdminOrders(ordersData.orders || [])
        setMenuItems(menuData.items || [])
        setMenuStatus('success')
        setMenuError('')
      } catch (error) {
        if (!isMounted) return
        setMenuError(error.message || 'Unable to load admin data.')
        setMenuStatus('error')
      }
    }

    setMenuStatus('loading')
    refreshAdminData()
    const refreshInterval = window.setInterval(refreshAdminData, 15000)

    return () => {
      isMounted = false
      window.clearInterval(refreshInterval)
    }
  }, [activeTab, token, user?.role])

  useEffect(() => {
    if (!menuImageFile) {
      setMenuImagePreview('')
      return undefined
    }

    const previewUrl = URL.createObjectURL(menuImageFile)
    setMenuImagePreview(previewUrl)
    return () => URL.revokeObjectURL(previewUrl)
  }, [menuImageFile])

  const reservations = useMemo(() => {
    if (reservationList.length) return reservationList
    return dashboard.recentReservations || []
  }, [dashboard.recentReservations, reservationList])
  const recentOrders = useMemo(() => dashboard.recentOrders || [], [dashboard.recentOrders])
  const allOrders = orders.length ? orders : recentOrders

  useEffect(() => {
    if (!selectedReservationId && reservations[0]?._id) setSelectedReservationId(reservations[0]._id)
  }, [reservations, selectedReservationId])

  useEffect(() => {
    const nextSelectedId = queryOrderId || allOrders[0]?._id || ''
    if (!selectedOrderId && nextSelectedId) setSelectedOrderId(nextSelectedId)
  }, [allOrders, queryOrderId, selectedOrderId])

  useEffect(() => {
    if (!selectedAdminReservationId && adminReservations[0]?._id) setSelectedAdminReservationId(adminReservations[0]._id)
  }, [adminReservations, selectedAdminReservationId])

  useEffect(() => {
    if (!selectedAdminOrderId && adminOrders[0]?._id) setSelectedAdminOrderId(adminOrders[0]._id)
  }, [adminOrders, selectedAdminOrderId])

  useEffect(() => {
    if (menuFormMode === 'create') return
    if (!selectedAdminMenuId && menuItems[0]?._id) setSelectedAdminMenuId(menuItems[0]._id)
  }, [menuItems, menuFormMode, selectedAdminMenuId])

  const initials = (user?.name || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  const avatarSrc = user?.avatarUrl
    ? user.avatarUrl.startsWith('http')
      ? user.avatarUrl
      : `${API_BASE_URL}${user.avatarUrl}`
    : ''

  const tasks = getTasks(user)
  const missingTasks = tasks.filter((task) => !task.complete)
  const completion = Math.round(((tasks.length - missingTasks.length) / tasks.length) * 100)
  const fullAddress = [user?.addressLine1, user?.addressLine2, user?.city, user?.stateRegion, user?.postalCode, user?.country].filter(Boolean).join(', ')
  const preferences = [fmtTitle(user?.preferredContactMethod || 'email'), fmtTitle(user?.preferredDiningTime || 'flexible'), fmtTitle(user?.dietaryPreference || 'none')].join(' | ')
  const selectedReservation = reservations.find((item) => item._id === selectedReservationId) || null
  const selectedOrder = allOrders.find((item) => item._id === selectedOrderId) || null
  const filteredAdminReservations = adminReservationFilter === 'all' ? adminReservations : adminReservations.filter((item) => item.status === adminReservationFilter)
  const filteredAdminOrders = adminOrderFilter === 'all' ? adminOrders : adminOrders.filter((item) => item.orderStatus === adminOrderFilter)
  const filteredMenuItems = menuFilterCategory === 'all' ? menuItems : menuItems.filter((item) => item.category === menuFilterCategory)
  const selectedAdminReservation = adminReservations.find((item) => item._id === selectedAdminReservationId) || null
  const selectedAdminOrder = adminOrders.find((item) => item._id === selectedAdminOrderId) || null
  const selectedAdminMenu = menuItems.find((item) => item._id === selectedAdminMenuId) || null

  const reservationCounts = adminReservations.reduce((acc, item) => {
    acc.all += 1
    acc[item.status] = (acc[item.status] || 0) + 1
    return acc
  }, { all: 0, pending: 0, confirmed: 0, cancelled: 0 })

  const orderCounts = adminOrders.reduce((acc, item) => {
    acc.all += 1
    acc[item.orderStatus] = (acc[item.orderStatus] || 0) + 1
    return acc
  }, { all: 0, pending: 0, confirmed: 0, preparing: 0, out_for_delivery: 0, ready_for_pickup: 0, completed: 0, cancelled: 0 })

  const menuCounts = menuItems.reduce((acc, item) => {
    acc.all += 1
    acc[item.category] = (acc[item.category] || 0) + 1
    return acc
  }, { all: 0 })

  const runAdminUpdate = async (path, payload, reload) => {
    try {
      setBusyId(payload.id)
      setAdminMessage('')
      setAdminError('')
      const data = await apiRequest(path, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload.body),
      })
      setAdminMessage(data.message || 'Updated successfully.')
      const refreshed = await apiRequest(reload, { headers: { Authorization: `Bearer ${token}` } })
      if (reload.includes('reservations')) setAdminReservations(refreshed.reservations || [])
      if (reload.includes('orders')) setAdminOrders(refreshed.orders || [])
    } catch (error) {
      setAdminError(error.message || 'Unable to update item.')
    } finally {
      setBusyId('')
    }
  }

  const resetMenuForm = () => {
    setMenuFormMode('create')
    setSelectedAdminMenuId('')
    setMenuForm(initialMenuForm)
    setMenuImageFile(null)
    setAdminMessage('')
    setAdminError('')
  }

  const loadMenuItems = async () => {
    const data = await apiRequest('/api/menu')
    setMenuItems(data.items || [])
    setMenuStatus('success')
    return data.items || []
  }

  const handleSelectAdminMenu = (item) => {
    setMenuFormMode('edit')
    setSelectedAdminMenuId(item._id)
    setMenuForm(buildMenuForm(item))
    setMenuImageFile(null)
    setAdminMessage('')
    setAdminError('')
  }

  const handleMenuFieldChange = (field, value) => {
    setMenuForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleMenuImageChange = (event) => {
    const file = event.target.files?.[0] || null
    setMenuImageFile(file)
    event.target.value = ''
  }

  const submitMenuForm = async (event) => {
    event.preventDefault()
    if (!token) return

    if (!menuForm.name.trim() || !menuForm.description.trim() || !menuForm.price.trim() || !menuForm.category.trim()) {
      setAdminError('Name, description, price, and category are required.')
      setAdminMessage('')
      return
    }

    if (menuFormMode === 'create' && !menuImageFile) {
      setAdminError('Choose a meal image before creating a menu item.')
      setAdminMessage('')
      return
    }

    try {
      const targetId = selectedAdminMenuId || 'menu-create'
      setBusyId(targetId)
      setAdminMessage('')
      setAdminError('')

      const formData = new FormData()
      formData.append('name', menuForm.name.trim())
      formData.append('description', menuForm.description.trim())
      formData.append('price', menuForm.price.trim())
      formData.append('category', menuForm.category)
      formData.append('isFeatured', String(menuForm.isFeatured))
      formData.append('isAvailable', String(menuForm.isAvailable))
      if (menuImageFile) {
        formData.append('image', menuImageFile)
      }

      const isEdit = menuFormMode === 'edit' && selectedAdminMenuId
      const data = await apiRequest(isEdit ? `/api/menu/${selectedAdminMenuId}` : '/api/menu', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      const nextItems = await loadMenuItems()
      setAdminMessage(data.message || (isEdit ? 'Menu item updated successfully.' : 'Menu item created successfully.'))
      setMenuImageFile(null)

      if (isEdit) {
        const refreshedItem = nextItems.find((item) => item._id === selectedAdminMenuId)
        if (refreshedItem) setMenuForm(buildMenuForm(refreshedItem))
      } else {
        const createdItemId = data.item?._id
        const createdItem = nextItems.find((item) => item._id === createdItemId) || data.item
        if (createdItem?._id) {
          setMenuFormMode('edit')
          setSelectedAdminMenuId(createdItem._id)
          setMenuForm(buildMenuForm(createdItem))
        } else {
          resetMenuForm()
        }
      }
    } catch (error) {
      setAdminError(error.message || 'Unable to save menu item.')
    } finally {
      setBusyId('')
    }
  }

  const handleDeleteMenuItem = async () => {
    if (!selectedAdminMenuId || !token || !selectedAdminMenu) return
    if (!window.confirm(`Delete "${selectedAdminMenu.name}" from the menu?`)) return

    try {
      setBusyId(selectedAdminMenuId)
      setAdminMessage('')
      setAdminError('')
      const data = await apiRequest(`/api/menu/${selectedAdminMenuId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      await loadMenuItems()
      resetMenuForm()
      setAdminMessage(data.message || 'Menu item deleted successfully.')
    } catch (error) {
      setAdminError(error.message || 'Unable to delete menu item.')
    } finally {
      setBusyId('')
    }
  }

  const stats = [
    ['Reservations', dashboard.stats.totalReservations || 0, `${dashboard.stats.pendingReservations || 0} pending`],
    ['Orders', dashboard.stats.totalOrders || 0, `${dashboard.stats.activeOrders || 0} active`],
    ['Profile', `${completion}%`, missingTasks.length ? `${missingTasks.length} tasks left` : 'Complete'],
    ['Member Since', fmtDate(dashboard.stats.memberSince || user?.createdAt), user?.isEmailVerified ? 'Verified' : 'Not verified'],
  ]
  const nextTask = missingTasks[0]?.label || 'Everything is set'
  const quickHighlights = [
    ['Next step', nextTask, missingTasks.length ? 'Complete this next to improve checkout and booking flow.' : 'Your account is ready to use.'],
    ['Recent activity', pluralize((dashboard.stats.totalOrders || 0) + (dashboard.stats.totalReservations || 0), 'action'), `${pluralize(dashboard.stats.totalOrders || 0, 'order')} and ${pluralize(dashboard.stats.totalReservations || 0, 'reservation')}.`],
    ['Account mode', user?.role === 'admin' ? 'Admin access' : 'Guest dashboard', user?.role === 'admin' ? 'Manage reservations and order operations from here.' : 'Use this area to manage orders, bookings, and preferences.'],
  ]
  const orderItemSummary = selectedOrder?.items?.map((item) => `${item.quantity}x ${item.name}`).join(', ') || 'No order items recorded.'
  const adminOrderItemSummary = selectedAdminOrder?.items?.map((item) => `${item.quantity}x ${item.name}`).join(', ') || 'No order items recorded.'
  const menuPreviewSrc = menuImagePreview || selectedAdminMenu?.image || ''
  const canCancelReservation = ['pending', 'confirmed'].includes(selectedReservation?.status)
  const canCancelOrder = ['pending', 'confirmed'].includes(selectedOrder?.orderStatus)
  const premiumMetrics = [
    ['Completion', `${completion}%`, missingTasks.length ? `${missingTasks.length} items left` : 'Fully set up'],
    ['Dining style', fmtTitle(user?.preferredDiningTime || 'flexible'), fmtTitle(user?.dietaryPreference || 'none')],
    ['Contact lane', fmtTitle(user?.preferredContactMethod || 'email'), user?.marketingOptIn ? 'Campaigns on' : 'Campaigns off'],
  ]

  const handleRepeatOrder = () => {
    if (!selectedOrder?.items?.length) return
    replaceCart(selectedOrder.items)
    navigate('/order')
  }

  const handleCancelReservation = async () => {
    if (!selectedReservation?._id || !token) return
    try {
      setBusyId(selectedReservation._id)
      setReservationsError('')
      const data = await apiRequest(`/api/reservations/${selectedReservation._id}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      const updatedReservation = data.reservation
      setReservationList((prev) => prev.map((item) => (item._id === updatedReservation._id ? updatedReservation : item)))
      setDashboard((prev) => ({
        ...prev,
        recentReservations: (prev.recentReservations || []).map((item) => (item._id === updatedReservation._id ? updatedReservation : item)),
      }))
    } catch (error) {
      setReservationsError(error.message || 'Unable to cancel reservation.')
    } finally {
      setBusyId('')
    }
  }

  const handleCancelOrder = async () => {
    if (!selectedOrder?._id || !token) return
    try {
      setBusyId(selectedOrder._id)
      setOrdersError('')
      const data = await apiRequest(`/api/orders/${selectedOrder._id}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      const updatedOrder = data.order
      setOrders((prev) => prev.map((item) => (item._id === updatedOrder._id ? updatedOrder : item)))
      setDashboard((prev) => ({
        ...prev,
        recentOrders: (prev.recentOrders || []).map((item) => (item._id === updatedOrder._id ? updatedOrder : item)),
      }))
    } catch (error) {
      setOrdersError(error.message || 'Unable to cancel order.')
    } finally {
      setBusyId('')
    }
  }

  return (
    <section className="section">
      <div className="container profile-page">
        <div className="profile-shell">
          <aside className="profile-sidebar">
            <div className="profile-identity-card">
              <div className="profile-identity-top">
                {avatarSrc ? <img className="profile-identity-avatar" src={avatarSrc} alt={user?.name || 'Profile'} /> : <div className="profile-identity-avatar profile-avatar-fallback">{initials}</div>}
                <div className="profile-identity-copy">
                  <p className="profile-eyebrow">Account Overview</p>
                  <h2>{user?.name || 'User'}</h2>
                  <p>{user?.email || '-'}</p>
                </div>
              </div>
              <div className="profile-account-strip">
                <div>
                  <span className="profile-meta-label">Status</span>
                  <strong>{user?.isEmailVerified ? 'Verified and active' : 'Needs verification'}</strong>
                </div>
                <div>
                  <span className="profile-meta-label">Location</span>
                  <strong>{[user?.city, user?.country].filter(Boolean).join(', ') || 'Add your location'}</strong>
                </div>
              </div>
              <div className="profile-identity-meta">
                <div>
                  <span className="profile-meta-label">Phone</span>
                  <strong>{user?.phone || 'Add your phone number'}</strong>
                </div>
                <div>
                  <span className="profile-meta-label">Preferences</span>
                  <strong>{preferences}</strong>
                </div>
                <div>
                  <span className="profile-meta-label">Saved Address</span>
                  <strong>{fullAddress || 'No address saved yet'}</strong>
                </div>
              </div>
              <div className="profile-completion-card">
                <div className="profile-completion-header">
                  <div>
                    <p className="profile-eyebrow">Completion</p>
                    <h3>{completion}% complete</h3>
                  </div>
                  <span className="profile-completion-score">{completion}%</span>
                </div>
                <div className="profile-progress-track">
                  <span className="profile-progress-fill" style={{ width: `${completion}%` }} />
                </div>
                <ul className="profile-task-list">
                  {tasks.map((task) => (
                    <li key={task.id} className={task.complete ? 'is-complete' : ''}>
                      <span className="profile-task-dot" />
                      <span>{task.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="profile-sidebar-actions">
                <Link className="btn" to="/profile/edit">Edit Profile</Link>
                <Link className="btn btn-outline" to="/reservations">Book a Table</Link>
                <button className="btn btn-muted" type="button" onClick={logout}>Log Out</button>
              </div>
            </div>
          </aside>

          <div className="profile-main">
            {completion < 100 && (
              <div className="panel profile-alert-card">
                <div>
                  <p className="profile-eyebrow">Profile Attention</p>
                  <h3>Finish the remaining account steps.</h3>
                  <p className="profile-completion-copy">
                    {missingTasks.length} item{missingTasks.length === 1 ? '' : 's'} still need attention. Start with: {nextTask}.
                  </p>
                </div>
                <Link className="btn" to="/profile/edit">Complete Profile</Link>
              </div>
            )}

            <div className="panel profile-hero">
              <div className="profile-hero-copy">
                <p className="profile-eyebrow">Delxta Dashboard</p>
                <h1>Profile and activity in one place.</h1>
                <p>{missingTasks.length ? `Complete ${missingTasks.length} more ${missingTasks.length === 1 ? 'step' : 'steps'} to finish your account.` : 'Your profile is complete. You can book and order without friction.'}</p>
                <div className="profile-hero-highlights">
                  <div className="profile-highlight-chip">
                    <span className="profile-meta-label">Bio</span>
                    <strong>{user?.bio || 'Add a short profile bio'}</strong>
                  </div>
                  <div className="profile-highlight-chip">
                    <span className="profile-meta-label">Verification</span>
                    <strong>{user?.isEmailVerified ? 'Verified email' : 'Verification pending'}</strong>
                  </div>
                  <div className="profile-highlight-chip">
                    <span className="profile-meta-label">Marketing</span>
                    <strong>{user?.marketingOptIn ? 'Subscribed' : 'Quiet mode'}</strong>
                  </div>
                </div>
              </div>
              <div className="profile-hero-side">
                <div className="profile-hero-actions">
                  <Link className="btn" to="/menu">Order Food</Link>
                  <Link className="btn btn-outline" to="/profile/edit">Manage Account</Link>
                </div>
                <div className="profile-premium-panel">
                  <p className="profile-eyebrow">Concierge Snapshot</p>
                  <div className="profile-premium-metrics">
                    {premiumMetrics.map(([label, value, detail]) => (
                      <div key={label}>
                        <span className="profile-meta-label">{label}</span>
                        <strong>{value}</strong>
                        <p>{detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="profile-mobile-summary" aria-label="Profile app summary">
              <div className="profile-mobile-summary-card">
                <FiUser aria-hidden="true" />
                <div>
                  <span className="profile-meta-label">Profile</span>
                  <strong>{completion}% complete</strong>
                </div>
              </div>
              <div className="profile-mobile-summary-card">
                <FiClock aria-hidden="true" />
                <div>
                  <span className="profile-meta-label">Pending</span>
                  <strong>{dashboard.stats.pendingReservations || 0} reservations</strong>
                </div>
              </div>
              <div className="profile-mobile-summary-card">
                <FiActivity aria-hidden="true" />
                <div>
                  <span className="profile-meta-label">Orders</span>
                  <strong>{dashboard.stats.activeOrders || 0} active</strong>
                </div>
              </div>
            </div>

            <div className="profile-stats-grid">
              {stats.map(([label, value, detail]) => (
                <div className="panel profile-stat-card" key={label}>
                  <p className="profile-stat-label">{label}</p>
                  <h3>{value}</h3>
                  <p className="profile-stat-detail">{detail}</p>
                </div>
              ))}
            </div>

            <div className="profile-quick-grid">
              {quickHighlights.map(([label, value, detail]) => (
                <div className="panel profile-quick-card" key={label}>
                  <p className="profile-stat-label">{label}</p>
                  <h3>{value}</h3>
                  <p className="profile-stat-detail">{detail}</p>
                </div>
              ))}
            </div>

            <div className="panel profile-activity-card">
              <div className="profile-activity-header">
                <div>
                  <p className="profile-eyebrow">Activity</p>
                  <h3>Profile details, orders, and reservations</h3>
                </div>
                <div className="profile-tabs profile-tabs-sticky">
                  <button className={`profile-tab ${activeTab === 'overview' ? 'active' : ''}`} type="button" onClick={() => setActiveTab('overview')}>Overview</button>
                  <button className={`profile-tab ${activeTab === 'reservations' ? 'active' : ''}`} type="button" onClick={() => setActiveTab('reservations')}>Reservations</button>
                  <button className={`profile-tab ${activeTab === 'orders' ? 'active' : ''}`} type="button" onClick={() => setActiveTab('orders')}>Orders</button>
                  {user?.role === 'admin' && <button className={`profile-tab ${activeTab === 'admin' ? 'active' : ''}`} type="button" onClick={() => setActiveTab('admin')}>Admin</button>}
                </div>
              </div>

              {activeTab === 'overview' && (
                <div className="profile-content-grid">
                  <div className="panel profile-list-panel">
                    <div className="profile-list-head">
                      <div>
                        <p className="profile-eyebrow">Saved Details</p>
                        <h4>Account information</h4>
                      </div>
                      <Link className="profile-inline-link profile-inline-action" to="/profile/edit">Edit</Link>
                    </div>
                    <dl className="profile-detail-list">
                      <div><dt>Email</dt><dd>{user?.email || '-'}</dd></div>
                      <div><dt>Phone</dt><dd>{user?.phone || '-'}</dd></div>
                      <div><dt>Gender</dt><dd>{fmtTitle(user?.gender || 'prefer_not_to_say')}</dd></div>
                      <div><dt>City</dt><dd>{user?.city || '-'}</dd></div>
                      <div className="profile-detail-full"><dt>Address</dt><dd>{fullAddress || 'No saved address yet.'}</dd></div>
                      <div className="profile-detail-full"><dt>Bio</dt><dd>{user?.bio || 'No bio added yet.'}</dd></div>
                    </dl>
                  </div>

                  <div className="panel profile-list-panel">
                    <div className="profile-list-head">
                      <div>
                        <p className="profile-eyebrow">Highlights</p>
                        <h4>Current account state</h4>
                      </div>
                    </div>
                    <div className="profile-health-grid">
                      <div className="profile-health-item"><strong>{dashboard.stats.pendingReservations || 0}</strong><p>Pending reservations</p></div>
                      <div className="profile-health-item"><strong>{dashboard.stats.activeOrders || 0}</strong><p>Active orders</p></div>
                      <div className="profile-health-item"><strong>{dashboard.stats.paidOrders || 0}</strong><p>Paid orders</p></div>
                    </div>
                    <div className="profile-detail-stack">
                      <div><span className="profile-meta-label">Preferred contact</span><strong>{fmtTitle(user?.preferredContactMethod || 'email')}</strong></div>
                      <div><span className="profile-meta-label">Preferred dining time</span><strong>{fmtTitle(user?.preferredDiningTime || 'flexible')}</strong></div>
                      <div><span className="profile-meta-label">Dietary preference</span><strong>{fmtTitle(user?.dietaryPreference || 'none')}</strong></div>
                    </div>
                    <div className="profile-edit-actions">
                      <Link className="btn btn-outline" to="/profile/edit">Update preferences</Link>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'reservations' && (
                <div className="profile-split-view">
                  <div className="profile-activity-list">
                    {reservationsError && <div className="form-error">{reservationsError}</div>}
                    {reservationsStatus === 'loading' ? <p className="loading">Loading reservations...</p> : reservations.length ? reservations.map((item) => (
                      <button key={item._id} className={`profile-activity-item ${selectedReservationId === item._id ? 'active' : ''}`} type="button" onClick={() => setSelectedReservationId(item._id)}>
                        <div>
                          <strong>{fmtReservation(item._id)}</strong>
                          <span className={`status-badge ${getTone(item.status)}`}>{fmtTitle(item.status)}</span>
                        </div>
                        <p>{item.date} at {item.time}</p>
                        <span>{item.guests} guests</span>
                      </button>
                    )) : <div className="profile-empty-state"><p>No reservations yet.</p><span>Your recent table bookings will appear here.</span></div>}
                  </div>

                  <div className="panel profile-detail-panel">
                    {selectedReservation ? (
                      <>
                        <div className="profile-section-head">
                          <div>
                            <p className="profile-eyebrow">Reservation Detail</p>
                            <h4>{fmtReservation(selectedReservation._id)}</h4>
                          </div>
                          <span className={`status-badge ${getTone(selectedReservation.status)}`}>{fmtTitle(selectedReservation.status)}</span>
                        </div>
                        <div className="profile-detail-stack">
                          <div><span className="profile-meta-label">Date</span><strong>{selectedReservation.date}</strong></div>
                          <div><span className="profile-meta-label">Time</span><strong>{selectedReservation.time}</strong></div>
                          <div><span className="profile-meta-label">Guests</span><strong>{selectedReservation.guests}</strong></div>
                          <div><span className="profile-meta-label">Requests</span><strong>{selectedReservation.requests || 'No extra requests.'}</strong></div>
                          <div><span className="profile-meta-label">Created</span><strong>{fmtDateTime(selectedReservation.createdAt)}</strong></div>
                        </div>
                        <div className="profile-edit-actions">
                          <Link
                            className="btn btn-outline"
                            to={`/reservations?date=${encodeURIComponent(selectedReservation.date || '')}&time=${encodeURIComponent(selectedReservation.time || '')}&guests=${encodeURIComponent(selectedReservation.guests || '')}&requests=${encodeURIComponent(selectedReservation.requests || '')}`}
                          >
                            Book Similar
                          </Link>
                          {canCancelReservation && (
                            <button className="btn btn-muted" type="button" onClick={handleCancelReservation} disabled={busyId === selectedReservation._id}>
                              {busyId === selectedReservation._id ? 'Cancelling...' : 'Cancel Reservation'}
                            </button>
                          )}
                        </div>
                      </>
                    ) : <div className="profile-empty-state"><p>Select a reservation.</p><span>Choose one from the list to inspect it.</span></div>}
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="profile-split-view">
                  <div className="profile-activity-list">
                    {placedOrder && <div className="form-success">Order successful. You can review it below.</div>}
                    {ordersError && <div className="form-error">{ordersError}</div>}
                    {ordersStatus === 'loading' ? <p className="loading">Loading orders...</p> : allOrders.length ? allOrders.map((item) => (
                      <button key={item._id} className={`profile-list-card ${selectedOrderId === item._id ? 'active' : ''}`} type="button" onClick={() => setSelectedOrderId(item._id)}>
                        <div className="profile-list-card-top">
                          <strong>{fmtOrder(item._id)}</strong>
                          <span className={`status-badge ${getTone(item.orderStatus)}`}>{fmtTitle(item.orderStatus)}</span>
                        </div>
                        <p>{fmtMoney(item.total)}</p>
                        <span>{fmtTitle(item.deliveryType)} | {fmtTitle(item.paymentStatus)}</span>
                      </button>
                    )) : <div className="profile-empty-state"><p>No orders yet.</p><span>Your recent orders will appear here after checkout.</span></div>}
                  </div>

                  <div className="panel profile-detail-panel">
                    {selectedOrder ? (
                      <>
                        <div className="profile-section-head">
                          <div>
                            <p className="profile-eyebrow">Order Detail</p>
                            <h4>{fmtOrder(selectedOrder._id)}</h4>
                          </div>
                          <span className={`status-badge ${getTone(selectedOrder.orderStatus)}`}>{fmtTitle(selectedOrder.orderStatus)}</span>
                        </div>
                        <div className="profile-detail-stack">
                          <div><span className="profile-meta-label">Placed</span><strong>{fmtDateTime(selectedOrder.createdAt)}</strong></div>
                          <div><span className="profile-meta-label">Payment</span><strong>{fmtTitle(selectedOrder.paymentMethod)} ({fmtTitle(selectedOrder.paymentStatus)})</strong></div>
                          <div><span className="profile-meta-label">Delivery</span><strong>{fmtTitle(selectedOrder.deliveryType)}</strong></div>
                          <div><span className="profile-meta-label">Items</span><strong>{selectedOrder.items?.length || 0}</strong></div>
                          <div><span className="profile-meta-label">Total</span><strong>{fmtMoney(selectedOrder.total)}</strong></div>
                          <div><span className="profile-meta-label">Summary</span><strong>{orderItemSummary}</strong></div>
                        </div>
                        <div className="profile-edit-actions">
                          <Link className="btn" to={`/orders/${selectedOrder._id}`}>View Full Order</Link>
                          <button className="btn btn-outline" type="button" onClick={handleRepeatOrder}>Order Again</button>
                          {canCancelOrder && (
                            <button className="btn btn-muted" type="button" onClick={handleCancelOrder} disabled={busyId === selectedOrder._id}>
                              {busyId === selectedOrder._id ? 'Cancelling...' : 'Cancel Order'}
                            </button>
                          )}
                        </div>
                      </>
                    ) : <div className="profile-empty-state"><p>Select an order.</p><span>Choose one from the list to inspect it.</span></div>}
                  </div>
                </div>
              )}

              {activeTab === 'admin' && user?.role === 'admin' && (
                <div className="profile-admin-stack">
                  {(adminMessage || adminError) && (
                    <div>
                      {adminMessage && <div className="form-success">{adminMessage}</div>}
                      {adminError && <div className="form-error">{adminError}</div>}
                    </div>
                  )}

                  <div className="panel profile-activity-panel">
                    <div className="profile-list-head">
                      <div>
                        <p className="profile-eyebrow">Menu Admin</p>
                        <h4>Upload and maintain menu items</h4>
                      </div>
                      <button className="btn btn-outline" type="button" onClick={resetMenuForm}>
                        Add New Item
                      </button>
                    </div>

                    <div className="admin-filter-row">
                      {['all', ...menuCategories].map((category) => (
                        <button
                          key={category}
                          className={`admin-filter-btn ${menuFilterCategory === category ? 'active' : ''}`}
                          type="button"
                          onClick={() => setMenuFilterCategory(category)}
                        >
                          {fmtTitle(category)} ({menuCounts[category] || 0})
                        </button>
                      ))}
                    </div>

                    <div className="profile-split-view">
                      <div className="profile-activity-list">
                        {menuError && menuStatus === 'error' && <div className="form-error">{menuError}</div>}
                        {menuStatus === 'loading' ? <p className="loading">Loading menu items...</p> : filteredMenuItems.length ? filteredMenuItems.map((item) => (
                          <button
                            key={item._id}
                            className={`profile-list-card ${selectedAdminMenuId === item._id ? 'active' : ''}`}
                            type="button"
                            onClick={() => handleSelectAdminMenu(item)}
                          >
                            <div className="profile-list-card-top">
                              <strong>{item.name}</strong>
                              <span className={`status-badge ${item.isAvailable === false ? 'danger' : 'success'}`}>
                                {item.isAvailable === false ? 'Unavailable' : 'Live'}
                              </span>
                            </div>
                            <p>{item.category}</p>
                            <span>{item.price} {item.isFeatured ? '| Featured' : ''}</span>
                          </button>
                        )) : <div className="profile-empty-state"><p>No menu items found.</p><span>Use the form to create a new menu item for this category.</span></div>}
                      </div>

                      <div className="panel profile-detail-panel">
                        <form className="profile-detail-stack menu-admin-form-stack" onSubmit={submitMenuForm}>
                          <div className="profile-section-head">
                            <div>
                              <p className="profile-eyebrow">Menu Item Editor</p>
                              <h4>{menuFormMode === 'edit' ? 'Update menu item' : 'Create menu item'}</h4>
                            </div>
                            <span className={`status-badge ${menuForm.isAvailable ? 'success' : 'danger'}`}>
                              {menuForm.isAvailable ? 'Available' : 'Unavailable'}
                            </span>
                          </div>

                          {menuPreviewSrc ? (
                            <img className="menu-admin-preview" src={menuPreviewSrc} alt={menuForm.name || 'Menu preview'} />
                          ) : (
                            <div className="profile-empty-state">
                              <p>No image selected.</p>
                              <span>Choose an image to preview it here before saving.</span>
                            </div>
                          )}

                          <div className="form-grid">
                            <div>
                              <label className="form-label">Name</label>
                              <input className="input" value={menuForm.name} onChange={(e) => handleMenuFieldChange('name', e.target.value)} placeholder="Smoky Jollof Rice" />
                            </div>
                            <div>
                              <label className="form-label">Price</label>
                              <input className="input" value={menuForm.price} onChange={(e) => handleMenuFieldChange('price', e.target.value)} placeholder="NGN 8,500" />
                            </div>
                            <div>
                              <label className="form-label">Category</label>
                              <select className="select" value={menuForm.category} onChange={(e) => handleMenuFieldChange('category', e.target.value)}>
                                {menuCategories.map((category) => (
                                  <option key={category} value={category}>{category}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="form-label">Meal Image</label>
                              <input className="input" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleMenuImageChange} />
                            </div>
                          </div>

                          <div>
                            <label className="form-label">Description</label>
                            <textarea className="textarea" value={menuForm.description} onChange={(e) => handleMenuFieldChange('description', e.target.value)} placeholder="Describe the dish, ingredients, and serving style." rows="4" />
                          </div>

                          <div className="profile-toggle-grid menu-admin-toggle-grid">
                            <label className="profile-toggle-card">
                              <input type="checkbox" checked={menuForm.isFeatured} onChange={(e) => handleMenuFieldChange('isFeatured', e.target.checked)} />
                              <div>
                                <strong>Featured item</strong>
                                <span>Highlight this dish in curated or promotional sections.</span>
                              </div>
                            </label>
                            <label className="profile-toggle-card">
                              <input type="checkbox" checked={menuForm.isAvailable} onChange={(e) => handleMenuFieldChange('isAvailable', e.target.checked)} />
                              <div>
                                <strong>Available to order</strong>
                                <span>Turn this off to keep the item listed but unavailable for checkout.</span>
                              </div>
                            </label>
                          </div>

                          <div className="profile-edit-actions">
                            <button className="btn" type="submit" disabled={busyId === (selectedAdminMenuId || 'menu-create')}>
                              {busyId === (selectedAdminMenuId || 'menu-create')
                                ? (menuFormMode === 'edit' ? 'Saving...' : 'Creating...')
                                : (menuFormMode === 'edit' ? 'Save Changes' : 'Create Item')}
                            </button>
                            {menuFormMode === 'edit' && (
                              <button className="btn btn-muted" type="button" onClick={handleDeleteMenuItem} disabled={busyId === selectedAdminMenuId}>
                                {busyId === selectedAdminMenuId ? 'Working...' : 'Delete Item'}
                              </button>
                            )}
                            <button className="btn btn-outline" type="button" onClick={resetMenuForm}>
                              Reset
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>

                  <div className="profile-content-grid">
                    <div className="panel profile-activity-panel">
                      <div className="profile-list-head">
                        <div>
                          <p className="profile-eyebrow">Reservations Admin</p>
                          <h4>Manage incoming table bookings</h4>
                        </div>
                      </div>

                      <div className="admin-filter-row">
                        {['all', ...reservationStatuses].map((status) => (
                          <button
                            key={status}
                            className={`admin-filter-btn ${adminReservationFilter === status ? 'active' : ''}`}
                            type="button"
                            onClick={() => setAdminReservationFilter(status)}
                          >
                            {fmtTitle(status)} ({reservationCounts[status] || 0})
                          </button>
                        ))}
                      </div>

                      <div className="profile-split-view">
                        <div className="profile-activity-list">
                          {filteredAdminReservations.length ? filteredAdminReservations.map((item) => (
                            <button
                              key={item._id}
                              className={`profile-activity-item ${selectedAdminReservationId === item._id ? 'active' : ''}`}
                              type="button"
                              onClick={() => setSelectedAdminReservationId(item._id)}
                            >
                              <div>
                                <strong>{item.name || fmtReservation(item._id)}</strong>
                                <span className={`status-badge ${getTone(item.status)}`}>{fmtTitle(item.status)}</span>
                              </div>
                              <p>{item.date} at {item.time}</p>
                              <span>{item.guests} guests</span>
                            </button>
                          )) : <div className="profile-empty-state"><p>No reservations found.</p><span>Nothing matches the selected filter.</span></div>}
                        </div>

                        <div className="panel profile-detail-panel">
                          {selectedAdminReservation ? (
                            <>
                              <div className="profile-section-head">
                                <div>
                                  <p className="profile-eyebrow">Reservation Manager</p>
                                  <h4>{selectedAdminReservation.name || fmtReservation(selectedAdminReservation._id)}</h4>
                                </div>
                                <span className={`status-badge ${getTone(selectedAdminReservation.status)}`}>{fmtTitle(selectedAdminReservation.status)}</span>
                              </div>
                              <div className="profile-detail-stack">
                                <div><span className="profile-meta-label">Guest</span><strong>{selectedAdminReservation.name || '-'}</strong></div>
                                <div><span className="profile-meta-label">Email</span><strong>{selectedAdminReservation.email || '-'}</strong></div>
                                <div><span className="profile-meta-label">Phone</span><strong>{selectedAdminReservation.phone || '-'}</strong></div>
                                <div><span className="profile-meta-label">Schedule</span><strong>{selectedAdminReservation.date} at {selectedAdminReservation.time}</strong></div>
                                <div><span className="profile-meta-label">Guests</span><strong>{selectedAdminReservation.guests || 0}</strong></div>
                                <div><span className="profile-meta-label">Requests</span><strong>{selectedAdminReservation.requests || 'No extra requests.'}</strong></div>
                                <div><span className="profile-meta-label">Created</span><strong>{fmtDateTime(selectedAdminReservation.createdAt)}</strong></div>
                              </div>
                              <div className="admin-actions card-action-btn">
                                {reservationStatuses.map((status) => (
                                  <button
                                    key={status}
                                    className={`admin-filter-btn ${selectedAdminReservation.status === status ? 'active' : ''}`}
                                    type="button"
                                    disabled={busyId === selectedAdminReservation._id}
                                    onClick={() => runAdminUpdate(
                                      `/api/reservations/${selectedAdminReservation._id}/status`,
                                      { id: selectedAdminReservation._id, body: { status } },
                                      '/api/reservations/admin'
                                    )}
                                  >
                                    {busyId === selectedAdminReservation._id && selectedAdminReservation.status !== status
                                      ? 'Updating...'
                                      : fmtTitle(status)}
                                  </button>
                                ))}
                              </div>
                            </>
                          ) : <div className="profile-empty-state"><p>Select a reservation.</p><span>Choose one to update its status.</span></div>}
                        </div>
                      </div>
                    </div>

                    <div className="panel profile-activity-panel">
                      <div className="profile-list-head">
                        <div>
                          <p className="profile-eyebrow">Orders Admin</p>
                          <h4>Track kitchen and delivery flow</h4>
                        </div>
                      </div>

                      <div className="admin-filter-row">
                        {['all', ...orderStatuses].map((status) => (
                          <button
                            key={status}
                            className={`admin-filter-btn ${adminOrderFilter === status ? 'active' : ''}`}
                            type="button"
                            onClick={() => setAdminOrderFilter(status)}
                          >
                            {fmtTitle(status)} ({orderCounts[status] || 0})
                          </button>
                        ))}
                      </div>

                      <div className="profile-split-view">
                        <div className="profile-activity-list">
                          {filteredAdminOrders.length ? filteredAdminOrders.map((item) => (
                            <button
                              key={item._id}
                              className={`profile-list-card ${selectedAdminOrderId === item._id ? 'active' : ''}`}
                              type="button"
                              onClick={() => setSelectedAdminOrderId(item._id)}
                            >
                              <div className="profile-list-card-top">
                                <strong>{fmtOrder(item._id)}</strong>
                                <span className={`status-badge ${getTone(item.orderStatus)}`}>{fmtTitle(item.orderStatus)}</span>
                              </div>
                              <p>{item.customerName || item.email || 'Customer'}</p>
                              <span>{fmtMoney(item.total)} | {fmtTitle(item.paymentStatus)}</span>
                            </button>
                          )) : <div className="profile-empty-state"><p>No orders found.</p><span>Nothing matches the selected filter.</span></div>}
                        </div>

                        <div className="panel profile-detail-panel">
                          {selectedAdminOrder ? (
                            <>
                              <div className="profile-section-head">
                                <div>
                                  <p className="profile-eyebrow">Order Manager</p>
                                  <h4>{fmtOrder(selectedAdminOrder._id)}</h4>
                                </div>
                                <span className={`status-badge ${getTone(selectedAdminOrder.orderStatus)}`}>{fmtTitle(selectedAdminOrder.orderStatus)}</span>
                              </div>
                              <div className="profile-detail-stack">
                                <div><span className="profile-meta-label">Customer</span><strong>{selectedAdminOrder.customerName || '-'}</strong></div>
                                <div><span className="profile-meta-label">Email</span><strong>{selectedAdminOrder.email || '-'}</strong></div>
                                <div><span className="profile-meta-label">Phone</span><strong>{selectedAdminOrder.phone || '-'}</strong></div>
                                <div><span className="profile-meta-label">Placed</span><strong>{fmtDateTime(selectedAdminOrder.createdAt)}</strong></div>
                                <div><span className="profile-meta-label">Delivery</span><strong>{fmtTitle(selectedAdminOrder.deliveryType)}</strong></div>
                                <div><span className="profile-meta-label">Payment</span><strong>{fmtTitle(selectedAdminOrder.paymentMethod)} ({fmtTitle(selectedAdminOrder.paymentStatus)})</strong></div>
                                <div><span className="profile-meta-label">Items</span><strong>{selectedAdminOrder.items?.length || 0}</strong></div>
                                <div><span className="profile-meta-label">Total</span><strong>{fmtMoney(selectedAdminOrder.total)}</strong></div>
                                <div><span className="profile-meta-label">Summary</span><strong>{adminOrderItemSummary}</strong></div>
                              </div>
                              <div className="admin-actions card-action-btn">
                                {orderStatuses.map((status) => (
                                  <button
                                    key={status}
                                    className={`admin-filter-btn ${selectedAdminOrder.orderStatus === status ? 'active' : ''}`}
                                    type="button"
                                    disabled={busyId === selectedAdminOrder._id}
                                    onClick={() => runAdminUpdate(
                                      `/api/orders/${selectedAdminOrder._id}/status`,
                                      { id: selectedAdminOrder._id, body: { orderStatus: status } },
                                      '/api/orders/admin'
                                    )}
                                  >
                                    {busyId === selectedAdminOrder._id && selectedAdminOrder.orderStatus !== status
                                      ? 'Updating...'
                                      : fmtTitle(status)}
                                  </button>
                                ))}
                              </div>
                            </>
                          ) : <div className="profile-empty-state"><p>Select an order.</p><span>Choose one to update its status.</span></div>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Profile
