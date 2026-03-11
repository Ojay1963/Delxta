const MenuItem = require('../models/MenuItem')
const { resolveMealImage } = require('../utils/mealImageMap')
const { deleteImage, uploadImageBuffer } = require('../utils/cloudinary')
const { optimizeImageUrl } = require('../utils/imageDelivery')

const normalizeBoolean = (value, defaultValue = false) => {
  if (value === undefined) return defaultValue
  if (typeof value === 'boolean') return value
  const normalized = String(value).trim().toLowerCase()
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true
  if (['false', '0', 'no', 'off'].includes(normalized)) return false
  return defaultValue
}

const uploadMenuAsset = async (file, menuItemId) => {
  if (!file?.buffer) return null

  const uploadResult = await uploadImageBuffer(file.buffer, {
    folder: process.env.CLOUDINARY_MEAL_FOLDER || 'delxta/meals',
    resource_type: 'image',
    public_id: `meal-${menuItemId || 'draft'}-${Date.now()}`,
    transformation: [
      { width: 1200, height: 900, crop: 'fill', gravity: 'auto' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  })

  return {
    image: optimizeImageUrl(uploadResult.secure_url),
    imagePublicId: uploadResult.public_id,
  }
}

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

const createMenuItem = async (req, res, next) => {
  try {
    const { name, description, price, category } = req.body || {}
    if (!name || !description || !price || !category) {
      return res.status(400).json({
        message: 'Name, description, price, and category are required.',
      })
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Meal image is required.' })
    }

    const imageAsset = await uploadMenuAsset(req.file)
    const item = await MenuItem.create({
      name: String(name).trim(),
      description: String(description).trim(),
      price: String(price).trim(),
      category: String(category).trim(),
      image: imageAsset.image,
      imagePublicId: imageAsset.imagePublicId,
      isFeatured: normalizeBoolean(req.body?.isFeatured, false),
      isAvailable: normalizeBoolean(req.body?.isAvailable, true),
    })

    return res.status(201).json({
      message: 'Menu item created successfully.',
      item,
    })
  } catch (error) {
    return next(error)
  }
}

const updateMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id)
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found.' })
    }

    const body = req.body || {}
    const updatableFields = ['name', 'description', 'price', 'category']
    for (const field of updatableFields) {
      if (body[field] !== undefined) {
        item[field] = String(body[field]).trim()
      }
    }

    if (Object.prototype.hasOwnProperty.call(body, 'isFeatured')) {
      item.isFeatured = normalizeBoolean(body.isFeatured, item.isFeatured)
    }

    if (Object.prototype.hasOwnProperty.call(body, 'isAvailable')) {
      item.isAvailable = normalizeBoolean(body.isAvailable, item.isAvailable)
    }

    if (req.file) {
      const imageAsset = await uploadMenuAsset(req.file, item._id)
      const previousPublicId = item.imagePublicId
      item.image = imageAsset.image
      item.imagePublicId = imageAsset.imagePublicId
      if (previousPublicId && previousPublicId !== imageAsset.imagePublicId) {
        await deleteImage(previousPublicId)
      }
    }

    await item.save()

    return res.json({
      message: 'Menu item updated successfully.',
      item,
    })
  } catch (error) {
    return next(error)
  }
}

const deleteMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id)
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found.' })
    }

    if (item.imagePublicId) {
      await deleteImage(item.imagePublicId)
    }

    await item.deleteOne()
    return res.json({ message: 'Menu item deleted successfully.' })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  createMenuItem,
  deleteMenuItem,
  getMenuItems,
  updateMenuItem,
}
