/**
 * SDK Generation Script.
 *
 * Generates TypeScript and Python SDKs from the OpenAPI spec.
 * Usage: npx tsx server/scripts/generateSdks.ts
 *
 * Requires: npm install -g @openapitools/openapi-generator-cli
 */

import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const specPath = path.join(__dirname, '..', 'openapi.yaml')

console.log('Generating SDKs from OpenAPI spec...')

// TypeScript SDK
try {
  console.log('\n--- TypeScript SDK ---')
  execSync(
    `npx @openapitools/openapi-generator-cli generate ` +
    `-i ${specPath} ` +
    `-g typescript-fetch ` +
    `-o ${path.join(__dirname, '..', '..', 'sdk', 'typescript')} ` +
    `--additional-properties=npmName=@proanimate/sdk,supportsES6=true`,
    { stdio: 'inherit' }
  )
  console.log('TypeScript SDK generated successfully')
} catch (err) {
  console.error('Failed to generate TypeScript SDK:', err)
}

// Python SDK
try {
  console.log('\n--- Python SDK ---')
  execSync(
    `npx @openapitools/openapi-generator-cli generate ` +
    `-i ${specPath} ` +
    `-g python ` +
    `-o ${path.join(__dirname, '..', '..', 'sdk', 'python')} ` +
    `--additional-properties=packageName=proanimate`,
    { stdio: 'inherit' }
  )
  console.log('Python SDK generated successfully')
} catch (err) {
  console.error('Failed to generate Python SDK:', err)
}

console.log('\nDone!')
