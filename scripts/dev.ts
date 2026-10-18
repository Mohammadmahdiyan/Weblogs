import { spawn, spawnSync } from 'node:child_process'
import { watch, type FSWatcher } from 'node:fs'
import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import {
  blogRoot,
  exists,
  isTestFolder,
  projectRoot,
  readDates,
  runContentBuild,
  today,
  writeDates,
} from './lib/blog.ts'
import { pushBlogChanges } from './lib/git.ts'

type Snapshot = Map<string, string>
let watcher: FSWatcher | undefined
let debounce: ReturnType<typeof setTimeout> | undefined
let busy = false
let rerunRequested = false
let snapshots: Snapshot = new Map()

async function articleDirectories(): Promise<string[]> {
  const entries = await readdir(blogRoot, { withFileTypes: true })
  return entries.filter((entry) => entry.isDirectory()).map((entry) => path.join(blogRoot, entry.name))
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

async function takeSnapshots(): Promise<Snapshot> {
  const result: Snapshot = new Map()
  for (const directory of await articleDirectories()) {
    const slug = path.basename(directory)
    result.set(slug, await signature(directory))
  }
  return result
}

function isTrackedArticle(slug: string): boolean {
  const result = spawnSync('git', ['ls-files', '--error-unmatch', '--', `content/blog/${slug}/index.md`], {
    cwd: projectRoot,
    stdio: 'ignore',
    shell: process.platform === 'win32',
  })
  return result.status === 0
}

async function registerUnregisteredBlogs(): Promise<boolean> {
  const dates = await readDates()
  let changed = false
  for (const directory of await articleDirectories()) {
    const slug = path.basename(directory)
    if (isTestFolder(slug) || dates[slug] || !(await exists(path.join(directory, 'index.md')))) continue
    const info = await stat(path.join(directory, 'index.md'))
    const fileDate = Number.isNaN(info.mtimeMs) ? today() : info.mtime.toISOString().slice(0, 10)
    // Files already tracked by Git are existing live articles; new untracked folders stay incomplete.
    const completed = isTrackedArticle(slug)
    dates[slug] = { date: fileDate, updated: fileDate, completed }
    console.log(`ℹ Automatically registered new article: ${slug}`)
    changed = true
  }
  if (changed) await writeDates(dates)
  return changed
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
    const dates = await readDates()
    const completedChanged: string[] = []

    for (const [slug, currentSignature] of after) {
      const previousSignature = before.get(slug)
      if (previousSignature === undefined || previousSignature === currentSignature || isTestFolder(slug)) continue
      const current = dates[slug]
      if (current?.completed) {
        dates[slug] = { ...current, updated: today() }
        completedChanged.push(slug)
      }
    }

    if (completedChanged.length > 0) await writeDates(dates)
    snapshots = after

    if (registryChanged || completedChanged.length > 0 || !mapsEqual(before, after)) {
      if (!runContentBuild()) {
        console.error('✖ Automatic content rebuild failed; no automatic push was attempted.')
      } else if (completedChanged.length > 0) {
        const names = [...new Set(completedChanged)].sort()
        console.log(`✔ Updated modification date automatically: ${names.join(', ')}`)
        if (!pushBlogChanges(`auto-update: ${names.join(', ')}`, names)) {
          console.error('✖ Automatic push failed. The changes remain local; fix Git authentication/branch and push manually.')
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
  if (!(await exists(blogRoot))) throw new Error(`Blog folder not found: ${blogRoot}`)
  await registerUnregisteredBlogs()
  if (!runContentBuild()) throw new Error('Initial content build failed.')
  snapshots = await takeSnapshots()

  watcher = watch(blogRoot, { recursive: true }, () => scheduleProcess())
  watcher.on('error', (error) => console.error(`✖ Blog file watcher error: ${error.message}`))
  console.log('👀 Blog watcher active. Completed articles update their date and push to GitHub after each saved change.')

  const viteEntry = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js')
  const vite = spawn(process.execPath, [viteEntry, ...process.argv.slice(2)], {
    cwd: projectRoot,
    stdio: 'inherit',
  })
  const shutdown = () => {
    watcher?.close()
    if (debounce) clearTimeout(debounce)
    vite.kill('SIGTERM')
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
  vite.on('exit', (code) => {
    watcher?.close()
    process.exitCode = code ?? 0
  })
}

main().catch((error) => {
  console.error(`✖ ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
