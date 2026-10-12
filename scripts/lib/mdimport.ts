import { validateFolderName } from './blog.ts'

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

/**
 * The URL slug is the folder name. Test blogs get a leading `_`; normal blogs must not have one.
 */
export function resolveSlug(folderName: string, kind: 'blog' | 'test'): string {
  const name = validateFolderName(folderName)
  if (kind === 'blog' && name.startsWith('_')) {
    throw new Error(`"${name}" starts with "_", which marks a test blog (never published). Use "npm run createTest" or rename the folder.`)
  }
  return kind === 'test' && !name.startsWith('_') ? `_${name}` : name
}
