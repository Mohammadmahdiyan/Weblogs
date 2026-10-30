import { execFile } from 'node:child_process'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

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


export function rewriteMediaUrl(
  value: string,
  slug: string,
  mediaFiles: MediaFile[],
  base = '/',
): string {
  const suffixIndex = value.search(/[?#]/)
  const pathname = suffixIndex === -1 ? value : value.slice(0, suffixIndex)
  const suffix = suffixIndex === -1 ? '' : value.slice(suffixIndex)

  if (!pathname || isAbsoluteUrl(pathname)) return value

  const normalizedPath = normalizeMediaPath(pathname)
  if (!normalizedPath || normalizedPath === '.') return value

  const isArticleMedia = mediaFiles.some(
    (media) => media.relativePath.toLowerCase() === normalizedPath.toLowerCase(),
  )

  if (!isArticleMedia && !coverTypeFor(pathname)) return value

  const normalizedBase = base.replace(/^\/+|\/+$/g, '')
  const prefix = normalizedBase ? `/${normalizedBase}` : ''

  return `${prefix}/content/${encodeURIComponent(slug)}/${encodeMediaPath(normalizedPath)}${suffix}`
}



/** Audio codecs every mainstream browser plays inside mp4 / webm / ogv. */
const browserSafeAudioCodecs = new Set(['aac', 'mp3', 'opus', 'vorbis', 'flac'])

/**
 * Dev-time sanity check for a video file: returns a warning when it has no audio track at all, or an audio
 * codec browsers cannot decode (AC-3, DTS, PCM …), which plays silently. Needs `ffprobe` (ships with ffmpeg);
 * if it is not installed the check is silently skipped. Never throws.
 */
export async function videoAudioWarning(filePath: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=codec_name', '-of', 'csv=p=0', filePath,
    ], { timeout: 15_000 })
    const codecs = stdout.split(/\r?\n/).map((line) => line.trim().toLowerCase()).filter(Boolean)
    if (codecs.length === 0) return 'has no audio track (the file itself is silent)'
    if (!codecs.some((codec) => browserSafeAudioCodecs.has(codec))) {
      return `audio codec "${codecs.join(', ')}" is not playable in browsers (re-encode to AAC)`
    }
    return null
  } catch {
    return null
  }
}
