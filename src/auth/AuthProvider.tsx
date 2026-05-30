import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import * as authApi from '../api/auth'
import { getToken, setToken as persistToken } from './token'
import type { AuthProfile } from '../types/auth'

type AuthContextValue = {
  user: AuthProfile | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setTokenState] = useState<string | null>(() => getToken())
  const [user, setUser] = useState<AuthProfile | null>(null)
  const [isLoading, setLoading] = useState<boolean>(Boolean(token))

  const refreshProfile = async () => {
    if (!token) return
    setLoading(true)
    try {
      const profile = await authApi.getProfile()
      setUser(profile)
    } catch {
      setUser(null)
      setTokenState(null)
      persistToken(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }

    let isActive = true
    setLoading(true)

    authApi
      .getProfile()
      .then((profile) => {
        if (isActive) setUser(profile)
      })
      .catch(() => {
        if (isActive) {
          setUser(null)
          setTokenState(null)
          persistToken(null)
        }
      })
      .finally(() => {
        if (isActive) setLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [token])

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const data = await authApi.login(email, password)
      persistToken(data.token)
      setTokenState(data.token)
      setUser(data.user)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch {
      // Ignore logout errors; JWT is cleared locally.
    }
    persistToken(null)
    setTokenState(null)
    setUser(null)
  }

  const value = useMemo(
    () => ({ user, token, isLoading, login, logout, refreshProfile }),
    [user, token, isLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
