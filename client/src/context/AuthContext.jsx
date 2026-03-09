/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { apiRequest } from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('delxta_token'))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('delxta_token')))

  useEffect(() => {
    if (!token) return
    let isMounted = true

    apiRequest('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((data) => {
        if (!isMounted) return
        setUser(data.user)
      })
      .catch(() => {
        if (!isMounted) return
        localStorage.removeItem('delxta_token')
        setToken(null)
        setUser(null)
      })
      .finally(() => {
        if (!isMounted) return
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
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

  const changePassword = async (payload) => {
    if (!token) throw new Error('Not authenticated.')
    return apiRequest('/api/auth/change-password', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })
  }

  const logout = () => {
    localStorage.removeItem('delxta_token')
    setToken(null)
    setUser(null)
    setLoading(false)
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        register,
        resendVerificationEmail,
        logout,
        refreshUser,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
