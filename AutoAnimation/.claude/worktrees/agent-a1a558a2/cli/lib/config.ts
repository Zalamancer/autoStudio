/**
 * CLI configuration loader using cosmiconfig.
 * Reads from .proanimaterc.json, proanimate.config.js, or PROANIMATE_* env vars.
 * Merges: CLI flags > env vars > config file > defaults.
 */

import { cosmiconfig } from 'cosmiconfig'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'

export interface CliConfig {
  apiKey: string
  serverUrl: string
  outputDir: string
  format: 'mp4' | 'webm'
}

const DEFAULTS: CliConfig = {
  apiKey: '',
  serverUrl: 'https://api.proanimate.com',
  outputDir: '.',
  format: 'mp4',
}

const explorer = cosmiconfig('proanimate')

/**
 * Load CLI configuration merging: CLI flags > env vars > config file > credentials file > defaults.
 */
export async function loadConfig(overrides: Partial<CliConfig> = {}): Promise<CliConfig> {
  // Load config file
  let fileConfig: Partial<CliConfig> = {}
  try {
    const result = await explorer.search()
    if (result && !result.isEmpty) {
      fileConfig = result.config as Partial<CliConfig>
    }
  } catch {
    // Config file not found -- ignore
  }

  // Load credentials file
  const credentialsPath = path.join(os.homedir(), '.proanimate', 'credentials.json')
  let credConfig: Partial<CliConfig> = {}
  try {
    if (fs.existsSync(credentialsPath)) {
      const raw = fs.readFileSync(credentialsPath, 'utf-8')
      credConfig = JSON.parse(raw)
    }
  } catch {
    // Credentials file invalid -- ignore
  }

  // Env vars
  const envConfig: Partial<CliConfig> = {}
  if (process.env.PROANIMATE_API_KEY) envConfig.apiKey = process.env.PROANIMATE_API_KEY
  if (process.env.PROANIMATE_SERVER_URL) envConfig.serverUrl = process.env.PROANIMATE_SERVER_URL

  // Merge: defaults < credentials < file < env < overrides
  return {
    ...DEFAULTS,
    ...credConfig,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  }
}

/**
 * Save API key to credentials file.
 */
export function saveCredentials(apiKey: string): void {
  const dir = path.join(os.homedir(), '.proanimate')
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  const credPath = path.join(dir, 'credentials.json')

  let existing: Record<string, unknown> = {}
  try {
    if (fs.existsSync(credPath)) {
      existing = JSON.parse(fs.readFileSync(credPath, 'utf-8'))
    }
  } catch {
    // ignore
  }

  existing.apiKey = apiKey
  fs.writeFileSync(credPath, JSON.stringify(existing, null, 2))
}
