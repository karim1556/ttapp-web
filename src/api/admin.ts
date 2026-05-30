import { apiRequest } from './client'
import type { AdminStats } from '../types/admin'

export const getStats = () => apiRequest<AdminStats>('/admin/stats')
