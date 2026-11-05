/*
  Usage:  npm run new -- my-slug "عنوان مقاله"
  Creates content/media/<slug>/index.md from a template. The dev watcher registers it automatically.
*/
import { mkdir, writeFile, access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const [slug, ...titleParts] = process.argv.slice(2)
const title = titleParts.join(' ').trim()

function usage(message: string): never {
  console.error(`${message}\nUsage: npm run new -- <slug> "<title>"   (slug: a-z, 0-9, - and _)`)
  process.exit(1)
}

const relativeSlug = (slug ?? '').replace(/\\/g, '/').replace(/^\/+|\/+$/g, '')
if (!relativeSlug || relativeSlug.split('/').some((part) => !/^[a-z0-9][a-z0-9_-]*$/.test(part)))
  usage('A URL-safe folder path is required.')
if (!title) usage('A title is required.')

const directory = path.join(projectRoot, 'content', 'media', ...relativeSlug.split('/'))
const file = path.join(directory, 'index.md')

const template = `---
tags: []
suggestions:
  - عبارتی که کاربر جست‌وجو می‌کند و باید به این مقاله برسد
---

# ${title}

یک پاراگراف مقدمه.

## عنوان بخش اول

متن بخش اول.

## عنوان بخش دوم

متن بخش دوم.

:::suggested{href="/" label="مقاله پیشنهادی:"}
عنوان مقاله
:::
`

try {
  await access(file)
  usage(`${path.relative(projectRoot, file)} already exists.`)
} catch {
  // File does not exist yet: good.
}

await mkdir(directory, { recursive: true })
await writeFile(file, template, 'utf8')
console.log(
  `Created ${path.relative(projectRoot, file)}\nAdd images / videos next to it (a file named cover.jpg becomes the cover), then run npm run dev to register it automatically`,
)
