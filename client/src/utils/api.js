const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || ''

export async function apiRequest(path, options = {}) {
  const { headers: customHeaders = {}, ...restOptions } = options

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...customHeaders,
    },
  })

  if (!response.ok) {
    let message = 'Request failed'
    const contentType = response.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const data = await response.json()
      message = data.message || message
    } else {
      const text = await response.text()
      message = text || message
    }

    throw new Error(message)
  }

  if (response.status === 204) return null

  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return response.json()
  }

  return null
}

export { API_BASE_URL }
