/** Daily story data and route-selection helpers. */

export const STORY_SCOPES = ['home', 'media', 'books'] as const
export type StoryScope = (typeof STORY_SCOPES)[number]

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
  /** A published scope was intentionally hidden with `show: false`; do not use any fallback. */
  hidden?: boolean
  /** Automatic story for this scope, retained behind a manual story in case it expires before a rebuild. */
  fallback?: StoryData | null
  slides: StorySlide[]
}

export interface StoriesData {
  home: StoryData | null
  sections: Record<'media' | 'books', StoryData | null>
  branches: Record<string, StoryData>
}

const SEEN_KEY = 'story-seen'

export function isStoryExpired(story: StoryData, now = Date.now()): boolean {
  const end = Date.parse(story.expiresAt)
  return Number.isFinite(end) && now >= end
}

function usableStory(story: StoryData | null | undefined, now: number): StoryData | null {
  return story && !story.hidden && story.slides.length > 0 && !isStoryExpired(story, now) ? story : null
}

function homeStory(story: StoryData | null, now: number): StoryData | null {
  if (story?.source !== 'custom') return usableStory(story, now)
  if (story.hidden && !isStoryExpired(story, now)) return null
  return usableStory(story, now) ?? usableStory(story.fallback, now)
}

/**
 * Selects today's story for a route: scoped manual story, deepest matching directory, scoped auto story,
 * then home. A hidden manual story suppresses every fallback for its scope.
 */
export function pickStory(pathname: string, stories: StoriesData, now = Date.now()): StoryData | null {
  const route = `/${pathname.split(/[?#]/, 1)[0].split('/').filter(Boolean).join('/')}`
  if (route === '/') return homeStory(stories.home, now)

  const scope =
    route.startsWith('/media/') || route === '/media'
      ? 'media'
      : route.startsWith('/books/') || route === '/books'
        ? 'books'
        : null
  if (!scope) return homeStory(stories.home, now)

  const scopedStory = stories.sections[scope]
  if (scopedStory?.source === 'custom') {
    if (scopedStory.hidden && !isStoryExpired(scopedStory, now)) return null
    const manual = usableStory(scopedStory, now)
    if (manual) return manual
  }

  const segments = route.split('/').filter(Boolean)
  let directorySegments = segments
  if (scope === 'books' && /^\d+$/.test(segments.at(-1) ?? '')) {
    directorySegments = segments.slice(0, -2)
  }
  for (let length = directorySegments.length; length >= 1; length -= 1) {
    const candidate = usableStory(stories.branches[`/${directorySegments.slice(0, length).join('/')}`], now)
    if (candidate) return candidate
  }

  const automatic =
    scopedStory?.source === 'custom' ? usableStory(scopedStory.fallback, now) : usableStory(scopedStory, now)
  if (automatic) return automatic
  return homeStory(stories.home, now)
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
