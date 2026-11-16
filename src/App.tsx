import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { queryClient } from './data/queryClient'
import { AuthGate } from './features/auth/AuthGate'
import { WardrobePage } from './features/wardrobe/WardrobePage'
import { ItemFormPage } from './features/wardrobe/ItemFormPage'
import { OutfitPage } from './features/outfit/OutfitPage'
import ViewerPage from './features/viewer3d/ViewerPage'
import { ProfilePage } from './features/profile/ProfilePage'
import { ArchivePage } from './features/profile/ArchivePage'
import { BottomNav } from './ui/BottomNav'

/** App-Rahmen: Daten-Cache, Login-Schutz, Routing und Navigation unten. */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate>
        <BrowserRouter>
          <div className="app">
            <Routes>
              <Route path="/" element={<WardrobePage />} />
              <Route path="/teil/neu" element={<ItemFormPage />} />
              <Route path="/teil/:id" element={<ItemFormPage />} />
              <Route path="/outfit" element={<OutfitPage />} />
              <Route path="/3d" element={<ViewerPage />} />
              <Route path="/profil" element={<ProfilePage />} />
              <Route path="/profil/archiv" element={<ArchivePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <BottomNav />
          </div>
        </BrowserRouter>
      </AuthGate>
    </QueryClientProvider>
  )
}
