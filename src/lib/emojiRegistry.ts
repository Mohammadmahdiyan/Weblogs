import { emojis } from '../emojis/emojis.ts'

/** `{name}` → svg file name inside src/emojis/. Edit src/emojis/emojis.ts to add more. */
export const emojiFiles: Readonly<Record<string, string>> = emojis

export function isEmoji(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(emojiFiles, name.trim())
}

export function emojiFile(name: string): string | undefined {
  return isEmoji(name) ? emojiFiles[name.trim()] : undefined
}
