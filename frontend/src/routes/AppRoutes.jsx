import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { CreateTratto } from '@pages/CreateTratto'
import { Dashboard } from '@pages/Dashboard'
import { Home } from '@pages/Home'
import { NotFound } from '@pages/NotFound'
import { Profile } from '@pages/Profile'
import { TrattoDetail } from '@pages/TrattoDetail'

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/novo" element={<CreateTratto />} />
        <Route path="/trattos/:trattoId" element={<TrattoDetail />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
