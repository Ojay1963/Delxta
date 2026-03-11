const { v2: cloudinary } = require('cloudinary')

const requiredEnvVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']
let hasConfiguredCloudinary = false

const isCloudinaryConfigured = () =>
  requiredEnvVars.every((key) => String(process.env[key] || '').trim())

const ensureCloudinaryConfigured = () => {
  if (hasConfiguredCloudinary || !isCloudinaryConfigured()) return

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
  hasConfiguredCloudinary = true
}

const assertCloudinaryConfigured = () => {
  if (isCloudinaryConfigured()) {
    ensureCloudinaryConfigured()
    return
  }

  const error = new Error(
    'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.'
  )
  error.status = 500
  throw error
}

const uploadImageBuffer = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    assertCloudinaryConfigured()

    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error)
      return resolve(result)
    })

    stream.end(buffer)
  })

const deleteImage = async (publicId) => {
  if (!publicId || !isCloudinaryConfigured()) return null
  ensureCloudinaryConfigured()
  return cloudinary.uploader.destroy(publicId, { invalidate: true, resource_type: 'image' })
}

module.exports = {
  deleteImage,
  ensureCloudinaryConfigured,
  isCloudinaryConfigured,
  uploadImageBuffer,
}
