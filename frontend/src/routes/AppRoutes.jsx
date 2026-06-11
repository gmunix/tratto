import { BrowserRouter, Route, Routes } from 'react-router-dom'

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

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/novo" element={<CreateTratto />} />
        <Route path="/trattos/:trattoId" element={<TrattoDetail />} />
        <Route path="/notificacoes" element={<Notifications />} />
        <Route path="/comunidades" element={<Communities />} />
        <Route path="/comunidades/:communitySlug" element={<CommunityDetail />} />
        <Route path="/ajustes" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
