/**
 * pptxParser.ts
 *
 * Core PPTX parsing engine using JSZip + DOMParser.
 * Extracts slides, text boxes, shapes, images, speaker notes, and transitions.
 */

import JSZip from 'jszip'
import type {
  PresentationData,
  SlideData,
  TextBoxData,
  ShapeData,
  ImageData,
  ThemeData,
  TransitionData,
} from '@/types/pptx'

// ── EMU Conversion ──
// 1 inch = 914400 EMU. At 96 DPI: pixels = emu / 914400 * 96
const EMU_PER_INCH = 914400
const DPI = 96

export function emuToPixels(emu: number): number {
  return Math.round((emu / EMU_PER_INCH) * DPI)
}

// ── Font Mapping ──
const FONT_MAP: Record<string, string> = {
  'Calibri': 'Inter',
  'Arial': 'Inter',
  'Times New Roman': 'Merriweather',
  'Helvetica': 'Inter',
  'Comic Sans MS': 'Caveat',
  'Impact': 'Bebas Neue',
  'Georgia': 'Playfair Display',
  'Verdana': 'Inter',
  'Tahoma': 'Inter',
  'Cambria': 'Merriweather',
  'Segoe UI': 'Inter',
}

function mapFont(pptxFont: string): string {
  return FONT_MAP[pptxFont] || 'Inter'
}

// ── Shape Type Mapping ──
const SHAPE_TYPE_MAP: Record<string, ShapeData['type']> = {
  'rect': 'rectangle',
  'roundRect': 'roundRect',
  'ellipse': 'ellipse',
  'triangle': 'triangle',
  'rtTriangle': 'triangle',
  'rightArrow': 'arrow',
  'leftArrow': 'arrow',
  'upArrow': 'arrow',
  'downArrow': 'arrow',
  'star5': 'star',
  'star4': 'star',
  'star6': 'star',
}

// ── Main Parser ──

/**
 * Parse a PPTX file into structured PresentationData.
 */
export async function parsePPTX(file: File): Promise<PresentationData> {
  const buffer = await file.arrayBuffer()
  const zip = await JSZip.loadAsync(buffer)

  // Parse presentation.xml for slide dimensions and ordering
  const presentationXml = await getXml(zip, 'ppt/presentation.xml')
  if (!presentationXml) {
    throw new Error('Invalid PPTX file: missing ppt/presentation.xml')
  }

  const { slideWidth, slideHeight } = parseSlideDimensions(presentationXml)

  // Parse theme
  const theme = await parseTheme(zip)

  // Count slides from slide relationships
  const slideCount = await countSlides(zip)

  // Parse each slide
  const slides: SlideData[] = []
  for (let i = 1; i <= slideCount; i++) {
    const slide = await parseSlide(zip, i, theme)
    if (slide) slides.push(slide)
  }

  return {
    slides,
    slideWidth: emuToPixels(slideWidth),
    slideHeight: emuToPixels(slideHeight),
    theme,
  }
}

// ── Slide Dimensions ──

function parseSlideDimensions(doc: Document): { slideWidth: number; slideHeight: number } {
  const sldSz = doc.querySelector('sldSz')
  if (!sldSz) {
    // Default to 16:9 (12192000 x 6858000 EMU)
    return { slideWidth: 12192000, slideHeight: 6858000 }
  }
  const cx = parseInt(sldSz.getAttribute('cx') || '12192000', 10)
  const cy = parseInt(sldSz.getAttribute('cy') || '6858000', 10)
  return { slideWidth: cx, slideHeight: cy }
}

// ── Slide Count ──

async function countSlides(zip: JSZip): Promise<number> {
  let count = 0
  for (const path of Object.keys(zip.files)) {
    if (/^ppt\/slides\/slide\d+\.xml$/.test(path)) {
      count++
    }
  }
  return count
}

// ── Slide Parser ──

async function parseSlide(
  zip: JSZip,
  index: number,
  theme: ThemeData,
): Promise<SlideData | null> {
  const slideXml = await getXml(zip, `ppt/slides/slide${index}.xml`)
  if (!slideXml) return null

  const textBoxes: TextBoxData[] = []
  const shapes: ShapeData[] = []
  const images: ImageData[] = []

  // Parse shapes and text boxes
  const spElements = slideXml.querySelectorAll('sp')
  for (const sp of spElements) {
    const textBox = parseTextBox(sp, theme)
    if (textBox && textBox.text.trim()) {
      textBoxes.push(textBox)
    }

    const shape = parseShape(sp)
    if (shape) {
      shapes.push(shape)
    }
  }

  // Parse pictures
  const picElements = slideXml.querySelectorAll('pic')
  for (const pic of picElements) {
    const image = await parseImage(pic, zip, index)
    if (image) images.push(image)
  }

  // Parse background
  const background = parseSlideBackground(slideXml, theme)

  // Parse speaker notes
  const speakerNotes = await parseSpeakerNotes(zip, index)

  // Parse transition
  const transition = parseTransition(slideXml)

  return {
    index: index - 1,
    textBoxes,
    shapes,
    images,
    background,
    speakerNotes,
    transition,
  }
}

// ── Text Box Parser ──

function parseTextBox(sp: Element, theme: ThemeData): TextBoxData | null {
  const txBody = sp.querySelector('txBody')
  if (!txBody) return null

  // Extract position and size
  const spPr = sp.querySelector('spPr')
  const off = spPr?.querySelector('off')
  const ext = spPr?.querySelector('ext')

  const x = emuToPixels(parseInt(off?.getAttribute('x') || '0', 10))
  const y = emuToPixels(parseInt(off?.getAttribute('y') || '0', 10))
  const width = emuToPixels(parseInt(ext?.getAttribute('cx') || '0', 10))
  const height = emuToPixels(parseInt(ext?.getAttribute('cy') || '0', 10))

  // Extract rotation
  const xfrm = spPr?.querySelector('xfrm')
  const rot = parseInt(xfrm?.getAttribute('rot') || '0', 10)
  const rotation = rot / 60000 // PPTX rotation is in 60,000ths of a degree

  // Extract text content and formatting from runs
  const paragraphs = txBody.querySelectorAll('p')
  const textParts: string[] = []
  let fontSize = 18
  let fontFamily = theme.fonts.body
  let fontColor = '#000000'
  let bold = false
  let italic = false
  let alignment: 'left' | 'center' | 'right' = 'left'

  for (const p of paragraphs) {
    // Paragraph alignment
    const pPr = p.querySelector('pPr')
    const algn = pPr?.getAttribute('algn')
    if (algn === 'ctr') alignment = 'center'
    else if (algn === 'r') alignment = 'right'

    const runs = p.querySelectorAll('r')
    for (const r of runs) {
      const text = r.querySelector('t')?.textContent || ''
      textParts.push(text)

      // Run properties
      const rPr = r.querySelector('rPr')
      if (rPr) {
        const sz = rPr.getAttribute('sz')
        if (sz) fontSize = Math.round(parseInt(sz, 10) / 100) // hundredths of a point → pt

        const b = rPr.getAttribute('b')
        if (b === '1' || b === 'true') bold = true

        const i = rPr.getAttribute('i')
        if (i === '1' || i === 'true') italic = true

        // Font family from Latin element
        const latin = rPr.querySelector('latin')
        if (latin) fontFamily = mapFont(latin.getAttribute('typeface') || theme.fonts.body)

        // Color
        const solidFill = rPr.querySelector('solidFill')
        if (solidFill) {
          const srgbClr = solidFill.querySelector('srgbClr')
          if (srgbClr) fontColor = `#${srgbClr.getAttribute('val') || '000000'}`

          const schemeClr = solidFill.querySelector('schemeClr')
          if (schemeClr) {
            const schemeVal = schemeClr.getAttribute('val') || ''
            fontColor = theme.colors[schemeVal] || fontColor
          }
        }
      }
    }

    if (textParts.length > 0 && paragraphs.length > 1) {
      textParts.push('\n')
    }
  }

  const text = textParts.join('').trim()
  if (!text) return null

  return {
    text,
    x,
    y,
    width,
    height,
    fontSize,
    fontFamily,
    fontColor,
    bold,
    italic,
    alignment,
    rotation,
  }
}

// ── Shape Parser ──

function parseShape(sp: Element): ShapeData | null {
  const prstGeom = sp.querySelector('prstGeom')
  if (!prstGeom) return null

  const prst = prstGeom.getAttribute('prst') || ''
  const mappedType = SHAPE_TYPE_MAP[prst]
  if (!mappedType) return null

  const spPr = sp.querySelector('spPr')
  const off = spPr?.querySelector('off')
  const ext = spPr?.querySelector('ext')

  const x = emuToPixels(parseInt(off?.getAttribute('x') || '0', 10))
  const y = emuToPixels(parseInt(off?.getAttribute('y') || '0', 10))
  const width = emuToPixels(parseInt(ext?.getAttribute('cx') || '0', 10))
  const height = emuToPixels(parseInt(ext?.getAttribute('cy') || '0', 10))

  const xfrm = spPr?.querySelector('xfrm')
  const rot = parseInt(xfrm?.getAttribute('rot') || '0', 10)
  const rotation = rot / 60000

  // Fill color
  let fillColor = '#3b82f6'
  const solidFill = spPr?.querySelector('solidFill')
  if (solidFill) {
    const srgbClr = solidFill.querySelector('srgbClr')
    if (srgbClr) fillColor = `#${srgbClr.getAttribute('val') || '3b82f6'}`
  }

  // Stroke
  let strokeColor = 'transparent'
  let strokeWidth = 0
  const ln = spPr?.querySelector('ln')
  if (ln) {
    strokeWidth = emuToPixels(parseInt(ln.getAttribute('w') || '0', 10))
    const lnFill = ln.querySelector('solidFill srgbClr')
    if (lnFill) strokeColor = `#${lnFill.getAttribute('val') || '000000'}`
  }

  return {
    type: mappedType,
    x,
    y,
    width,
    height,
    fillColor,
    strokeColor,
    strokeWidth,
    rotation,
  }
}

// ── Image Parser ──

async function parseImage(
  pic: Element,
  zip: JSZip,
  slideIndex: number,
): Promise<ImageData | null> {
  // Get the blip reference (image relationship)
  const blipFill = pic.querySelector('blipFill')
  const blip = blipFill?.querySelector('blip')
  const embedId = blip?.getAttribute('r:embed') || blip?.getAttributeNS(
    'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
    'embed',
  )
  if (!embedId) return null

  // Resolve relationship to file path
  const relsPath = `ppt/slides/_rels/slide${slideIndex}.xml.rels`
  const relsXml = await getXml(zip, relsPath)
  if (!relsXml) return null

  const relationships = relsXml.querySelectorAll('Relationship')
  let imagePath: string | null = null
  for (const rel of relationships) {
    if (rel.getAttribute('Id') === embedId) {
      const target = rel.getAttribute('Target') || ''
      imagePath = target.startsWith('/') ? target.slice(1) : `ppt/slides/${target}`
      // Normalize path (resolve ../)
      imagePath = imagePath.replace(/[^/]+\/\.\.\//g, '')
      break
    }
  }

  if (!imagePath) return null

  // Extract image from zip
  const imageFile = zip.file(imagePath)
  if (!imageFile) return null

  const imageBlob = await imageFile.async('blob')
  const ext = imagePath.split('.').pop()?.toLowerCase() || 'png'
  const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
    : ext === 'png' ? 'image/png'
    : ext === 'gif' ? 'image/gif'
    : 'image/png'

  const dataUrl = await blobToDataUrl(new Blob([imageBlob], { type: mimeType }))

  // Position and size
  const spPr = pic.querySelector('spPr')
  const off = spPr?.querySelector('off')
  const ext_ = spPr?.querySelector('ext')

  const x = emuToPixels(parseInt(off?.getAttribute('x') || '0', 10))
  const y = emuToPixels(parseInt(off?.getAttribute('y') || '0', 10))
  const width = emuToPixels(parseInt(ext_?.getAttribute('cx') || '0', 10))
  const height = emuToPixels(parseInt(ext_?.getAttribute('cy') || '0', 10))

  return {
    dataUrl,
    x,
    y,
    width,
    height,
    filename: imagePath.split('/').pop() || 'image.png',
  }
}

// ── Speaker Notes ──

async function parseSpeakerNotes(zip: JSZip, slideIndex: number): Promise<string> {
  const notesXml = await getXml(zip, `ppt/notesSlides/notesSlide${slideIndex}.xml`)
  if (!notesXml) return ''

  const paragraphs = notesXml.querySelectorAll('txBody p')
  const texts: string[] = []

  for (const p of paragraphs) {
    const runs = p.querySelectorAll('r t')
    for (const t of runs) {
      const text = t.textContent?.trim()
      if (text) texts.push(text)
    }
  }

  return texts.join(' ').trim()
}

// ── Transition Parser ──

function parseTransition(slideXml: Document): TransitionData {
  const transition = slideXml.querySelector('transition')
  if (!transition) return { type: 'none', duration: 0 }

  const spd = transition.getAttribute('spd')
  const duration = spd === 'slow' ? 1.5 : spd === 'med' ? 0.75 : 0.3

  // Check transition type by child elements
  if (transition.querySelector('fade')) return { type: 'fade', duration }
  if (transition.querySelector('push')) return { type: 'push', duration }
  if (transition.querySelector('wipe')) return { type: 'wipe', duration }
  if (transition.querySelector('split')) return { type: 'split', duration }
  if (transition.querySelector('dissolve')) return { type: 'dissolve', duration }

  return { type: 'fade', duration }
}

// ── Background Parser ──

function parseSlideBackground(
  slideXml: Document,
  theme: ThemeData,
): SlideData['background'] {
  const bg = slideXml.querySelector('bg')
  if (!bg) return { type: 'none' }

  const bgPr = bg.querySelector('bgPr')
  if (!bgPr) return { type: 'none' }

  // Solid fill
  const solidFill = bgPr.querySelector('solidFill')
  if (solidFill) {
    const srgbClr = solidFill.querySelector('srgbClr')
    if (srgbClr) {
      return { type: 'solid', color: `#${srgbClr.getAttribute('val') || 'ffffff'}` }
    }
    const schemeClr = solidFill.querySelector('schemeClr')
    if (schemeClr) {
      const val = schemeClr.getAttribute('val') || ''
      return { type: 'solid', color: theme.colors[val] || '#ffffff' }
    }
  }

  // Gradient fill
  const gradFill = bgPr.querySelector('gradFill')
  if (gradFill) {
    const firstStop = gradFill.querySelector('gs srgbClr')
    const color = firstStop ? `#${firstStop.getAttribute('val') || 'ffffff'}` : '#ffffff'
    return { type: 'gradient', color }
  }

  return { type: 'none' }
}

// ── Theme Parser ──

async function parseTheme(zip: JSZip): Promise<ThemeData> {
  const themeXml = await getXml(zip, 'ppt/theme/theme1.xml')

  const colors: Record<string, string> = {
    dk1: '#000000',
    lt1: '#ffffff',
    dk2: '#44546a',
    lt2: '#e7e6e6',
    accent1: '#4472c4',
    accent2: '#ed7d31',
    accent3: '#a5a5a5',
    accent4: '#ffc000',
    accent5: '#5b9bd5',
    accent6: '#70ad47',
  }

  const fonts: ThemeData['fonts'] = {
    heading: 'Inter',
    body: 'Inter',
  }

  if (themeXml) {
    // Extract theme colors
    const clrScheme = themeXml.querySelector('clrScheme')
    if (clrScheme) {
      for (const [key] of Object.entries(colors)) {
        const el = clrScheme.querySelector(key)
        if (el) {
          const srgb = el.querySelector('srgbClr')
          if (srgb) colors[key] = `#${srgb.getAttribute('val') || colors[key].slice(1)}`
          const sysClr = el.querySelector('sysClr')
          if (sysClr) colors[key] = `#${sysClr.getAttribute('lastClr') || colors[key].slice(1)}`
        }
      }
    }

    // Extract fonts
    const fontScheme = themeXml.querySelector('fontScheme')
    if (fontScheme) {
      const majorFont = fontScheme.querySelector('majorFont latin')
      if (majorFont) fonts.heading = mapFont(majorFont.getAttribute('typeface') || 'Inter')
      const minorFont = fontScheme.querySelector('minorFont latin')
      if (minorFont) fonts.body = mapFont(minorFont.getAttribute('typeface') || 'Inter')
    }
  }

  return { colors, fonts }
}

// ── Utilities ──

async function getXml(zip: JSZip, path: string): Promise<Document | null> {
  const file = zip.file(path)
  if (!file) return null

  const text = await file.async('text')
  const parser = new DOMParser()
  return parser.parseFromString(text, 'application/xml')
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
