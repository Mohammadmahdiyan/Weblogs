/*
  Blog commands (see README):

    npm run createNewBlog <folder> [--move] [--force] [--no-build]
    npm run updateBlog    <name>   [--from <folder>] [--no-build]
    npm run deleteBlog    <name>   [--yes] [--no-build]
    npm run createTest    <folder> [--move] [--force] [--no-build]
    npm run deleteTest    <name>   [--yes] [--no-build]

  <name>   = a folder inside content/blog (it is also the URL: /blog/<name>)
  <folder> = a folder inside content/blog OR any folder on disk that holds ONE .md file plus its
             media. A folder on disk is copied to content/blog/<its name>/ and the .md becomes index.md.

  Test blogs live in content/blog/_<name>: they are visible while developing and are never part
  of `npm run build`, the sitemap, or the RSS feed, so they can't reach the online site.
*/
import { cp, mkdtemp, readFile, readdir, rename, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import readline from 'node:readline/promises'
import {
  blogRoot,
  exists,
  isTestFolder,
  parseBlog,
  projectRoot,
  readDates,
  runContentBuild,
  today,
  writeDates,
  type DatesRegistry,
} from './lib/blog.ts'
import { pickMarkdownFile, resolveSlug } from './lib/mdimport.ts'

type Command = 'create' | 'update' | 'publish' | 'delete' | 'create-test' | 'delete-test'

const usage: Record<Command, string> = {
  create: 'npm run createNewBlog <folder> [--move] [--force] [--no-build]',
  update: 'npm run updateBlog <name> [--from <folder>] [--no-build]',
  publish: 'npm run publishBlog <name> [--no-build]',
  delete: 'npm run deleteBlog <name> [--yes] [--no-build]',
  'create-test': 'npm run createTest <folder> [--move] [--force] [--no-build]',
  'delete-test': 'npm run deleteTest <name> [--yes] [--no-build]',
}
const allowedFlags: Record<Command, string[]> = {
  create: ['--move', '--force', '--no-build'],
  update: ['--from', '--no-build'],
  publish: ['--no-build'],
  delete: ['--yes', '--no-build'],
  'create-test': ['--move', '--force', '--no-build'],
  'delete-test': ['--yes', '--no-build'],
}

const command = process.argv[2] as Command
if (!(command in usage)) {
  console.error(`✖ unknown command "${process.argv[2]}"`)
  process.exit(1)
}

function stop(message: string): never {
  console.error(`✖ ${message}`)
  console.error(`Usage: ${usage[command]}`)
  process.exit(1)
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

// ── arguments ──
const rawArgs = process.argv.slice(3)
const flags = new Set<string>()
const positional: string[] = []
let fromFolder: string | undefined
for (let index = 0; index < rawArgs.length; index += 1) {
  const argument = rawArgs[index]
  if (!argument.startsWith('--')) {
    positional.push(argument)
    continue
  }
  if (!allowedFlags[command].includes(argument)) stop(`unknown option ${argument}`)
  if (argument === '--from') {
    fromFolder = rawArgs[(index += 1)]
    if (!fromFolder || fromFolder.startsWith('--')) stop('--from needs a folder')
  }
  flags.add(argument)
}
if (positional.length !== 1) stop('give exactly one folder name')
const target = positional[0].replace(/[\\/]+$/, '')

// ── helpers ──
async function findOnDisk(input: string): Promise<string | undefined> {
  // Relative paths are tried against the current directory first, then the project root.
  for (const candidate of [path.resolve(process.cwd(), input), path.resolve(projectRoot, input)]) {
    if (await exists(candidate)) return candidate
  }
  return undefined
}

async function readArticle(directory: string, fileName: string, label: string) {
  try {
    return parseBlog(await readFile(path.join(directory, fileName), 'utf8'), label)
  } catch (error) {
    return stop(message(error))
  }
}

function report(blog: ReturnType<typeof parseBlog>): void {
  if (blog.ignoredKeys.length > 0) {
    console.log(
      `! ignored frontmatter key(s): ${blog.ignoredKeys.join(', ')} (only "tags" and "suggestions" are used; the title is the first "# " line)`,
    )
  }
}

async function confirm(question: string): Promise<boolean> {
  if (flags.has('--yes')) return true
  if (!process.stdin.isTTY) stop('refusing to delete without confirmation. Add --yes to confirm.')
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const answer = (await rl.question(`${question} [y/N] `)).trim().toLowerCase()
  rl.close()
  return answer === 'y' || answer === 'yes'
}

/** Finds an existing blog folder by name (tests are also found without the leading "_"). */
async function findExisting(name: string, kind: 'blog' | 'test'): Promise<{ slug: string; directory: string }> {
  const candidates = kind === 'test' && !name.startsWith('_') ? [`_${name}`] : [name]
  for (const slug of candidates) {
    const directory = path.join(blogRoot, slug)
    if (await exists(directory)) return { slug, directory }
  }
  const other = kind === 'test' ? name.replace(/^_+/, '') : `_${name}`
  const hint = (await exists(path.join(blogRoot, other)))
    ? kind === 'test'
      ? ` (there is a normal blog called "${other}": use deleteBlog)`
      : ` (there is a test called "${other}": use deleteTest)`
    : ''
  return stop(`content/blog/${candidates[0]} does not exist${hint}`)
}

// ── create / create-test ──
async function create(kind: 'blog' | 'test'): Promise<void> {
  // 1) a folder already inside content/blog (just register it), 2) any folder on disk (copy it in).
  const inside = !/[\\/]/.test(target)
    ? [target, `_${target}`].find((name) => kind === 'test' || name === target)
    : undefined
  const insideDirectory = inside ? path.join(blogRoot, inside) : undefined
  const inPlace = Boolean(insideDirectory && (await exists(insideDirectory)))
  const sourceDirectory = inPlace ? insideDirectory : await findOnDisk(target)
  if (!sourceDirectory) stop(`folder not found: ${target}`)

  let slug: string
  try {
    slug = resolveSlug(path.basename(sourceDirectory), kind)
  } catch (error) {
    return stop(message(error))
  }
  const targetDirectory = path.join(blogRoot, slug)
  const isInPlace = path.resolve(sourceDirectory) === path.resolve(targetDirectory)
  if (inPlace && !isInPlace) {
    // e.g. createTest foo found content/blog/foo: a normal blog cannot silently become a test.
    stop(`content/blog/${path.basename(sourceDirectory)} is a normal blog; tests must live in a folder that starts with "_".`)
  }

  const files = (await readdir(sourceDirectory, { withFileTypes: true })).filter((entry) => entry.isFile()).map((entry) => entry.name)
  const picked = pickMarkdownFile(files)
  if ('error' in picked) stop(`${target}: ${picked.error}`)
  const label = `${path.relative(projectRoot, path.join(sourceDirectory, picked.file)) || picked.file}`
  const blog = await readArticle(sourceDirectory, picked.file, label)

  const dates = await readDates()
  const previousDates: DatesRegistry = { ...dates }
  const alreadyThere = !isInPlace && (await exists(targetDirectory))
  if (!isInPlace && alreadyThere && !flags.has('--force')) {
    stop(`content/blog/${slug} already exists. Edit it and run "npm run updateBlog ${slug}", or use --force to replace it.`)
  }
  if (isInPlace && dates[slug] && !flags.has('--force')) {
    stop(`"${slug}" is already registered. Use "npm run updateBlog ${slug}" after editing it (or --force to re-register it as new).`)
  }

  // Keep a backup of what --force replaces, so a failed build restores it.
  let backupDirectory: string | undefined
  if (alreadyThere) {
    backupDirectory = path.join(await mkdtemp(path.join(os.tmpdir(), 'blog-cli-')), slug)
    await cp(targetDirectory, backupDirectory, { recursive: true })
    await rm(targetDirectory, { recursive: true, force: true })
  }
  if (!isInPlace) await cp(sourceDirectory, targetDirectory, { recursive: true })
  if (picked.file !== 'index.md') await rename(path.join(targetDirectory, picked.file), path.join(targetDirectory, 'index.md'))

  // Dates: tests are not registered (nothing about them is committed); blogs get date = updated = today.
  // Replacing an existing blog with --force keeps its first date and counts as an update.
  if (kind === 'blog') {
    const day = today()
    dates[slug] = alreadyThere && previousDates[slug]
      ? { ...previousDates[slug], updated: previousDates[slug].completed ? day : previousDates[slug].date }
      : { date: day, updated: day, completed: false }
    await writeDates(dates)
  }

  if (!flags.has('--no-build') && !runContentBuild()) {
    if (!isInPlace) {
      await rm(targetDirectory, { recursive: true, force: true })
      if (backupDirectory) await cp(backupDirectory, targetDirectory, { recursive: true })
    }
    if (kind === 'blog') await writeDates(previousDates)
    stop('the content step failed (see the message above), so the change was undone. Fix the markdown and run the command again.')
  }

  if (!isInPlace && flags.has('--move')) await rm(sourceDirectory, { recursive: true, force: true })

  console.log(`✔ content/blog/${slug}/index.md ${isInPlace ? 'registered' : flags.has('--move') ? 'moved' : 'created'}`)
  report(blog)
  console.table({
    slug,
    url: `/blog/${slug}`,
    title: blog.title,
    tags: blog.tags.length,
    suggestions: blog.suggestions.length,
    ...(kind === 'blog' ? { date: dates[slug].date, updated: dates[slug].updated } : {}),
  })
  if (kind === 'test') console.log('! This is a test blog: it shows in development only and is skipped by `npm run build`.')
  console.log('Next: npm run dev (preview) or npm run build')
}

// ── update ──
async function update(): Promise<void> {
  const kind = target.startsWith('_') ? 'test' : 'blog'
  const { slug, directory } = await findExisting(target, kind)
  const dates = await readDates()
  const previousDates: DatesRegistry = { ...dates }

  let backupDirectory: string | undefined
  if (fromFolder) {
    const source = await findOnDisk(fromFolder)
    if (!source) stop(`folder not found: ${fromFolder}`)
    const picked = pickMarkdownFile((await readdir(source, { withFileTypes: true })).filter((entry) => entry.isFile()).map((entry) => entry.name))
    if ('error' in picked) stop(`${fromFolder}: ${picked.error}`)
    await readArticle(source, picked.file, `${fromFolder}/${picked.file}`)

    backupDirectory = path.join(await mkdtemp(path.join(os.tmpdir(), 'blog-cli-')), slug)
    await cp(directory, backupDirectory, { recursive: true })
    await rm(directory, { recursive: true, force: true })
    await cp(source, directory, { recursive: true })
    if (picked.file !== 'index.md') await rename(path.join(directory, picked.file), path.join(directory, 'index.md'))
  }

  if (!(await exists(path.join(directory, 'index.md')))) stop(`content/blog/${slug}/index.md is missing`)
  const blog = await readArticle(directory, 'index.md', `content/blog/${slug}/index.md`)

  // updated = today. A blog that was never registered keeps today as its first date too.
  const day = today()
  if (kind === 'blog') {
    const previous = dates[slug]
    dates[slug] = previous
      ? { ...previous, updated: previous.completed ? day : previous.date }
      : { date: day, updated: day, completed: false }
    await writeDates(dates)
  }

  if (!flags.has('--no-build') && !runContentBuild()) {
    if (kind === 'blog') await writeDates(previousDates)
    if (backupDirectory) {
      await rm(directory, { recursive: true, force: true })
      await cp(backupDirectory, directory, { recursive: true })
    }
    stop('the content step failed (see the message above), so the change was undone.')
  }

  console.log(`✔ content/blog/${slug} updated`)
  report(blog)
  console.table({
    slug,
    title: blog.title,
    ...(kind === 'blog' ? { date: dates[slug].date, updated: dates[slug].updated } : {}),
  })
  if (kind === 'test') console.log('! Test blogs have no stored dates; nothing to update there.')
}

// ── publish (mark article as complete) ──
async function publish(): Promise<void> {
  if (target.startsWith('_')) stop('test blogs cannot be published; use a normal folder name.')
  const { slug, directory } = await findExisting(target, 'blog')
  if (!(await exists(path.join(directory, 'index.md')))) stop(`content/blog/${slug}/index.md is missing`)
  const blog = await readArticle(directory, 'index.md', `content/blog/${slug}/index.md`)
  const dates = await readDates()
  const previousDates: DatesRegistry = { ...dates }
  const day = today()
  const previous = dates[slug]

  if (previous?.completed) {
    console.log(`! ${slug} is already marked complete; dates were not changed.`)
  } else {
    dates[slug] = { date: previous?.date ?? day, updated: previous?.date ? previous.date : day, completed: true }
    await writeDates(dates)
  }

  if (!flags.has('--no-build') && !runContentBuild()) {
    await writeDates(previousDates)
    stop('the content step failed (see the message above), so the publication status was undone.')
  }

  console.log(`✔ content/blog/${slug} marked as complete`)
  report(blog)
  console.table({ slug, title: blog.title, date: dates[slug].date, updated: dates[slug].updated, completed: dates[slug].completed })
  console.log(`Next: npm run updateBlog ${slug} whenever you edit this article later.`)
}

// ── delete / delete-test ──
async function remove(kind: 'blog' | 'test'): Promise<void> {
  const { slug, directory } = await findExisting(target, kind)
  if (kind === 'blog' && isTestFolder(slug)) stop(`"${slug}" is a test blog: use "npm run deleteTest ${slug.slice(1)}".`)
  if (!(await confirm(`Delete content/blog/${slug} and everything inside it?`))) {
    console.log('Cancelled. Nothing was deleted.')
    return
  }

  await rm(directory, { recursive: true, force: true })
  const dates = await readDates()
  if (dates[slug]) {
    delete dates[slug]
    await writeDates(dates)
  }
  console.log(`✔ content/blog/${slug} deleted`)

  if (!flags.has('--no-build') && !runContentBuild()) {
    console.error('! The folder is deleted, but the content step failed for another reason (see above). Fix that and run "npm run content".')
    process.exitCode = 1
  }
}

try {
  if (command === 'create') await create('blog')
  else if (command === 'publish') await publish()
  else if (command === 'create-test') await create('test')
  else if (command === 'update') await update()
  else if (command === 'delete') await remove('blog')
  else await remove('test')
} catch (error) {
  stop(message(error))
}
