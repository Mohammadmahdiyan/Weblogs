import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { folderPageConfigs, syncFolderPageConfigs } from '../scripts/lib/folder-pages.ts'

describe('folder page configuration', () => {
  it('creates configurations for listing branches, including branches containing articles', () => {
    const pages = folderPageConfigs([
      {
        collection: 'media',
        articleSlugs: ['lives-nour/spider-house/topic', 'lives-nour/motaghiya/article'],
      },
    ])

    expect(pages.get('media/_root')?.folders.map((folder) => folder.slug)).toEqual(['lives-nour'])
    expect(pages.get('media/lives-nour')?.folders.map((folder) => folder.slug)).toEqual(['motaghiya', 'spider-house'])
    expect(pages.get('media/lives-nour/spider-house')?.folders).toEqual([])
    expect(pages.get('media/lives-nour/motaghiya')?.folders).toEqual([])
  })

  it('preserves Persian edits and adds newly discovered branches', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'folder-pages-'))
    try {
      const source = [{ collection: 'media', articleSlugs: ['lives-nour/first/article'] }]
      await syncFolderPageConfigs(root, source)
      const filePath = path.join(root, 'folder-pages', 'media', '_root.json')
      const first = JSON.parse(await readFile(filePath, 'utf8')) as {
        title: string
        folders: { slug: string; caption: string }[]
      }
      first.title = 'رسانه‌ها'
      first.folders[0].caption = 'توضیح فارسی'
      await writeFile(filePath, `${JSON.stringify(first, null, 2)}\n`)

      await syncFolderPageConfigs(root, [
        { collection: 'media', articleSlugs: ['lives-nour/first/article', 'lives-nour/second/article'] },
      ])
      const updated = JSON.parse(await readFile(filePath, 'utf8')) as {
        title: string
        folders: { slug: string; caption: string }[]
      }
      expect(updated.title).toBe('رسانه‌ها')
      expect(updated.folders).toEqual([{ slug: 'lives-nour', title: '', caption: 'توضیح فارسی', image: '' }])

      const nested = JSON.parse(
        await readFile(path.join(root, 'folder-pages', 'media', 'lives-nour.json'), 'utf8'),
      ) as { folders: { slug: string }[] }
      expect(nested.folders.map((folder) => folder.slug)).toEqual(['first', 'second'])

      const leafPath = path.join(root, 'folder-pages', 'media', 'lives-nour', 'first.json')
      const leaf = JSON.parse(await readFile(leafPath, 'utf8')) as { title: string }
      expect(leaf.title).toBe('')
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})
