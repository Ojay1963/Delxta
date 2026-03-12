const express = require('express')
const {
  createMenuItem,
  deleteMenuItem,
  getMenuItems,
  updateMenuItem,
} = require('../controllers/menuController')
const { auth, adminOnly } = require('../middleware/auth')
const { uploadMenuImage } = require('../middleware/upload')

const router = express.Router()

router.get('/', getMenuItems)
router.post('/', auth, adminOnly, uploadMenuImage, createMenuItem)
router.patch('/:id', auth, adminOnly, uploadMenuImage, updateMenuItem)
router.delete('/:id', auth, adminOnly, deleteMenuItem)

module.exports = router
