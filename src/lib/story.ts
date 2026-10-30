/** Daily story: data shape (written by scripts/lib/story.ts into src/generated/story.json) + reader helpers. */

export interface StoryLink {
  /** Site path (`/blog/slug?find=…`, opened with the router) or a full https URL. */
  href: string
  label: string
}

export interface StorySlide {
  /** `image`: a picture (+ optional caption). `text`: a coloured card with text. `link`: the closing «open the article» card. */
  kind: 'image' | 'text' | 'link'
  /** Picture URL (kind image), or an optional background picture (kind text). */
  src?: string
  /** Small line above the text. */
  kicker?: string
  title?: string
  /** Text. A few inline Markdown bits work: **bold** and [label](url). */
  caption?: string
  link?: StoryLink
}

export interface StoryData {
  /** Changes every time a different story is published; the reader's «seen» mark is stored per id. */
  id: string
  /** `custom`: the owner's story folder. `article`: the automatic «section of a random article» story. */
  source: 'custom' | 'article'
  /** YYYY-MM-DD (Asia/Tehran) the story belongs to. */
  date: string
  /** After this instant the story is hidden, even if the site was not rebuilt. */
  expiresAt: string
  /** true in development for a story folder that has not been published yet. */
  preview?: boolean
  slides: StorySlide[]
}

const SEEN_KEY = 'story-seen'

export function isStoryExpired(story: StoryData, now = Date.now()): boolean {
  const end = Date.parse(story.expiresAt)
  return Number.isFinite(end) && now >= end
}

export function readSeenStory(): string | null {
  try {
    return localStorage.getItem(SEEN_KEY)
  } catch {
    return null
  }
}

export function markStorySeen(id: string): void {
  try {
    localStorage.setItem(SEEN_KEY, id)
  } catch {
    // Private mode: the ring simply stays coloured.
  }
}

/** Seconds a slide stays: the configured time, longer for long text (about 14 characters per second). */
export function slideSeconds(slide: StorySlide, base: number): number {
  if (slide.kind === 'image' && !slide.caption) return base
  const length = (slide.title?.length ?? 0) + (slide.caption?.length ?? 0)
  return Math.min(18, Math.max(base, Math.ceil(length / 14)))
}
