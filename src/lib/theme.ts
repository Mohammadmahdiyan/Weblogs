import { createContext, useContext } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
}

export const ThemeContext = createContext<ThemeContextValue>({ theme: 'system', setTheme: () => undefined })

export function useTheme() {
  return useContext(ThemeContext)
}