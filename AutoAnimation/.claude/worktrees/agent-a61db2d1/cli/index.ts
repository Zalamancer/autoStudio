#!/usr/bin/env node

/**
 * ProAnimate CLI -- Headless video generation from the terminal.
 *
 * Supports cloud rendering (via API) and local rendering (via Remotion CLI).
 */

import { Command } from 'commander'
import { registerRenderCommand } from './commands/render.js'
import { registerBatchCommand } from './commands/batch.js'
import { registerVoicesCommand } from './commands/voices.js'
import { registerTemplatesCommand } from './commands/templates.js'
import { registerAuthCommand } from './commands/auth.js'
import { registerStatusCommand } from './commands/status.js'

const program = new Command()

program
  .name('proanimate')
  .description('ProAnimate CLI - Generate animated videos from the terminal')
  .version('0.1.0')
  .option('--api-key <key>', 'API key (overrides config/env)')
  .option('--server-url <url>', 'Server URL (overrides config/env)')

// Register commands
registerRenderCommand(program)
registerBatchCommand(program)
registerVoicesCommand(program)
registerTemplatesCommand(program)
registerAuthCommand(program)
registerStatusCommand(program)

program.parse()
