import { readdir } from 'node:fs/promises'
import path from 'node:path'

export function articlePathSlug(root: string, directory: string): string {
  return path.relative(root, directory).split(path.sep).join('/')
}

export function englishFolderName(slug: string): string {
  return slug
    .split('/')
    .at(-1)!
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ')
}

export async function discoverContentDirectories(root: string): Promise<string[]> {
  const found: string[] = []
  async function walk(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return []
      throw error
    })
    if (directory !== root) found.push(directory)
    if (entries.some((entry) => entry.isFile() && entry.name === 'index.md')) return
    for (const entry of entries
      .filter((item) => item.isDirectory() && item.name !== 'story')
      .sort((a, b) => a.name.localeCompare(b.name))) {
      await walk(path.join(directory, entry.name))
    }
  }
  await walk(root)
  return found
}

export async function discoverArticleDirectories(root: string): Promise<string[]> {
  const found: string[] = []
  async function walk(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return []
      throw error
    })
    const relative = articlePathSlug(root, directory)
    if (relative.split('/').includes('story')) return
    if (entries.some((entry) => entry.isFile() && entry.name === 'index.md')) {
      found.push(directory)
      return
    }
    for (const entry of entries
      .filter((item) => item.isDirectory() && item.name !== 'story')
      .sort((a, b) => a.name.localeCompare(b.name))) {
      await walk(path.join(directory, entry.name))
    }
  }
  await walk(root)
  return found
}
