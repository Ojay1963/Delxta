import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Login() {
  const { login, resendVerificationEmail } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [verificationUrl, setVerificationUrl] = useState('')
  const [showResend, setShowResend] = useState(false)
  const [resending, setResending] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setInfo('')
    setVerificationUrl('')
    setShowResend(false)
    if (!form.email.includes('@') || !form.password) {
      setError('Enter a valid email and password.')
      return
    }
    setLoading(true)
    try {
      await login(form)
      navigate(location.state?.from?.pathname || '/profile', { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.')
      if (err.code === 'EMAIL_NOT_VERIFIED') {
        setShowResend(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setError('')
    setInfo('')
    setVerificationUrl('')
    if (!form.email.includes('@')) {
      setError('Enter the email you used to register.')
      return
    }

    setResending(true)
    try {
      const data = await resendVerificationEmail(form.email)
      setInfo(data?.message || 'Verification email sent.')
      if (data?.verificationUrl) {
        setVerificationUrl(data.verificationUrl)
      }
    } catch (err) {
      setError(err.message || 'Could not resend verification email.')
    } finally {
      setResending(false)
    }
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: '520px' }}>
        <form className="form-card" onSubmit={handleSubmit}>
          <h3 style={{ marginTop: 0 }}>Welcome Back</h3>
          <label className="form-label">Email</label>
          <input
            className="input"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
          />
          <label className="form-label" style={{ marginTop: '16px' }}>
            Password
          </label>
          <input
            className="input"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="********"
          />
          {error && <div className="form-error">{error}</div>}
          {info && <div className="form-success">{info}</div>}
          {verificationUrl && (
            <p style={{ marginTop: '12px' }}>
              Dev link: <a href={verificationUrl}>Verify email now</a>
            </p>
          )}
          {showResend && (
            <button
              className="btn"
              type="button"
              onClick={handleResendVerification}
              disabled={resending}
              style={{ marginBottom: '12px', background: 'transparent', color: 'var(--text-100)' }}
            >
              {resending ? 'Sending verification...' : 'Resend verification email'}
            </button>
          )}
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
          <p style={{ marginTop: '16px', color: 'var(--text-400)' }}>
            No account? <Link to="/register">Create one</Link>
          </p>
        </form>
      </div>
    </section>
  )
}

export default Login
