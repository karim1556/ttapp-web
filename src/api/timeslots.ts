import { apiRequest } from './client'
import type { TimeSlotTemplate } from '../types/timeslot'

export const getAll = () => apiRequest<TimeSlotTemplate[]>('/timeslots')

export const createTimeSlot = (payload: Partial<TimeSlotTemplate>) =>
  apiRequest<TimeSlotTemplate>('/timeslots', {
    method: 'POST',
    json: payload,
  })

export const updateTimeSlot = (id: number, payload: Partial<TimeSlotTemplate>) =>
  apiRequest<TimeSlotTemplate>(`/timeslots/${id}`, {
    method: 'PUT',
    json: payload,
  })

export const removeTimeSlot = (id: number) =>
  apiRequest<{ message: string }>(`/timeslots/${id}`, {
    method: 'DELETE',
  })
