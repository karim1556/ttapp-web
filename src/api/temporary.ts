import { apiRequest, withQuery } from './client'
import { getToken } from '../auth/token'
import { getServerUrl } from '../settings/serverUrl'
import type { TemporaryTimeSlot, TemporaryBulkPayload } from '../types/temporary'

export interface TemporaryListQuery {
  branchId?: number
  sem?: number
  division?: string
  date?: string
  fromDate?: string
  toDate?: string
  [key: string]: string | number | null | undefined
}

export const list = (query: TemporaryListQuery) =>
  apiRequest<TemporaryTimeSlot[]>(withQuery('/timetable/temporary', query))

export const createBulk = (payload: TemporaryBulkPayload) =>
  apiRequest<TemporaryTimeSlot[]>('/timetable/temporary/bulk', {
    method: 'POST',
    json: payload,
  })

export const remove = (id: number) =>
  apiRequest<{ message: string }>(`/timetable/temporary/${id}`, {
    method: 'DELETE',
  })

export const downloadTemporaryPdf = async (query: TemporaryListQuery) => {
  const token = getToken()
  const baseUrl = getServerUrl()
  const path = withQuery('/timetable/temporary/pdf', query)
  const headers: HeadersInit = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${baseUrl}${path}`, { headers })
  if (!response.ok) {
    let errMsg = 'Failed to download PDF'
    try {
      const errPayload = await response.json()
      if (errPayload && errPayload.message) {
        errMsg = errPayload.message
      }
    } catch {
      // ignore
    }
    throw new Error(errMsg)
  }

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `temporary_timetable_branch${query.branchId || 'all'}_sem${query.sem || 'all'}_div${query.division || 'all'}.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}
