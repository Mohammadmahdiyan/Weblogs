import articlesJson from '../generated/articles.json'
import searchJson from '../generated/search-index.json'
import hiddenJson from '../generated/hidden.json'
import { articleBodies } from '../generated/bodies'
import booksJson from '../generated/books.json'
import booksSearchJson from '../generated/books-search-index.json'
import booksHiddenJson from '../generated/books-hidden.json'
import { bookBodies } from '../generated/books-bodies'
import type { ArticleMeta, SearchEntry } from './types'

export type CollectionId = 'blog' | 'books'
type BodyLoaders = Record<string, () => Promise<{ default: string }>>

/** Everything the pages need to show one collection (the blog's articles, or the books). */
export interface SiteCollection {
  id: CollectionId
  /** URL prefix: items live at `${route}/<slug>`, the list at `route` (the blog list is the home page). */
  route: '/blog' | '/books'
  /** Address of the list page. */
  listPath: string
  /** Newest first. */
  items: ArticleMeta[]
  searchIndex: SearchEntry[]
  bodies: BodyLoaders
  hidden: string[]
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
  blog: {
    id: 'blog',
    route: '/blog',
    listPath: '/',
    items: newestFirst(articlesJson as ArticleMeta[]),
    searchIndex: searchJson as SearchEntry[],
    bodies: articleBodies,
    hidden: hiddenJson as string[],
    text: {
      pageTitle: '',
      pageDescription: '',
      listHeading: 'همه مقاله‌ها',
      empty: 'هنوز مقاله‌ای منتشر نشده است.',
      searchLabel: 'جست‌وجوی مقاله',
      breadcrumb: 'همه مقاله‌ها',
      latest: 'جدیدترین نوشته‌ها',
      previous: 'مقالات پیشین',
      next: 'مقالات بعدی',
      related: 'مقالات مرتبط',
      newer: 'مقاله جدیدتر',
      older: 'مقاله قدیمی‌تر',
      notFoundTitle: 'مقاله پیدا نشد',
    },
  },
  books: {
    id: 'books',
    route: '/books',
    listPath: '/books',
    items: newestFirst(booksJson as ArticleMeta[]),
    searchIndex: booksSearchJson as SearchEntry[],
    bodies: bookBodies,
    hidden: booksHiddenJson as string[],
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
