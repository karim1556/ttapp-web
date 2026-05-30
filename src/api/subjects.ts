import { apiRequest, withQuery } from './client'
import type { Subject } from '../types/subject'

export const getAll = (query?: {
  branchId?: number
  semester?: number
  acadYear?: string
}) => apiRequest<Subject[]>(withQuery('/subjects', query))

export const createSubject = (payload: Partial<Subject>) =>
  apiRequest<Subject>('/subjects', {
    method: 'POST',
    json: payload,
  })

export const updateSubject = (id: number, payload: Partial<Subject>) =>
  apiRequest<Subject>(`/subjects/${id}`, {
    method: 'PUT',
    json: payload,
  })

export const removeSubject = (id: number) =>
  apiRequest<{ message: string }>(`/subjects/${id}`, {
    method: 'DELETE',
  })
