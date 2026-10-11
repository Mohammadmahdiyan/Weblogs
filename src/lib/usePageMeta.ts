import { useEffect } from 'react'
import siteConfig from '../site.config'

interface SeoOptions {
  title: string
  description: string
  image?: string | null
  canonical?: string
  article?: {
    date: string
    updated?: string | null
    tags: string[]
    authors: string[]
  }
  noindex?: boolean
}

function setMeta(selector: string, content: string | undefined) {
  let element = document.head.querySelector<HTMLMetaElement>(selector)
  if (!content) {
    element?.remove()
    return
  }
  if (!element) {
    element = document.createElement('meta')
    const match = selector.match(/\[(name|property)="([^"]+)"\]/)?.slice(1) ?? []
    if (match[0] && match[1]) element.setAttribute(match[0], match[1])
    document.head.append(element)
  }
  element.content = content
}

function setLinkCanonical(url: string | undefined) {
  if (!url) {
    document.head.querySelector('link[rel="canonical"]')?.remove()
    return
  }
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', 'canonical')
    document.head.append(element)
  }
  element.setAttribute('href', url)
}

function setRobots(noindex: boolean | undefined) {
  let element = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]')
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute('name', 'robots')
    document.head.append(element)
  }
  element.content = noindex ? 'noindex, nofollow' : 'index, follow'
}

function setJsonLd(script: object) {
  const existing = document.getElementById('seo-json-ld')
  const element = existing ?? document.createElement('script')
  if (!existing) {
    element.setAttribute('type', 'application/ld+json')
    element.setAttribute('id', 'seo-json-ld')
    document.head.append(element)
  }
  element.textContent = JSON.stringify(script)
}

export function usePageMeta({ title, description, image, canonical, article, noindex }: SeoOptions) {
  useEffect(() => {
    const fullTitle = title === siteConfig.siteName ? title : `${title} | ${siteConfig.siteName}`
    const imageUrl = image ? new URL(image, siteConfig.siteUrl).toString() : undefined

    document.title = fullTitle

    setMeta('meta[name="description"]', description)
    setMeta('meta[property="og:title"]', fullTitle)
    setMeta('meta[property="og:description"]', description)
    setMeta('meta[property="og:image"]', imageUrl)
    setMeta('meta[property="og:type"]', article ? 'article' : 'website')
    setMeta('meta[property="og:locale"]', 'fa_IR')
    setMeta('meta[property="og:site"]', siteConfig.siteName)
    setMeta('meta[property="og:site_name"]', siteConfig.siteName)

    setMeta('meta[name="twitter:card"]', imageUrl ? 'summary_large_image' : 'summary')
    setMeta('meta[name="twitter:title"]', fullTitle)
    setMeta('meta[name="twitter:description"]', description)
    setMeta('meta[name="twitter:image"]', imageUrl)

    setLinkCanonical(canonical)
    setRobots(noindex)

    const siteUrl = siteConfig.siteUrl.replace(/\/+$/, '')
    const jsonLd: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteConfig.siteName,
      description: siteConfig.siteDescription,
      url: siteUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${siteUrl}/?q={search_term_string}`,
        },
        queryInput: 'search_term_string',
      },
    }

    if (article) {
      jsonLd['@type'] = 'Article'
      jsonLd.headline = title
      jsonLd.datePublished = article.date
      jsonLd.dateModified = article.updated ?? article.date
      jsonLd.image = imageUrl ?? siteUrl
      jsonLd.author = Array.isArray(article.authors)
        ? article.authors.map((author) => ({ '@type': 'Person' as const, name: author }))
        : { '@type': 'Person' as const, name: article.authors }
      jsonLd.keywords = article.tags.join(', ')
    }

    setJsonLd(jsonLd)

    return () => {
      document.title = siteConfig.siteName
      setMeta('meta[property="og:image"]', undefined)
      setLinkCanonical(undefined)
    }
  }, [description, image, title, canonical, article, noindex])
}
