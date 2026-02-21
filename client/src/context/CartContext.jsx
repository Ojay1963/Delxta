import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { findUnitOption } from '../utils/servingUnits'

const CartContext = createContext(null)

const STORAGE_KEY = 'delxta_cart'

const parsePrice = (price) => {
  const normalized = String(price || '')
    .replace(/[^0-9.]/g, '')
    .trim()
  return Number(normalized) || 0
}

const buildLineItem = (menuItem, selectedUnitOption, quantity) => {
  const servingOption = selectedUnitOption || findUnitOption(menuItem)
  const basePrice = parsePrice(menuItem.price)
  const unitPrice = Math.round(basePrice * servingOption.multiplier)
  const safeQuantity = Math.max(1, Number(quantity) || 1)

  return {
    key: `${menuItem._id}:${servingOption.value}`,
    menuItemId: menuItem._id,
    name: menuItem.name,
    image: menuItem.image,
    servingOption: servingOption.value,
    servingLabel: servingOption.label,
    basePrice,
    unitPrice,
    quantity: safeQuantity,
    lineTotal: unitPrice * safeQuantity,
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addItem = (menuItem, unitOption, quantity = 1) => {
    const nextItem = buildLineItem(menuItem, unitOption, quantity)
    setItems((prev) => {
      const existing = prev.find((item) => item.key === nextItem.key)
      if (!existing) return [...prev, nextItem]

      const nextQty = existing.quantity + nextItem.quantity
      return prev.map((item) =>
        item.key === nextItem.key
          ? { ...item, quantity: nextQty, lineTotal: item.unitPrice * nextQty }
          : item
      )
    })
  }

  const updateQuantity = (key, quantity) => {
    const nextQty = Math.max(1, Number(quantity) || 1)
    setItems((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, quantity: nextQty, lineTotal: item.unitPrice * nextQty } : item
      )
    )
  }

  const removeItem = (key) => {
    setItems((prev) => prev.filter((item) => item.key !== key))
  }

  const clearCart = () => setItems([])

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0)

  const value = useMemo(
    () => ({ items, itemCount, subtotal, addItem, updateQuantity, removeItem, clearCart }),
    [items, itemCount, subtotal]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => useContext(CartContext)
