const PAYSTACK_BASE_URL = 'https://api.paystack.co'

const getSecretKey = () => process.env.PAYSTACK_SECRET_KEY

const paystackRequest = async (path, options = {}) => {
  const secretKey = getSecretKey()
  if (!secretKey) {
    const error = new Error('Paystack is not configured on the server.')
    error.status = 500
    throw error
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  const data = await response.json()
  if (!response.ok || data.status !== true) {
    const message = data?.message || 'Paystack request failed.'
    const error = new Error(message)
    error.status = 400
    throw error
  }

  return data
}

const initializeTransaction = async ({ email, amount, reference, callback_url, metadata = {} }) => {
  const payload = { email, amount, reference, callback_url, metadata }
  return paystackRequest('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

const verifyTransaction = async (reference) => {
  return paystackRequest(`/transaction/verify/${encodeURIComponent(reference)}`)
}

module.exports = {
  initializeTransaction,
  verifyTransaction,
}
