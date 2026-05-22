/**
 * Brand Kit Store — Persistent brand identity for consistent content.
 *
 * Stores brand colors, fonts, logos, and templates to auto-apply
 * across orchestrator-generated clips.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { persist } from 'zustand/middleware'

// ── Types ──────────────────────────────────────────────────────────────

export interface BrandKit {
  /** Brand/business name */
  name: string
  /** Industry/niche */
  industry: string
  /** Brand tone of voice */
  tone: string
  /** Primary brand colors (hex) */
  primaryColors: string[]
  /** Secondary colors */
  secondaryColors: string[]
  /** Brand tagline */
  tagline: string
  /** Preferred font family for headings */
  headingFont: string
  /** Preferred font family for body text */
  bodyFont: string
  /** Logo asset ID (from media store) */
  logoAssetId: string | null
  /** Logo URL */
  logoUrl: string | null
  /** Watermark text (if no logo) */
  watermarkText: string
  /** Preferred intro template ID */
  introTemplateId: string | null
  /** Preferred outro template ID */
  outroTemplateId: string | null
}

// ── Store ──────────────────────────────────────────────────────────────

interface BrandState {
  /** Active brand kit */
  kit: BrandKit
  /** Whether brand kit is enabled for orchestrator */
  enabled: boolean
  /** Saved brand kits */
  savedKits: Array<{ id: string; name: string; kit: BrandKit }>

  // Actions
  setEnabled: (enabled: boolean) => void
  updateKit: (updates: Partial<BrandKit>) => void
  addColor: (color: string, type: 'primary' | 'secondary') => void
  removeColor: (index: number, type: 'primary' | 'secondary') => void
  setLogo: (assetId: string, url: string) => void
  clearLogo: () => void
  saveKit: (name: string) => void
  loadKit: (id: string) => void
  deleteKit: (id: string) => void
  reset: () => void
}

const DEFAULT_KIT: BrandKit = {
  name: '',
  industry: '',
  tone: 'professional',
  primaryColors: [],
  secondaryColors: [],
  tagline: '',
  headingFont: 'Montserrat',
  bodyFont: 'Inter',
  logoAssetId: null,
  logoUrl: null,
  watermarkText: '',
  introTemplateId: null,
  outroTemplateId: null,
}

export const useBrandStore = create<BrandState>()(
  persist(
    immer((set, _get) => ({
      kit: { ...DEFAULT_KIT },
      enabled: false,
      savedKits: [],

      setEnabled: (enabled) =>
        set((s) => {
          s.enabled = enabled
        }),

      updateKit: (updates) =>
        set((s) => {
          Object.assign(s.kit, updates)
        }),

      addColor: (color, type) =>
        set((s) => {
          const arr = type === 'primary' ? s.kit.primaryColors : s.kit.secondaryColors
          if (!arr.includes(color)) arr.push(color)
        }),

      removeColor: (index, type) =>
        set((s) => {
          const arr = type === 'primary' ? s.kit.primaryColors : s.kit.secondaryColors
          if (index >= 0 && index < arr.length) arr.splice(index, 1)
        }),

      setLogo: (assetId, url) =>
        set((s) => {
          s.kit.logoAssetId = assetId
          s.kit.logoUrl = url
        }),

      clearLogo: () =>
        set((s) => {
          s.kit.logoAssetId = null
          s.kit.logoUrl = null
        }),

      saveKit: (name) =>
        set((s) => {
          s.savedKits.push({
            id: `brand_${Date.now()}`,
            name,
            kit: JSON.parse(JSON.stringify(s.kit)),
          })
        }),

      loadKit: (id) =>
        set((s) => {
          const saved = s.savedKits.find((k) => k.id === id)
          if (saved) {
            s.kit = JSON.parse(JSON.stringify(saved.kit))
            s.enabled = true
          }
        }),

      deleteKit: (id) =>
        set((s) => {
          s.savedKits = s.savedKits.filter((k) => k.id !== id)
        }),

      reset: () =>
        set((s) => {
          s.kit = { ...DEFAULT_KIT }
          s.enabled = false
        }),
    })),
    {
      name: 'proanimate-brand-kit',
      partialize: (state) => ({
        kit: state.kit,
        enabled: state.enabled,
        savedKits: state.savedKits,
      }),
    }
  )
)
