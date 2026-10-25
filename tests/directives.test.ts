import { describe, expect, it } from 'vitest'
import { normalizeDirectiveAttributes, normalizeDirectiveFences } from '../src/lib/directives.ts'

const lines = (...rows: string[]) => `${rows.join('\n')}\n`

describe('normalizeDirectiveFences', () => {
  it('lets a modal sit inside an accordion item whatever number of colons was typed', () => {
    const typed = lines(':::accordion', ':::item{title="س"}', 'متن', ':::modal{trigger="باز"}', 'داخل', ':::', ':::', ':::')
    const fixed = lines(':::::accordion', '::::item{title="س"}', 'متن', ':::modal{trigger="باز"}', 'داخل', ':::', '::::', ':::::')
    expect(normalizeDirectiveFences(typed)).toBe(fixed)
  })

  it('is idempotent and keeps sequential containers as they are', () => {
    const nested = lines('::::accordion', ':::item{title="a"}', 'x', ':::', ':::item{title="b"}', 'y', ':::', '::::')
    expect(normalizeDirectiveFences(nested)).toBe(nested)
    const once = normalizeDirectiveFences(lines(':::accordion', ':::item{title="س"}', ':::modal', ':::', ':::', ':::'))
    expect(normalizeDirectiveFences(once)).toBe(once)
  })

  it('leaves code fences, leaf directives and unbalanced documents alone', () => {
    const code = lines('```md', ':::item', ':::', '```')
    expect(normalizeDirectiveFences(code)).toBe(code)
    const leaf = lines('::youtube{id="x"}', 'سلام: خوبی؟')
    expect(normalizeDirectiveFences(leaf)).toBe(leaf)
    const unbalanced = lines(':::item{title="a"}', 'x')
    expect(normalizeDirectiveFences(unbalanced)).toBe(unbalanced)
    const stray = lines('x', ':::')
    expect(normalizeDirectiveFences(stray)).toBe(stray)
  })

  it('keeps Windows line endings', () => {
    const typed = [':::accordion', ':::item{title="س"}', ':::modal', ':::', ':::', ':::', ''].join('\r\n')
    expect(normalizeDirectiveFences(typed)).toBe([':::::accordion', '::::item{title="س"}', ':::modal', ':::', '::::', ':::::', ''].join('\r\n'))
  })
})

describe('normalizeDirectiveAttributes', () => {
  it('lets attributes be separated by a comma after a quoted value', () => {
    expect(normalizeDirectiveAttributes('::video{link="./a.mp4", cover="./a.jpg"}')).toBe('::video{link="./a.mp4"  cover="./a.jpg"}')
    expect(normalizeDirectiveAttributes('::audio{link="./a,b.mp3",}')).toBe('::audio{link="./a,b.mp3" }')
  })

  it('leaves normal text, unquoted values and code fences alone', () => {
    for (const text of ['سلام, {خنده} و بعد', '::select{options=الف,ب}', ['```', '::video{link="a", cover="b"}', '```'].join('\n')]) {
      expect(normalizeDirectiveAttributes(text)).toBe(text)
    }
  })
})
