import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import '@fontsource-variable/inter/index.css'
import '@fontsource-variable/manrope/index.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster richColors closeButton position="top-right" />
    </BrowserRouter>
  </StrictMode>,
)
