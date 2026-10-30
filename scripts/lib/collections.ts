/*
  The site has two collections of Markdown "articles" that share ONE format and ONE build:
    blog   content/blog/<folder>/index.md   → /blog/<folder>
    books  content/books/<folder>/index.md  → /books/<folder>
  Everything that differs between them (folders, registry file, generated files, media folder) lives here.
*/
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

export type CollectionId = 'blog' | 'books'

export interface Collection {
  id: CollectionId
  /** content/<id> */
  root: string
  /** content/<id>-dates.json: creation / update dates and the «published» flag per folder. */
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
  blog: {
    id: 'blog',
    root: path.join(projectRoot, 'content', 'blog'),
    datesFile: path.join(projectRoot, 'content', 'blog-dates.json'),
    mediaDir: 'content',
    files: { meta: 'articles.json', search: 'search-index.json', bodiesDir: 'bodies', bodiesModule: 'bodies.ts', bodiesExport: 'articleBodies', hidden: 'hidden.json' },
    testSlug: '_example-article',
    templateDir: path.join(projectRoot, 'scripts', 'templates', 'example-article'),
  },
  books: {
    id: 'books',
    root: path.join(projectRoot, 'content', 'books'),
    datesFile: path.join(projectRoot, 'content', 'books-dates.json'),
    mediaDir: 'content-books',
    files: { meta: 'books.json', search: 'books-search-index.json', bodiesDir: 'books-bodies', bodiesModule: 'books-bodies.ts', bodiesExport: 'bookBodies', hidden: 'books-hidden.json' },
    testSlug: '_example-book',
    templateDir: path.join(projectRoot, 'scripts', 'templates', 'example-book'),
  },
}

export const allCollections: Collection[] = [collections.blog, collections.books]
