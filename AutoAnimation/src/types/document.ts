// ── Document/PDF-to-Video Types ──

export interface PageImage {
  dataUrl: string
  width: number
  height: number
  altText?: string
}

export type DocumentPageType = 'title' | 'text' | 'image-heavy' | 'table' | 'chart' | 'diagram'

export interface DocumentPage {
  pageNumber: number
  text: string
  headings: string[]
  images: PageImage[]
  hasTable: boolean
  hasChart: boolean
  pageType: DocumentPageType
  thumbnailDataUrl: string
  /** Whether this page is included in video generation */
  enabled: boolean
}

export interface DocumentExtraction {
  title: string
  author: string
  pageCount: number
  language: string
  pages: DocumentPage[]
}

export interface DocumentVideoSettings {
  /** How many pages per scene (1 = one scene per page, 2 = group pages) */
  pagesPerScene: number
  /** Target duration in seconds */
  targetDuration: number
  /** Whether to include rendered page images as media layers */
  includePageImages: boolean
  /** Narration style */
  narrationStyle: 'formal' | 'conversational' | 'educational'
  /** Transition style between scenes */
  transitionStyle: 'fade' | 'slide' | 'zoom' | 'none'
}
