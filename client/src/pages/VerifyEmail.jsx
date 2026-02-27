import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { apiRequest } from '../utils/api'

function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState({
    email: searchParams.get('email') || '',
    otp: '',
  })
  const [status, setStatus] = useState(searchParams.get('token') ? 'loading' : 'idle')
  const [message, setMessage] = useState(
    searchParams.get('token') ? 'Verifying your email...' : 'Enter the OTP sent to your email.'
  )
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      return
    }

    apiRequest(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((data) => {
        setStatus('success')
        setMessage(data?.message || 'Email verified successfully.')
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err.message || 'Verification failed.')
      })
  }, [searchParams])

  const handleOtpSubmit = async (event) => {
    event.preventDefault()
    setStatus('idle')
    setMessage('')

    if (!form.email || !form.otp) {
      setStatus('error')
      setMessage('Email and OTP are required.')
      return
    }

    setLoading(true)
    try {
      const data = await apiRequest('/api/auth/verify-email-otp', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      setStatus('success')
      setMessage(data?.message || 'Email verified successfully.')
    } catch (err) {
      setStatus('error')
      setMessage(err.message || 'Verification failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    const email = String(form.email || '').trim()
    if (!email) {
      setStatus('error')
      setMessage('Enter your email first to resend the OTP.')
      return
    }

    setResending(true)
    try {
      const data = await apiRequest('/api/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      setStatus('idle')
      setMessage(data?.message || 'A new OTP has been sent to your email.')
    } catch (err) {
      setStatus('error')
      setMessage(err.message || 'Could not resend OTP.')
    } finally {
      setResending(false)
    }
  }

  const token = searchParams.get('token')

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: '620px' }}>
        <div className="form-card">
          <h3 style={{ marginTop: 0 }}>Email Verification</h3>
          <p>{message}</p>
          {!token && status !== 'success' && (
            <form onSubmit={handleOtpSubmit}>
              <label className="form-label">Email</label>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
              />
              <label className="form-label" style={{ marginTop: '16px' }}>
                OTP Code
              </label>
              <input
                className="input"
                value={form.otp}
                onChange={(e) => setForm({ ...form, otp: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                placeholder="123456"
                inputMode="numeric"
                maxLength={6}
              />
              <div style={{ marginTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button className="btn" type="submit" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending}
                >
                  {resending ? 'Sending...' : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}
          {status === 'success' && (
            <p>
              <Link to="/login">Continue to Sign In</Link>
            </p>
          )}
          {status === 'error' && (
            <p>
              <Link to="/register">Back to Register</Link>
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

export default VerifyEmail
