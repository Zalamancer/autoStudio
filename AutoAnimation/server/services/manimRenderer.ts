/**
 * Agent 4 — Manim Renderer
 *
 * Renders ManimCE Python code by writing it to a temp file and invoking
 * the `manim` CLI (either local install or Docker). Tracks render jobs
 * in a Map-based cache and copies finished videos to a served directory.
 */

import { exec } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import crypto from 'node:crypto'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RenderResult {
  jobId: string
  videoPath: string
  thumbnailPath?: string
  durationSeconds: number
}

export interface RenderJobStatus {
  jobId: string
  status: 'queued' | 'rendering' | 'completed' | 'failed'
  videoUrl?: string
  thumbnailUrl?: string
  error?: string
  startedAt: number
  completedAt?: number
}

// ---------------------------------------------------------------------------
// Job cache
// ---------------------------------------------------------------------------

const _jobs = new Map<string, RenderJobStatus>()

/** Max jobs to keep in cache before pruning oldest completed ones. */
const MAX_CACHED_JOBS = 200

function pruneJobs(): void {
  if (_jobs.size <= MAX_CACHED_JOBS) return
  const completed = Array.from(_jobs.entries())
    .filter(([, j]) => j.status === 'completed' || j.status === 'failed')
    .sort((a, b) => (a[1].completedAt || 0) - (b[1].completedAt || 0))
  const toRemove = completed.slice(0, _jobs.size - MAX_CACHED_JOBS)
  for (const [id] of toRemove) {
    _jobs.delete(id)
  }
}

// ---------------------------------------------------------------------------
// Output directory — rendered videos are copied here so Express can serve them
// ---------------------------------------------------------------------------

const OUTPUT_DIR = path.join(os.tmpdir(), 'proanimate-manim-renders')

function ensureOutputDir(): void {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }
}

// ---------------------------------------------------------------------------
// Availability check
// ---------------------------------------------------------------------------

/**
 * Check whether the `manim` CLI is available on the system.
 * Returns true if the command exists and responds to --version.
 */
export async function isManimAvailable(): Promise<boolean> {
  return new Promise(resolve => {
    exec('manim --version', { timeout: 10000 }, (error) => {
      resolve(!error)
    })
  })
}

// ---------------------------------------------------------------------------
// Render a Manim scene
// ---------------------------------------------------------------------------

/**
 * Write Python code to a temp file and invoke `manim render` on it.
 *
 * @param code       Complete ManimCE Python source
 * @param className  The Scene subclass name (e.g. "Scene0")
 * @param quality    Render quality: l = 480p, m = 720p, h = 1080p
 * @returns          Paths to the rendered video and optional thumbnail
 */
export async function renderManimScene(
  code: string,
  className: string,
  quality: 'l' | 'm' | 'h' = 'm'
): Promise<RenderResult> {
  ensureOutputDir()

  const jobId = crypto.randomUUID()
  const tmpDir = path.join(os.tmpdir(), `manim-${jobId}`)
  fs.mkdirSync(tmpDir, { recursive: true })

  const pyFile = path.join(tmpDir, `${className}.py`)
  fs.writeFileSync(pyFile, code, 'utf-8')

  // Register job
  _jobs.set(jobId, {
    jobId,
    status: 'rendering',
    startedAt: Date.now(),
  })
  pruneJobs()

  console.log(`[manimRenderer] Job ${jobId}: rendering ${className} at quality=${quality}`)

  try {
    // Manim writes output to media/ subdirectory by default
    const mediaDir = path.join(tmpDir, 'media')
    const cmd = `manim render -q${quality} --media_dir "${mediaDir}" "${pyFile}" ${className}`

    await execPromise(cmd, { cwd: tmpDir, timeout: 120_000 })

    // Find the output video — Manim puts it in media/videos/<filename>/<quality>/
    const videoPath = findRenderedVideo(mediaDir, className)
    if (!videoPath) {
      throw new Error('Render completed but no output video found')
    }

    // Copy to served output directory
    const ext = path.extname(videoPath)
    const outputFilename = `${jobId}${ext}`
    const outputPath = path.join(OUTPUT_DIR, outputFilename)
    fs.copyFileSync(videoPath, outputPath)

    // Try to find a thumbnail (last frame image) — Manim generates images/ dir with -s flag
    // For now, thumbnail is optional and we skip it
    let thumbnailPath: string | undefined

    // Estimate duration from quality (rough — actual duration comes from spec)
    const durationSeconds = estimateDuration(code)

    const result: RenderResult = {
      jobId,
      videoPath: outputPath,
      thumbnailPath,
      durationSeconds,
    }

    // Update job status
    _jobs.set(jobId, {
      jobId,
      status: 'completed',
      videoUrl: `/api/manim/output/${outputFilename}`,
      thumbnailUrl: thumbnailPath ? `/api/manim/output/${path.basename(thumbnailPath)}` : undefined,
      startedAt: _jobs.get(jobId)!.startedAt,
      completedAt: Date.now(),
    })

    console.log(`[manimRenderer] Job ${jobId}: completed — ${outputPath}`)

    // Clean up temp dir (keep output dir)
    cleanupTmpDir(tmpDir)

    return result
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[manimRenderer] Job ${jobId}: failed —`, message)

    _jobs.set(jobId, {
      jobId,
      status: 'failed',
      error: message,
      startedAt: _jobs.get(jobId)!.startedAt,
      completedAt: Date.now(),
    })

    // Clean up temp dir on failure too
    cleanupTmpDir(tmpDir)

    throw err
  }
}

// ---------------------------------------------------------------------------
// Async render (fire-and-forget, check status via jobId)
// ---------------------------------------------------------------------------

/**
 * Start a render job asynchronously. Returns the jobId immediately.
 * The caller can poll getManimRenderStatus() for progress.
 */
export function startManimRenderAsync(
  code: string,
  className: string,
  quality: 'l' | 'm' | 'h' = 'm'
): string {
  const jobId = crypto.randomUUID()

  _jobs.set(jobId, {
    jobId,
    status: 'queued',
    startedAt: Date.now(),
  })
  pruneJobs()

  // Fire and forget — renders in background
  renderManimSceneInternal(jobId, code, className, quality).catch(err => {
    console.error(`[manimRenderer] Async job ${jobId} failed:`, err)
  })

  return jobId
}

/** Internal async render that updates the job cache. */
async function renderManimSceneInternal(
  jobId: string,
  code: string,
  className: string,
  quality: 'l' | 'm' | 'h'
): Promise<void> {
  ensureOutputDir()

  const tmpDir = path.join(os.tmpdir(), `manim-${jobId}`)
  fs.mkdirSync(tmpDir, { recursive: true })

  const pyFile = path.join(tmpDir, `${className}.py`)
  fs.writeFileSync(pyFile, code, 'utf-8')

  _jobs.set(jobId, {
    ..._jobs.get(jobId)!,
    status: 'rendering',
  })

  console.log(`[manimRenderer] Async job ${jobId}: rendering ${className} at quality=${quality}`)

  try {
    const mediaDir = path.join(tmpDir, 'media')
    const cmd = `manim render -q${quality} --media_dir "${mediaDir}" "${pyFile}" ${className}`

    await execPromise(cmd, { cwd: tmpDir, timeout: 120_000 })

    const videoPath = findRenderedVideo(mediaDir, className)
    if (!videoPath) {
      throw new Error('Render completed but no output video found')
    }

    const ext = path.extname(videoPath)
    const outputFilename = `${jobId}${ext}`
    const outputPath = path.join(OUTPUT_DIR, outputFilename)
    fs.copyFileSync(videoPath, outputPath)

    _jobs.set(jobId, {
      jobId,
      status: 'completed',
      videoUrl: `/api/manim/output/${outputFilename}`,
      startedAt: _jobs.get(jobId)!.startedAt,
      completedAt: Date.now(),
    })

    console.log(`[manimRenderer] Async job ${jobId}: completed`)
    cleanupTmpDir(tmpDir)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    _jobs.set(jobId, {
      jobId,
      status: 'failed',
      error: message,
      startedAt: _jobs.get(jobId)!.startedAt,
      completedAt: Date.now(),
    })
    cleanupTmpDir(tmpDir)
  }
}

// ---------------------------------------------------------------------------
// Job status
// ---------------------------------------------------------------------------

/**
 * Get the status of a render job by its ID.
 */
export function getManimRenderStatus(jobId: string): RenderJobStatus | null {
  return _jobs.get(jobId) || null
}

/**
 * Get the output directory path (for Express static serving).
 */
export function getManimOutputDir(): string {
  ensureOutputDir()
  return OUTPUT_DIR
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Promisified exec with configurable timeout. */
function execPromise(
  cmd: string,
  options: { cwd?: string; timeout?: number } = {}
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    exec(cmd, { maxBuffer: 10 * 1024 * 1024, ...options }, (error, stdout, stderr) => {
      if (error) {
        // Include stderr in the error for debugging
        const fullMessage = `${error.message}\n--- stderr ---\n${stderr}`
        reject(new Error(fullMessage))
      } else {
        resolve({ stdout, stderr })
      }
    })
  })
}

/**
 * Find the rendered video file in Manim's output directory structure.
 * Manim outputs to: media/videos/<filename>/<quality>/<ClassName>.mp4
 */
function findRenderedVideo(mediaDir: string, className: string): string | null {
  if (!fs.existsSync(mediaDir)) return null

  // Walk the media/videos directory tree to find the .mp4
  const videosDir = path.join(mediaDir, 'videos')
  if (!fs.existsSync(videosDir)) return null

  // Recursively search for <ClassName>.mp4
  const found = findFileRecursive(videosDir, `${className}.mp4`)
  return found
}

/** Recursively search a directory for a file with the given name. */
function findFileRecursive(dir: string, filename: string): string | null {
  if (!fs.existsSync(dir)) return null

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      const result = findFileRecursive(fullPath, filename)
      if (result) return result
    } else if (entry.name === filename) {
      return fullPath
    }
  }
  return null
}

/** Rough duration estimate by counting self.wait and self.play run_time values in code. */
function estimateDuration(code: string): number {
  let total = 0

  // Match self.wait(X) calls
  const waitMatches = code.matchAll(/self\.wait\(([0-9.]+)\)/g)
  for (const m of waitMatches) {
    total += parseFloat(m[1]) || 0
  }

  // Match run_time=X in self.play() calls
  const runTimeMatches = code.matchAll(/run_time\s*=\s*([0-9.]+)/g)
  for (const m of runTimeMatches) {
    total += parseFloat(m[1]) || 0
  }

  // Default self.play() without run_time defaults to 1 second
  const playMatches = code.matchAll(/self\.play\([^)]*\)/g)
  for (const m of playMatches) {
    if (!m[0].includes('run_time')) {
      total += 1
    }
  }

  return total || 5 // Fallback to 5 seconds
}

/** Clean up a temp directory (fire-and-forget). */
function cleanupTmpDir(dir: string): void {
  try {
    fs.rmSync(dir, { recursive: true, force: true })
  } catch {
    // Ignore cleanup errors
  }
}
