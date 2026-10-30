import { spawn, spawnSync } from 'node:child_process'
import { watch, type FSWatcher } from 'node:fs'
import { mkdir, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import {
  exists,
  isTestFolder,
  projectRoot,
  readDates,
  runContentBuild,
  today,
  writeDates,
} from './lib/blog.ts'
import { pushBlogChanges } from './lib/git.ts'
import { allCollections, type Collection } from './lib/collections.ts'

type Snapshot = Map<string, string>
const watchers: FSWatcher[] = []
let debounce: ReturnType<typeof setTimeout> | undefined
let busy = false
let rerunRequested = false
let snapshots: Snapshot = new Map()

async function articleDirectories(collection: Collection): Promise<string[]> {
  const entries = await readdir(collection.root, { withFileTypes: true }).catch(() => [])
  return entries.filter((entry) => entry.isDirectory()).map((entry) => path.join(collection.root, entry.name))
}

async function signature(directory: string): Promise<string> {
  const parts: string[] = []
  async function walk(current: string): Promise<void> {
    const entries = await readdir(current, { withFileTypes: true })
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name.startsWith('.') || entry.name.endsWith('~') || /\.(swp|tmp)$/.test(entry.name)) continue
      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        await walk(fullPath)
      } else if (entry.isFile()) {
        const info = await stat(fullPath)
        parts.push(`${path.relative(directory, fullPath)}:${info.size}:${info.mtimeMs}`)
      }
    }
  }
  await walk(directory)
  return parts.join('|')
}

/** Keys are `<collection>/<folder>` so a blog folder and a book folder with the same name never collide. */
async function takeSnapshots(): Promise<Snapshot> {
  const result: Snapshot = new Map()
  for (const collection of allCollections) {
    for (const directory of await articleDirectories(collection)) {
      result.set(`${collection.id}/${path.basename(directory)}`, await signature(directory))
    }
  }
  return result
}

function isTrackedArticle(collection: Collection, slug: string): boolean {
  const result = spawnSync('git', ['ls-files', '--error-unmatch', '--', `content/${collection.id}/${slug}/index.md`], {
    cwd: projectRoot,
    stdio: 'ignore',
    shell: process.platform === 'win32',
  })
  return result.status === 0
}

async function registerUnregisteredBlogs(): Promise<boolean> {
  let anyChanged = false
  for (const collection of allCollections) {
    const dates = await readDates(collection.datesFile)
    let changed = false
    for (const directory of await articleDirectories(collection)) {
      const slug = path.basename(directory)
      if (isTestFolder(slug) || dates[slug] || !(await exists(path.join(directory, 'index.md')))) continue
      const info = await stat(path.join(directory, 'index.md'))
      const fileDate = Number.isNaN(info.mtimeMs) ? today() : info.mtime.toISOString().slice(0, 10)
      // Files already tracked by Git are existing live items; new untracked folders stay incomplete.
      const completed = isTrackedArticle(collection, slug)
      dates[slug] = { date: fileDate, updated: fileDate, completed, published: false }
      console.log(`ℹ Automatically registered new ${collection.id === 'books' ? 'book' : 'article'}: ${slug}`)
      changed = true
    }
    if (changed) await writeDates(dates, collection.datesFile)
    anyChanged ||= changed
  }
  return anyChanged
}

async function processChanges(): Promise<void> {
  if (busy) {
    rerunRequested = true
    return
  }
  busy = true
  try {
    const before = snapshots
    const after = await takeSnapshots()
    const registryChanged = await registerUnregisteredBlogs()
    const completedChanged: { collection: Collection; slug: string }[] = []

    for (const collection of allCollections) {
      const dates = await readDates(collection.datesFile)
      let touched = false
      for (const [key, currentSignature] of after) {
        if (!key.startsWith(`${collection.id}/`)) continue
        const slug = key.slice(collection.id.length + 1)
        const previousSignature = before.get(key)
        if (previousSignature === undefined || previousSignature === currentSignature || isTestFolder(slug)) continue
        const current = dates[slug]
        if (current?.completed) {
          dates[slug] = { ...current, updated: today() }
          completedChanged.push({ collection, slug })
          touched = true
        }
      }
      if (touched) await writeDates(dates, collection.datesFile)
    }
    snapshots = after

    if (registryChanged || completedChanged.length > 0 || !mapsEqual(before, after)) {
      if (!runContentBuild()) {
        console.error('✖ Automatic content rebuild failed; no automatic push was attempted.')
      } else if (completedChanged.length > 0) {
        for (const collection of allCollections) {
          const names = [...new Set(completedChanged.filter((item) => item.collection === collection).map((item) => item.slug))].sort()
          if (names.length === 0) continue
          console.log(`✔ Updated modification date automatically (${collection.id}): ${names.join(', ')}`)
          if (!pushBlogChanges(`auto-update: ${names.join(', ')}`, names, collection.id)) {
            console.error('✖ Automatic push failed. The changes remain local; fix Git authentication/branch and push manually.')
          }
        }
      }
    }
  } catch (error) {
    console.error(`✖ Automatic blog update failed: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    busy = false
    if (rerunRequested) {
      rerunRequested = false
      scheduleProcess()
    }
  }
}

function mapsEqual(left: Snapshot, right: Snapshot): boolean {
  if (left.size !== right.size) return false
  for (const [key, value] of left) if (right.get(key) !== value) return false
  return true
}

function scheduleProcess(): void {
  if (debounce) clearTimeout(debounce)
  debounce = setTimeout(() => void processChanges(), 1800)
}

async function main(): Promise<void> {
  for (const collection of allCollections) {
    if (!(await exists(collection.root))) await mkdir(collection.root, { recursive: true })
  }
  await registerUnregisteredBlogs()
  if (!runContentBuild()) throw new Error('Initial content build failed.')
  snapshots = await takeSnapshots()

  for (const collection of allCollections) {
    const watcher = watch(collection.root, { recursive: true }, () => scheduleProcess())
    watcher.on('error', (error) => console.error(`✖ File watcher error (${collection.id}): ${error.message}`))
    watchers.push(watcher)
  }
  console.log('👀 Watching content/blog and content/books. Completed items update their date and push to GitHub after each saved change.')

  const viteEntry = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js')
  const vite = spawn(process.execPath, [viteEntry, ...process.argv.slice(2)], {
    cwd: projectRoot,
    stdio: 'inherit',
  })
  const shutdown = () => {
    watchers.forEach((watcher) => watcher.close())
    if (debounce) clearTimeout(debounce)
    vite.kill('SIGTERM')
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
  vite.on('exit', (code) => {
    watchers.forEach((watcher) => watcher.close())
    process.exitCode = code ?? 0
  })
}

main().catch((error) => {
  console.error(`✖ ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
