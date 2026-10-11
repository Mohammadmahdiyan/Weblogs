/*
  Small, dependency-free frontmatter validators. They return the validated value
  or throw an Error whose message starts with the offending file path, so the
  build fails with a readable message (and is easy to unit-test).
*/

export function validationError(filePath: string, message: string): Error {
  return new Error(`${filePath}: ${message}`)
}

/** `coverEmbed` must be an https:// URL string (or absent). */
export function validateCoverEmbed(value: unknown, filePath: string): string | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'string' || !/^https:\/\/\S+$/i.test(value.trim())) {
    throw validationError(filePath, '"coverEmbed" must be a URL starting with https://')
  }
  return value.trim()
}

/** Optional BCP-47-ish language tag such as `en`, `ar`, `fa`, `en-US`. */
export function validateLang(value: unknown, filePath: string): string | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'string' || !/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(value.trim())) {
    throw validationError(filePath, '"lang" must be a language tag such as "en" or "ar"')
  }
  return value.trim()
}

export function validateDir(value: unknown, filePath: string): 'ltr' | 'rtl' | undefined {
  if (value === undefined) return undefined
  if (value !== 'ltr' && value !== 'rtl') {
    throw validationError(filePath, '"dir" must be "ltr" or "rtl"')
  }
  return value
}

export function validateStyle(value: unknown, filePath: string): number {
  const style = value === undefined ? 1 : value
  if (typeof style !== 'number' || !Number.isInteger(style) || style < 1 || style > 8) {
    throw validationError(filePath, '"style" must be an integer from 1 to 8')
  }
  return style
}
