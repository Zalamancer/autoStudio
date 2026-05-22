/**
 * `proanimate voices` command: list and preview voices.
 */

import type { Command } from 'commander'
import { loadConfig } from '../lib/config.js'
import { ProAnimateApiClient } from '../lib/apiClient.js'
import { printTable, printError } from '../lib/display.js'

export function registerVoicesCommand(program: Command): void {
  const voices = program
    .command('voices')
    .description('Manage ElevenLabs voices')

  voices
    .command('list')
    .description('List available voices')
    .action(async () => {
      try {
        const config = await loadConfig()
        if (!config.apiKey) {
          printError('No API key configured.')
          process.exit(2)
        }

        const client = new ProAnimateApiClient(config)
        const data = await client.get<{ voices: Array<{ voice_id: string; name: string; category: string; labels?: Record<string, string> }> }>('/api/v1/voices')

        if (!data.voices || data.voices.length === 0) {
          console.log('No voices available.')
          return
        }

        const rows = data.voices.map((v) => [
          v.voice_id,
          v.name,
          v.category || 'premade',
          v.labels?.accent || '',
        ])

        printTable(['Voice ID', 'Name', 'Category', 'Accent'], rows)
      } catch (err) {
        printError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })

  voices
    .command('preview')
    .description('Preview a voice with a test phrase')
    .requiredOption('--voice-id <id>', 'Voice ID to preview')
    .option('--text <text>', 'Text to speak', 'Hello, this is my voice. How does it sound?')
    .action(async (opts) => {
      try {
        const config = await loadConfig()
        if (!config.apiKey) {
          printError('No API key configured.')
          process.exit(2)
        }

        console.log(`Voice preview for ${opts.voiceId} is available in the web dashboard.`)
        console.log(`Text: "${opts.text}"`)
      } catch (err) {
        printError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })
}
