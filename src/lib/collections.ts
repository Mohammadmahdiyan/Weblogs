import mediaJson from '../generated/media.json'
import mediaFoldersJson from '../generated/media-folders.json'
import mediaSearchJson from '../generated/media-search-index.json'
import mediaHiddenJson from '../generated/media-hidden.json'
import { mediaBodies } from '../generated/media-bodies'
import booksJson from '../generated/books.json'
import booksFoldersJson from '../generated/books-folders.json'
import booksSearchJson from '../generated/books-search-index.json'
import booksHiddenJson from '../generated/books-hidden.json'
import { bookBodies } from '../generated/books-bodies'
import mediaStoryJson from '../generated/media-story.json'
import booksStoryJson from '../generated/books-story.json'
import type { ArticleMeta, SearchEntry } from './types'
import type { StoryData } from './story'

export type CollectionId = 'media' | 'books'
type BodyLoaders = Record<string, () => Promise<{ default: string }>>

/** Everything the pages need to show one collection (the blog's articles, or the books). */
export interface SiteCollection {
  id: CollectionId
  /** URL prefix: items live at `${route}/<slug>`, the list at `route` (the blog list is the home page). */
  route: '/media' | '/books'
  /** Address of the list page. */
  listPath: string
  /** Newest first. */
  items: ArticleMeta[]
  folderNames: Record<string, string>
  searchIndex: SearchEntry[]
  bodies: BodyLoaders
  hidden: string[]
  story: StoryData | null
  /** Texts that differ between the collections. */
  text: {
    pageTitle: string
    pageDescription: string
    listHeading: string
    empty: string
    searchLabel: string
    breadcrumb: string
    latest: string
    previous: string
    next: string
    related: string
    newer: string
    older: string
    notFoundTitle: string
  }
}

const newestFirst = (items: ArticleMeta[]) => [...items].sort((first, second) => second.date.localeCompare(first.date))

export const siteCollections: Record<CollectionId, SiteCollection> = {
  media: {
    id: 'media',
    route: '/media',
    listPath: '/media',
    items: newestFirst(mediaJson as ArticleMeta[]),
    folderNames: mediaFoldersJson as Record<string, string>,
    searchIndex: mediaSearchJson as SearchEntry[],
    bodies: mediaBodies,
    hidden: mediaHiddenJson as string[],
    story: mediaStoryJson as StoryData | null,
    text: {
      pageTitle: 'رسانه‌ها',
      pageDescription: 'مقاله‌ها، ویدیوها و رسانه‌های آموزشی.',
      listHeading: 'همه رسانه‌ها',
      empty: 'هنوز محتوایی اضافه نشده است.',
      searchLabel: 'جست‌وجوی رسانه',
      breadcrumb: 'رسانه‌ها',
      latest: 'جدیدترین نوشته‌ها',
      previous: 'مقالات پیشین',
      next: 'مقالات بعدی',
      related: 'مقالات مرتبط',
      newer: 'مقاله جدیدتر',
      older: 'مقاله قدیمی‌تر',
      notFoundTitle: 'محتوا پیدا نشد',
    },
  },
  books: {
    id: 'books',
    route: '/books',
    listPath: '/books',
    items: newestFirst(booksJson as ArticleMeta[]),
    folderNames: booksFoldersJson as Record<string, string>,
    searchIndex: booksSearchJson as SearchEntry[],
    bodies: bookBodies,
    hidden: booksHiddenJson as string[],
    story: booksStoryJson as StoryData | null,
    text: {
      pageTitle: 'کتاب‌ها',
      pageDescription: 'کتاب‌های معرفی‌شده و منابع مطالعه؛ در عنوان و متن کتاب‌ها جست‌وجو کنید.',
      listHeading: 'همه کتاب‌ها',
      empty: 'هنوز کتابی اضافه نشده است.',
      searchLabel: 'جست‌وجوی کتاب',
      breadcrumb: 'کتاب‌ها',
      latest: 'جدیدترین کتاب‌ها',
      previous: 'کتاب‌های پیشین',
      next: 'کتاب‌های بعدی',
      related: 'کتاب‌های مرتبط',
      newer: 'کتاب جدیدتر',
      older: 'کتاب قدیمی‌تر',
      notFoundTitle: 'کتاب پیدا نشد',
    },
  },
}

/** The text of one book page (published as a plain file by the build, so a book can have thousands of pages). */
export async function fetchBookPage(slug: string, page: number): Promise<string> {
  const encodedSlug = slug.split('/').map(encodeURIComponent).join('/')
  const response = await fetch(`${import.meta.env.BASE_URL}books-media/${encodedSlug}/pages/${page}.md`)
  if (!response.ok) throw new Error(`page ${page} of ${slug}: HTTP ${response.status}`)
  return response.text()
}
