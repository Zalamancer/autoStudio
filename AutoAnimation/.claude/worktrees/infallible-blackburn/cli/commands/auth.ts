/**
 * `proanimate auth` command: manage authentication.
 */

import type { Command } from 'commander'
import { loadConfig, saveCredentials } from '../lib/config.js'
import { ProAnimateApiClient } from '../lib/apiClient.js'
import { printSuccess, printError, printInfo } from '../lib/display.js'

export function registerAuthCommand(program: Command): void {
  const auth = program
    .command('auth')
    .description('Manage authentication')

  auth
    .command('set-key <key>')
    .description('Store an API key for authentication')
    .action((key: string) => {
      if (!key.startsWith('pak_')) {
        printError('Invalid API key format. Keys should start with "pak_".')
        process.exit(1)
      }

      saveCredentials(key)
      printSuccess(`API key saved (${key.slice(0, 12)}...).`)
      printInfo('Stored in ~/.proanimate/credentials.json')
    })

  auth
    .command('whoami')
    .description('Show current authentication status')
    .action(async () => {
      try {
        const config = await loadConfig()

        if (!config.apiKey) {
          printError('Not authenticated. Run `proanimate auth set-key <key>` or set PROANIMATE_API_KEY.')
          process.exit(2)
        }

        printInfo(`API Key: ${config.apiKey.slice(0, 12)}...`)
        printInfo(`Server: ${config.serverUrl}`)

        // Try to validate the key
        try {
          const client = new ProAnimateApiClient(config)
          const _data = await client.get<{ keys: Array<{ name: string }> }>('/api/v1/api-keys')
          printSuccess('API key is valid.')
        } catch {
          printError('API key validation failed. The key may be invalid or the server may be unreachable.')
        }
      } catch (err) {
        printError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })

  auth
    .command('login')
    .description('Open browser to authenticate via OAuth (coming soon)')
    .action(() => {
      printInfo('Browser-based authentication is coming soon.')
      printInfo('For now, use `proanimate auth set-key <key>` with an API key from the dashboard.')
    })
}
