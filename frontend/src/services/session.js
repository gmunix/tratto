import { api } from './api'

const tokenKey = 'tratto-auth-token'
const userKey = 'tratto-auth-user'
const listeners = new Set()

export function getSession() {
  const token = window.localStorage.getItem(tokenKey)
  const userJson = window.localStorage.getItem(userKey)

  return {
    token,
    user: userJson ? JSON.parse(userJson) : null,
  }
}

export function subscribeToSession(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password })
  saveSession(data.token, data.user)
  return data
}

export async function logout() {
  try {
    await api.post('/auth/logout')
  } finally {
    clearSession()
  }
}

export async function refreshCurrentUser() {
  const { data } = await api.get('/auth/me')
  saveSession(getSession().token, data.user)
  return data.user
}

export function saveSession(token, user) {
  if (token) {
    window.localStorage.setItem(tokenKey, token)
  }

  window.localStorage.setItem(userKey, JSON.stringify(user))
  emitSessionChange()
}

export function clearSession() {
  window.localStorage.removeItem(tokenKey)
  window.localStorage.removeItem(userKey)
  emitSessionChange()
}

function emitSessionChange() {
  for (const listener of listeners) {
    listener(getSession())
  }
}
