const DEFAULT_CLOUDINARY_TRANSFORMATION = 'f_auto,q_auto,c_fill,w_960,h_720'

const normalizeUrl = (value) => String(value || '').trim()

const isCloudinaryUrl = (value) =>
  /^https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//i.test(normalizeUrl(value))

const optimizeCloudinaryImageUrl = (
  url,
  transformation = process.env.CLOUDINARY_MEAL_TRANSFORMATION || DEFAULT_CLOUDINARY_TRANSFORMATION
) => {
  const normalizedUrl = normalizeUrl(url)
  if (!normalizedUrl || !isCloudinaryUrl(normalizedUrl)) return normalizedUrl

  const marker = '/image/upload/'
  const markerIndex = normalizedUrl.indexOf(marker)
  if (markerIndex === -1) return normalizedUrl

  const base = normalizedUrl.slice(0, markerIndex + marker.length)
  const remainder = normalizedUrl.slice(markerIndex + marker.length)

  if (!remainder || remainder.startsWith('f_') || remainder.startsWith('q_') || remainder.startsWith('c_')) {
    return normalizedUrl
  }

  return `${base}${transformation}/${remainder}`
}

const optimizeImageUrl = (url) => optimizeCloudinaryImageUrl(url)

module.exports = {
  optimizeImageUrl,
  optimizeCloudinaryImageUrl,
  isCloudinaryUrl,
}
