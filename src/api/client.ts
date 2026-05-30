import { getToken } from '../auth/token'
import { getServerUrl } from '../settings/serverUrl'

type RequestOptions = RequestInit & {
  json?: unknown
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

const resolveBaseUrl = () => getServerUrl()

export function withQuery(
  path: string,
  params?: Record<string, string | number | null | undefined>,
) {
  if (!params) return path
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null)
  if (!entries.length) return path
  const query = new URLSearchParams()
  for (const [key, value] of entries) {
    query.set(key, String(value))
  }
  return `${path}?${query.toString()}`
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { json, headers, ...rest } = options
  const requestHeaders = new Headers(headers)

  if (json !== undefined) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  const token = getToken()
  if (token && !requestHeaders.has('Authorization')) {
    requestHeaders.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${resolveBaseUrl()}${path}`, {
    ...rest,
    headers: requestHeaders,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  })

  if (response.status === 204) {
    return {} as T
  }

  const text = await response.text()
  let payload: { success?: boolean; data?: T; message?: string } = {}

  if (text) {
    try {
      payload = JSON.parse(text) as { success?: boolean; data?: T; message?: string }
    } catch {
      payload = {}
    }
  }

  if (!response.ok || payload.success === false) {
    throw new ApiError(payload.message || 'Request failed', response.status)
  }

  return (payload.data ?? (payload as T)) as T
}
