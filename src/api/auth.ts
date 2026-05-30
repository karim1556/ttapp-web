import { apiRequest } from './client'
import type { AuthProfile, LoginResponse } from '../types/auth'

export const login = (email: string, password: string) =>
  apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    json: { email, password },
  })

export const logout = () =>
  apiRequest<{ message: string }>('/auth/logout', {
    method: 'POST',
  })

export const getProfile = () => apiRequest<AuthProfile>('/profile')
