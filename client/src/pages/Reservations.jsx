import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { FiCalendar, FiClock, FiUsers } from 'react-icons/fi'
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
  const { token, user } = useAuth()
  const location = useLocation()
  const query = useMemo(() => new URLSearchParams(location.search), [location.search])
  const [form, setForm] = useState(() => ({
    ...initialState,
    guests: query.get('guests') || initialState.guests,
    date: query.get('date') || initialState.date,
    time: query.get('time') || initialState.time,
    requests: query.get('requests') || initialState.requests,
  }))
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')
  const hydratedForm = useMemo(() => ({
    ...form,
    name: form.name || user?.name || '',
    email: form.email || user?.email || '',
    phone: form.phone || user?.phone || '',
  }), [form, user])

  const validate = (values) => {
    const next = {}
    if (!values.name.trim()) next.name = 'Name is required'
    if (!values.email.includes('@')) next.email = 'Valid email required'
    if (!values.phone.trim()) next.phone = 'Phone is required'
    if (!/^\d{11}$/.test(values.phone.trim())) next.phone = 'Phone number must be exactly 11 digits'
    if (!values.date) next.date = 'Select a date'
    if (!values.time) next.time = 'Select a time'
    return next
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate(hydratedForm)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setStatus('loading')
    try {
      await apiRequest('/api/reservations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(hydratedForm),
      })
      setStatus('success')
      setForm({
        ...initialState,
        guests: query.get('guests') || initialState.guests,
      })
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

          <div className="reservation-mobile-summary" aria-label="Reservation details">
            <div className="reservation-mobile-card">
              <FiUsers aria-hidden="true" />
              <div>
                <span className="profile-meta-label">Party size</span>
                <strong>{form.guests} guest{form.guests === '1' ? '' : 's'}</strong>
              </div>
            </div>
            <div className="reservation-mobile-card">
              <FiCalendar aria-hidden="true" />
              <div>
                <span className="profile-meta-label">Date</span>
                <strong>{form.date || 'Choose a day'}</strong>
              </div>
            </div>
            <div className="reservation-mobile-card">
              <FiClock aria-hidden="true" />
              <div>
                <span className="profile-meta-label">Time</span>
                <strong>{form.time || 'Select time'}</strong>
              </div>
            </div>
          </div>
        </div>

        <form className="form-card" onSubmit={handleSubmit}>
          <h3 style={{ marginTop: 0 }}>Make a Reservation</h3>
          <div className="form-grid">
            <div>
              <label className="form-label">Name</label>
              <input
                className="input"
                value={hydratedForm.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="John Doe"
              />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>
            <div>
              <label className="form-label">Email</label>
              <input
                className="input"
                value={hydratedForm.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="john@example.com"
              />
              {errors.email && <div className="form-error">{errors.email}</div>}
            </div>
            <div>
              <label className="form-label">Phone</label>
              <input
                className="input"
                value={hydratedForm.phone}
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
          <div className="reservation-submit-row">
            <div className="reservation-submit-copy">
              <span className="profile-meta-label">Reservation snapshot</span>
              <strong>{form.guests} guest{form.guests === '1' ? '' : 's'} • {form.time || 'Select time'}</strong>
            </div>
            <button className="btn" type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Submitting...' : 'Confirm Reservation'}
            </button>
          </div>
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
