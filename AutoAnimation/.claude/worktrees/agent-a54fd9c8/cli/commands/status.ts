/**
 * `proanimate status` command: shows credit balance, active jobs, API key info.
 */

import type { Command } from 'commander'
import { loadConfig } from '../lib/config.js'
import { ProAnimateApiClient } from '../lib/apiClient.js'
import { printTable, printError, printInfo, printSuccess } from '../lib/display.js'

export function registerStatusCommand(program: Command): void {
  program
    .command('status')
    .description('Show account status, credit balance, and active jobs')
    .action(async () => {
      try {
        const config = await loadConfig()

        if (!config.apiKey) {
          printError('Not authenticated. Run `proanimate auth set-key <key>` or set PROANIMATE_API_KEY.')
          process.exit(2)
        }

        const client = new ProAnimateApiClient(config)

        console.log('\n  ProAnimate Status')
        console.log('  ' + '-'.repeat(40))

        // Show API key info
        try {
          const keysData = await client.get<{
            keys: Array<{ name: string; key_prefix: string; last_used_at: string | null }>
          }>('/api/v1/api-keys')

          if (keysData.keys && keysData.keys.length > 0) {
            printInfo(`API Keys: ${keysData.keys.length} active`)
          }
        } catch {
          printInfo('API key info unavailable')
        }

        // Show usage stats
        try {
          const usageData = await client.get<{
            usage: Array<{ key_id: string; total_calls: number; total_credits: number; calls_today: number }>
          }>('/api/v1/api-keys/usage')

          if (usageData.usage && usageData.usage.length > 0) {
            const totalCalls = usageData.usage.reduce((a, u) => a + u.total_calls, 0)
            const totalCredits = usageData.usage.reduce((a, u) => a + u.total_credits, 0)
            const callsToday = usageData.usage.reduce((a, u) => a + u.calls_today, 0)

            printInfo(`Total API Calls: ${totalCalls}`)
            printInfo(`Total Credits Used: ${totalCredits}`)
            printInfo(`Calls Today: ${callsToday}`)
          }
        } catch {
          printInfo('Usage stats unavailable')
        }

        // Show active render jobs
        try {
          const jobsData = await client.get<{
            jobs: Array<{ id: string; status: string; prompt: string; created_at: string }>
          }>('/api/v1/renders?status=running')

          if (jobsData.jobs && jobsData.jobs.length > 0) {
            console.log('\n  Active Jobs:')
            const rows = jobsData.jobs.map((j) => [
              j.id.slice(0, 8),
              j.status,
              (j.prompt || '').slice(0, 40),
              new Date(j.created_at).toLocaleString(),
            ])
            printTable(['Job ID', 'Status', 'Prompt', 'Created'], rows)
          } else {
            printInfo('No active render jobs')
          }
        } catch {
          printInfo('Active jobs unavailable')
        }

        console.log('')
        printSuccess(`Server: ${config.serverUrl}`)
      } catch (err) {
        printError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })
}
