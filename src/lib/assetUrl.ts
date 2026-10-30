/** Turns a path from site.config.ts into a URL: https / data URLs stay as they are, others are relative to `public/`. */
export function assetUrl(value: string): string {
  if (!value) return ''
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value)) return value
  return `${import.meta.env.BASE_URL}${value.replace(/^\/+/, '')}`
}
