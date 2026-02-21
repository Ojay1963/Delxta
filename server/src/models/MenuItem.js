const mongoose = require('mongoose')

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: String, required: true },
    category: { type: String, required: true },
    image: { type: String, required: true },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
)

module.exports = mongoose.model('MenuItem', menuItemSchema)
