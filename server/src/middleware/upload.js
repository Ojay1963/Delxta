const multer = require('multer')

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

const fileFilter = (req, file, cb) => {
  if (!IMAGE_MIME_TYPES.includes(file.mimetype)) {
    const error = new Error('Only JPG, PNG, WEBP, or GIF images are allowed.')
    error.status = 400
    return cb(error)
  }

  return cb(null, true)
}

const createSingleImageUpload = (fieldName, maxFileSizeMb = 5) =>
  multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: { fileSize: maxFileSizeMb * 1024 * 1024 },
  }).single(fieldName)

const uploadAvatar = createSingleImageUpload('avatar', 2)
const uploadMenuImage = createSingleImageUpload('image', 8)

module.exports = {
  uploadAvatar,
  uploadMenuImage,
}
