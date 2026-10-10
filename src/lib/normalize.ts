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