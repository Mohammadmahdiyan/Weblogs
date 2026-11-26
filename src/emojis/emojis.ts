/**
 * Stickers available in articles. Write the emoji itself (😂) or `{😂}` in Markdown and the matching svg of this
 * folder is shown inline.
 *
 * To add one: put `file.svg` next to this file and add a line `'😂': 'file.svg',` below.
 * Only the emoji listed here are replaced; any other emoji or `{text}` stays as written.
 */
export const emojis: Readonly<Record<string, string>> = {
  '😂': 'funnyface.svg',
  '🤣': 'funnyface.svg',
  '🙂': 'smile.svg',
  '😉': 'wink.svg',
  '😎': 'cool.svg',
  '😮': 'wow.svg',
  '😭': 'cry.svg',
  '😡': 'angry.svg',
  '♥': 'heart.svg',
}
