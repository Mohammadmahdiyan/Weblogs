import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { FontProvider } from './components/FontControls'
import { LightboxProvider } from './components/Lightbox'
import { ThemeProvider } from './components/ThemeControls'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename="/Weblogs" future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <LightboxProvider>
          <ThemeProvider>
            <FontProvider>
              <App />
            </FontProvider>
          </ThemeProvider>
        </LightboxProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
