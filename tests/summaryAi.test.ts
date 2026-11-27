import { describe, expect, it } from 'vitest'
import {
  buildSummaryPrompt,
  prefillsPrompt,
  summaryAiAddress,
  summaryAiById,
  summaryAis,
} from '../src/lib/summaryAi.ts'

const url = 'https://example.github.io/Weblogs/media/lives-nour/spider-house/tohen-ba-ahle-beat'

describe('buildSummaryPrompt', () => {
  const prompt = buildSummaryPrompt(url, 'media')

  it('names the exact page twice: to read it, and to come back to', () => {
    expect(prompt.split(url)).toHaveLength(3)
  })

  it('asks for the introduction and every ## and ### section, word by word', () => {
    expect(prompt).toContain('word by word')
    expect(prompt).toContain('introduction')
    expect(prompt).toContain('"##"')
    expect(prompt).toContain('"###"')
  })

  it('forbids own interpretation and invention when the page cannot be read', () => {
    expect(prompt).toMatch(/Do NOT interpret/)
    expect(prompt).toMatch(/cannot open the link/)
    expect(prompt).toMatch(/do NOT write anything from your own knowledge/)
  })

  it('media articles get the source / Arabic rules', () => {
    expect(prompt).toContain('source')
    expect(prompt).toContain('Arabic')
    expect(prompt).toContain('in full')
  })

  it('books do not', () => {
    const book = buildSummaryPrompt(url, 'books')
    expect(book).not.toContain('Arabic')
    expect(book).toContain('"###"')
  })

  it('is written in English apart from the one Persian failure message', () => {
    const withoutFailure = prompt.replace(/متأسفانه[^\n]*/, '')
    expect(withoutFailure).not.toMatch(/[\u0600-\u06FF]/)
  })
})

describe('summaryAiAddress', () => {
  it('has the six assistants', () => {
    expect(summaryAis.map((ai) => ai.id)).toEqual(['arena', 'claude', 'chatgpt', 'grok', 'gemini', 'deepseek'])
  })

  it('puts the prompt in the address where the assistant takes it', () => {
    const chatgpt = summaryAiById('chatgpt')!
    expect(summaryAiAddress(chatgpt, 'a b')).toBe('https://chatgpt.com/?q=a%20b')
    expect(prefillsPrompt(chatgpt, 'a b')).toBe(true)
  })

  it('opens the plain chat where there is no such thing (the prompt is on the clipboard)', () => {
    const gemini = summaryAiById('gemini')!
    expect(summaryAiAddress(gemini, 'a b')).toBe(gemini.url)
    expect(prefillsPrompt(gemini, 'a b')).toBe(false)
  })

  it('does not build an address too long to be accepted', () => {
    const chatgpt = summaryAiById('chatgpt')!
    expect(summaryAiAddress(chatgpt, 'x'.repeat(8000))).toBe(chatgpt.url)
  })
})
