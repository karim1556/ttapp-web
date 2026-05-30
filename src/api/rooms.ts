import { apiRequest, withQuery } from './client'
import type { Room } from '../types/room'

export const getAll = (query?: { branch_id?: number }) =>
  apiRequest<Room[]>(withQuery('/rooms', query))

export const getOne = (id: number) => apiRequest<Room>(`/rooms/${id}`)

export const createRoom = (payload: Partial<Room>) =>
  apiRequest<Room>('/rooms', {
    method: 'POST',
    json: payload,
  })

export const updateRoom = (id: number, payload: Partial<Room>) =>
  apiRequest<Room>(`/rooms/${id}`, {
    method: 'PUT',
    json: payload,
  })

export const removeRoom = (id: number) =>
  apiRequest<{ message: string }>(`/rooms/${id}`, {
    method: 'DELETE',
  })
