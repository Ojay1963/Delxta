import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Register() {
  const { register } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [verificationUrl, setVerificationUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setVerificationUrl('')
    if (!form.name || !form.email.includes('@') || form.password.length < 6) {
      setError('Please provide a name, valid email, and 6+ character password.')
      return
    }
    setLoading(true)
    try {
      const data = await register(form)
      setSuccess(
        data?.message ||
          'Registration successful. Check your email for a verification link.'
      )
      if (data?.verificationUrl) {
        setVerificationUrl(data.verificationUrl)
      }
      setForm({ name: '', email: '', password: '' })
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
          <input
            className="input"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Create a password"
          />
          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}
          {verificationUrl && (
            <p style={{ marginTop: '12px' }}>
              Dev link: <a href={verificationUrl}>Verify email now</a>
            </p>
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
