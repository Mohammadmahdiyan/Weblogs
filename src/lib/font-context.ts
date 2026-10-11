import { createContext, useContext } from 'react'

export interface FontConfig {
  id: string
  label: string
  family: string
  fallback: string
  weights?: Record<string, string>
}

export interface FontContextValue {
  fonts: FontConfig[]
  current: string
  setFont: (fontId: string) => void
  size: number
  setSize: (size: number) => void
  resetFont: () => void
}

export const FontContext = createContext<FontContextValue>({
  fonts: [],
  current: 'vazirmatn',
  setFont: () => undefined,
  size: 100,
  setSize: () => undefined,
  resetFont: () => undefined,
})

export function useFont() {
  return useContext(FontContext)
}
