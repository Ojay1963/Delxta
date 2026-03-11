const DEFAULT_LOCAL_API_URL = 'http://localhost:5000'
const DEFAULT_PRODUCTION_API_URL = 'https://delxta.onrender.com'

const trimTrailingSlash = (value) => String(value || '').trim().replace(/\/+$/, '')

const isLocalApiUrl = (value) =>
  /^https?:\/\/(localhost|127(?:\.\d{1,3}){3})(:\d+)?$/i.test(trimTrailingSlash(value))

const resolveApiBaseUrl = () => {
  const envApiUrl = trimTrailingSlash(
    import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || ''
  )

  if (envApiUrl && !(import.meta.env.PROD && isLocalApiUrl(envApiUrl))) {
    return envApiUrl
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return DEFAULT_LOCAL_API_URL
    }
  }

  return DEFAULT_PRODUCTION_API_URL
}

const API_BASE_URL = resolveApiBaseUrl()

export async function apiRequest(path, options = {}) {
  const { headers: customHeaders = {}, timeoutMs = 65000, ...restOptions } = options
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  const isFormDataBody = typeof FormData !== 'undefined' && restOptions.body instanceof FormData

  let response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...restOptions,
      signal: controller.signal,
      headers: {
        ...(isFormDataBody ? {} : { 'Content-Type': 'application/json' }),
        ...customHeaders,
      },
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(
        'Request timed out. The server may be waking up on Render. Wait a moment and try again.'
      )
    }

    throw error
  } finally {
    clearTimeout(timeoutId)
  }

  if (!response.ok) {
    let message = 'Request failed'
    let errorData = null
    const contentType = response.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      errorData = await response.json()
      message = errorData.message || message
    } else {
      const text = await response.text()
      message = text || message
    }

    const error = new Error(message)
    error.status = response.status
    error.code = errorData?.code
    error.data = errorData
    throw error
  }

  if (response.status === 204) return null

  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return response.json()
  }

  return null
}

export { API_BASE_URL }
