import { describe, expect, it } from 'vitest'
import { FOLLOW_UP_MESSAGES, fillTitle, followUpUrl, pickIndex, telegramUsername, unlockUrl } from '../src/lib/followUp.ts'

describe('follow-up messages', () => {
  it('has 25 short messages that all mention the article title', () => {
    expect(FOLLOW_UP_MESSAGES).toHaveLength(25)
    for (const message of FOLLOW_UP_MESSAGES) {
      expect(message).toContain('{title}')
      expect(message.length).toBeLessThan(160)
    }
    expect(new Set(FOLLOW_UP_MESSAGES).size).toBe(25)
  })

  it('puts the article title into the message', () => {
    expect(fillTitle('مقاله «{title}» کی کامل میشه؟', 'نقد کتاب')).toBe('مقاله «نقد کتاب» کی کامل میشه؟')
  })
})

describe('telegramUsername', () => {
  it('reads the username from the first Telegram link', () => {
    expect(telegramUsername([{ href: 'https://example.com/x' }, { href: 'https://t.me/Rasoolallah_s_is_best' }])).toBe('Rasoolallah_s_is_best')
    expect(telegramUsername([{ href: 'https://telegram.me/some_user/' }])).toBe('some_user')
  })

  it('returns null when there is no Telegram profile link', () => {
    expect(telegramUsername([{ href: 'https://instagram.com/x' }])).toBeNull()
    expect(telegramUsername([])).toBeNull()
  })
})

describe('followUpUrl', () => {
  it('opens the chat with the message typed in', () => {
    const url = followUpUrl('some_user', 'سلام «{title}»', 'نقد کتاب')
    expect(url).toBe(`https://t.me/some_user?text=${encodeURIComponent('سلام «نقد کتاب»')}`)
  })
})

describe('pickIndex', () => {
  it('never repeats the previous message', () => {
    for (let index = 0; index < 25; index++) {
      for (const random of [0, 0.3, 0.999]) expect(pickIndex(25, index, () => random)).not.toBe(index)
    }
  })

  it('stays in range', () => {
    expect(pickIndex(25, null, () => 0.9999)).toBe(24)
    expect(pickIndex(1, 0)).toBe(0)
  })
})

describe('unlockUrl', () => {
  it('opens the author chat with the page address in the message', () => {
    const url = unlockUrl('someone', 'https://example.com/blog/secret')
    expect(url.startsWith('https://t.me/someone?text=')).toBe(true)
    expect(decodeURIComponent(url)).toContain('https://example.com/blog/secret')
  })
})
