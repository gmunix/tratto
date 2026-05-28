import axios from 'axios'

import { environment } from '@/config/environment'

export const api = axios.create({
  baseURL: environment.apiUrl,
})
