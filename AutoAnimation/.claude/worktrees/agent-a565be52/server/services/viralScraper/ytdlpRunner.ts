/**
 * yt-dlp CLI wrapper using child_process.execFile (no shell injection).
 * Handles metadata extraction, comment fetching, and video download.
 */

import { execFile } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'

const YT_DLP_BIN = process.env.YT_DLP_PATH || 'yt-dlp'

/** Run yt-dlp with given args, returning stdout */
function run(args: string[], timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(YT_DLP_BIN, args, { timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        const msg = stderr?.trim() || err.message
        reject(new Error(`yt-dlp error: ${msg}`))
        return
      }
      resolve(stdout)
    })
  })
}

/** Raw JSON metadata from yt-dlp --dump-json */
export interface YtDlpMetadata {
  id: string
  title: string
  description: string | null
  uploader: string | null
  uploader_id: string | null
  channel: string | null
  channel_id: string | null
  channel_follower_count: number | null
  uploader_url: string | null
  thumbnail: string | null
  thumbnails: Array<{ url: string; width?: number; height?: number }> | null
  duration: number | null
  view_count: number | null
  like_count: number | null
  comment_count: number | null
  repost_count: number | null
  width: number | null
  height: number | null
  webpage_url: string
  extractor: string
  extractor_key: string
  upload_date: string | null
  track: string | null
  artist: string | null
  tags: string[] | null
  categories: string[] | null
  language: string | null
  [key: string]: unknown
}

export interface YtDlpComment {
  id: string
  text: string
  author: string
  author_id?: string
  like_count: number
  timestamp: number | null
  parent?: string
}

/**
 * Get video metadata without downloading.
 * Runs: yt-dlp --dump-json --no-download <url>
 */
export async function getVideoInfo(url: string): Promise<YtDlpMetadata> {
  const stdout = await run([
    '--dump-json',
    '--no-download',
    '--no-warnings',
    '--no-playlist',
    url,
  ], 60_000)

  return JSON.parse(stdout.trim())
}

/**
 * Get comments for a video.
 * Runs yt-dlp with --write-comments and extracts from the info JSON.
 */
export async function getComments(url: string, maxComments = 100): Promise<YtDlpComment[]> {
  const stdout = await run([
    '--dump-json',
    '--no-download',
    '--no-warnings',
    '--no-playlist',
    '--write-comments',
    '--extractor-args', `youtube:max_comments=${maxComments}`,
    url,
  ], 90_000)

  const data = JSON.parse(stdout.trim())
  const comments: YtDlpComment[] = (data.comments || []).map((c: Record<string, unknown>) => ({
    id: String(c.id || ''),
    text: String(c.text || ''),
    author: String(c.author || 'Unknown'),
    author_id: c.author_id ? String(c.author_id) : undefined,
    like_count: typeof c.like_count === 'number' ? c.like_count : 0,
    timestamp: typeof c.timestamp === 'number' ? c.timestamp : null,
    parent: c.parent === 'root' ? undefined : c.parent ? String(c.parent) : undefined,
  }))

  return comments
}

/**
 * Download a video file.
 * Runs: yt-dlp -f "best[height<=1080]" -o "<dir>/<id>.%(ext)s" <url>
 */
export async function downloadVideo(url: string, outputDir: string): Promise<string> {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const outputTemplate = path.join(outputDir, '%(id)s.%(ext)s')

  await run([
    '-f', 'best[height<=1080]/best',
    '-o', outputTemplate,
    '--no-warnings',
    '--no-playlist',
    url,
  ], 5 * 60_000) // 5 minute timeout

  // Find the downloaded file
  const files = fs.readdirSync(outputDir)
  if (files.length === 0) {
    throw new Error('Download completed but no file found')
  }

  return path.join(outputDir, files[0])
}

/**
 * Extract auto-subtitles as plain text.
 * Downloads VTT subtitle file, parses it, and returns deduplicated text.
 * Returns null if no subtitles are available.
 */
export async function extractSubtitles(url: string, lang = 'en'): Promise<{ text: string; source: 'subtitles' } | null> {
  const tmpDir = path.join(require('node:os').tmpdir(), `ytdlp-subs-${Date.now()}`)
  fs.mkdirSync(tmpDir, { recursive: true })

  try {
    await run([
      '--write-auto-sub',
      '--sub-lang', lang,
      '--skip-download',
      '--sub-format', 'vtt',
      '-o', path.join(tmpDir, '%(id)s'),
      '--no-warnings',
      '--no-playlist',
      url,
    ], 30_000)

    const files = fs.readdirSync(tmpDir).filter((f) => f.endsWith('.vtt'))
    if (files.length > 0) {
      const vttContent = fs.readFileSync(path.join(tmpDir, files[0]), 'utf-8')
      const text = parseVTT(vttContent)
      if (text.trim().length > 10) {
        return { text, source: 'subtitles' }
      }
    }
  } catch {
    // Subtitle extraction failed
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }

  return null
}

/**
 * Download audio only as mp3. Returns the file path, or null on failure.
 * Caller is responsible for cleaning up the output directory.
 */
export async function downloadAudio(url: string, outputDir: string): Promise<string | null> {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  try {
    await run([
      '-x',
      '--audio-format', 'mp3',
      '--audio-quality', '5',
      '-o', path.join(outputDir, '%(id)s.%(ext)s'),
      '--no-warnings',
      '--no-playlist',
      url,
    ], 120_000)

    const files = fs.readdirSync(outputDir).filter((f) =>
      f.endsWith('.mp3') || f.endsWith('.m4a') || f.endsWith('.opus'),
    )
    return files.length > 0 ? path.join(outputDir, files[0]) : null
  } catch {
    return null
  }
}

/** Parse WebVTT content into deduplicated plain text */
function parseVTT(vtt: string): string {
  const lines = vtt.split('\n')
  const textLines: string[] = []
  const seen = new Set<string>()

  for (const line of lines) {
    const trimmed = line.trim()
    if (
      !trimmed ||
      trimmed === 'WEBVTT' ||
      trimmed.includes('-->') ||
      /^\d+$/.test(trimmed) ||
      trimmed.startsWith('NOTE') ||
      trimmed.startsWith('Kind:') ||
      trimmed.startsWith('Language:')
    ) {
      continue
    }
    const clean = trimmed.replace(/<[^>]+>/g, '').trim()
    if (clean && !seen.has(clean)) {
      seen.add(clean)
      textLines.push(clean)
    }
  }

  return textLines.join(' ')
}

/**
 * Check if yt-dlp is installed and accessible.
 */
export async function isAvailable(): Promise<boolean> {
  try {
    await run(['--version'], 5_000)
    return true
  } catch {
    return false
  }
}

/**
 * Get yt-dlp version string.
 */
export async function getVersion(): Promise<string> {
  const stdout = await run(['--version'], 5_000)
  return stdout.trim()
}
