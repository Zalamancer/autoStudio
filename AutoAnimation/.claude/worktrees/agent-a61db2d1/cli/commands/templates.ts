/**
 * `proanimate templates` command: list and show template details.
 */

import type { Command } from 'commander'
import { loadConfig } from '../lib/config.js'
import { ProAnimateApiClient } from '../lib/apiClient.js'
import { printTable, printError, printInfo } from '../lib/display.js'

export function registerTemplatesCommand(program: Command): void {
  const templates = program
    .command('templates')
    .description('Browse motion graphics templates')

  templates
    .command('list')
    .description('List available templates')
    .option('--category <category>', 'Filter by category')
    .option('--search <query>', 'Search by name or description')
    .action(async (opts) => {
      try {
        const config = await loadConfig()
        if (!config.apiKey) {
          printError('No API key configured.')
          process.exit(2)
        }

        const client = new ProAnimateApiClient(config)
        const params = new URLSearchParams()
        if (opts.category) params.set('category', opts.category)
        if (opts.search) params.set('search', opts.search)

        const data = await client.get<{
          templates: Array<{ id: string; name: string; category: string; description?: string }>
        }>(`/api/v1/templates?${params.toString()}`)

        if (!data.templates || data.templates.length === 0) {
          console.log('No templates found.')
          return
        }

        const rows = data.templates.map((t) => [
          t.id,
          t.name,
          t.category,
          (t.description || '').slice(0, 50),
        ])

        printTable(['ID', 'Name', 'Category', 'Description'], rows)
        printInfo(`${data.templates.length} templates found`)
      } catch (err) {
        printError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })

  templates
    .command('show <id>')
    .description('Show template details')
    .action(async (id) => {
      try {
        const config = await loadConfig()
        if (!config.apiKey) {
          printError('No API key configured.')
          process.exit(2)
        }

        const client = new ProAnimateApiClient(config)
        const data = await client.get<{
          id: string
          name: string
          category: string
          description?: string
          editableProperties?: Array<{ key: string; type: string; default?: unknown }>
        }>(`/api/v1/templates/${id}`)

        console.log(`\nTemplate: ${data.name}`)
        console.log(`ID: ${data.id}`)
        console.log(`Category: ${data.category}`)
        if (data.description) console.log(`Description: ${data.description}`)

        if (data.editableProperties && data.editableProperties.length > 0) {
          console.log('\nEditable Properties:')
          const rows = data.editableProperties.map((p) => [
            p.key,
            p.type,
            String(p.default ?? ''),
          ])
          printTable(['Property', 'Type', 'Default'], rows)
        }
      } catch (err) {
        printError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })
}
