/**
 * Content Extractor API route: Extract text from uploaded documents (PDF, PPTX, TXT).
 *
 * Endpoints:
 *   POST /extract-document — Parse uploaded file and extract text content
 *
 * Uses multer for file upload handling.
 * PDF parsing uses a simple text extraction approach.
 * PPTX parsing extracts text from slide XML.
 */
import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import { unlink } from 'node:fs/promises'
import { readFile } from 'node:fs/promises'
import { inflateRawSync } from 'node:zlib'
import logger from '../lib/logger'

const router = Router()

// Configure multer for temporary file storage
const upload = multer({
  dest: '/tmp/proanimate-uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'text/csv',
    ]
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(txt|md|csv|pdf|pptx|docx)$/i)) {
      cb(null, true)
    } else {
      cb(new Error('Unsupported file type. Supported: PDF, PPTX, DOCX, TXT, MD, CSV'))
    }
  },
})

// ── PDF Text Extraction (simple approach using raw buffer) ──

function extractTextFromPDF(buffer: Buffer): string {
  // Simple PDF text extraction: find text between BT and ET operators
  // and decode string objects. This handles most simple PDFs.
  const text = buffer.toString('latin1')
  const textParts: string[] = []

  // Extract text from content streams
  // Look for text objects between parentheses in BT...ET blocks
  const btBlocks = text.match(/BT[\s\S]*?ET/g) || []
  for (const block of btBlocks) {
    // Match text in parentheses (PDF string objects)
    const strings = block.match(/\(([^)]*)\)/g) || []
    for (const s of strings) {
      const decoded = s.slice(1, -1)
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\\\/g, '\\')
        .replace(/\\([()])/g, '$1')
      if (decoded.trim()) textParts.push(decoded)
    }

    // Match hex strings
    const hexStrings = block.match(/<([0-9a-fA-F]+)>/g) || []
    for (const hs of hexStrings) {
      const hex = hs.slice(1, -1)
      let decoded = ''
      for (let i = 0; i < hex.length; i += 2) {
        decoded += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16))
      }
      if (decoded.trim()) textParts.push(decoded)
    }
  }

  // If BT/ET approach fails, try to find readable text sequences
  if (textParts.length === 0) {
    const readableChunks = text.match(/[A-Za-z0-9 .,!?;:'"()\-]{20,}/g) || []
    textParts.push(...readableChunks)
  }

  return textParts.join(' ').replace(/\s+/g, ' ').trim()
}

// ── PPTX Text Extraction (zip + XML) ──

async function extractTextFromPPTX(buffer: Buffer): Promise<string> {
  // PPTX is a ZIP archive containing XML files
  // We'll look for slide XML files and extract text from <a:t> tags

  // Simple ZIP parsing: find local file headers (PK\x03\x04)
  const entries = findZipEntries(buffer)
  const slideTexts: string[] = []

  for (const entry of entries) {
    if (entry.name.match(/ppt\/slides\/slide\d+\.xml$/i)) {
      const content = entry.data.toString('utf-8')
      // Extract text from <a:t>...</a:t> tags
      const textMatches = content.match(/<a:t>([^<]*)<\/a:t>/g) || []
      const slideText = textMatches
        .map(m => m.replace(/<\/?a:t>/g, ''))
        .filter(t => t.trim())
        .join(' ')
      if (slideText) slideTexts.push(slideText)
    }
  }

  return slideTexts.map((t, i) => `Slide ${i + 1}: ${t}`).join('\n\n')
}

// ── DOCX Text Extraction ──

async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  const entries = findZipEntries(buffer)
  const textParts: string[] = []

  for (const entry of entries) {
    if (entry.name === 'word/document.xml') {
      const content = entry.data.toString('utf-8')
      // Extract text from <w:t>...</w:t> tags
      const textMatches = content.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || []
      const docText = textMatches
        .map(m => m.replace(/<\/?w:t[^>]*>/g, ''))
        .join(' ')
      if (docText) textParts.push(docText)
    }
  }

  return textParts.join('\n').replace(/\s+/g, ' ').trim()
}

// ── Simple ZIP entry finder ──

interface ZipEntry {
  name: string
  data: Buffer
}

function findZipEntries(buffer: Buffer): ZipEntry[] {
  const entries: ZipEntry[] = []
  let offset = 0

  while (offset < buffer.length - 30) {
    // Local file header signature: PK\x03\x04
    if (buffer[offset] !== 0x50 || buffer[offset + 1] !== 0x4B ||
        buffer[offset + 2] !== 0x03 || buffer[offset + 3] !== 0x04) {
      offset++
      continue
    }

    const compressionMethod = buffer.readUInt16LE(offset + 8)
    const compressedSize = buffer.readUInt32LE(offset + 18)
    const uncompressedSize = buffer.readUInt32LE(offset + 22)
    const nameLength = buffer.readUInt16LE(offset + 26)
    const extraLength = buffer.readUInt16LE(offset + 28)

    const nameStart = offset + 30
    const name = buffer.toString('utf-8', nameStart, nameStart + nameLength)
    const dataStart = nameStart + nameLength + extraLength

    // Only handle stored (uncompressed) files — compressed entries need zlib
    if (compressionMethod === 0 && uncompressedSize > 0 && uncompressedSize < buffer.length) {
      const data = buffer.subarray(dataStart, dataStart + uncompressedSize)
      entries.push({ name, data })
    } else if (compressionMethod === 8) {
      // Deflated — try using zlib
      try {
        const size = compressedSize > 0 ? compressedSize : Math.min(buffer.length - dataStart, 1_000_000)
        const compressed = buffer.subarray(dataStart, dataStart + size)
        const data = inflateRawSync(compressed)
        entries.push({ name, data })
      } catch {
        // Skip undecompressable entries
      }
    }

    // Move past this entry
    const entrySize = compressedSize > 0 ? compressedSize : uncompressedSize
    offset = dataStart + entrySize
    if (offset <= dataStart) offset = dataStart + 1 // prevent infinite loop
  }

  return entries
}

// ── Route Handler ──

router.post('/extract-document', upload.single('file'), async (req: Request, res: Response) => {
  const file = req.file
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded', code: 'NO_FILE' })
  }

  try {
    const buffer = await readFile(file.path)
    let extractedText = ''
    let documentType = 'text'

    const ext = (file.originalname.split('.').pop() || '').toLowerCase()
    const mime = file.mimetype

    if (ext === 'pdf' || mime === 'application/pdf') {
      documentType = 'pdf'
      extractedText = extractTextFromPDF(buffer)
    } else if (ext === 'pptx' || mime.includes('presentationml')) {
      documentType = 'presentation'
      extractedText = await extractTextFromPPTX(buffer)
    } else if (ext === 'docx' || mime.includes('wordprocessingml')) {
      documentType = 'document'
      extractedText = await extractTextFromDOCX(buffer)
    } else {
      // Plain text / markdown / CSV
      documentType = ext === 'csv' ? 'data' : ext === 'md' ? 'markdown' : 'text'
      extractedText = buffer.toString('utf-8')
    }

    // Truncate to 10000 chars for Gemini context
    extractedText = extractedText.slice(0, 10_000)

    if (!extractedText.trim()) {
      return res.status(422).json({
        error: 'Could not extract text from the document. The file may be image-only or encrypted.',
        code: 'EMPTY_CONTENT',
      })
    }

    return res.json({
      documentType,
      fileName: file.originalname,
      textContent: extractedText,
      characterCount: extractedText.length,
    })
  } catch (err) {
    logger.error({ err }, 'Document extraction failed')
    return res.status(500).json({
      error: `Failed to extract document: ${err instanceof Error ? err.message : 'Unknown error'}`,
      code: 'EXTRACT_FAILED',
    })
  } finally {
    // Clean up temp file
    try {
      await unlink(file.path)
    } catch { /* ignore */ }
  }
})

export default router
