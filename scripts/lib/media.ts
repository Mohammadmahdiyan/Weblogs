import path from 'node:path'

export type MediaType = 'image' | 'video' | 'audio'

export interface MediaFile {
  sourcePath: string
  relativePath: string
  type: MediaType | null
}

const imageExtensions = new Set([
  '.avif', '.bmp', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp', '.tif', '.tiff',
])
const videoExtensions = new Set([
  '.3gp', '.avi', '.m4v', '.mkv', '.mov', '.mp4', '.mpeg', '.mpg', '.ogv', '.webm',
])
const audioExtensions = new Set([
  '.aac', '.flac', '.m4a', '.mid', '.midi', '.mp3', '.oga', '.ogg', '.opus', '.wav', '.weba',
])

export function coverTypeFor(filePath: string): MediaType | null {
  const extension = path.extname(filePath).toLowerCase()
  if (imageExtensions.has(extension)) return 'image'
  if (videoExtensions.has(extension)) return 'video'
  if (audioExtensions.has(extension)) return 'audio'
  return null
}

export function normalizeMediaPath(value: string): string {
  let decoded = value
  try {
    decoded = decodeURIComponent(value)
  } catch {
    // Keep malformed percent-encoding as a literal filename.
  }

  const normalized = path.posix.normalize(decoded.replace(/\\/g, '/'))
  return normalized.replace(/^(\.\.\/)+/, '').replace(/^\.\//, '')
}

export function encodeMediaPath(value: string): string {
  return value.split('/').map(encodeURIComponent).join('/')
}

export function isAbsoluteUrl(value: string): boolean {
  return value.startsWith('/') || value.startsWith('#') || /^[a-z][a-z\d+.-]*:/i.test(value)
}

export function rewriteMediaUrl(value: string, slug: string, mediaFiles: MediaFile[]): string {
  const suffixIndex = value.search(/[?#]/)
  const pathname = suffixIndex === -1 ? value : value.slice(0, suffixIndex)
  const suffix = suffixIndex === -1 ? '' : value.slice(suffixIndex)

  if (!pathname || isAbsoluteUrl(pathname)) return value

  const normalizedPath = normalizeMediaPath(pathname)
  if (!normalizedPath || normalizedPath === '.') return value
  const isArticleMedia = mediaFiles.some((media) => media.relativePath.toLowerCase() === normalizedPath.toLowerCase())
  if (!isArticleMedia && !coverTypeFor(pathname)) return value
  return `/content/${slug}/${encodeMediaPath(normalizedPath)}${suffix}`
}

