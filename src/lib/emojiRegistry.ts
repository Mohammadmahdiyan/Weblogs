import registry from '../emojis/emojis.json'

/** `{name}` → svg file name inside src/emojis/. Edit src/emojis/emojis.json to add more. */
export const emojiFiles: Readonly<Record<string, string>> = registry

export function isEmoji(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(emojiFiles, name.trim())
}

export function emojiFile(name: string): string | undefined {
  return isEmoji(name) ? emojiFiles[name.trim()] : undefined
}
