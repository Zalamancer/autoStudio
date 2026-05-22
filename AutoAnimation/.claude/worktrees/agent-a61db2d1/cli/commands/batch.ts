/**
 * `proanimate batch` command: renders multiple videos from CSV or JSON input.
 */

import type { Command } from 'commander'
import ora from 'ora'
import fs from 'node:fs'
import path from 'node:path'
import { loadConfig } from '../lib/config.js'
import { ProAnimateApiClient } from '../lib/apiClient.js'
import { printError } from '../lib/display.js'

interface BatchRow {
  prompt: string
  aspect?: string
  duration?: string
  output?: string
}

function parseCSV(content: string): BatchRow[] {
  const lines = content.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
  const rows: BatchRow[] = []

  for (let i = 1; i < lines.length; i++) {
    // Simple CSV parsing (handles quoted fields)
    const values: string[] = []
    let current = ''
    let inQuotes = false
    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())

    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = values[idx] || ''
    })

    if (row.prompt) {
      rows.push(row as unknown as BatchRow)
    }
  }

  return rows
}

export function registerBatchCommand(program: Command): void {
  program
    .command('batch')
    .description('Render multiple videos from CSV or JSON input')
    .option('--csv <path>', 'CSV file with prompt/settings columns')
    .option('--json <path>', 'JSON array file with prompt/settings objects')
    .option('--output <dir>', 'Output directory', './renders')
    .option('--concurrency <n>', 'Number of parallel jobs', '2')
    .option('--format <format>', 'Output format (mp4 or webm)', 'mp4')
    .action(async (opts) => {
      try {
        let rows: BatchRow[] = []

        if (opts.csv) {
          const content = fs.readFileSync(opts.csv, 'utf-8')
          rows = parseCSV(content)
        } else if (opts.json) {
          const content = fs.readFileSync(opts.json, 'utf-8')
          rows = JSON.parse(content)
        } else {
          printError('Provide --csv or --json input file.')
          process.exit(1)
        }

        if (rows.length === 0) {
          printError('No valid rows found in input file.')
          process.exit(1)
        }

        const config = await loadConfig({ format: opts.format })

        if (!config.apiKey) {
          printError('No API key configured. Run `proanimate auth set-key <key>` or set PROANIMATE_API_KEY.')
          process.exit(2)
        }

        // Ensure output directory exists
        const outputDir = path.resolve(opts.output)
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true })
        }

        const client = new ProAnimateApiClient(config)
        const concurrency = parseInt(opts.concurrency) || 2
        const spinner = ora(`Batch rendering ${rows.length} videos (concurrency: ${concurrency})...`).start()

        let completed = 0
        let failed = 0

        // Process in batches of concurrency
        for (let i = 0; i < rows.length; i += concurrency) {
          const batch = rows.slice(i, i + concurrency)

          const promises = batch.map(async (row, batchIdx) => {
            const _idx = i + batchIdx
            const slug = row.prompt
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '')
              .slice(0, 40)
            const outputPath = path.join(outputDir, `${slug}.${opts.format}`)

            try {
              // Submit job
              const job = await client.post<{ jobId: string }>('/api/v1/renders', {
                prompt: row.prompt,
                settings: {
                  aspectRatio: row.aspect || '9:16',
                  durationSeconds: row.duration ? parseInt(row.duration) : undefined,
                },
              })

              // Poll for completion
              const result = await client.pollRenderJob(job.jobId)

              if (result.status === 'complete') {
                await client.download(`/api/v1/renders/${job.jobId}/download`, outputPath)
                completed++
                spinner.text = `[${completed + failed}/${rows.length}] Completed: ${slug}`
              } else {
                failed++
                spinner.text = `[${completed + failed}/${rows.length}] Failed: ${slug} - ${result.error}`
              }
            } catch {
              failed++
              spinner.text = `[${completed + failed}/${rows.length}] Failed: ${slug}`
            }
          })

          await Promise.all(promises)
        }

        if (failed === 0) {
          spinner.succeed(`Batch complete: ${completed}/${rows.length} rendered to ${outputDir}`)
        } else {
          spinner.warn(`Batch complete: ${completed} succeeded, ${failed} failed out of ${rows.length}`)
        }

        process.exit(failed > 0 ? 1 : 0)
      } catch (err) {
        printError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })
}
