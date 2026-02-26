import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [verificationUrl, setVerificationUrl] = useState('')
  const [verificationOtp, setVerificationOtp] = useState('')
  const [verificationEmail, setVerificationEmail] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setVerificationUrl('')
    setVerificationOtp('')
    setVerificationEmail('')
    if (!form.name || !form.email.includes('@') || form.password.length < 6) {
      setError('Please provide a name, valid email, and 6+ character password.')
      return
    }
    setLoading(true)
    try {
      const data = await register(form)
      const nextEmail = data?.email || form.email
      setSuccess(
        data?.message ||
          'Registration successful. Check your email for a verification code.'
      )
      setVerificationEmail(nextEmail)
      if (data?.verificationUrl) {
        setVerificationUrl(data.verificationUrl)
      }
      if (data?.verificationOtp) {
        setVerificationOtp(data.verificationOtp)
      }
      setForm({ name: '', email: '', password: '' })

      if (data?.verificationMethod === 'otp' || nextEmail) {
        navigate(`/verify-email?email=${encodeURIComponent(nextEmail)}`)
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: '520px' }}>
        <form className="form-card" onSubmit={handleSubmit}>
          <h3 style={{ marginTop: 0 }}>Create an Account</h3>
          <label className="form-label">Name</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Your name"
          />
          <label className="form-label" style={{ marginTop: '16px' }}>
            Email
          </label>
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
          <div style={{ position: 'relative' }}>
            <input
              className="input"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Create a password"
              style={{ paddingRight: '68px' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-300)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}
          {verificationEmail && (
            <p style={{ marginTop: '12px' }}>
              Enter your code here:{' '}
              <Link to={`/verify-email?email=${encodeURIComponent(verificationEmail)}`}>
                Verify Email
              </Link>
            </p>
          )}
          {verificationUrl && (
            <p style={{ marginTop: '12px' }}>
              Dev link: <a href={verificationUrl}>Verify email now</a>
            </p>
          )}
          {verificationOtp && (
            <p style={{ marginTop: '12px' }}>Dev OTP: <strong>{verificationOtp}</strong></p>
          )}
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Register'}
          </button>
          <p style={{ marginTop: '16px', color: 'var(--text-400)' }}>
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </form>
      </div>
    </section>
  )
}

export default Register
