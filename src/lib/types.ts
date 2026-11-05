import type { SourceItem } from './sources.ts'

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

/** One page file (`pages/<number>.md`) of a book. */
export interface BookPageMeta {
  number: number
  /** Optional chapter / page title from the file's frontmatter `title:`. */
  title?: string
}

export interface ArticleMeta {
  slug: string
  category?: string
  /** Folder-derived name for directory cards; editors may override it in the category JSON registry. */
  name?: string
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
  /** true until the author runs `npm run publishBlog -- <name>`; the page then ends with a «not finished» notice. */
  incomplete?: boolean
  /** Frontmatter `sources:` : shown at the end of the article. */
  sources?: SourceItem[]
  /** Books only: the page files, ascending. Missing = a single-page book (just index.md). */
  pages?: BookPageMeta[]
}

export interface SearchEntry {
  slug: string
  title: string
  phrases: string[]
  /** Plain searchable article body, used only by the explicit content:: search mode. */
  content?: string
  /** Book pages: found only by the «محتوا::» search, never by title. */
  contentOnly?: boolean
}
