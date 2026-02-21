import { useState } from 'react'
import { apiRequest } from '../utils/api'
import { useAuth } from '../context/AuthContext'

const initialState = {
  name: '',
  email: '',
  phone: '',
  guests: '2',
  date: '',
  time: '',
  requests: '',
}

function Reservations() {
  const { token } = useAuth()
  const [form, setForm] = useState(initialState)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')

  const validate = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Name is required'
    if (!form.email.includes('@')) next.email = 'Valid email required'
    if (!form.phone.trim()) next.phone = 'Phone is required'
    if (!/^\d{11}$/.test(form.phone.trim())) next.phone = 'Phone number must be exactly 11 digits'
    if (!form.date) next.date = 'Select a date'
    if (!form.time) next.time = 'Select a time'
    return next
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setStatus('loading')
    try {
      await apiRequest('/api/reservations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      })
      setStatus('success')
      setForm(initialState)
    } catch {
      setStatus('error')
    }
  }

  return (
    <section className="section">
      <div className="container split">
        <div>
          <h2 className="section-title" style={{ textAlign: 'left' }}>
            Book a Table
          </h2>
          <p className="section-subtitle" style={{ textAlign: 'left', margin: 0 }}>
            Experience the art of fine dining at Delxta. Whether it&apos;s a
            romantic evening, a business lunch, or a family celebration, we
            ensure every moment is special.
          </p>
          <div className="panel" style={{ marginTop: '24px' }}>
            <h3>Reservation Policy</h3>
            <ul className="list">
              <li>Reservations are held for 15 minutes past the booking time.</li>
              <li>For groups larger than 10, please contact us directly.</li>
              <li>Dress code: Smart casual / traditional elegance.</li>
            </ul>
          </div>
        </div>

        <form className="form-card" onSubmit={handleSubmit}>
          <h3 style={{ marginTop: 0 }}>Make a Reservation</h3>
          <div className="form-grid">
            <div>
              <label className="form-label">Name</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="John Doe"
              />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>
            <div>
              <label className="form-label">Email</label>
              <input
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="john@example.com"
              />
              {errors.email && <div className="form-error">{errors.email}</div>}
            </div>
            <div>
              <label className="form-label">Phone</label>
              <input
                className="input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="08012345678"
                maxLength={11}
                inputMode="numeric"
              />
              {errors.phone && <div className="form-error">{errors.phone}</div>}
            </div>
            <div>
              <label className="form-label">Guests</label>
              <select
                className="select"
                value={form.guests}
                onChange={(e) => setForm({ ...form, guests: e.target.value })}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <option key={num} value={num}>
                    {num} Guest{num > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Date</label>
              <input
                className="input"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
              {errors.date && <div className="form-error">{errors.date}</div>}
            </div>
            <div>
              <label className="form-label">Time</label>
              <select
                className="select"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
              >
                <option value="">Select Time</option>
                {['18:00', '19:00', '20:00', '21:00'].map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
              {errors.time && <div className="form-error">{errors.time}</div>}
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <label className="form-label">Special Requests (Optional)</label>
            <textarea
              className="textarea"
              value={form.requests}
              onChange={(e) => setForm({ ...form, requests: e.target.value })}
              placeholder="Allergies, special occasion, seating preference..."
            />
          </div>
          <button className="btn" type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Submitting...' : 'Confirm Reservation'}
          </button>
          {status === 'success' && (
            <div className="form-success">Reservation submitted successfully.</div>
          )}
          {status === 'error' && (
            <div className="form-error">Unable to submit. Try again.</div>
          )}
        </form>
      </div>
    </section>
  )
}

export default Reservations
