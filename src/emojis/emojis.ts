/**
 * Emoji available in articles. Write `{name}` in Markdown and the matching svg of this folder is shown inline.
 *
 * To add one: put `file.svg` next to this file and add a line `'name': 'file.svg',` below.
 * Only the names listed here are replaced; any other `{text}` stays as written.
 */
export const emojis: Readonly<Record<string, string>> = {
  'خخخ': 'funnyface.svg',
  'لبخند': 'smile.svg',
  'چشمک': 'wink.svg',
  'باحال': 'cool.svg',
  'تعجب': 'wow.svg',
  'گریه': 'cry.svg',
  'عصبانی': 'angry.svg',
  'قلب': 'heart.svg',
}
