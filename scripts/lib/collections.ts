/* Each immediate content category has an independent date registry, story feed and generated data. */
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

export type CollectionId = 'books' | 'media'

export interface Collection {
  id: CollectionId
  /** content/<id> */
  root: string
  /** content/<id>.json: creation / update dates and the «published» flag per article path. */
  datesFile: string
  /** Folder (inside public/) the pictures / videos of each item are copied to, and the URL segment for them. */
  mediaDir: string
  /** src/generated file names. */
  files: { meta: string; search: string; bodiesDir: string; bodiesModule: string; bodiesExport: string; hidden: string }
  /** Name of the test item folder (`_…`: shown in development only). */
  testSlug: string
  /** Folder of the template used by createTest / createTestBook. */
  templateDir: string
}

export const collections: Record<CollectionId, Collection> = {
  media: {
    id: 'media',
    root: path.join(projectRoot, 'content', 'media'),
    datesFile: path.join(projectRoot, 'content', 'media.json'),
    mediaDir: 'content-media',
    files: {
      meta: 'media.json',
      search: 'media-search-index.json',
      bodiesDir: 'media-bodies',
      bodiesModule: 'media-bodies.ts',
      bodiesExport: 'mediaBodies',
      hidden: 'media-hidden.json',
    },
    testSlug: '_example-media',
    templateDir: path.join(projectRoot, 'scripts', 'templates', 'example-article'),
  },
  books: {
    id: 'books',
    root: path.join(projectRoot, 'content', 'books'),
    datesFile: path.join(projectRoot, 'content', 'books.json'),
    mediaDir: 'books-media',
    files: {
      meta: 'books.json',
      search: 'books-search-index.json',
      bodiesDir: 'books-bodies',
      bodiesModule: 'books-bodies.ts',
      bodiesExport: 'bookBodies',
      hidden: 'books-hidden.json',
    },
    testSlug: '_example-book',
    templateDir: path.join(projectRoot, 'scripts', 'templates', 'example-book'),
  },
}

export const allCollections: Collection[] = [collections.books, collections.media]
