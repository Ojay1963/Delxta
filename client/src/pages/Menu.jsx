/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import LoadingState from '../components/LoadingState'
import { menuCategories } from '../data/content'
import { useCart } from '../context/CartContext'
import { findUnitOption, getUnitOptionsForItem } from '../utils/servingUnits'
import { apiRequest } from '../utils/api'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const parsePrice = (price) => {
  const normalized = String(price || '')
    .replace(/[^0-9.]/g, '')
    .trim()
  return Number(normalized) || 0
}

const formatCurrency = (amount) => `NGN ${amount.toLocaleString()}`

function Menu() {
  const [category, setCategory] = useState(menuCategories[0])
  const [menuState, setMenuState] = useState({
    category: '',
    items: [],
    error: '',
  })
  const [configByItemId, setConfigByItemId] = useState({})
  const [addedMessage, setAddedMessage] = useState('')
  const { addItem, itemCount } = useCart()
  const items = menuState.items
  const error = menuState.error
  const status = menuState.category !== category
    ? 'loading'
    : menuState.error
      ? 'error'
      : 'success'
  const availableCount = items.filter((item) => item.isAvailable !== false).length

  useEffect(() => {
    let isMounted = true

    apiRequest(`/api/menu?category=${encodeURIComponent(category)}`)
      .then((data) => {
        if (!isMounted) return
        setMenuState({
          category,
          items: data.items || [],
          error: '',
        })
      })
      .catch((err) => {
        if (!isMounted) return
        setMenuState({
          category,
          items: [],
          error: err.message || 'Failed to load menu.',
        })
      })

    return () => {
      isMounted = false
    }
  }, [category])

  const configFor = (item) => {
    const existing = configByItemId[item._id]
    if (existing) return existing
    const defaultUnit = findUnitOption(item)
    return { servingOption: defaultUnit.value, quantity: 1 }
  }

  const updateItemConfig = (item, next) => {
    const current = configFor(item)
    setConfigByItemId((prev) => ({
      ...prev,
      [item._id]: { ...current, ...next },
    }))
  }

  const estimatedUnitPrice = (item, servingOptionValue) => {
    const base = parsePrice(item.price)
    const servingOption = findUnitOption(item, servingOptionValue)
    const multiplier = servingOption ? servingOption.multiplier : 1
    return Math.round(base * multiplier)
  }

  const handleAddToOrder = (item) => {
    const config = configFor(item)
    const selectedOption = findUnitOption(item, config.servingOption)
    addItem(item, selectedOption, config.quantity)
    setAddedMessage(`${item.name} (${selectedOption.label}) added to order.`)
    window.setTimeout(() => setAddedMessage(''), 2000)
  }

  return (
    <section className="section">
      <div className="container menu-page">
        <div className="menu-hero panel">
          <div>
            <p className="profile-eyebrow">Browse Delxta</p>
            <h2 className="section-title" style={{ textAlign: 'left', marginBottom: '10px' }}>Our Menu</h2>
            <p className="section-subtitle" style={{ textAlign: 'left', margin: 0 }}>
              Choose a category, adjust serving type and quantity, then build your order with clearer pricing.
            </p>
          </div>
          <div className="menu-hero-stats">
            <div className="profile-highlight-chip">
              <span className="profile-meta-label">Category</span>
              <strong>{category}</strong>
            </div>
            <div className="profile-highlight-chip">
              <span className="profile-meta-label">Available Items</span>
              <strong>{availableCount}</strong>
            </div>
            <div className="profile-highlight-chip">
              <span className="profile-meta-label">Order Basket</span>
              <strong>{itemCount} item(s)</strong>
            </div>
          </div>
        </div>

        {itemCount > 0 && (
          <div className="menu-actions-row">
            <div className="pill">Items in order: {itemCount}</div>
            <Link className="btn" to="/order">
              View Order & Pay
            </Link>
          </div>
        )}
        {addedMessage && <div className="form-success">{addedMessage}</div>}

        <div className="menu-tabs">
          {menuCategories.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`tab ${category === tab ? 'active' : ''}`}
              onClick={() => setCategory(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {status === 'loading' && <LoadingState message="Loading menu..." />}
        {status === 'error' && <div className="loading">{error || 'Failed to load menu.'}</div>}

        {status === 'success' && (
          <div className="menu-grid">
            {items.map((item) => {
              const config = configFor(item)
              const unitOptions = getUnitOptionsForItem(item)
              const estimated = estimatedUnitPrice(item, config.servingOption)
              const selectedOption = findUnitOption(item, config.servingOption)
              const subtotal = estimated * config.quantity

              return (
                <motion.div
                  key={item._id}
                  className="image-card menu-item-card"
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <img src={item.image} alt={item.name} />
                  <div className="image-card-body">
                    <div className="menu-card-header">
                      <h4>{item.name}</h4>
                      <span className={`status-badge ${item.isAvailable === false ? 'danger' : 'success'}`}>
                        {item.isAvailable === false ? 'Unavailable' : 'Available'}
                      </span>
                    </div>
                    <p>{item.description}</p>
                    <div className="menu-card-price-row">
                      <p className="price">{item.price}</p>
                      <span className="menu-base-price">Base price</span>
                    </div>
                    <div className="item-config-grid">
                      <div>
                        <label className="form-label">Serving Type</label>
                        <select
                          className="select"
                          value={config.servingOption}
                          onChange={(e) => updateItemConfig(item, { servingOption: e.target.value })}
                        >
                          {unitOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="form-label">Quantity</label>
                        <input
                          className="input"
                          type="number"
                          min="1"
                          value={config.quantity}
                          onChange={(e) =>
                            updateItemConfig(item, {
                              quantity: Math.max(1, Number(e.target.value) || 1),
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="menu-card-summary">
                      <div>
                        <span className="profile-meta-label">Selected Serving</span>
                        <strong>{selectedOption.label}</strong>
                      </div>
                      <div>
                        <span className="profile-meta-label">Unit Price</span>
                        <strong>{formatCurrency(estimated)}</strong>
                      </div>
                      <div>
                        <span className="profile-meta-label">Subtotal</span>
                        <strong>{formatCurrency(subtotal)}</strong>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline card-action-btn"
                      onClick={() => handleAddToOrder(item)}
                      disabled={item.isAvailable === false}
                    >
                      {item.isAvailable === false ? 'Unavailable' : 'Add to Order'}
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

export default Menu
