import type { NotificationItem } from '../types/notification'

const STORAGE_KEY = 'ttapp_notifications'

const readItems = (): NotificationItem[] => {
  if (typeof localStorage === 'undefined') return []
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as NotificationItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const writeItems = (items: NotificationItem[]) => {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export const getNotifications = () => readItems()

export const saveNotifications = (items: NotificationItem[]) => {
  writeItems(items)
  return items
}

export const addNotification = (item: NotificationItem) => {
  const next = [item, ...readItems()]
  writeItems(next)
  return next
}

export const markAllRead = () => {
  const next = readItems().map((item) => ({ ...item, isRead: true }))
  writeItems(next)
  return next
}

export const markRead = (id: string) => {
  const next = readItems().map((item) =>
    item.id === id ? { ...item, isRead: true } : item,
  )
  writeItems(next)
  return next
}

export const clearNotifications = () => {
  writeItems([])
  return []
}
