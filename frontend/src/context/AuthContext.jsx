import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('momently_user')
    try {
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState(() => localStorage.getItem('momently_token') || null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function verifyAuth() {
      const storedToken = localStorage.getItem('momently_token')
      if (!storedToken) {
        setUser(null)
        setToken(null)
        setIsLoading(false)
        return
      }

      try {
        const userData = await authService.getMe()
        setUser(userData)
        localStorage.setItem('momently_user', JSON.stringify(userData))
        setToken(storedToken)
      } catch (err) {
        console.error('Session expired or invalid:', err)
        authService.logout()
        setUser(null)
        setToken(null)
      } finally {
        setIsLoading(false)
      }
    }

    verifyAuth()
  }, [])

  const login = async (email, password) => {
    const data = await authService.login({ email, password })
    setToken(data.access_token)
    // Fetch user details with the newly acquired token
    const userData = await authService.getMe()
    setUser(userData)
    localStorage.setItem('momently_user', JSON.stringify(userData))
    return userData
  }

  const register = async ({ name, email, password, role }) => {
    await authService.register({ name, email, password, role })
    // Auto login after successful registration
    return await login(email, password)
  }

  const logout = () => {
    authService.logout()
    setUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === 'admin',
        isTeamMember: user?.role === 'team_member',
        isLoading,
        login,
        register,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
