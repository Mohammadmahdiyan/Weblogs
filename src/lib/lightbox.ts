import { createContext, useContext } from 'react'
import type { CoverType } from './types'

export interface LightboxMedia {
  url: string
  type: Extract<CoverType, 'image' | 'video'>
  alt?: string
}

export type OpenLightbox = (media: LightboxMedia) => void

export const LightboxContext = createContext<OpenLightbox>(() => undefined)

export function useLightbox(): OpenLightbox {
  return useContext(LightboxContext)
}