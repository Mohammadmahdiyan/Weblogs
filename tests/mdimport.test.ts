import { describe, expect, it } from 'vitest'
import { pickMarkdownFile, resolveSlug } from '../scripts/lib/mdimport.ts'

describe('pickMarkdownFile', () => {
  it('prefers index.md', () => {
    expect(pickMarkdownFile(['a.md', 'index.md', 'pic.png'])).toEqual({ file: 'index.md' })
  })

  it('accepts a single markdown file with any name', () => {
    expect(pickMarkdownFile(['article.MD', 'pic.png'])).toEqual({ file: 'article.MD' })
  })

  it('reports none or several', () => {
    expect(pickMarkdownFile(['pic.png'])).toHaveProperty('error')
    expect(pickMarkdownFile(['a.md', 'b.md'])).toHaveProperty('error')
  })
})

describe('resolveSlug', () => {
  it('uses the frontmatter name when present', () => {
    expect(resolveSlug('Married-Prophet with Ayesha', 'folder')).toBe('married-prophet-with-ayesha')
  })

  it('falls back to the folder name', () => {
    expect(resolveSlug(undefined, 'My Folder')).toBe('my-folder')
  })

  it('throws when nothing URL-safe remains', () => {
    expect(() => resolveSlug(undefined, 'مقاله')).toThrow(/name/)
  })
})
