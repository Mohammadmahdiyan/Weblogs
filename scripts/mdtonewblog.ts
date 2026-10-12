/*
  Usage:
    npm run mdtonewblog -- <folder> [--move] [--force] [--no-build]

  Turns a folder that contains ONE markdown file (+ its images/videos/audio) into a blog:
  the frontmatter at the top of the markdown is the page information.

      ---
      name: married-prophet-with-ayesha     # → URL slug (defaults to the folder name)
      title: ...                            # required, becomes the page <h1>
      date / updated / tags / suggestions / style / coverEmbed / lang / dir / draft
      ---

  The folder is COPIED to content/blog/<slug>/ and the markdown file becomes index.md.
    --move   delete the source folder after a successful copy
    --force  overwrite content/blog/<slug> if it already exists
    --no-build  skip the content step below

  Registration is automatic: content/blog is the single source of truth, and everything else
  (articles.json, search index, bodies, media copy, sitemap, RSS, _headers) is generated from it.
  So after copying, this command runs `npm run content` right away. That validates the whole
  site (e.g. duplicate slugs) and refreshes all generated files; on failure the change is undone.
  Afterwards `npm run build` is all that is left.
  A folder that is already inside content/blog is only validated and normalized in place.
*/
import { spawnSync } from 'node:child_process'
import { access, cp, mkdtemp, readFile, readdir, rename, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import { pickMarkdownFile, resolveSlug } from './lib/mdimport.ts'
import { validateCoverEmbed, validateDir, validateLang, validateStyle } from './lib/validators.ts'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const blogRoot = path.join(projectRoot, 'content', 'blog')

function stop(message: string): never {
  console.error(`✖ ${message}`)
  console.error('Usage: npm run mdtonewblog -- <folder> [--move] [--force] [--no-build]')
  process.exit(1)
}

async function exists(target: string): Promise<boolean> {
  try {
    await access(target)
    return true
  } catch {
    return false
  }
}

function stringArray(data: Record<string, unknown>, key: string, label: string): string[] {
  const value = data[key]
  if (value === undefined) return []
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !item.trim())) {
    stop(`${label}: "${key}" must be a list of non-empty strings`)
  }
  return value as string[]
}

const args = process.argv.slice(2)
const flags = new Set(args.filter((argument) => argument.startsWith('--')))
const positional = args.filter((argument) => !argument.startsWith('--'))
const unknownFlag = [...flags].find((flag) => flag !== '--move' && flag !== '--force' && flag !== '--no-build')
if (unknownFlag) stop(`unknown option ${unknownFlag}`)
if (positional.length !== 1) stop('give exactly one folder')

// Relative paths are tried against the current directory first, then the project root.
const candidates = [path.resolve(process.cwd(), positional[0]), path.resolve(projectRoot, positional[0])]
let sourceDirectory: string | undefined
for (const candidate of candidates) {
  if (await exists(candidate)) { sourceDirectory = candidate; break }
}
if (!sourceDirectory) stop(`folder not found: ${positional[0]}`)

const entries = await readdir(sourceDirectory, { withFileTypes: true })
const picked = pickMarkdownFile(entries.filter((entry) => entry.isFile()).map((entry) => entry.name))
if ('error' in picked) stop(`${positional[0]}: ${picked.error}`)

const markdownName = picked.file
const label = path.relative(projectRoot, path.join(sourceDirectory, markdownName)) || markdownName

let data: Record<string, unknown>
try {
  data = matter(await readFile(path.join(sourceDirectory, markdownName), 'utf8')).data as Record<string, unknown>
} catch (error) {
  stop(`${label}: invalid frontmatter (${error instanceof Error ? error.message.split('\n')[0] : String(error)})`)
}

if (typeof data.title !== 'string' || !data.title.trim()) {
  stop(`${label}: the frontmatter needs a "title" (it becomes the page <h1>)`)
}
if (data.name !== undefined && typeof data.name !== 'string') stop(`${label}: "name" must be a string`)

try {
  validateStyle(data.style, label)
  validateCoverEmbed(data.coverEmbed, label)
  validateLang(data.lang, label)
  validateDir(data.dir, label)
} catch (error) {
  stop(error instanceof Error ? error.message : String(error))
}
const tags = stringArray(data, 'tags', label)
const suggestions = stringArray(data, 'suggestions', label)

let slug: string
try {
  slug = resolveSlug(data.name, path.basename(sourceDirectory))
} catch (error) {
  stop(`${label}: ${error instanceof Error ? error.message : String(error)}`)
}

const targetDirectory = path.join(blogRoot, slug)
const inPlace = path.resolve(sourceDirectory) === path.resolve(targetDirectory)

// Keep a backup of an article that --force replaces, so a failed build can restore it.
let backupDirectory: string | undefined
let createdTarget = false

if (!inPlace) {
  if (await exists(targetDirectory)) {
    if (!flags.has('--force')) stop(`content/blog/${slug} already exists (use --force to overwrite, or change "name:")`)
    backupDirectory = path.join(await mkdtemp(path.join(os.tmpdir(), 'mdtonewblog-')), slug)
    await cp(targetDirectory, backupDirectory, { recursive: true })
    await rm(targetDirectory, { recursive: true, force: true })
  }
  await cp(sourceDirectory, targetDirectory, { recursive: true })
  createdTarget = true
}

// The article file must be called index.md.
if (markdownName !== 'index.md') {
  await rename(path.join(targetDirectory, markdownName), path.join(targetDirectory, 'index.md'))
}

async function undo(): Promise<void> {
  if (!createdTarget) return
  await rm(targetDirectory, { recursive: true, force: true })
  if (backupDirectory) await cp(backupDirectory, targetDirectory, { recursive: true })
}

if (!flags.has('--no-build')) {
  console.log('→ npm run content (validating and regenerating site data)…')
  const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'content'], {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  if (result.status !== 0) {
    await undo()
    stop('the content step failed (see the message above), so the change was undone. Fix the markdown and run the command again.')
  }
}

if (!inPlace && flags.has('--move')) {
  await rm(sourceDirectory, { recursive: true, force: true })
}

const draft = data.draft === true
console.log(`✔ content/blog/${slug}/index.md ${inPlace ? 'checked' : flags.has('--move') ? 'moved' : 'created'}`)
console.table({
  slug,
  url: `/blog/${slug}`,
  title: data.title,
  style: typeof data.style === 'number' ? data.style : 1,
  tags: tags.length,
  suggestions: suggestions.length,
  draft,
})
if (draft) console.log('! draft: true → the article is excluded from `npm run build` until you remove it.')
console.log(flags.has('--no-build') ? 'Next: npm run build   (it regenerates everything)' : 'Everything is registered. Next: npm run build   (or npm run dev to preview)')
