/**
 * useRecentDocumentsStore — persists recently uploaded PDF extractions
 * so users can re-select them without re-uploading.
 *
 * Stores up to 10 recent documents. Thumbnails are stripped to save space;
 * only the first page thumbnail is kept as a preview.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DocumentExtraction } from '@/types/document'

export interface RecentDocument {
  id: string
  title: string
  author: string
  pageCount: number
  language: string
  uploadedAt: number
  /** First page thumbnail for preview */
  previewThumbnail: string
  /** Full extraction data (thumbnails stripped except first page) */
  extraction: DocumentExtraction
}

interface RecentDocumentsState {
  documents: RecentDocument[]
  addDocument: (extraction: DocumentExtraction) => RecentDocument
  removeDocument: (id: string) => void
  clearAll: () => void
}

const MAX_RECENT = 10

export const useRecentDocumentsStore = create<RecentDocumentsState>()(
  persist(
    (set, get) => ({
      documents: [],

      addDocument: (extraction) => {
        const id = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        const previewThumbnail = extraction.pages[0]?.thumbnailDataUrl ?? ''

        // Keep full extraction but strip thumbnails after first page to save space
        const lightExtraction: DocumentExtraction = {
          ...extraction,
          pages: extraction.pages.map((p, i) => ({
            ...p,
            thumbnailDataUrl: i === 0 ? p.thumbnailDataUrl : '',
            images: [], // Strip embedded images to save space
          })),
        }

        const doc: RecentDocument = {
          id,
          title: extraction.title || 'Untitled Document',
          author: extraction.author || '',
          pageCount: extraction.pageCount,
          language: extraction.language,
          uploadedAt: Date.now(),
          previewThumbnail,
          extraction: lightExtraction,
        }

        set((state) => ({
          documents: [doc, ...state.documents].slice(0, MAX_RECENT),
        }))

        return doc
      },

      removeDocument: (id) =>
        set((state) => ({
          documents: state.documents.filter((d) => d.id !== id),
        })),

      clearAll: () => set({ documents: [] }),
    }),
    {
      name: 'proanimate-recent-documents',
      version: 1,
    },
  ),
)
