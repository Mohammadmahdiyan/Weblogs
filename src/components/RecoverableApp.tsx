import { useLocation } from 'react-router-dom'
import App from '../App'
import { ErrorBoundary } from './ErrorBoundary'
import { FontProvider } from './FontControls'
import { LightboxProvider } from './Lightbox'
import { ThemeProvider } from './ThemeControls'

export function RecoverableApp() {
  const location = useLocation()

  return (
    <ErrorBoundary key={`${location.pathname}${location.search}`}>
      <LightboxProvider>
        <ThemeProvider>
          <FontProvider>
            <App />
          </FontProvider>
        </ThemeProvider>
      </LightboxProvider>
    </ErrorBoundary>
  )
}
