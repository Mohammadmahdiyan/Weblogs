import type { EmbedProvider } from './embed.ts'

export type { EmbedProvider }
export type CoverType = 'image' | 'video' | 'audio' | 'embed'

export interface ArticleCover {
  url: string
  type: CoverType
  /** Only for `type: 'embed'`. */
  embedProvider?: EmbedProvider
  /** Only for YouTube embeds: poster image URL. */
  poster?: string
}

export interface ArticleMeta {
  slug: string
  title: string
  description: string
  date: string
  updated: string | null
  tags: string[]
  suggestions: string[]
  cover: ArticleCover | null
  style: number
  readingTime: number
  /** Optional per-article language / direction override (frontmatter `lang`, `dir`). */
  lang?: string
  dir?: 'ltr' | 'rtl'
}

export interface SearchEntry {
  slug: string
  title: string
  phrases: string[]
}
