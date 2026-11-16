import { lazy, Suspense } from 'react'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { PERSIST_MAX_AGE, persister, queryClient } from './data/queryClient'
import { AuthGate } from './features/auth/AuthGate'
import { WardrobePage } from './features/wardrobe/WardrobePage'
import { ItemFormPage } from './features/wardrobe/ItemFormPage'
import { OutfitPage } from './features/outfit/OutfitPage'
import { ProfilePage } from './features/profile/ProfilePage'
import { ArchivePage } from './features/profile/ArchivePage'
import { BottomNav } from './ui/BottomNav'
import { OfflineBanner } from './ui/OfflineBanner'

// 3D-Ansicht samt three.js erst laden, wenn der Tab geöffnet wird
const ViewerPage = lazy(() => import('./features/viewer3d/ViewerPage'))

/** App-Rahmen: Daten-Cache (im Browser gespeichert), Login-Schutz, Routing und Navigation unten. */
export default function App() {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, maxAge: PERSIST_MAX_AGE }}>
      <AuthGate>
        <BrowserRouter>
          <div className="app">
            <OfflineBanner />
            <Routes>
              <Route path="/" element={<WardrobePage />} />
              <Route path="/teil/neu" element={<ItemFormPage />} />
              <Route path="/teil/:id" element={<ItemFormPage />} />
              <Route path="/outfit" element={<OutfitPage />} />
              <Route path="/3d" element={
                <Suspense fallback={<main className="page"><p className="muted">3D wird geladen …</p></main>}>
                  <ViewerPage />
                </Suspense>
              } />
              <Route path="/profil" element={<ProfilePage />} />
              <Route path="/profil/archiv" element={<ArchivePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <BottomNav />
          </div>
        </BrowserRouter>
      </AuthGate>
    </PersistQueryClientProvider>
  )
}
