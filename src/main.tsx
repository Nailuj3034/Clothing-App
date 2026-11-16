import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './ui/global.css'
import App from './App.tsx'
import { applyTheme, loadTheme } from './ui/theme'

// Theme vor dem ersten Zeichnen setzen, damit nichts aufblitzt
applyTheme(loadTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
