import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const blogRoot = path.join(projectRoot, 'content', 'blog')

function usage(): never {
  console.error('Usage: npm run new -- <slug> "<عنوان مقاله>"')
  console.error('Example: npm run new -- my-article "عنوان مثال"')
  process.exit(1)
}

const args = process.argv.slice(2)
if (args.length < 2) usage()

const slug = args[0]
const title = args[1]

if (!slug || !/^[a-z0-9_-]+$/.test(slug)) {
  console.error(`Error: slug "${slug}" must contain only lowercase letters, numbers, hyphens, and underscores.`)
  process.exit(1)
}

const articleDir = path.join(blogRoot, slug)

const template = [
  '---',
  `title: ${title}`,
  `description: یک مقاله جدید درباره ${title}`,
  `date: ${new Date().toISOString().slice(0, 10)}`,
  'tags:',
  '  - نمونه',
  'suggestions:',
  '  - سؤال مرتبط 1',
  '  - سؤال مرتبط 2',
  'style: 1',
  '---',
  '',
  `# ${title}`,
  '',
  'متن مقاله‌ی شما اینجا قرار بگیرد.',
  '',
  '## بخش اول',
  '',
  'متن نمونه برای شروع نوشتن مقاله خود.',
  '',
  '## بخش دوم',
  '',
  ':::alert{type="info"}',
  'این یک هشدار است.',
  ':::',
  '',
  ':::accordion',
  ':::item{title="سؤال متداول"}',
  'پاسخ شما اینجا.',
  ':::',
  ':::',
  '',
  '```javascript',
  'function greet(name) {',
  '  console.log("سلام، " + name);',
  '}',
  '```',
  '',
  ':::suggested{href="/"}',
  'مقاله پیشنهادی',
  ':::',
  '',
].join('\n')

async function main() {
  await mkdir(articleDir, { recursive: true })
  await writeFile(path.join(articleDir, 'index.md'), template, 'utf8')
  console.log(`✓ Created article at content/blog/${slug}/index.md`)
  console.log(`  Edit the file to add your content, then run npm run dev`)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
