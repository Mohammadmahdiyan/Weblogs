import GithubSlugger from 'github-slugger'
import { splitInline } from './inline.ts'
import { isEmoji } from './emojiRegistry.ts'

export interface TocItem { level: number; title: string; id: string }

/**
 * Builds the table of contents from the markdown source (h2/h3).
 * Ids are produced by the same slugger algorithm as rehype-slug, so they match
 * the rendered heading ids. Headings inside fenced code blocks are ignored.
 */
export function buildToc(markdown: string): TocItem[] {
  const slugger = new GithubSlugger()
  const headings: TocItem[] = []
  const withoutCode = markdown.replace(/^( {0,3})(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\2[`~]*[ \t]*$/gm, '')
  const expression = /^ {0,3}(#{1,3})\s+(.+?)\s*#*\s*$/gm
  for (const match of withoutCode.matchAll(expression)) {
    // Mini-text keeps its words in the heading; emoji are images with no text.
    const visibleTitle = splitInline(match[2], isEmoji)
      .map((segment) => (segment.type === 'text' ? segment.value : segment.type === 'mini' ? segment.text : ''))
      .join('')
    const title = visibleTitle.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`~]/g, '').trim()

    // remarkHonorifics turns these parenthesized markers into image-backed
    // React components with no text content. rehype-slug therefore excludes
    // them from the rendered heading id; use the same visible text for slugs.
    const slugTitle = title
      .replace(/\(\s*(?:صلى الله عليه وسلم|ﷺ|ص|عليه السلام|عليه الصلاة والسلام|عليها السلام|عليهم السلام|رضي الله عنه|رضي الله عنها|رضي الله عنهما|رضي الله عنهم|رضي الله عنهن|رض|رحمه الله|رحمها الله|رحمهم الله|رحمهما الله|رحمهن الله|رح|جل جلاله|عز وجل|جل وعلا|سبحانه وتعالى|تبارك وتعالى|رضها|رضهما|رضهم|رضهن|رحها|رحهم|رحهما|رحهن|جل|عز|سبح|تبارك|صلى الله عليه و آله|صا|حفظه الله|حف)\s*\)/g, '')
      .trim()
    const id = slugger.slug(slugTitle)
    // `#` (level 1) in a body is demoted by the renderer; keep it out of the TOC like the original behaviour.
    if (match[1].length >= 2) headings.push({ level: match[1].length, title, id })
  }
  return headings
}
