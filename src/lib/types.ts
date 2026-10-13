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
  /** Equals `date` until `npm run updateBlog` is used. */
  updated: string
  tags: string[]
  suggestions: string[]
  cover: ArticleCover | null
  readingTime: number
  /** Optional per-article language / direction override (frontmatter `lang`, `dir`). */
  lang?: string
  dir?: 'ltr' | 'rtl'
  /** Whether the article requires an 18+ confirmation gate. */
  adult?: boolean
}

export interface SearchEntry {
  slug: string
  title: string
  phrases: string[]
}
