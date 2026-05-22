/**
 * Document Parser — extract text content from uploaded files (PDF, TXT, DOCX)
 * and summarize via Gemini for video script generation.
 *
 * Extended in Phase 8 with rich PDF extraction: page thumbnails, heading detection,
 * page type classification, and document structure analysis.
 */

import { getGeminiService } from './gemini'
import type {
  DocumentExtraction,
  DocumentPage,
  DocumentPageType,
} from '@/types/document'

export interface ParsedDocument {
  title: string
  content: string
  wordCount: number
}

export interface DocumentVideoScript {
  title: string
  summary: string
  suggestedPrompt: string
  suggestedDuration: number
  keyPoints: string[]
}

/**
 * Extract raw text from an uploaded file.
 */
export async function parseDocument(file: File): Promise<ParsedDocument> {
  const extension = file.name.split('.').pop()?.toLowerCase()

  let content: string

  switch (extension) {
    case 'txt':
    case 'md':
    case 'csv':
      content = await file.text()
      break

    case 'pdf':
      content = await parsePDF(file)
      break

    case 'html':
    case 'htm':
      content = await parseHTML(file)
      break

    default:
      // Try as plain text
      content = await file.text()
  }

  const title = file.name.replace(/\.[^/.]+$/, '')
  const wordCount = content.split(/\s+/).filter(Boolean).length

  return { title, content: content.trim(), wordCount }
}

/**
 * Parse PDF using basic text extraction.
 * If pdfjs-dist is available it will be used; otherwise falls back to
 * reading raw text content from the file (works for text-based PDFs).
 */
async function parsePDF(file: File): Promise<string> {
  try {
    // Try dynamic import of pdfjs-dist (may not be installed)
    const pdfjsLib = await import('pdfjs-dist' as string) as {
      GlobalWorkerOptions: { workerSrc: string }
      version: string
      getDocument: (opts: { data: ArrayBuffer }) => { promise: Promise<{ numPages: number; getPage: (n: number) => Promise<{ getTextContent: () => Promise<{ items: Array<{ str: string }> }> }> }> }
    }
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

    const pages: string[] = []
    for (let i = 1; i <= Math.min(pdf.numPages, 50); i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item) => item.str)
        .join(' ')
      pages.push(pageText)
    }

    return pages.join('\n\n')
  } catch {
    // Fallback: read as text (works for some PDFs)
    const text = await file.text()
    return text
  }
}

/**
 * Parse HTML file → plain text.
 */
async function parseHTML(file: File): Promise<string> {
  const html = await file.text()
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  // Remove scripts and styles
  doc.querySelectorAll('script, style, nav, footer, header').forEach((el) => el.remove())
  return doc.body.textContent?.trim() || ''
}

/**
 * Summarize a parsed document into a video script via Gemini.
 */
export async function summarizeForVideo(
  doc: ParsedDocument,
): Promise<DocumentVideoScript> {
  const gemini = getGeminiService()

  // Truncate very long documents
  const maxChars = 15000
  const truncatedContent =
    doc.content.length > maxChars
      ? doc.content.slice(0, maxChars) + '\n\n[... content truncated ...]'
      : doc.content

  const prompt = `You are a video script writer. Analyze this document and create a concise video script suitable for a short-form video (30-90 seconds).

DOCUMENT TITLE: ${doc.title}
DOCUMENT CONTENT:
${truncatedContent}

Output valid JSON with this structure:
{
  "title": "catchy video title",
  "summary": "2-3 sentence summary",
  "suggestedPrompt": "A full orchestrator prompt that describes the video to create, including dialogue with [emotion] cues, visual elements, and pacing. Should be self-contained and detailed enough to generate a complete video.",
  "suggestedDuration": 45,
  "keyPoints": ["key point 1", "key point 2", "key point 3"]
}`

  const raw = await gemini.generateContent(prompt)
  // Strip markdown code fences if present
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  return JSON.parse(cleaned) as DocumentVideoScript
}

// ══════════════════════════════════════════════════════════════════════
// Phase 8: Rich PDF Extraction with page thumbnails and structure analysis
// ══════════════════════════════════════════════════════════════════════

// Lazy pdf.js singleton
let _pdfjsLib: typeof import('pdfjs-dist') | null = null

async function getPdfjsLib() {
  if (!_pdfjsLib) {
    _pdfjsLib = await import('pdfjs-dist')
    _pdfjsLib.GlobalWorkerOptions.workerSrc =
      `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${_pdfjsLib.version}/pdf.worker.min.mjs`
  }
  return _pdfjsLib
}

/**
 * Parse a PDF file into a rich DocumentExtraction with page thumbnails,
 * heading detection, and page type classification.
 */
export async function parseRichPDF(file: File): Promise<DocumentExtraction> {
  const pdfjs = await getPdfjsLib()
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: buffer }).promise

  const metadata = await pdf.getMetadata().catch(() => null)
  const info = (metadata?.info || {}) as Record<string, unknown>
  const title = (info.Title as string) || file.name.replace(/\.pdf$/i, '')
  const author = (info.Author as string) || ''

  const maxPages = Math.min(pdf.numPages, 50)
  const pages: DocumentPage[] = []

  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i)
    const pageData = await extractRichPageData(page, i)
    pages.push(pageData)
  }

  const allText = pages.map((p) => p.text).join(' ').slice(0, 500)
  const language = detectDocLanguage(allText)

  return {
    title,
    author,
    pageCount: pdf.numPages,
    language,
    pages,
  }
}

async function extractRichPageData(
  page: import('pdfjs-dist').PDFPageProxy,
  pageNumber: number,
): Promise<DocumentPage> {
  const textContent = await page.getTextContent()
  const { text, headings } = analyzePageTextContent(textContent)
  const thumbnailDataUrl = await renderPdfThumbnail(page, 0.5)
  const pageType = classifyPageType(text, headings, textContent)

  return {
    pageNumber,
    text,
    headings,
    images: [],
    hasTable: detectTableFromItems(textContent),
    hasChart: false,
    pageType,
    thumbnailDataUrl,
    enabled: true,
  }
}

function analyzePageTextContent(
  textContent: Awaited<ReturnType<import('pdfjs-dist').PDFPageProxy['getTextContent']>>,
): { text: string; headings: string[] } {
  const items = textContent.items as Array<{
    str: string
    transform: number[]
    height?: number
  }>

  if (items.length === 0) return { text: '', headings: [] }

  const fontSizes: number[] = []
  const textParts: string[] = []

  for (const item of items) {
    const fontSize = item.transform ? Math.abs(item.transform[0]) : (item.height || 12)
    fontSizes.push(fontSize)
    textParts.push(item.str)
  }

  const text = textParts.join(' ').replace(/\s+/g, ' ').trim()

  const sortedSizes = [...fontSizes].sort((a, b) => a - b)
  const medianSize = sortedSizes[Math.floor(sortedSizes.length / 2)] || 12
  const headingThreshold = medianSize * 1.3

  const headings: string[] = []
  let currentHeading = ''

  for (let i = 0; i < items.length; i++) {
    const fontSize = fontSizes[i]
    const str = items[i].str.trim()

    if (fontSize > headingThreshold && str.length > 2) {
      currentHeading += (currentHeading ? ' ' : '') + str
    } else if (currentHeading) {
      headings.push(currentHeading)
      currentHeading = ''
    }
  }

  if (currentHeading) headings.push(currentHeading)

  return { text, headings }
}

async function renderPdfThumbnail(
  page: import('pdfjs-dist').PDFPageProxy,
  scale: number,
): Promise<string> {
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  if (!canvas.getContext('2d')) return ''

  await page.render({ canvas, viewport }).promise
  return canvas.toDataURL('image/jpeg', 0.7)
}

function classifyPageType(
  text: string,
  headings: string[],
  textContent: Awaited<ReturnType<import('pdfjs-dist').PDFPageProxy['getTextContent']>>,
): DocumentPageType {
  const wordCount = text.split(/\s+/).length
  const items = textContent.items as Array<{ str: string }>

  if (wordCount < 30 && headings.length <= 2) return 'title'
  if (detectTableFromItems(textContent)) return 'table'
  if (wordCount < 20 && items.length < 10) return 'image-heavy'
  return 'text'
}

function detectTableFromItems(
  textContent: Awaited<ReturnType<import('pdfjs-dist').PDFPageProxy['getTextContent']>>,
): boolean {
  const items = textContent.items as Array<{ str: string; transform: number[] }>
  if (items.length < 10) return false

  const yPositions = new Map<number, number>()
  for (const item of items) {
    if (!item.transform) continue
    const y = Math.round(item.transform[5])
    yPositions.set(y, (yPositions.get(y) || 0) + 1)
  }

  let tableRows = 0
  for (const count of yPositions.values()) {
    if (count >= 3) tableRows++
  }
  return tableRows >= 3
}

function detectDocLanguage(text: string): string {
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh'
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja'
  if (/[\uac00-\ud7af]/.test(text)) return 'ko'
  if (/[\u0600-\u06ff]/.test(text)) return 'ar'
  if (/[\u0400-\u04ff]/.test(text)) return 'ru'
  return 'en'
}
