import { useEffect } from 'react'
import siteConfig from '../site.config'

interface PageMetaOptions {
  title: string
  description: string
  image?: string | null
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

export function usePageMeta({ title, description, image }: PageMetaOptions) {
  useEffect(() => {
    const fullTitle = title === siteConfig.siteName ? title : `${title} | ${siteConfig.siteName}`
    document.title = fullTitle
    setMeta('meta[name="description"]', description)
    setMeta('meta[property="og:title"]', fullTitle)
    setMeta('meta[property="og:description"]', description)
    setMeta('meta[property="og:image"]', image ? new URL(image, siteConfig.siteUrl).toString() : undefined)
    return () => {
      document.title = siteConfig.siteName
      setMeta('meta[property="og:image"]', undefined)
    }
  }, [description, image, title])
}