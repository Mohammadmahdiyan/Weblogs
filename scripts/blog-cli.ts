import { readFile, readdir, rm, mkdir, copyFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
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
} from './lib/blog.ts'
import { pushBlogChanges } from './lib/git.ts'

const command = process.argv[2]
const args = process.argv.slice(3).filter((arg) => arg !== '--')
const templateRoot = path.join(projectRoot, 'scripts', 'templates', 'example-article')
const testSlug = '_example-article'
const testDirectory = path.join(blogRoot, testSlug)

function fail(message: string): never {
  console.error(`✖ ${message}`)
  process.exit(1)
}

function getTarget(): string {
  if (args.length !== 1 || !args[0] || args[0].startsWith('--')) {
    fail(command === 'publish'
      ? 'usage: npm run publishBlog -- <folder-name>'
      : 'usage: npm run deleteBlog -- <folder-name>')
  }
  const target = args[0].replace(/[\\/]+$/, '')
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(target) || target.startsWith('_')) {
    fail('Folder name must use lowercase a-z, numbers, hyphens and underscores, and must not start with _.')
  }
  return target
}

async function rebuildOrFail(): Promise<void> {
  if (!runContentBuild()) fail('Content validation/build failed; GitHub was not updated.')
}

async function publish(): Promise<void> {
  const slug = getTarget()
  const directory = path.join(blogRoot, slug)
  const markdownPath = path.join(directory, 'index.md')
  if (!(await exists(directory))) fail(`content/blog/${slug} does not exist.`)
  if (!(await exists(markdownPath))) fail(`content/blog/${slug}/index.md is missing.`)

  try {
    parseBlog(await readFile(markdownPath, 'utf8'), `content/blog/${slug}/index.md`)
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error))
  }

  const dates = await readDates()
  const previousDates = { ...dates }
  const day = today()
  const previous = dates[slug]
  dates[slug] = previous
    ? { ...previous, updated: previous.completed ? previous.updated : day, completed: true }
    : { date: day, updated: day, completed: true }
  await writeDates(dates)
  if (!runContentBuild()) {
    await writeDates(previousDates)
    fail('Content validation/build failed; publication status was rolled back and GitHub was not updated.')
  }

  console.log(`✔ Article "${slug}" marked complete.`)
  if (!pushBlogChanges(`publish: ${slug}`, [slug])) process.exitCode = 1
}

async function deleteBlog(): Promise<void> {
  const slug = getTarget()
  const directory = path.join(blogRoot, slug)
  if (!(await exists(directory))) fail(`content/blog/${slug} does not exist.`)
  if (isTestFolder(slug)) fail('Test articles are managed only by npm run deleteTest.')

  await rm(directory, { recursive: true, force: true })
  const dates = await readDates()
  delete dates[slug]
  await writeDates(dates)
  await rebuildOrFail()

  console.log(`✔ content/blog/${slug} and its date record deleted.`)
  if (!pushBlogChanges(`delete: ${slug}`, [slug])) process.exitCode = 1
}

async function createTest(): Promise<void> {
  if (args.length !== 0) fail('Run this command without a folder name: npm run createTest')
  if (await exists(testDirectory)) {
    console.log(`ℹ Test article already exists: content/blog/${testSlug}`)
    return
  }

  await mkdir(testDirectory, { recursive: true })
  for (const file of await readdir(templateRoot)) {
    await copyFile(path.join(templateRoot, file), path.join(testDirectory, file))
  }
  // The long-standing fixture refers to this image in its gallery; create a tiny valid PNG if absent.
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/WQAAAABJRU5ErkJggg==', 'base64')
  const imagePath = path.join(testDirectory, 'Spider House.png')
  if (!(await exists(imagePath))) await writeFile(imagePath, png)

  await rebuildOrFail()
  console.log(`✔ Full test article restored at content/blog/${testSlug}/index.md`)
}

async function deleteTest(): Promise<void> {
  if (args.length !== 0) fail('Run this command without a folder name: npm run deleteTest')
  if (!(await exists(testDirectory))) {
    console.log(`ℹ Test article does not exist: content/blog/${testSlug}`)
    return
  }
  await rm(testDirectory, { recursive: true, force: true })
  await rebuildOrFail()
  console.log(`✔ Test article content/blog/${testSlug} deleted.`)
}

try {
  if (command === 'publish') await publish()
  else if (command === 'delete') await deleteBlog()
  else if (command === 'create-test') await createTest()
  else if (command === 'delete-test') await deleteTest()
  else fail(`Unknown command "${command ?? ''}".`)
} catch (error) {
  fail(error instanceof Error ? error.message : String(error))
}
