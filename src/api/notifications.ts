import { apiRequest } from './client'

export const saveToken = (token: string) =>
  apiRequest<{ message: string }>('/notifications/token', {
    method: 'POST',
    json: { token },
  })
