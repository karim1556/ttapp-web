const STORAGE_KEY = 'ttapp_server_url'

const normalizeUrl = (value: string) => {
  let url = value.trim()
  if (!url) return ''
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `http://${url}`
  }
  return url.replace(/\/$/, '')
}

export const getServerUrl = () => {
  if (typeof localStorage === 'undefined') {
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
  }
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
}

export const setServerUrl = (value: string) => {
  if (typeof localStorage === 'undefined') return ''
  const normalized = normalizeUrl(value)
  if (!normalized) {
    localStorage.removeItem(STORAGE_KEY)
    return ''
  }
  localStorage.setItem(STORAGE_KEY, normalized)
  return normalized
}

export const normalizeServerUrl = (value: string) => normalizeUrl(value)
