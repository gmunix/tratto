import axios from 'axios'

import { environment } from '@/config/environment'

export const api = axios.create({
  baseURL: environment.apiUrl ?? 'http://localhost:8000/api',
})

api.interceptors.request.use((config) => {
  const token = window.localStorage.getItem('tratto-auth-token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthRoute = /\/api\/auth\/(login|register)/.test(error.config?.url ?? '')

      if (!isAuthRoute && window.localStorage.getItem('tratto-auth-token')) {
        window.localStorage.removeItem('tratto-auth-token')
        window.localStorage.removeItem('tratto-auth-user')
        window.dispatchEvent(new Event('tratto-session-expired'))
      }
    }

    return Promise.reject(error)
  },
)
