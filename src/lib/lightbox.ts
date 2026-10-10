import { createContext, useContext } from 'react'
import type { CoverType } from './types'

export interface LightboxMedia {
  url: string
  type: Extract<CoverType, 'image' | 'video'>
  alt?: string
  title?: string
  poster?: string
}

export type OpenLightbox = (media: LightboxMedia, gallery?: LightboxMedia[]) => void
export type RegisterLightboxMedia = (id: string, media: LightboxMedia, element: HTMLElement | null) => () => void

export const LightboxContext = createContext<OpenLightbox>(() => undefined)
export const LightboxRegistrationContext = createContext<RegisterLightboxMedia>(() => () => undefined)

export function useLightbox(): OpenLightbox {
  return useContext(LightboxContext)
}

export function useLightboxRegistration(): RegisterLightboxMedia {
  return useContext(LightboxRegistrationContext)
}