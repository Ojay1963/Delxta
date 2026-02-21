const MenuItem = require('../models/MenuItem')

const getMenuItems = async (req, res, next) => {
  try {
    const { category } = req.query
    const filter = category ? { category } : {}
    const items = await MenuItem.find(filter).sort({ createdAt: -1 })
    return res.json({ items })
  } catch (error) {
    return next(error)
  }
}

module.exports = { getMenuItems }
