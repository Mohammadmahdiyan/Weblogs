/**
 * «Let an AI summarize this page»: the list of assistants, the prompt each one gets, and the remembered choice.
 *
 * Some assistants accept a prompt in the address (`?q=`), some do not. The prompt is therefore ALWAYS copied to the
 * clipboard as well, so the reader can paste it where it did not arrive by itself.
 */

export type SummaryAiId = 'arena' | 'claude' | 'chatgpt' | 'grok' | 'gemini' | 'deepseek'

export interface SummaryAi {
  id: SummaryAiId
  name: string
  /** Where the chat opens. */
  url: string
  /** Query-string key that fills the chat box with the prompt; none when the assistant has no such thing. */
  promptParam?: string
}

/** The order the picker shows them in. */
export const summaryAis: readonly SummaryAi[] = [
  { id: 'arena', name: 'Arena AI', url: 'https://arena.ai/' },
  { id: 'claude', name: 'Claude', url: 'https://claude.ai/new', promptParam: 'q' },
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com/', promptParam: 'q' },
  { id: 'grok', name: 'Grok', url: 'https://grok.com/', promptParam: 'q' },
  { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com/app' },
  { id: 'deepseek', name: 'DeepSeek', url: 'https://chat.deepseek.com/' },
]

export const summaryAiById = (id: string | null | undefined): SummaryAi | undefined =>
  summaryAis.find((ai) => ai.id === id)

/** Longer addresses are refused by servers (HTTP 431), so a longer prompt goes by clipboard only. */
const MAX_ADDRESS_LENGTH = 7000

/** The address to open: the chat with the prompt in it when the assistant supports that, else the plain chat. */
export function summaryAiAddress(ai: SummaryAi, prompt: string): string {
  if (!ai.promptParam) return ai.url
  const address = `${ai.url}?${ai.promptParam}=${encodeURIComponent(prompt)}`
  return address.length <= MAX_ADDRESS_LENGTH ? address : ai.url
}

/** Does opening this assistant already put the prompt in its chat box? */
export const prefillsPrompt = (ai: SummaryAi, prompt: string): boolean => summaryAiAddress(ai, prompt) !== ai.url

/** What the assistant must answer when it cannot read the page (this one sentence is Persian: the reader sees it). */
const FAILURE_MESSAGE =
  'متأسفانه نتوانستم لینک را باز کنم یا نتوانستم صفحه را بخوانم. به سایت برگرد و یک هوش مصنوعی دیگر را انتخاب کن:'

export type SummaryKind = 'media' | 'books'

/**
 * The prompt (in English) for one page. `url` is the page's own address, with no query or fragment.
 * Articles of the media section also get the rules for quotations, sources and Arabic text.
 */
export function buildSummaryPrompt(url: string, kind: SummaryKind): string {
  const parts: string[] = [
    [
      'Open this exact page and read it carefully, word by word, from the first line to the last. Do not skim, do not skip anything:',
      '',
      url,
    ].join('\n'),

    [
      'Then write an accurate, detailed summary of the page in Persian (Farsi):',
      '- first the introduction (the text before the first second-level heading),',
      '- then EVERY second-level section ("##") and EVERY third-level section ("###"), in the order they appear on the page. Do not leave any of them out. Use the headings of the page as the headings of your summary.',
      '- Text under deeper headings ("####" and below) belongs to the section above it: cover it there.',
    ].join('\n'),

    [
      'Important rules:',
      '- Do NOT interpret, explain, comment on, judge or add anything of your own. I do not want your commentary or your outside knowledge.',
      '- The summary must convey exactly what the full text means: the same claims, the same arguments, the same meaning, only shorter. Do not change, soften, strengthen or reorder the meaning.',
    ].join('\n'),
  ]

  if (kind === 'media') {
    parts.push(
      [
        'What MUST be in the summary (100%):',
        '- The pages are full of quotations (narrations, sayings, verses, texts of scholars). Very probably (about 90%) a quotation comes with its source (the book, volume, page, number, narrator chain or whatever the page gives). If a quotation has a source, the source MUST appear in the summary, written exactly as on the page. Put it right where you summarize that quotation, together with (a) a short Persian summary of its translation and (b) the exact Arabic text, copied letter for letter from the page.',
        '- If a quotation has no source but has an Arabic text, put the complete Arabic text in the summary, copied exactly, together with a short Persian summary of its translation.',
        '- If a quoted text has no Arabic text, do not shorten its Persian text: put it in the summary in full.',
        '- Never change, correct, re-type or paraphrase the Arabic. Copy it as it is.',
      ].join('\n'),
    )
  }

  parts.push(
    [
      'If you cannot open the link, or you cannot read the page (or only part of it), do NOT write a summary and do NOT write anything from your own knowledge or from guessing what the page might say. Reply with only this Persian message and then the address below, so that I can go back to the site and choose another AI:',
      '',
      FAILURE_MESSAGE,
      url,
    ].join('\n'),
  )

  return parts.join('\n\n')
}

// ───────────────────────────── the remembered choice

const STORAGE_KEY = 'summary-ai'

/** Only the two calls used: this file is also compiled by the Node-side TypeScript project, which has no DOM types. */
interface KeyValueStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

const store = (): KeyValueStore | undefined => (globalThis as unknown as { localStorage?: KeyValueStore }).localStorage

export function readSummaryAi(): SummaryAi | undefined {
  try {
    return summaryAiById(store()?.getItem(STORAGE_KEY))
  } catch {
    return undefined
  }
}

export function saveSummaryAi(id: SummaryAiId): void {
  try {
    store()?.setItem(STORAGE_KEY, id)
  } catch {
    // Private mode: the choice just is not remembered.
  }
}
