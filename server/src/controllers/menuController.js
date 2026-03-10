const MenuItem = require('../models/MenuItem')
const { resolveMealImage } = require('../utils/mealImageMap')

const getMenuItems = async (req, res, next) => {
  try {
    const { category } = req.query
    const filter = category ? { category } : {}
    const items = await MenuItem.find(filter).sort({ createdAt: -1 })
    const normalizedItems = items.map((item) => ({
      ...item.toObject(),
      image: resolveMealImage(item.name, item.image, req),
    }))
    return res.json({ items: normalizedItems })
  } catch (error) {
    return next(error)
  }
}

module.exports = { getMenuItems }
