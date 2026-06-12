import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { getSession } from '@/services/session'

export function RequireAuth({ children }) {
  const location = useLocation()
  const hasSession = Boolean(getSession().token)

  useEffect(() => {
    function handleExpired() {
      window.location.assign('/login')
    }

    window.addEventListener('tratto-session-expired', handleExpired)
    return () => window.removeEventListener('tratto-session-expired', handleExpired)
  }, [])

  if (!hasSession) {
    return <Navigate replace state={{ from: location }} to="/login" />
  }

  return children
}
