import { apiRequest } from './client'
import type { Holiday } from '../types/holiday'

export const getUpcoming = () => apiRequest<Holiday[]>('/holidays/upcoming')

export const getAll = () => apiRequest<Holiday[]>('/holidays')

export const createHoliday = (payload: Partial<Holiday>) =>
  apiRequest<Holiday>('/holidays', {
    method: 'POST',
    json: payload,
  })

export const updateHoliday = (id: number, payload: Partial<Holiday>) =>
  apiRequest<Holiday>(`/holidays/${id}`, {
    method: 'PUT',
    json: payload,
  })

export const removeHoliday = (id: number) =>
  apiRequest<{ message: string }>(`/holidays/${id}`, {
    method: 'DELETE',
  })
