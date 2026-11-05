import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  articlePathSlug,
  discoverArticleDirectories,
  discoverContentDirectories,
  englishFolderName,
} from '../scripts/lib/content-path.ts'
import { readDates } from '../scripts/lib/blog.ts'

describe('nested content paths', () => {
  it('keeps every relative directory segment in the route slug', () => {
    const root = path.resolve('content', 'media')
    const left = path.join(root, 'lives-nour', 'spider-house', 'topic')
    const right = path.join(root, 'lives-nour', 'motaghiya', 'topic')
    expect(articlePathSlug(root, left)).toBe('lives-nour/spider-house/topic')
    expect(articlePathSlug(root, right)).toBe('lives-nour/motaghiya/topic')
    expect(englishFolderName(articlePathSlug(root, left))).toBe('Topic')
  })

  it('discovers nested book/media index files and treats pages as book pages', async () => {
    const booksRoot = path.resolve('content', 'books')
    const mediaRoot = path.resolve('content', 'media')
    const books = (await discoverArticleDirectories(booksRoot)).map((directory) =>
      articlePathSlug(booksRoot, directory),
    )
    const media = (await discoverArticleDirectories(mediaRoot)).map((directory) =>
      articlePathSlug(mediaRoot, directory),
    )
    const folders = (await discoverContentDirectories(mediaRoot)).map((directory) =>
      articlePathSlug(mediaRoot, directory),
    )

    expect(books).toContain('answer-to-shobhat/alhad-noven-part1')
    expect(books).not.toContain('answer-to-shobhat/alhad-noven-part1/pages')
    expect(media).toContain('lives-nour/spider-house/tohen-ba-ahle-beat')
    expect(media).toContain('lives-nour/motaghiya/kashti-najat')
    expect(folders).toContain('lives-nour')
    expect(folders).toContain('lives-nour/spider-house')
    expect(folders).not.toContain('lives-nour/spider-house/tohen-ba-ahle-beat/pages')
  })

  it('keeps the previous leaf-slug date record when registering nested routes', async () => {
    const registry = await readDates(path.resolve('content', 'books.json'))
    const legacy = registry['alhad-noven-part1']
    const nested = registry['answer-to-shobhat/alhad-noven-part1']

    expect(nested).toMatchObject({
      date: legacy.date,
      updated: legacy.updated,
      completed: legacy.completed,
      published: legacy.published,
      route: '/books/answer-to-shobhat/alhad-noven-part1',
    })
    expect(nested.name).toBeTruthy()
  })
})
