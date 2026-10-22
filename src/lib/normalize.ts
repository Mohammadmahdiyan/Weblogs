const digitMap = new Map<string, string>([
  ...Array.from({ length: 10 }, (_unused, digit) => [String.fromCharCode(0x0660 + digit), String(digit)] as const),
  ...Array.from({ length: 10 }, (_unused, digit) => [String.fromCharCode(0x06f0 + digit), String(digit)] as const),
])

export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/[\u064b-\u065f\u0670\u0640]/g, '')
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[\u200b-\u200f\ufeff]/g, '')
    .replace(/[\u0660-\u0669\u06f0-\u06f9]/g, (digit) => digitMap.get(digit) ?? digit)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

export interface NormalizedText {
  /** Same text `normalizeSearchText` produces. */
  text: string
  /** `map[i]` = index in the ORIGINAL string of the character that produced `text[i]`. */
  map: number[]
}

function foldCharacter(character: string): string {
  return character
    .normalize('NFKC')
    .replace(/[\u064b-\u065f\u0670\u0640]/g, '')
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[\u200b-\u200f\ufeff]/g, '')
    .replace(/[\u0660-\u0669\u06f0-\u06f9]/g, (digit) => digitMap.get(digit) ?? digit)
    .toLowerCase()
}

/**
 * Like `normalizeSearchText`, but also remembers where every normalized character came from.
 * Normalizing changes the length of a text (ZWNJ, diacritics and repeated spaces disappear), so an index
 * found in the normalized text must be mapped back before it is used on the original text.
 */
export function normalizeWithMap(value: string): NormalizedText {
  let text = ''
  const map: number[] = []
  let spaceAt = -1
  let position = 0

  for (const character of value) {
    const start = position
    position += character.length
    for (const folded of foldCharacter(character)) {
      if (/\s/u.test(folded)) {
        if (text && spaceAt < 0) spaceAt = start
        continue
      }
      if (spaceAt >= 0) {
        text += ' '
        map.push(spaceAt)
        spaceAt = -1
      }
      text += folded
      // One entry per UTF-16 unit, so indexes into `text` and `map` always agree (emoji take two units).
      for (let unit = 0; unit < folded.length; unit++) map.push(start)
    }
  }
  return { text, map }
}
