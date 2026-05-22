/**
 * `proanimate render` command: renders a single video from a prompt.
 *
 * Cloud mode: calls render API, polls, downloads.
 * Local mode: calls Remotion CLI.
 */

import type { Command } from 'commander'
import ora from 'ora'
import chalk from 'chalk'
import fs from 'node:fs'
import { loadConfig } from '../lib/config.js'
import { ProAnimateApiClient } from '../lib/apiClient.js'
import { renderLocally } from '../lib/localRender.js'
import { printError, formatSize } from '../lib/display.js'

export function registerRenderCommand(program: Command): void {
  program
    .command('render')
    .description('Render a video from a text prompt')
    .requiredOption('--prompt <text>', 'Text prompt describing the video to create')
    .option('--prompt-file <path>', 'Read prompt from a file instead of --prompt')
    .option('--output <path>', 'Output file path', 'output.mp4')
    .option('--format <format>', 'Output format (mp4 or webm)', 'mp4')
    .option('--aspect <ratio>', 'Aspect ratio (9:16, 16:9, 1:1)', '9:16')
    .option('--duration <seconds>', 'Target duration in seconds')
    .option('--settings <json>', 'Additional settings as JSON string')
    .option('--local', 'Use local rendering (requires Remotion + Chromium)')
    .action(async (opts) => {
      try {
        // Resolve prompt
        let prompt = opts.prompt
        if (opts.promptFile) {
          prompt = fs.readFileSync(opts.promptFile, 'utf-8').trim()
        }

        if (!prompt) {
          printError('No prompt provided. Use --prompt or --prompt-file.')
          process.exit(1)
        }

        const config = await loadConfig({
          format: opts.format,
        })

        if (!config.apiKey && !opts.local) {
          printError('No API key configured. Run `proanimate auth set-key <key>` or set PROANIMATE_API_KEY.')
          process.exit(2)
        }

        const settings: Record<string, unknown> = {
          aspectRatio: opts.aspect,
        }
        if (opts.duration) {
          settings.durationSeconds = parseInt(opts.duration)
        }
        if (opts.settings) {
          try {
            Object.assign(settings, JSON.parse(opts.settings))
          } catch {
            printError('Invalid JSON in --settings')
            process.exit(1)
          }
        }

        if (opts.local) {
          // Local rendering mode
          const spinner = ora('Generating plan locally...').start()

          try {
            // For local mode, we would call the orchestrator directly
            // For now, show a message about requirements
            spinner.info('Local rendering requires the ProAnimate project installed with Remotion.')
            spinner.start('Running Remotion render...')

            await renderLocally({
              propsJson: {
                fps: 30,
                width: settings.aspectRatio === '16:9' ? 1920 : 1080,
                height: settings.aspectRatio === '16:9' ? 1080 : 1920,
                character: null,
                audioUrl: null,
                visemeTimeline: [],
                emotionTimeline: [],
                captions: { style: 'word-by-word', position: 'bottom', fontSize: 48, color: '#ffffff', bgOpacity: 0.7, wordTimeline: [], sentenceTimeline: [] },
                animations: [],
                dialogueCharacters: [],
                videos: [],
                mediaItems: [],
                textOverlays: [],
                shapes: [],
                artCurves: [],
                keyframeData: {},
                characters3D: [],
                backgroundAudio: [],
                rigData: [],
                htmlTemplates: [],
                svgComposition: { objects: [], keyframes: {} },
                retentionHooks: [],
                pixelArtCharacters: [],
                avatarCharacters: [],
              },
              outputPath: opts.output,
              format: opts.format,
              onProgress: (line) => {
                spinner.text = line
              },
            })

            spinner.succeed(`Rendered to ${opts.output}`)
          } catch (err) {
            spinner.fail('Local render failed')
            printError(err instanceof Error ? err.message : String(err))
            process.exit(1)
          }
          return
        }

        // Cloud rendering mode
        const client = new ProAnimateApiClient(config)
        const spinner = ora('Submitting render job...').start()

        // Submit job
        const job = await client.post<{ jobId: string; status: string }>('/api/v1/renders', {
          prompt,
          settings,
        })

        spinner.text = `Job ${job.jobId} submitted. Rendering...`

        // Poll for completion
        const result = await client.pollRenderJob(job.jobId, (status, step) => {
          if (step) {
            spinner.text = `Rendering... (${step})`
          } else {
            spinner.text = `Rendering... (${status})`
          }
        })

        if (result.status === 'complete' && result.resultUrl) {
          spinner.text = 'Downloading result...'

          await client.download(`/api/v1/renders/${job.jobId}/download`, opts.output)

          const stats = fs.statSync(opts.output)
          spinner.succeed(`Exported ${chalk.bold(opts.output)} (${formatSize(stats.size)})`)
          process.exit(0)
        } else {
          spinner.fail(`Render ${result.status}: ${result.error || 'Unknown error'}`)
          process.exit(1)
        }
      } catch (err) {
        printError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })
}
