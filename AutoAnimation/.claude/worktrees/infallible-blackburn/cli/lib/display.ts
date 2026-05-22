/**
 * Terminal display helpers: formatted tables for voice/template lists,
 * progress bars for render jobs, error formatting.
 */

import chalk from 'chalk'

/**
 * Print a formatted table to stdout.
 */
export function printTable(headers: string[], rows: string[][]): void {
  // Calculate column widths
  const widths = headers.map((h, i) => {
    const maxRow = rows.reduce((max, row) => Math.max(max, (row[i] || '').length), 0)
    return Math.max(h.length, maxRow)
  })

  // Header
  const headerLine = headers.map((h, i) => h.padEnd(widths[i])).join('  ')
  const separatorLine = widths.map((w) => '-'.repeat(w)).join('  ')

  console.log(chalk.bold(headerLine))
  console.log(chalk.dim(separatorLine))

  // Rows
  for (const row of rows) {
    const line = row.map((cell, i) => (cell || '').padEnd(widths[i])).join('  ')
    console.log(line)
  }
}

/**
 * Print a success message.
 */
export function printSuccess(message: string): void {
  console.log(chalk.green('  ') + message)
}

/**
 * Print an error message.
 */
export function printError(message: string): void {
  console.error(chalk.red('  ') + message)
}

/**
 * Print an info message.
 */
export function printInfo(message: string): void {
  console.log(chalk.blue('  ') + message)
}

/**
 * Format file size for display.
 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
