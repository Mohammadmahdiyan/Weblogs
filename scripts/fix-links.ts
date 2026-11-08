import { stat } from 'node:fs/promises'
import path from 'node:path'
import { fixLinks } from './lib/link-check.ts'
import { projectRoot } from './lib/blog.ts'
import { collections } from './lib/collections.ts'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const folders = args.filter((argument) => argument !== '--dry-run' && argument !== '--')
if (folders.length !== 1) {
  console.error('Usage: npm run fixLinks -- <folder> [--dry-run]')
  process.exitCode = 1
} else {
  const rawFolder = folders[0]
  const contentRoot = path.join(projectRoot, 'content')
  const candidates = [
    path.isAbsolute(rawFolder) ? rawFolder : path.resolve(projectRoot, rawFolder),
    ...Object.values(collections).map((collection) => path.join(collection.root, rawFolder)),
  ]
  const existing: string[] = []
  for (const candidate of candidates) {
    try {
      if ((await stat(candidate)).isDirectory() && !existing.includes(candidate)) existing.push(candidate)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
  }
  const target = existing.length === 1 ? existing[0] : undefined
  const relative = target ? path.relative(contentRoot, target) : '..'
  if (!target || relative === '..' || relative.startsWith(`..${path.sep}`)) {
    console.error(
      existing.length > 1
        ? `Folder "${rawFolder}" is ambiguous; pass its path under content/media or content/books.`
        : `Folder "${rawFolder}" was not found inside content/.`,
    )
    process.exitCode = 1
  } else {
    await fixLinks(target, dryRun)
  }
}
