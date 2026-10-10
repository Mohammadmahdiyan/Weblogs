export type CoverType = 'image' | 'video' | 'audio'

export interface ArticleMeta {
  slug: string
  title: string
  description: string
  date: string
  updated: string | null
  tags: string[]
  suggestions: string[]
  cover: {
    url: string
    type: CoverType
  } | null
  style: number
  readingTime: number
}

export interface SearchEntry {
  slug: string
  title: string
  phrases: string[]
}