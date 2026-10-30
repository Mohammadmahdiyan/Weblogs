import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, rename, stat } from 'node:fs/promises'
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
/** Containers whose audio we can swap to AAC while keeping the same file name and extension. */
const remuxableExtensions = new Set(['.mp4', '.m4v', '.mov'])

let ffmpegLookup: Promise<string | null> | undefined

/** The ffmpeg binary: the `ffmpeg-static` package if installed, else `ffmpeg` on PATH, else null. */
function findFfmpeg(): Promise<string | null> {
  ffmpegLookup ??= (async () => {
    try {
      const name = 'ffmpeg-static' // variable specifier: the package is optional
      const mod = (await import(name)) as { default?: unknown }
      const binary = mod.default
      if (typeof binary === 'string') {
        await execFileAsync(binary, ['-version'], { timeout: 15_000 })
        return binary
      }
    } catch {
      // fall through to the system ffmpeg
    }
    try {
      await execFileAsync('ffmpeg', ['-version'], { timeout: 15_000 })
      return 'ffmpeg'
    } catch {
      return null
    }
  })()
  return ffmpegLookup
}

async function audioCodecsOf(ffmpeg: string, filePath: string): Promise<string[]> {
  let report = ''
  try {
    const { stderr } = await execFileAsync(ffmpeg, ['-hide_banner', '-i', filePath], { timeout: 30_000 })
    report = stderr
  } catch (error) {
    // `ffmpeg -i file` with no output always exits non-zero, but still prints the stream list on stderr.
    report = String((error as { stderr?: unknown }).stderr ?? '')
  }
  return [...report.matchAll(/Stream #\S+.*?: Audio: ([\w-]+)/g)].map((match) => match[1].toLowerCase())
}

export interface PreparedVideo {
  /** The file to publish: the original, or an AAC-audio copy kept in the cache folder. */
  filePath: string
  /** A problem or a note worth printing (never fatal). */
  message?: string
}

/**
 * Makes sure a video has sound that browsers can play. Movie files often carry AC-3 / DTS / PCM audio: the
 * picture plays but the sound is silent. For mp4 / m4v / mov such files get a copy with the audio re-encoded
 * to AAC (video untouched, no quality loss) in `cacheDir`; the source file is never modified. Copies are cached
 * by path + size + modified time, so each file is converted only once. Without ffmpeg, or on any failure,
 * the original is used. Never throws.
 */
export async function prepareVideoForBrowser(sourcePath: string, cacheDir: string): Promise<PreparedVideo> {
  try {
    const ffmpeg = await findFfmpeg()
    if (!ffmpeg) return { filePath: sourcePath }

    const codecs = await audioCodecsOf(ffmpeg, sourcePath)
    if (codecs.length === 0) return { filePath: sourcePath, message: 'has no audio track (the file itself is silent)' }
    if (codecs.some((codec) => browserSafeAudioCodecs.has(codec))) return { filePath: sourcePath }

    const extension = path.extname(sourcePath).toLowerCase()
    if (!remuxableExtensions.has(extension)) {
      return { filePath: sourcePath, message: `audio codec "${codecs.join(', ')}" is not playable in browsers; convert the file to mp4 with AAC audio` }
    }

    const info = await stat(sourcePath)
    const key = createHash('sha1').update(`${sourcePath}|${info.size}|${info.mtimeMs}`).digest('hex').slice(0, 16)
    const converted = path.join(cacheDir, `${key}${extension}`)
    if (existsSync(converted)) return { filePath: converted }

    await mkdir(cacheDir, { recursive: true })
    const partial = path.join(cacheDir, `${key}.partial${extension}`)
    await execFileAsync(ffmpeg, [
      '-hide_banner', '-loglevel', 'error', '-y', '-i', sourcePath,
      '-map', '0:v?', '-map', '0:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', partial,
    ], { timeout: 30 * 60_000, maxBuffer: 16 * 1024 * 1024 })
    await rename(partial, converted)
    return { filePath: converted, message: `audio "${codecs.join(', ')}" converted to AAC automatically (original file untouched)` }
  } catch (error) {
    return { filePath: sourcePath, message: `automatic audio conversion failed: ${error instanceof Error ? error.message : String(error)}` }
  }
}
