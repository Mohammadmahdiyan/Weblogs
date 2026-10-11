import { describe, expect, it } from 'vitest'
import { normalizeSearchText } from './normalize'

describe('normalizeSearchText integration with suggestions matching', () => {
  const suggestions = [
    'آیا پیامبر ص با دختر 6 ساله ازدواج کرد',
    'ازدواج پیامبر ص با دختر 6 ساله',
    'دلیل ازدواج پیامبر ص با مادر عایشه رض',
  ]

  it('matches exact suggestion after normalization', () => {
    const userQuery = 'آیا پیامبر ص با دختر ۶ ساله ازدواج کرد'
    const normalizedQuery = normalizeSearchText(userQuery)
    const matches = suggestions.filter((s) => normalizeSearchText(s) === normalizedQuery)
    expect(matches.length).toBeGreaterThan(0)
    expect(matches[0]).toBe('آیا پیامبر ص با دختر 6 ساله ازدواج کرد')
  })

  it('matches suggestion with Arabic-Indic digits', () => {
    const userQuery = 'ازدواج پیامبر ص با دختر ٦ ساله'
    const normalizedQuery = normalizeSearchText(userQuery)
    const matches = suggestions.filter((s) => normalizeSearchText(s) === normalizedQuery)
    expect(matches).toContain('ازدواج پیامبر ص با دختر 6 ساله')
  })

  it('normalizes ك/ک differences', () => {
    const userQuery = 'آیا پیامبر ص با دختر ۶ ساله ازدواج كرد'
    const normalizedQuery = normalizeSearchText(userQuery)
    const matches = suggestions.filter((s) => normalizeSearchText(s) === normalizedQuery)
    expect(matches.length).toBeGreaterThan(0)
  })
})
