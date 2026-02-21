const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    role: { type: String },
    quote: { type: String, required: true },
    avatar: { type: String },
    rating: { type: Number, default: 5 },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Review', reviewSchema)
