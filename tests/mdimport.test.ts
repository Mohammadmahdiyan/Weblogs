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
  it('uses the folder name as the slug', () => {
    expect(resolveSlug('married-prophet', 'blog')).toBe('married-prophet')
  })

  it('tests always get a leading underscore', () => {
    expect(resolveSlug('demo', 'test')).toBe('_demo')
    expect(resolveSlug('_demo', 'test')).toBe('_demo')
  })

  it('a normal blog cannot start with an underscore (it would never be published)', () => {
    expect(() => resolveSlug('_demo', 'blog')).toThrow(/createTest/)
  })

  it('rejects folder names that are not URL-safe', () => {
    expect(() => resolveSlug('مقاله', 'blog')).toThrow(/URL-safe/)
    expect(() => resolveSlug('My Folder', 'blog')).toThrow(/URL-safe/)
  })
})
