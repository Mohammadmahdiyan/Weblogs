import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import siteConfig from '../site.config'

interface PageMetaOptions {
  title: string
  description: string
  image?: string | null
  type?: 'website' | 'article'
  /** JSON-LD object(s) to inject for this page (Article, WebSite, …). */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}

function setMeta(selector: string, content: string | undefined) {
  let element = document.head.querySelector<HTMLMetaElement>(selector)
  if (!content) {
    element?.remove()
    return
  }
  if (!element) {
    element = document.createElement('meta')
    const [attribute, value] = selector.match(/\[(name|property)="([^"]+)"\]/)?.slice(1) ?? []
    if (attribute && value) element.setAttribute(attribute, value)
    document.head.append(element)
  }
  element.content = content
}

function setCanonical(href: string | undefined) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!href) {
    element?.remove()
    return
  }
  if (!element) {
    element = document.createElement('link')
    element.rel = 'canonical'
    document.head.append(element)
  }
  element.href = href
}

export function usePageMeta({ title, description, image, type = 'website', jsonLd }: PageMetaOptions) {
  const { pathname } = useLocation()
  const jsonLdText = jsonLd ? JSON.stringify(jsonLd).replace(/</g, '\\u003c') : undefined

  useEffect(() => {
    const fullTitle = title === siteConfig.siteName ? title : `${title} | ${siteConfig.siteName}`
    const imageUrl = image ? new URL(image, siteConfig.siteUrl).toString() : undefined
    const canonical = new URL(pathname, siteConfig.siteUrl).toString()

    document.title = fullTitle
    setMeta('meta[name="description"]', description)
    setMeta('meta[property="og:title"]', fullTitle)
    setMeta('meta[property="og:description"]', description)
    setMeta('meta[property="og:type"]', type)
    setMeta('meta[property="og:url"]', canonical)
    setMeta('meta[property="og:site_name"]', siteConfig.siteName)
    setMeta('meta[property="og:image"]', imageUrl)
    setMeta('meta[name="twitter:card"]', imageUrl ? 'summary_large_image' : 'summary')
    setMeta('meta[name="twitter:title"]', fullTitle)
    setMeta('meta[name="twitter:description"]', description)
    setMeta('meta[name="twitter:image"]', imageUrl)
    setCanonical(canonical)

    let script: HTMLScriptElement | null = null
    if (jsonLdText) {
      script = document.createElement('script')
      script.type = 'application/ld+json'
      script.dataset.seo = 'page'
      script.textContent = jsonLdText
      document.head.append(script)
    }

    return () => {
      script?.remove()
      document.title = siteConfig.siteName
      setMeta('meta[property="og:image"]', undefined)
      setMeta('meta[name="twitter:image"]', undefined)
      setCanonical(undefined)
    }
  }, [description, image, jsonLdText, pathname, title, type])
}
