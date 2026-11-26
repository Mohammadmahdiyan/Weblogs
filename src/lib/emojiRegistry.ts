import { emojis } from '../emojis/emojis.ts'
import { emojiKey } from './inline.ts'

/** emoji (written bare or as `{emoji}`) → svg file name inside src/emojis/. Edit src/emojis/emojis.ts to add more. */
export const emojiFiles: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(emojis).map(([emoji, file]) => [emojiKey(emoji), file]),
)

export function isEmoji(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(emojiFiles, emojiKey(name))
}

export function emojiFile(name: string): string | undefined {
  return isEmoji(name) ? emojiFiles[emojiKey(name)] : undefined
}
