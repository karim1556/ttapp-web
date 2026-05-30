const STORAGE_KEY = 'ttapp_token'

export const getToken = () => {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(STORAGE_KEY)
}

export const setToken = (token: string | null) => {
  if (typeof localStorage === 'undefined') return
  if (token) {
    localStorage.setItem(STORAGE_KEY, token)
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}
