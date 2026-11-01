/**
 * Turns a path from site.config.ts into a URL. https / data URLs stay as they are; anything else is a file inside
 * `public/`: write `profile.jpg` for `public/profile.jpg`. Common slips (`/profile.jpg`, `./profile.jpg`,
 * `public/profile.jpg`, `../public/profile.jpg`) are accepted and mean the same file.
 */
export function assetUrl(value: string): string {
  if (!value) return ''
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value)) return value
  const file = value.trim().replace(/^(?:\.{0,2}\/)+/, '').replace(/^public\//, '')
  return `${import.meta.env.BASE_URL}${file}`
}
