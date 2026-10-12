import { useSearchParams } from 'react-router-dom'
import siteConfig from '../site.config'
import { normalizeStyle } from '../layouts'

const STORAGE_KEY = 'blog-style'

function storedStyle(): number | undefined {
  try {
    const value = Number(window.localStorage.getItem(STORAGE_KEY))
    return value >= 1 ? value : undefined
  } catch {
    return undefined
  }
}

/** Remembers the reader's chosen style so every article opens with it. */
export function rememberStyle(style: number): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(style))
  } catch {
    // Storage can be blocked (private mode); the `?style=` link still works.
  }
}

/**
 * The style the reader sees: `?style=N` in the link wins, then the style the reader chose
 * earlier (saved in this browser), then the site default. Articles do not carry a style.
 */
export function useArticleStyle(): number {
  const [searchParams] = useSearchParams()
  const requested = Number(searchParams.get('style'))
  return normalizeStyle(requested >= 1 ? requested : storedStyle() ?? siteConfig.defaultStyle)
}
