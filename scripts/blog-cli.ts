import { readFile, readdir, rm, mkdir, copyFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  exists,
  isTestFolder,
  parseBlog,
  readDates,
  runContentBuild,
  today,
  writeDates,
} from './lib/blog.ts'
import { pushBlogChanges } from './lib/git.ts'
import { collections } from './lib/collections.ts'

// `publish`, `delete`, `create-test`, `delete-test` work on the blog; the same names ending in `-book` on books.
const rawCommand = process.argv[2] ?? ''
const isBook = rawCommand.endsWith('-book')
const command = isBook ? rawCommand.slice(0, -'-book'.length) : rawCommand
const collection = isBook ? collections.books : collections.blog
const blogRoot = collection.root
const noun = isBook ? 'book' : 'article'
const args = process.argv.slice(3).filter((arg) => arg !== '--')
const templateRoot = collection.templateDir
const testSlug = collection.testSlug
const testDirectory = path.join(blogRoot, testSlug)
const npmName = (name: string) => (isBook ? `${name}Book` : `${name}Blog`)
const collectionPath = `content/${collection.id}`

function fail(message: string): never {
  console.error(`✖ ${message}`)
  process.exit(1)
}

function parseSlug(raw: string): string {
  const target = raw.replace(/[\\/]+$/, '')
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(target) || target.startsWith('_')) {
    fail('Folder name must use lowercase a-z, numbers, hyphens and underscores, and must not start with _.')
  }
  return target
}

function getTarget(): string {
  if (args.length !== 1 || !args[0] || args[0].startsWith('--')) {
    fail(`usage: npm run ${npmName('delete')} -- <folder-name>`)
  }
  return parseSlug(args[0])
}

/** `npm run publishBlog -- a b c` publishes several items in one go. */
function getTargets(): string[] {
  if (args.length < 1 || args.some((arg) => !arg || arg.startsWith('--'))) {
    fail(`usage: npm run ${npmName('publish')} -- <folder-name> [more folder names…]`)
  }
  return [...new Set(args.map(parseSlug))]
}

async function rebuildOrFail(): Promise<void> {
  if (!runContentBuild()) fail('Content validation/build failed; GitHub was not updated.')
}

async function publish(): Promise<void> {
  const slugs = getTargets()
  for (const slug of slugs) {
    const directory = path.join(blogRoot, slug)
    const markdownPath = path.join(directory, 'index.md')
    if (!(await exists(directory))) fail(`${collectionPath}/${slug} does not exist.`)
    if (!(await exists(markdownPath))) fail(`${collectionPath}/${slug}/index.md is missing.`)
    try {
      parseBlog(await readFile(markdownPath, 'utf8'), `${collectionPath}/${slug}/index.md`)
    } catch (error) {
      fail(error instanceof Error ? error.message : String(error))
    }
  }

  const dates = await readDates(collection.datesFile)
  const previousDates = { ...dates }
  const day = today()
  for (const slug of slugs) {
    const previous = dates[slug]
    dates[slug] = previous
      ? { ...previous, updated: previous.completed ? previous.updated : day, completed: true, published: true }
      : { date: day, updated: day, completed: true, published: true }
  }
  await writeDates(dates, collection.datesFile)
  if (!runContentBuild()) {
    await writeDates(previousDates, collection.datesFile)
    fail('Content validation/build failed; publication status was rolled back and GitHub was not updated.')
  }

  console.log(`✔ Published: ${slugs.join(', ')}`)
  if (!pushBlogChanges(`publish: ${slugs.join(', ')}`, slugs, collection.id)) process.exitCode = 1
}

async function deleteBlog(): Promise<void> {
  const slug = getTarget()
  const directory = path.join(blogRoot, slug)
  if (!(await exists(directory))) fail(`${collectionPath}/${slug} does not exist.`)
  if (isTestFolder(slug)) fail(`Test ${noun}s are managed only by npm run ${isBook ? 'deleteTestBook' : 'deleteTest'}.`)

  await rm(directory, { recursive: true, force: true })
  const dates = await readDates(collection.datesFile)
  delete dates[slug]
  await writeDates(dates, collection.datesFile)
  await rebuildOrFail()

  console.log(`✔ ${collectionPath}/${slug} and its date record deleted.`)
  if (!pushBlogChanges(`delete: ${slug}`, [slug], collection.id)) process.exitCode = 1
}

async function createTest(): Promise<void> {
  if (args.length !== 0) fail(`Run this command without a folder name: npm run ${isBook ? 'createTestBook' : 'createTest'}`)
  if (await exists(testDirectory)) {
    console.log(`ℹ Test ${noun} already exists: ${collectionPath}/${testSlug}`)
    return
  }

  await mkdir(testDirectory, { recursive: true })
  for (const file of await readdir(templateRoot)) {
    await copyFile(path.join(templateRoot, file), path.join(testDirectory, file))
  }
  // The long-standing blog fixture refers to this image in its gallery; create a tiny valid PNG if absent.
  if (!isBook) {
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/WQAAAABJRU5ErkJggg==', 'base64')
  const imagePath = path.join(testDirectory, 'Spider House.png')
  if (!(await exists(imagePath))) await writeFile(imagePath, png)
  }

  await rebuildOrFail()
  console.log(`✔ Full test ${noun} restored at ${collectionPath}/${testSlug}/index.md`)
}

async function deleteTest(): Promise<void> {
  if (args.length !== 0) fail(`Run this command without a folder name: npm run ${isBook ? 'deleteTestBook' : 'deleteTest'}`)
  if (!(await exists(testDirectory))) {
    console.log(`ℹ Test ${noun} does not exist: ${collectionPath}/${testSlug}`)
    return
  }
  await rm(testDirectory, { recursive: true, force: true })
  await rebuildOrFail()
  console.log(`✔ Test ${noun} ${collectionPath}/${testSlug} deleted.`)
}

try {
  if (command === 'publish') await publish()
  else if (command === 'delete') await deleteBlog()
  else if (command === 'create-test') await createTest()
  else if (command === 'delete-test') await deleteTest()
  else fail(`Unknown command "${rawCommand}".`)
} catch (error) {
  fail(error instanceof Error ? error.message : String(error))
}
