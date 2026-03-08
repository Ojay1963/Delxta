const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || ''

export async function apiRequest(path, options = {}) {
  const { headers: customHeaders = {}, timeoutMs = 15000, ...restOptions } = options
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  let response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...restOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...customHeaders,
      },
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(
        'Request timed out. Check that the API URL is correct and the server is running.'
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
