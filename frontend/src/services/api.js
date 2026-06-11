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
