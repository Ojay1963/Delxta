import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../utils/api'

const initialForm = {
  name: '',
  phone: '',
  gender: 'prefer_not_to_say',
  city: '',
  country: '',
  bio: '',
}

function EditProfile() {
  const { user, updateProfile, token, refreshUser } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const [avatarStatus, setAvatarStatus] = useState('idle')
  const [avatarMessage, setAvatarMessage] = useState('')

  useEffect(() => {
    if (!user) return
    setForm({
      name: user.name || '',
      phone: user.phone || '',
      gender: user.gender || 'prefer_not_to_say',
      city: user.city || '',
      country: user.country || '',
      bio: user.bio || '',
    })
  }, [user])

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const avatarSrc = user?.avatarUrl
    ? user.avatarUrl.startsWith('http')
      ? user.avatarUrl
      : `${API_BASE_URL}${user.avatarUrl}`
    : ''

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !token) return
    setAvatarStatus('loading')
    setAvatarMessage('')
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const response = await fetch(`${API_BASE_URL}/api/auth/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Unable to upload avatar.')
      }
      const data = await response.json()
      setAvatarStatus('success')
      setAvatarMessage(data.message || 'Profile photo updated.')
      await refreshUser()
    } catch (error) {
      setAvatarStatus('error')
      setAvatarMessage(error.message || 'Unable to upload avatar.')
    } finally {
      event.target.value = ''
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus('loading')
    setMessage('')
    try {
      const data = await updateProfile(form)
      setStatus('success')
      setMessage(data.message || 'Profile updated successfully.')
    } catch (error) {
      setStatus('error')
      setMessage(error.message || 'Unable to update profile.')
    }
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: '900px' }}>
        <form className="form-card" onSubmit={handleSubmit}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ marginTop: 0 }}>Edit Profile</h3>
            <Link className="btn btn-outline" to="/profile">
              Back to Dashboard
            </Link>
          </div>

          <p className="section-subtitle" style={{ textAlign: 'left', margin: '0 0 20px' }}>
            Update your personal information and contact preferences.
          </p>

          <div className="panel" style={{ marginBottom: '20px' }}>
            <h4 style={{ marginTop: 0 }}>Profile Photo</h4>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              {avatarSrc ? (
                <img className="profile-avatar" src={avatarSrc} alt={user?.name || 'Profile'} />
              ) : (
                <div className="profile-avatar profile-avatar-fallback">
                  {(user?.name || 'U')
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((chunk) => chunk[0]?.toUpperCase())
                    .join('')}
                </div>
              )}
              <div>
                <label className="form-label">Upload new photo</label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleAvatarChange}
                />
                <p className="form-label" style={{ marginTop: '6px' }}>
                  Max 2MB. JPG, PNG, WEBP, or GIF.
                </p>
              </div>
            </div>
            {avatarStatus === 'success' && <div className="form-success">{avatarMessage}</div>}
            {avatarStatus === 'error' && <div className="form-error">{avatarMessage}</div>}
          </div>

          <div className="form-grid">
            <div>
              <label className="form-label">Full Name</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Phone</label>
              <input
                className="input"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+234..."
              />
            </div>
            <div>
              <label className="form-label">Gender</label>
              <select
                className="select"
                value={form.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
              >
                <option value="prefer_not_to_say">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="form-label">City</label>
              <input
                className="input"
                value={form.city}
                onChange={(e) => handleChange('city', e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Country</label>
              <input
                className="input"
                value={form.country}
                onChange={(e) => handleChange('country', e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <label className="form-label">Bio</label>
            <textarea
              className="textarea"
              value={form.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              placeholder="Tell us a bit about yourself..."
            />
          </div>

          {status === 'error' && <div className="form-error">{message}</div>}
          {status === 'success' && <div className="form-success">{message}</div>}

          <button className="btn" type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </section>
  )
}

export default EditProfile
