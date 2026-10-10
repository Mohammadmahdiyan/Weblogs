import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { LightboxProvider } from './components/Lightbox'
import { ThemeProvider } from './components/ThemeControls'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <LightboxProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </LightboxProvider>
    </BrowserRouter>
  </StrictMode>,
)
