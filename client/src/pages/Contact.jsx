import { useState } from 'react'
import { apiRequest } from '../utils/api'
import { FiFacebook, FiInstagram, FiYoutube } from 'react-icons/fi'
import { FaXTwitter, FaTiktok } from 'react-icons/fa6'
import brandLogoSrc from '../images/DELXTA_NO_BACKGROUND.jpg'

const initialState = {
  name: '',
  email: '',
  message: '',
}

function Contact() {
  const [form, setForm] = useState(initialState)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')

  const validate = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Name is required'
    if (!form.email.includes('@')) next.email = 'Valid email required'
    if (form.message.trim().length < 10) next.message = 'Message is too short.'
    return next
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setStatus('loading')
    try {
      await apiRequest('/api/contact', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      setStatus('success')
      setForm(initialState)
    } catch (err) {
      setStatus('error')
    }
  }

  return (
    <section className="section">
      <div className="container split">
        <div>
          <h2 className="section-title" style={{ textAlign: 'left' }}>
            Contact Us
          </h2>
          <p className="section-subtitle" style={{ textAlign: 'left', margin: 0 }}>
            Have a question or want to host a private event? Send us a message and
            our team will respond promptly.
          </p>
          <div className="panel" style={{ marginTop: '24px' }}>
            <img src={brandLogoSrc} alt="Delxta logo" className="contact-brand-logo" />
            <p>Block 12, Plot 4 Admiralty Way, Lekki Phase 1, Lagos State, Nigeria</p>
            <p>hello@delxta.com</p>
            <p>+234 800 000 0000</p>
            <div className="contact-social">
              <a href="https://facebook.com/delxta" target="_blank" rel="noreferrer" aria-label="Delxta on Facebook">
                <FiFacebook />
              </a>
              <a href="https://instagram.com/delxta" target="_blank" rel="noreferrer" aria-label="Delxta on Instagram">
                <FiInstagram />
              </a>
              <a href="https://tiktok.com/@delxta" target="_blank" rel="noreferrer" aria-label="Delxta on TikTok">
                <FaTiktok />
              </a>
              <a href="https://youtube.com/@delxta" target="_blank" rel="noreferrer" aria-label="Delxta on YouTube">
                <FiYoutube />
              </a>
              <a href="https://x.com/delxta" target="_blank" rel="noreferrer" aria-label="Delxta on X">
                <FaXTwitter />
              </a>
            </div>
          </div>
        </div>

        <form className="form-card" onSubmit={handleSubmit}>
          <h3 style={{ marginTop: 0 }}>Send a Message</h3>
          <div>
            <label className="form-label">Name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your name"
            />
            {errors.name && <div className="form-error">{errors.name}</div>}
          </div>
          <div style={{ marginTop: '14px' }}>
            <label className="form-label">Email</label>
            <input
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
            />
            {errors.email && <div className="form-error">{errors.email}</div>}
          </div>
          <div style={{ marginTop: '14px' }}>
            <label className="form-label">Message</label>
            <textarea
              className="textarea"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Tell us about your event..."
            />
            {errors.message && <div className="form-error">{errors.message}</div>}
          </div>
          <button className="btn" type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Sending...' : 'Submit'}
          </button>
          {status === 'success' && (
            <div className="form-success">Message sent successfully.</div>
          )}
          {status === 'error' && (
            <div className="form-error">Unable to send. Try again.</div>
          )}
        </form>
      </div>
    </section>
  )
}

export default Contact
