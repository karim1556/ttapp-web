import { apiRequest } from './client'
import type { FacultyConstraint } from '../types/constraint'

export const getByFacultyId = (facultyId: number) =>
  apiRequest<FacultyConstraint>(`/constraints/${facultyId}`)

export const createConstraint = (payload: Partial<FacultyConstraint>) =>
  apiRequest<FacultyConstraint>('/constraints', {
    method: 'POST',
    json: payload,
  })

export const updateConstraint = (id: number, payload: Partial<FacultyConstraint>) =>
  apiRequest<FacultyConstraint>(`/constraints/${id}`, {
    method: 'PUT',
    json: payload,
  })
