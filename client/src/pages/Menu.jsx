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
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [configByItemId, setConfigByItemId] = useState({})
  const [addedMessage, setAddedMessage] = useState('')
  const { addItem, itemCount } = useCart()

  useEffect(() => {
    setStatus('loading')
    apiRequest(`/api/menu?category=${encodeURIComponent(category)}`)
      .then((data) => {
        setItems(data.items)
        setStatus('success')
      })
      .catch((err) => {
        setError(err.message)
        setStatus('error')
      })
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
      <div className="container">
        <h2 className="section-title">Our Menu</h2>
        <p className="section-subtitle">
          Select serving type and quantity, then add to your order.
        </p>
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
              return (
                <motion.div
                  key={item._id}
                  className="image-card"
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <img src={item.image} alt={item.name} />
                  <div className="image-card-body">
                    <h4>{item.name}</h4>
                    <p>{item.description}</p>
                    <p className="price">{item.price}</p>
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
                    <p className="price" style={{ marginTop: '8px' }}>
                      Estimated unit price: {formatCurrency(estimated)}
                    </p>
                    <button
                      type="button"
                      className="btn btn-outline card-action-btn"
                      onClick={() => handleAddToOrder(item)}
                    >
                      Place an Order
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
