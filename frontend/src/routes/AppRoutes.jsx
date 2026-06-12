import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { RequireAuth } from '@components/auth/RequireAuth'
import { CreateTratto } from '@pages/CreateTratto'
import { Dashboard } from '@pages/Dashboard'
import { Home } from '@pages/Home'
import { Login } from '@pages/Login'
import { NotFound } from '@pages/NotFound'
import { Notifications } from '@pages/Notifications'
import { Communities } from '@pages/Communities'
import { CommunityDetail } from '@pages/CommunityDetail'
import { Settings } from '@pages/Settings'
import { TrattoDetail } from '@pages/TrattoDetail'

function protectedRoute(element) {
  return <RequireAuth>{element}</RequireAuth>
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={protectedRoute(<Dashboard />)} />
        <Route path="/novo" element={protectedRoute(<CreateTratto />)} />
        <Route path="/trattos/:trattoId" element={protectedRoute(<TrattoDetail />)} />
        <Route path="/notificacoes" element={protectedRoute(<Notifications />)} />
        <Route path="/comunidades" element={protectedRoute(<Communities />)} />
        <Route path="/comunidades/:communitySlug" element={protectedRoute(<CommunityDetail />)} />
        <Route path="/ajustes" element={protectedRoute(<Settings />)} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
