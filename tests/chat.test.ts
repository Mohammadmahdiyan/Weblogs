import { describe, expect, it } from 'vitest'
import { transformChatMessages } from '../src/lib/chat.ts'

interface Node {
  type: string
  value?: string
  name?: string
  children?: Node[]
  data?: { hProperties?: Record<string, string> }
}

const t = (value: string): Node => ({ type: 'text', value })
const p = (...children: Node[]): Node => ({ type: 'paragraph', children })
const item = (...children: Node[]): Node => ({ type: 'containerDirective', name: 'item', children })
const plain = (node: Node): string => node.value ?? (node.children ?? []).map(plain).join('')

function run(node: Node): Node[] {
  transformChatMessages({ type: 'root', children: [node] })
  return node.children ?? []
}

/** `CHAT[label|index:text ; …]` for a chat thread, `P:text` for anything else. */
function summary(nodes: Node[]): string[] {
  return nodes.map((node) =>
    node.type === 'chatThread'
      ? `CHAT[${(node.children ?? []).map((message) => `${message.data?.hProperties?.chatLabel}|${message.data?.hProperties?.chatIndex}:${(message.children ?? []).map(plain).join('¶')}`).join(' ; ')}]`
      : `P:${plain(node)}`,
  )
}

describe('transformChatMessages', () => {
  it('turns consecutive سوال/جواب lines into bubbles and keeps text outside the parentheses as normal text', () => {
    const kids = run(item(p(t('سوال1 : (سلام چطوری؟)\nجواب1 : (خوبم ممنون)\nج2: (باشه)\nاین بیرون پرانتز است'))))
    expect(summary(kids)).toEqual(['CHAT[سوال ۱|0:سلام چطوری؟ ; جواب ۱|1:خوبم ممنون ; جواب ۲|2:باشه]', 'P:این بیرون پرانتز است'])
  })

  it('understands the short markers س1 / ج1, with text before and after', () => {
    const kids = run(item(p(t('مقدمه\nس1 : (اول)\nج1 : (دوم) توضیح بعدی'))))
    expect(summary(kids)).toEqual(['P:مقدمه', 'CHAT[سوال ۱|0:اول ; جواب ۱|1:دوم]', 'P:توضیح بعدی'])
  })

  it('does not end a bubble at a nested parenthesis, an honorific or a list number', () => {
    const kids = run(item(p(t('سوال: (آیا پیامبر (ص) گفت؟)\nج: (دلایل: ۱) الف ۲) ب)'))))
    expect(summary(kids)).toEqual(['CHAT[سوال|0:آیا پیامبر (ص) گفت؟ ; جواب|1:دلایل: ۱) الف ۲) ب]'])
  })

  it('keeps inline formatting inside the bubble', () => {
    const strong: Node = { type: 'strong', children: [t('مهم')] }
    const kids = run(item(p(t('جواب : (این '), strong, t(' است)'))))
    expect(plain(kids[0].children?.[0] as Node)).toBe('این مهم است')
  })

  it('lets one answer span several paragraphs and a list', () => {
    const list: Node = { type: 'list', children: [{ type: 'listItem', children: [p(t('مورد'))] }] }
    const kids = run(item(p(t('ج1 : (پاراگراف اول')), p(t('پاراگراف دوم')), list, p(t('پایان)')), p(t('بعد از چت'))))
    expect(summary(kids)).toEqual(['CHAT[جواب ۱|0:پاراگراف اول¶پاراگراف دوم¶مورد¶پایان]', 'P:بعد از چت'])
  })

  it('leaves the item exactly as written when a parenthesis is never closed', () => {
    const unclosed = item(p(t('س1 : (بدون بسته')), p(t('ادامه')))
    const before = JSON.stringify(unclosed)
    run(unclosed)
    expect(JSON.stringify(unclosed)).toBe(before)
  })

  it('leaves ordinary items and look-alike text alone', () => {
    const normal = item(p(t('این یک متن عادی است. ج را ببین: (نه) و سوال هم هست')))
    const before = JSON.stringify(normal)
    run(normal)
    expect(JSON.stringify(normal)).toBe(before)
  })

  it('does not touch a modal inside the item', () => {
    const modal: Node = { type: 'containerDirective', name: 'modal', children: [p(t('ج1 : (این داخل مودال است)'))] }
    const kids = run(item(p(t('س1 : (سوال)')), modal))
    expect(kids[1]).toBe(modal)
    expect(plain(modal)).toBe('ج1 : (این داخل مودال است)')
  })

  it('only treats a marker at the start of a line as a bubble', () => {
    const kids = run(item(p(t('متن سوال1 : (نه)\nولی\nج : (بله)'))))
    expect(summary(kids)).toEqual(['P:متن سوال1 : (نه)\nولی', 'CHAT[جواب|0:بله]'])
  })
})
