/**
 * batchProcessor.ts
 *
 * Core batch processing engine for generating multiple videos from CSV/Excel data.
 * Supports variable substitution in template prompts and ZIP export.
 */

import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import JSZip from 'jszip'
import type { BatchRowResult, BatchRowStatus } from '@/types/orchestrator'

// ── Types ──

export interface ParsedSpreadsheet {
  columns: string[]
  rows: Record<string, string>[]
}

export interface BatchProgressCallback {
  (rowIndex: number, status: BatchRowStatus, error?: string): void
}

// ── CSV Parsing ──

/**
 * Parse a CSV file into columns and rows.
 */
export function parseCsv(file: File): Promise<ParsedSpreadsheet> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        const columns = results.meta.fields || []
        const rows = (results.data as Record<string, string>[]).map((row) => {
          // Ensure all values are strings
          const cleaned: Record<string, string> = {}
          for (const col of columns) {
            cleaned[col] = String(row[col] ?? '')
          }
          return cleaned
        })
        resolve({ columns, rows })
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`))
      },
    })
  })
}

// ── Excel Parsing ──

/**
 * Parse an Excel (.xlsx, .xls) file into columns and rows.
 */
export async function parseExcel(file: File): Promise<ParsedSpreadsheet> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })

  // Use the first sheet
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) throw new Error('Excel file has no sheets')

  const sheet = workbook.Sheets[sheetName]
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

  if (jsonData.length === 0) {
    return { columns: [], rows: [] }
  }

  const columns = Object.keys(jsonData[0])
  const rows = jsonData.map((row) => {
    const cleaned: Record<string, string> = {}
    for (const col of columns) {
      cleaned[col] = String(row[col] ?? '')
    }
    return cleaned
  })

  return { columns, rows }
}

/**
 * Auto-detect file type and parse accordingly.
 */
export async function parseSpreadsheet(file: File): Promise<ParsedSpreadsheet> {
  const ext = file.name.toLowerCase().split('.').pop()
  if (ext === 'csv') {
    return parseCsv(file)
  }
  if (ext === 'xlsx' || ext === 'xls') {
    return parseExcel(file)
  }
  throw new Error(`Unsupported file format: .${ext}. Please use .csv, .xlsx, or .xls`)
}

// ── Variable Substitution ──

/**
 * Replace {column_name} placeholders in a template string with row values.
 */
export function substituteVariables(
  template: string,
  row: Record<string, string>,
): string {
  let result = template
  for (const [key, value] of Object.entries(row)) {
    // Replace both {key} and {Key} variants
    result = result.replace(new RegExp(`\\{${escapeRegex(key)}\\}`, 'gi'), value)
  }
  return result
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Extract all {variable} placeholders from a template string.
 */
export function extractPlaceholders(template: string): string[] {
  const matches = template.match(/\{([^}]+)\}/g)
  if (!matches) return []
  return [...new Set(matches.map((m) => m.slice(1, -1)))]
}

/**
 * Auto-detect column-to-variable mapping by matching column names.
 */
export function autoDetectMapping(
  columns: string[],
  placeholders: string[],
): Record<string, string> {
  const mapping: Record<string, string> = {}
  const commonAliases: Record<string, string[]> = {
    title: ['title', 'name', 'product_name', 'heading', 'subject'],
    description: ['description', 'desc', 'body', 'content', 'text', 'details'],
    price: ['price', 'cost', 'amount', 'value'],
    image_url: ['image', 'image_url', 'photo', 'picture', 'thumbnail', 'img'],
    features: ['features', 'highlights', 'benefits', 'specs'],
    style: ['style', 'theme', 'look', 'design'],
    color: ['color', 'colour'],
    category: ['category', 'type', 'group'],
  }

  for (const placeholder of placeholders) {
    const lowerPlaceholder = placeholder.toLowerCase()

    // Exact match first
    const exactMatch = columns.find((c) => c.toLowerCase() === lowerPlaceholder)
    if (exactMatch) {
      mapping[placeholder] = exactMatch
      continue
    }

    // Alias match
    const aliases = commonAliases[lowerPlaceholder] || [lowerPlaceholder]
    for (const alias of aliases) {
      const match = columns.find((c) => c.toLowerCase().includes(alias))
      if (match) {
        mapping[placeholder] = match
        break
      }
    }
  }

  return mapping
}

// ── Batch Execution ──

/**
 * Process a batch of rows through the orchestrator.
 * Executes sequentially to respect API rate limits.
 */
export async function processBatch(
  rows: Record<string, string>[],
  templatePrompt: string,
  generateFn: (prompt: string, rowIndex: number) => Promise<string | undefined>,
  onProgress: BatchProgressCallback,
  options?: { cancelled?: { value: boolean } },
): Promise<BatchRowResult[]> {
  const results: BatchRowResult[] = []

  for (let i = 0; i < rows.length; i++) {
    // Check for cancellation
    if (options?.cancelled?.value) {
      results.push({
        rowIndex: i,
        status: 'pending',
        error: 'Cancelled by user',
      })
      continue
    }

    onProgress(i, 'generating')

    try {
      const prompt = substituteVariables(templatePrompt, rows[i])
      const videoUrl = await generateFn(prompt, i)

      results.push({
        rowIndex: i,
        status: 'complete',
        videoUrl,
      })
      onProgress(i, 'complete')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Generation failed'
      results.push({
        rowIndex: i,
        status: 'error',
        error: errorMsg,
      })
      onProgress(i, 'error', errorMsg)
    }
  }

  return results
}

// ── ZIP Export ──

/**
 * Bundle multiple video blobs into a ZIP archive.
 */
export async function exportBatchZip(
  results: Array<{ videoBlob: Blob; filename: string }>,
): Promise<Blob> {
  const zip = new JSZip()

  for (const { videoBlob, filename } of results) {
    zip.file(filename, videoBlob)
  }

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
}

/**
 * Generate a filename for a batch row.
 */
export function generateRowFilename(
  rowIndex: number,
  row: Record<string, string>,
  namingColumn?: string,
  format: string = 'mp4',
): string {
  const base = namingColumn && row[namingColumn]
    ? row[namingColumn].replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50)
    : `row_${rowIndex + 1}`
  return `${rowIndex + 1}_${base}.${format}`
}
