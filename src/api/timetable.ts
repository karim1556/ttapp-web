import { apiRequest, withQuery } from './client'
import type { TimetableDay } from '../types/timetable'
import type { ClassroomUsageReport } from '../types/report'

export interface WeeklyQuery {
  [key: string]: string | number | null | undefined
  branchId?: number
  sem?: string
  division?: string
  roomNumber?: string
}

export const getWeekly = (query?: WeeklyQuery) =>
  apiRequest<TimetableDay[]>(withQuery('/timetable/weekly', query))

export const getRoomWeekly = (roomNumber: string, query?: WeeklyQuery) =>
  apiRequest<TimetableDay[]>(
    withQuery(`/timetable/room/${encodeURIComponent(roomNumber)}/weekly`, query),
  )

export const getClassroomUsageReport = () =>
  apiRequest<ClassroomUsageReport>('/timetable/reports/classroom-usage')

export const getToday = () => apiRequest<TimetableDay[]>('/timetable/today')

export const getSlots = () => apiRequest<TimetableDay[]>('/timetable/slots')

export const getFacultyTimetable = (facultyId: number) =>
  apiRequest<TimetableDay[]>(`/timetable/faculty/${facultyId}`)

export const generate = (payload: Record<string, unknown>) =>
  apiRequest<{ message: string }>('/timetable/generate', {
    method: 'POST',
    json: payload,
  })

export const generateAll = (payload: Record<string, unknown>) =>
  apiRequest<{ message: string }>('/timetable/generate-all', {
    method: 'POST',
    json: payload,
  })

export const updateSlot = (slotId: number, payload: Record<string, unknown>) =>
  apiRequest<{ message: string }>(`/timetable/slots/${slotId}`, {
    method: 'PUT',
    json: payload,
  })

export const moveSlot = (slotId: number, payload: Record<string, unknown>) =>
  apiRequest<{ message: string }>(`/timetable/slots/${slotId}/move`, {
    method: 'PUT',
    json: payload,
  })
