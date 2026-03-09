import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../utils/api'

const initialForm = {
  name: '',
  phone: '',
  gender: 'prefer_not_to_say',
  city: '',
  country: '',
  addressLine1: '',
  addressLine2: '',
  stateRegion: '',
  postalCode: '',
  deliveryNotes: '',
  bio: '',
  preferredContactMethod: 'email',
  preferredDiningTime: 'flexible',
  dietaryPreference: 'none',
  marketingOptIn: false,
  smsOptIn: false,
}

const initialPasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

const buildFormState = (user) => ({
  name: user?.name || '',
  phone: user?.phone || '',
  gender: user?.gender || 'prefer_not_to_say',
  city: user?.city || '',
  country: user?.country || '',
  addressLine1: user?.addressLine1 || '',
  addressLine2: user?.addressLine2 || '',
  stateRegion: user?.stateRegion || '',
  postalCode: user?.postalCode || '',
  deliveryNotes: user?.deliveryNotes || '',
  bio: user?.bio || '',
  preferredContactMethod: user?.preferredContactMethod || 'email',
  preferredDiningTime: user?.preferredDiningTime || 'flexible',
  dietaryPreference: user?.dietaryPreference || 'none',
  marketingOptIn: Boolean(user?.marketingOptIn),
  smsOptIn: Boolean(user?.smsOptIn),
})

const normalizeForm = (form) => ({
  name: form.name.trim(),
  phone: form.phone.trim(),
  gender: form.gender,
  city: form.city.trim(),
  country: form.country.trim(),
  addressLine1: form.addressLine1.trim(),
  addressLine2: form.addressLine2.trim(),
  stateRegion: form.stateRegion.trim(),
  postalCode: form.postalCode.trim(),
  deliveryNotes: form.deliveryNotes.trim(),
  bio: form.bio.trim(),
  preferredContactMethod: form.preferredContactMethod,
  preferredDiningTime: form.preferredDiningTime,
  dietaryPreference: form.dietaryPreference,
  marketingOptIn: Boolean(form.marketingOptIn),
  smsOptIn: Boolean(form.smsOptIn),
})

const getValidationErrors = (form) => {
  const errors = {}
  if (!form.name.trim()) errors.name = 'Full name is required.'
  if (form.bio.trim().length > 160) errors.bio = 'Bio should be 160 characters or fewer.'
  return errors
}

const getPasswordErrors = (form) => {
  const errors = {}
  if (!form.currentPassword) errors.currentPassword = 'Current password is required.'
  if (!form.newPassword) errors.newPassword = 'New password is required.'
  if (form.newPassword && form.newPassword.length < 6) {
    errors.newPassword = 'New password must be at least 6 characters.'
  }
  if (form.confirmPassword !== form.newPassword) {
    errors.confirmPassword = 'Passwords do not match.'
  }
  return errors
}

const getProfileTasks = (user, form) => [
  { id: 'name', label: 'Full name', complete: Boolean(form.name || user?.name) },
  { id: 'phone', label: 'Phone number', complete: Boolean(form.phone || user?.phone) },
  { id: 'address', label: 'Saved address', complete: Boolean(form.addressLine1 || user?.addressLine1) },
  { id: 'city', label: 'City and country', complete: Boolean((form.city || user?.city) && (form.country || user?.country)) },
  { id: 'bio', label: 'Short bio', complete: Boolean(form.bio || user?.bio) },
  { id: 'avatar', label: 'Profile photo', complete: Boolean(user?.avatarUrl) },
]

function EditProfile() {
  const { user, updateProfile, token, refreshUser, changePassword } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const [avatarStatus, setAvatarStatus] = useState('idle')
  const [avatarMessage, setAvatarMessage] = useState('')
  const [avatarPreview, setAvatarPreview] = useState('')
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm)
  const [passwordStatus, setPasswordStatus] = useState('idle')
  const [passwordMessage, setPasswordMessage] = useState('')

  useEffect(() => {
    if (!user) return
    setForm(buildFormState(user))
  }, [user])

  useEffect(() => () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
  }, [avatarPreview])

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const avatarSrc = avatarPreview
    || (user?.avatarUrl
      ? user.avatarUrl.startsWith('http')
        ? user.avatarUrl
        : `${API_BASE_URL}${user.avatarUrl}`
      : '')

  const baseForm = useMemo(() => buildFormState(user), [user])
  const normalizedForm = useMemo(() => normalizeForm(form), [form])
  const normalizedBaseForm = useMemo(() => normalizeForm(baseForm), [baseForm])
  const validationErrors = useMemo(() => getValidationErrors(form), [form])
  const passwordErrors = useMemo(() => getPasswordErrors(passwordForm), [passwordForm])
  const isDirty = JSON.stringify(normalizedForm) !== JSON.stringify(normalizedBaseForm)
  const hasErrors = Object.keys(validationErrors).length > 0
  const tasks = getProfileTasks(user, form)
  const completion = Math.round((tasks.filter((task) => task.complete).length / tasks.length) * 100)
  const bioLength = form.bio.trim().length
  const pendingTasks = tasks.filter((task) => !task.complete)
  const passwordStrength = passwordForm.newPassword.length >= 10
    ? 'Strong'
    : passwordForm.newPassword.length >= 6
      ? 'Good'
      : 'Needs work'

  const resetForm = () => {
    setForm(baseForm)
    setStatus('idle')
    setMessage('')
  }

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !token) return

    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    const nextPreview = URL.createObjectURL(file)
    setAvatarPreview(nextPreview)
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
      setAvatarPreview('')
      URL.revokeObjectURL(nextPreview)
    } catch (error) {
      setAvatarStatus('error')
      setAvatarMessage(error.message || 'Unable to upload avatar.')
    } finally {
      event.target.value = ''
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (hasErrors) {
      setStatus('error')
      setMessage(Object.values(validationErrors)[0])
      return
    }
    if (!isDirty) {
      setStatus('success')
      setMessage('No changes to save.')
      return
    }
    setStatus('loading')
    setMessage('')
    try {
      const data = await updateProfile(normalizedForm)
      setStatus('success')
      setMessage(data.message || 'Profile updated successfully.')
    } catch (error) {
      setStatus('error')
      setMessage(error.message || 'Unable to update profile.')
    }
  }

  const handlePasswordChange = async (event) => {
    event.preventDefault()
    if (Object.keys(passwordErrors).length > 0) {
      setPasswordStatus('error')
      setPasswordMessage(Object.values(passwordErrors)[0])
      return
    }
    setPasswordStatus('loading')
    setPasswordMessage('')
    try {
      const data = await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setPasswordStatus('success')
      setPasswordMessage(data.message || 'Password updated successfully.')
      setPasswordForm(initialPasswordForm)
    } catch (error) {
      setPasswordStatus('error')
      setPasswordMessage(error.message || 'Unable to update password.')
    }
  }

  return (
    <section className="section">
      <div className="container profile-edit-page">
        <aside className="profile-edit-sidebar">
          <div className="panel profile-edit-summary">
            <p className="profile-eyebrow">Account Settings</p>
            <h2>Manage your account details.</h2>
            <p className="profile-edit-copy">
              Update your personal profile, saved delivery details, communication preferences, and password from one place.
            </p>

            <div className="profile-edit-callout">
              <span className="profile-meta-label">Focus now</span>
              <strong>{pendingTasks[0]?.label || 'Your profile is in good shape.'}</strong>
              <p>
                {pendingTasks.length
                  ? `${pendingTasks.length} profile item${pendingTasks.length === 1 ? '' : 's'} are still incomplete.`
                  : 'Only refinements are left. Your essential account details are already complete.'}
              </p>
            </div>

            <div className="profile-edit-avatar-row">
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
                <strong>{form.name || user?.name || 'User'}</strong>
                <p>{user?.email || '-'}</p>
              </div>
            </div>

            <div className="profile-edit-meta">
              <div>
                <span className="profile-meta-label">Email</span>
                <strong>{user?.email || '-'}</strong>
              </div>
              <div>
                <span className="profile-meta-label">Verification</span>
                <strong>{user?.isEmailVerified ? 'Verified' : 'Pending verification'}</strong>
              </div>
              <div>
                <span className="profile-meta-label">Preferences</span>
                <strong>{form.preferredContactMethod === 'phone' ? 'Phone first' : form.preferredContactMethod === 'whatsapp' ? 'WhatsApp first' : 'Email first'}</strong>
              </div>
            </div>

            <div className="profile-completion-card profile-edit-progress">
              <div className="profile-completion-header">
                <div>
                  <p className="profile-eyebrow">Completion</p>
                  <h3>{completion}% complete</h3>
                </div>
                <span className="profile-completion-score">{completion}%</span>
              </div>
              <div className="profile-progress-track">
                <span className="profile-progress-fill" style={{ width: `${completion}%` }} />
              </div>
              <ul className="profile-task-list">
                {tasks.map((task) => (
                  <li key={task.id} className={task.complete ? 'is-complete' : ''}>
                    <span className="profile-task-dot" />
                    <span>{task.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="profile-edit-checklist">
              {tasks.map((task) => (
                <div className={`profile-check-row ${task.complete ? 'is-complete' : ''}`} key={task.id}>
                  <span className="profile-task-dot" />
                  <strong>{task.label}</strong>
                </div>
              ))}
            </div>

            <Link className="btn btn-outline" to="/profile">
              Back to Dashboard
            </Link>
          </div>
        </aside>

        <div className="form-card profile-edit-form">
          <form onSubmit={handleSubmit}>
            <div className="profile-edit-header">
              <div>
                <p className="profile-eyebrow">Edit Profile</p>
                <h3>Profile, addresses, and preferences</h3>
              </div>
              <div className={`profile-save-pill ${isDirty ? 'is-active' : ''}`}>
                {isDirty ? 'Unsaved changes' : 'All changes saved'}
              </div>
            </div>

            <p className="section-subtitle profile-edit-subtitle">
              This page is organized like a standard account settings area, with separate sections for identity, saved address, preferences, and security.
            </p>

            <div className="profile-section-nav">
              <a className="profile-inline-link" href="#photo">Photo</a>
              <a className="profile-inline-link" href="#details">Details</a>
              <a className="profile-inline-link" href="#address">Address</a>
              <a className="profile-inline-link" href="#preferences">Preferences</a>
              <a className="profile-inline-link" href="#security">Security</a>
            </div>

            <div className="panel profile-photo-panel" id="photo">
              <div className="profile-section-head">
                <div>
                  <p className="profile-eyebrow">Photo</p>
                  <h4>Profile photo</h4>
                </div>
              </div>
              <div className="profile-edit-avatar-row">
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
                <div className="profile-photo-copy">
                  <label className="form-label">Upload new photo</label>
                  <label className="avatar-upload-trigger">
                    <input
                      className="avatar-upload-input"
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={handleAvatarChange}
                    />
                    <span>{avatarStatus === 'loading' ? 'Uploading...' : 'Choose image'}</span>
                  </label>
                  <p className="form-label profile-photo-note">
                    Square images work best. Max 2MB. JPG, PNG, WEBP, or GIF.
                  </p>
                </div>
              </div>
              {avatarStatus === 'success' && <div className="form-success">{avatarMessage}</div>}
              {avatarStatus === 'error' && <div className="form-error">{avatarMessage}</div>}
            </div>

            <div className="profile-edit-section" id="details">
              <div className="profile-section-head">
                <div>
                  <p className="profile-eyebrow">Details</p>
                  <h4>Basic information</h4>
                </div>
              </div>
              <div className="form-grid">
                <div>
                  <label className="form-label">Full Name</label>
                  <input className="input" value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Your full name" />
                  {validationErrors.name && <div className="form-error">{validationErrors.name}</div>}
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <input className="input" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="+234..." />
                </div>
                <div>
                  <label className="form-label">Gender</label>
                  <select className="select" value={form.gender} onChange={(e) => handleChange('gender', e.target.value)}>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">City</label>
                  <input className="input" value={form.city} onChange={(e) => handleChange('city', e.target.value)} placeholder="Lagos" />
                </div>
                <div>
                  <label className="form-label">Country</label>
                  <input className="input" value={form.country} onChange={(e) => handleChange('country', e.target.value)} placeholder="Nigeria" />
                </div>
                <div>
                  <label className="form-label">Email Address</label>
                  <input className="input" value={user?.email || ''} disabled />
                </div>
              </div>
              <div style={{ marginTop: '16px' }}>
                <label className="form-label">Bio</label>
                <textarea className="textarea" value={form.bio} onChange={(e) => handleChange('bio', e.target.value)} placeholder="Tell us a bit about yourself..." maxLength={160} />
                <div className="profile-edit-actions profile-edit-meta-row">
                  <p className="profile-field-note">Short and clear works best for your profile summary.</p>
                  <span className="profile-char-count">{bioLength}/160</span>
                </div>
                {validationErrors.bio && <div className="form-error">{validationErrors.bio}</div>}
              </div>
            </div>

            <div className="profile-edit-section" id="address">
              <div className="profile-section-head">
                <div>
                  <p className="profile-eyebrow">Saved Address</p>
                  <h4>Delivery and booking details</h4>
                </div>
              </div>
              <div className="form-grid">
                <div>
                  <label className="form-label">Address Line 1</label>
                  <input className="input" value={form.addressLine1} onChange={(e) => handleChange('addressLine1', e.target.value)} placeholder="Street address" />
                </div>
                <div>
                  <label className="form-label">Address Line 2</label>
                  <input className="input" value={form.addressLine2} onChange={(e) => handleChange('addressLine2', e.target.value)} placeholder="Apartment, suite, landmark" />
                </div>
                <div>
                  <label className="form-label">State / Region</label>
                  <input className="input" value={form.stateRegion} onChange={(e) => handleChange('stateRegion', e.target.value)} placeholder="Lagos State" />
                </div>
                <div>
                  <label className="form-label">Postal Code</label>
                  <input className="input" value={form.postalCode} onChange={(e) => handleChange('postalCode', e.target.value)} placeholder="100001" />
                </div>
              </div>
              <div style={{ marginTop: '16px' }}>
                <label className="form-label">Delivery Notes</label>
                <textarea className="textarea" value={form.deliveryNotes} onChange={(e) => handleChange('deliveryNotes', e.target.value)} placeholder="Gate code, landmark, preferred drop-off note..." />
              </div>
            </div>

            <div className="profile-edit-section" id="preferences">
              <div className="profile-section-head">
                <div>
                  <p className="profile-eyebrow">Preferences</p>
                  <h4>Communication and dining preferences</h4>
                </div>
              </div>
              <div className="form-grid">
                <div>
                  <label className="form-label">Preferred Contact Method</label>
                  <select className="select" value={form.preferredContactMethod} onChange={(e) => handleChange('preferredContactMethod', e.target.value)}>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Preferred Dining Time</label>
                  <select className="select" value={form.preferredDiningTime} onChange={(e) => handleChange('preferredDiningTime', e.target.value)}>
                    <option value="flexible">Flexible</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="late_night">Late night</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Dietary Preference</label>
                  <select className="select" value={form.dietaryPreference} onChange={(e) => handleChange('dietaryPreference', e.target.value)}>
                    <option value="none">None</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="halal">Halal</option>
                    <option value="gluten_free">Gluten free</option>
                  </select>
                </div>
              </div>
              <div className="profile-toggle-grid">
                <label className="profile-toggle-card">
                  <input type="checkbox" checked={form.marketingOptIn} onChange={(e) => handleChange('marketingOptIn', e.target.checked)} />
                  <div>
                    <strong>Promotions and new menu updates</strong>
                    <span>Receive occasional marketing emails from Delxta.</span>
                  </div>
                </label>
                <label className="profile-toggle-card">
                  <input type="checkbox" checked={form.smsOptIn} onChange={(e) => handleChange('smsOptIn', e.target.checked)} />
                  <div>
                    <strong>SMS or WhatsApp reminders</strong>
                    <span>Allow booking and delivery reminders on mobile.</span>
                  </div>
                </label>
              </div>
            </div>

            {status === 'error' && <div className="form-error">{message}</div>}
            {status === 'success' && <div className="form-success">{message}</div>}

            <div className="profile-edit-actions">
              <button className="btn" type="submit" disabled={status === 'loading' || hasErrors}>
                {status === 'loading' ? 'Saving...' : 'Save Profile'}
              </button>
              <button className="btn btn-muted" type="button" onClick={resetForm} disabled={!isDirty || status === 'loading'}>
                Reset Changes
              </button>
              <Link className="btn btn-outline" to="/profile">
                Cancel
              </Link>
            </div>
          </form>

          <form className="profile-edit-section profile-security-section" id="security" onSubmit={handlePasswordChange}>
            <div className="profile-section-head">
              <div>
                <p className="profile-eyebrow">Security</p>
                <h4>Password and account protection</h4>
              </div>
            </div>
            <div className="form-grid">
              <div>
                <label className="form-label">Current Password</label>
                <input className="input" type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))} />
                {passwordErrors.currentPassword && <div className="form-error">{passwordErrors.currentPassword}</div>}
              </div>
              <div>
                <label className="form-label">New Password</label>
                <input className="input" type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))} />
                {passwordErrors.newPassword && <div className="form-error">{passwordErrors.newPassword}</div>}
              </div>
              <div>
                <label className="form-label">Confirm New Password</label>
                <input className="input" type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))} />
                {passwordErrors.confirmPassword && <div className="form-error">{passwordErrors.confirmPassword}</div>}
              </div>
            </div>
            <div className="profile-security-notes">
              <div>
                <span className="profile-meta-label">Session</span>
                <strong>Your account stays signed in on this device until you log out.</strong>
              </div>
              <div>
                <span className="profile-meta-label">Password hygiene</span>
                <strong>Use at least 6 characters and avoid reusing your old password.</strong>
              </div>
              <div>
                <span className="profile-meta-label">Password strength</span>
                <strong>{passwordForm.newPassword ? passwordStrength : 'Waiting for input'}</strong>
              </div>
            </div>
            {passwordStatus === 'error' && <div className="form-error">{passwordMessage}</div>}
            {passwordStatus === 'success' && <div className="form-success">{passwordMessage}</div>}
            <div className="profile-edit-actions">
              <button className="btn" type="submit" disabled={passwordStatus === 'loading'}>
                {passwordStatus === 'loading' ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

export default EditProfile
