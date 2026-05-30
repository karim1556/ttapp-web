import { apiRequest, withQuery } from './client'
import type { Faculty } from '../types/faculty'

export const getAll = (query?: {
  branchId?: number
  departId?: number
  status?: number
}) => apiRequest<Faculty[]>(withQuery('/faculty', query))

export const getMe = () => apiRequest<Faculty>('/faculty/me')

export const updateMyWeeklyWorkHours = (weekly_work_hours: number) =>
  apiRequest<Faculty>('/faculty/me/work-hours', {
    method: 'PUT',
    json: { weekly_work_hours },
  })

export const createFaculty = (payload: Partial<Faculty>) =>
  apiRequest<Faculty>('/faculty', {
    method: 'POST',
    json: payload,
  })

export const updateFaculty = (id: number, payload: Partial<Faculty>) =>
  apiRequest<Faculty>(`/faculty/${id}`, {
    method: 'PUT',
    json: payload,
  })

export const removeFaculty = (id: number) =>
  apiRequest<{ message: string }>(`/faculty/${id}`, {
    method: 'DELETE',
  })
