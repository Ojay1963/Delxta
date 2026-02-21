import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { apiRequest } from '../utils/api'

function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('Verifying your email...')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setMessage('Verification token is missing.')
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

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: '620px' }}>
        <div className="form-card">
          <h3 style={{ marginTop: 0 }}>Email Verification</h3>
          <p>{message}</p>
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
