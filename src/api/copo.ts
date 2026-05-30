import { apiRequest, withQuery } from './client'
import type { CopoCourse } from '../types/copo'

export const getAll = (query?: {
  branch?: number
  semester?: number
  academic_year?: string
}) => apiRequest<CopoCourse[]>(withQuery('/copo', query))

export const getOne = (id: number) => apiRequest<CopoCourse>(`/copo/${id}`)

export const createCourse = (payload: Partial<CopoCourse>) =>
  apiRequest<CopoCourse>('/copo', {
    method: 'POST',
    json: payload,
  })

export const updateCourse = (id: number, payload: Partial<CopoCourse>) =>
  apiRequest<CopoCourse>(`/copo/${id}`, {
    method: 'PUT',
    json: payload,
  })

export const removeCourse = (id: number) =>
  apiRequest<{ message: string }>(`/copo/${id}`, {
    method: 'DELETE',
  })

export const getUsers = (id: number) =>
  apiRequest<{ user_id: number; user: { uid: number; email: string; user_type: number } }[]>(
    `/copo/${id}/users`,
  )

export const addUsers = (id: number, userIds: number[]) =>
  apiRequest<{ message: string }>(`/copo/${id}/users`, {
    method: 'POST',
    json: { user_ids: userIds },
  })

export const removeUser = (id: number, userId: number) =>
  apiRequest<{ message: string }>(`/copo/${id}/users/${userId}`, {
    method: 'DELETE',
  })
