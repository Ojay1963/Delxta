import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('delxta_token'))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    apiRequest('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((data) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem('delxta_token')
        setToken(null)
      })
      .finally(() => setLoading(false))
  }, [token])

  const login = async (payload) => {
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    localStorage.setItem('delxta_token', data.token)
    setToken(data.token)
    setUser(data.user)
  }

  const register = async (payload) => {
    return apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  const resendVerificationEmail = async (email) => {
    return apiRequest('/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  const refreshUser = async () => {
    if (!token) return null
    const data = await apiRequest('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    setUser(data.user)
    return data.user
  }

  const updateProfile = async (payload) => {
    if (!token) throw new Error('Not authenticated.')
    const data = await apiRequest('/api/auth/me', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })
    setUser(data.user)
    return data
  }

  const logout = () => {
    localStorage.removeItem('delxta_token')
    setToken(null)
    setUser(null)
  }

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login,
      register,
      resendVerificationEmail,
      logout,
      refreshUser,
      updateProfile,
    }),
    [token, user, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
