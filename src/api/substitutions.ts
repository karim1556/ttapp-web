import { apiRequest, withQuery } from './client'
import type { SubstitutionRecord } from '../types/substitution'

export const getAll = (query?: {
  date?: string
  facultyId?: number
  status?: string
}) => apiRequest<SubstitutionRecord[]>(withQuery('/substitutions', query))

export const preview = (payload: Record<string, unknown>) =>
  apiRequest<Record<string, unknown>>('/substitutions/preview', {
    method: 'POST',
    json: payload,
  })

export const createSubstitution = (payload: Record<string, unknown>) =>
  apiRequest<SubstitutionRecord>('/substitutions', {
    method: 'POST',
    json: payload,
  })

export const approve = (id: number) =>
  apiRequest<{ message: string }>(`/substitutions/${id}/approve`, {
    method: 'POST',
  })
