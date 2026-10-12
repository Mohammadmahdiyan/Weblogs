import { slugify } from './slug.ts'

/**
 * Chooses the markdown file of a source folder:
 * `index.md` wins; otherwise the folder must contain exactly one `.md` file.
 */
export function pickMarkdownFile(fileNames: readonly string[]): { file: string } | { error: string } {
  const markdown = fileNames.filter((name) => name.toLowerCase().endsWith('.md'))
  const index = markdown.find((name) => name.toLowerCase() === 'index.md')
  if (index) return { file: index }
  if (markdown.length === 1) return { file: markdown[0] }
  if (markdown.length === 0) return { error: 'no .md file found in the folder' }
  return { error: `more than one .md file found (${markdown.join(', ')}); rename the article to index.md` }
}

/** Slug = frontmatter `name` (slugified) or, when absent, the source folder name. */
export function resolveSlug(name: unknown, folderName: string): string {
  const slug = slugify(typeof name === 'string' && name.trim() ? name : folderName)
  if (!slug) throw new Error('could not build a URL-safe slug; set "name:" in the frontmatter (a-z, 0-9, - and _)')
  return slug
}
