/** Daily story: data shape (written by scripts/lib/story.ts into src/generated/story.json) + reader helpers. */

export interface StoryLink {
  /** Category route (`/media/path?find=…`, opened with the router) or a full https URL. */
  href: string
  label: string
}

/** One story = one screen in the viewer (and one segment of the progress bar). */
export interface StorySlide {
  /** `image`: one picture shown whole. `markdown`: rich text, scrolls when long (images, quotes, spoilers… all work). */
  kind: 'image' | 'markdown'
  /** kind image: picture URL. */
  src?: string
  /** kind markdown: the story text. */
  markdown?: string
  /** Small line above the text, e.g. the article a section comes from. */
  kicker?: string
  /** Closing button, e.g. «open the article». */
  link?: StoryLink
  /** Length of the text (characters): longer text stays on screen longer. */
  textLength: number
  /** From the story file's `seconds:`; replaces the automatic time. */
  seconds?: number
}

export interface StoryData {
  /** Changes every time a different story is published; the reader's «seen» mark is stored per id. */
  id: string
  /** `custom`: a published story-folder feed. `article`: an automatically generated article-section story. */
  source: 'custom' | 'article'
  /** YYYY-MM-DD (Asia/Tehran) the story belongs to. */
  date: string
  /** After this instant the story is hidden, even if the site was not rebuilt. */
  expiresAt: string
  /** true in development for a story folder that has not been published yet. */
  preview?: boolean
  slides: StorySlide[]
}

export interface BranchStoriesData {
  home: StoryData | null
  branches: Record<string, StoryData>
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

/** Seconds a story stays: its own `seconds`, else the configured time, longer for long text (≈15 characters/second). */
export function slideSeconds(slide: StorySlide, base: number): number {
  if (slide.seconds && slide.seconds > 0) return slide.seconds
  return Math.min(60, Math.max(base, Math.ceil(slide.textLength / 15)))
}
