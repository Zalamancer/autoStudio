/**
 * BrandKitPropertiesPanel — Right panel for editing the active brand kit.
 * Follows the same pattern as CameraPropertiesPanel:
 * p-4 space-y-4 with h4 section headers + PanelSlider/PanelSelect controls.
 */

import { useState, useRef } from 'react'
import { Palette, Upload, Loader2, Trash2 } from 'lucide-react'
import { useBrandKitStore } from '@/stores/useBrandKitStore'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { useShallow } from 'zustand/react/shallow'
import { ColorPicker } from '@/components/ui'
import { PanelSlider, PanelSelect } from '@/components/ui/panel-controls'
import { cn } from '@/lib/utils'

const FONT_OPTIONS = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Oswald',
  'Playfair Display',
  'Raleway',
  'Source Sans 3',
  'Nunito',
  'Ubuntu',
  'Merriweather',
  'PT Sans',
  'Work Sans',
]

const TONE_OPTIONS = [
  'professional',
  'casual',
  'playful',
  'energetic',
  'luxury',
  'minimalist',
  'bold',
  'friendly',
  'corporate',
  'creative',
]

export function BrandKitPropertiesPanel({
  activeTab,
}: {
  activeTab: 'all' | 'identity' | 'colors' | 'typography' | 'media' | 'voice'
}) {
  const { brandKits, activeBrandKitId, updateBrandKit, deleteBrandKit, uploadLogo, uploadWatermark } = useBrandKitStore(
    useShallow((s) => ({
      brandKits: s.brandKits,
      activeBrandKitId: s.activeBrandKitId,
      updateBrandKit: s.updateBrandKit,
      deleteBrandKit: s.deleteBrandKit,
      uploadLogo: s.uploadLogo,
      uploadWatermark: s.uploadWatermark,
    })),
  )
  const availableVoices = useVoiceStore((s) => s.availableVoices)

  const logoInputRef = useRef<HTMLInputElement>(null)
  const watermarkInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingWatermark, setIsUploadingWatermark] = useState(false)

  const kit = brandKits.find((k) => k.id === activeBrandKitId)

  if (!kit) {
    return (
      <div className="p-4 text-center text-zinc-500">
        <Palette size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-xs">No brand kit selected</p>
        <p className="text-[10px] mt-1">Create or select a brand kit from the Design panel</p>
      </div>
    )
  }

  const handleImageUpload = async (
    file: File,
    field: 'logoUrl' | 'watermarkUrl',
    setUploading: (v: boolean) => void,
  ) => {
    setUploading(true)
    try {
      if (field === 'logoUrl') {
        await uploadLogo(kit.id, file)
      } else {
        await uploadWatermark(kit.id, file)
      }
    } catch {
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      updateBrandKit(kit.id, { [field]: base64 })
    } finally {
      setUploading(false)
    }
  }

  const showIdentity = activeTab === 'all' || activeTab === 'identity'
  const showColors = activeTab === 'all' || activeTab === 'colors'
  const showTypography = activeTab === 'all' || activeTab === 'typography'
  const showMedia = activeTab === 'all' || activeTab === 'media'
  const showVoice = activeTab === 'all' || activeTab === 'voice'

  return (
    <div className="p-4 space-y-4">
      {/* Identity */}
      {showIdentity && (
        <div className="space-y-3">
          {activeTab === 'all' && (
            <h4 className="text-xs font-medium text-zinc-400 tracking-wider uppercase">Identity</h4>
          )}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-gray-400 text-sm w-20 shrink-0">Name</span>
            <input
              value={kit.name}
              onChange={(e) => updateBrandKit(kit.id, { name: e.target.value })}
              className="flex-1 min-w-0 bg-panel-surface text-sm text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Brand name..."
            />
          </div>
          <PanelSelect
            label="Tone"
            value={kit.tone}
            onChange={(v) => updateBrandKit(kit.id, { tone: v })}
            options={TONE_OPTIONS.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
          />
        </div>
      )}

      {/* Divider */}
      {activeTab === 'all' && <div className="border-t border-white/5" />}

      {/* Colors */}
      {showColors && (
        <div className="space-y-3">
          {activeTab === 'all' && (
            <h4 className="text-xs font-medium text-zinc-400 tracking-wider uppercase">Colors</h4>
          )}
          <div className="flex items-center gap-2">
            <ColorPicker color={kit.primaryColor} onChange={(v) => updateBrandKit(kit.id, { primaryColor: v })} />
            <span className="text-xs text-zinc-400 flex-1">Primary</span>
            <span className="text-[10px] text-zinc-600 font-mono">{kit.primaryColor}</span>
          </div>
          <div className="flex items-center gap-2">
            <ColorPicker color={kit.secondaryColor} onChange={(v) => updateBrandKit(kit.id, { secondaryColor: v })} />
            <span className="text-xs text-zinc-400 flex-1">Secondary</span>
            <span className="text-[10px] text-zinc-600 font-mono">{kit.secondaryColor}</span>
          </div>
          <div className="flex items-center gap-2">
            <ColorPicker color={kit.accentColor} onChange={(v) => updateBrandKit(kit.id, { accentColor: v })} />
            <span className="text-xs text-zinc-400 flex-1">Accent</span>
            <span className="text-[10px] text-zinc-600 font-mono">{kit.accentColor}</span>
          </div>
          {kit.bgColor && (
            <div className="flex items-center gap-2">
              <ColorPicker color={kit.bgColor} onChange={(v) => updateBrandKit(kit.id, { bgColor: v })} />
              <span className="text-xs text-zinc-400 flex-1">Background</span>
              <span className="text-[10px] text-zinc-600 font-mono">{kit.bgColor}</span>
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      {activeTab === 'all' && <div className="border-t border-white/5" />}

      {/* Typography */}
      {showTypography && (
        <div className="space-y-3">
          {activeTab === 'all' && (
            <h4 className="text-xs font-medium text-zinc-400 tracking-wider uppercase">Typography</h4>
          )}
          <PanelSelect
            label="Heading"
            value={kit.headingFont}
            onChange={(v) => updateBrandKit(kit.id, { headingFont: v })}
            options={FONT_OPTIONS.map((f) => ({ value: f, label: f }))}
          />
          <PanelSelect
            label="Body"
            value={kit.bodyFont}
            onChange={(v) => updateBrandKit(kit.id, { bodyFont: v })}
            options={FONT_OPTIONS.map((f) => ({ value: f, label: f }))}
          />
          <div className="p-2.5 rounded-lg bg-panel-surface border border-white/5">
            <p className="text-sm font-bold text-zinc-200" style={{ fontFamily: kit.headingFont }}>
              Heading Preview
            </p>
            <p className="text-xs text-zinc-400 mt-1" style={{ fontFamily: kit.bodyFont }}>
              Body text preview — {kit.bodyFont}
            </p>
          </div>
        </div>
      )}

      {/* Divider */}
      {activeTab === 'all' && <div className="border-t border-white/5" />}

      {/* Logo & Watermark */}
      {showMedia && (
        <div className="space-y-3">
          {activeTab === 'all' && (
            <h4 className="text-xs font-medium text-zinc-400 tracking-wider uppercase">Logo & Watermark</h4>
          )}
          {/* Logo */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-gray-400 text-sm w-20 shrink-0">Logo</span>
            {kit.logoUrl ? (
              <div className="flex-1 flex items-center gap-2 min-w-0">
                <img
                  src={kit.logoUrl}
                  alt="Logo"
                  className="w-8 h-8 object-contain rounded bg-panel-surface border border-white/5"
                />
                <button
                  onClick={() => updateBrandKit(kit.id, { logoUrl: undefined })}
                  className="text-[10px] text-zinc-600 hover:text-red-400 transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="flex-1 flex items-center justify-center h-8 bg-panel-surface border border-dashed border-white/10 rounded-lg cursor-pointer hover:border-accent/30 transition-colors">
                {isUploadingLogo ? (
                  <Loader2 size={12} className="animate-spin text-zinc-500" />
                ) : (
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <Upload size={11} />
                    <span className="text-[10px]">Upload</span>
                  </div>
                )}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file, 'logoUrl', setIsUploadingLogo)
                  }}
                />
              </label>
            )}
          </div>

          {/* Watermark */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-gray-400 text-sm w-20 shrink-0">Watermark</span>
            {kit.watermarkUrl ? (
              <div className="flex-1 flex items-center gap-2 min-w-0">
                <img
                  src={kit.watermarkUrl}
                  alt="Watermark"
                  className="w-8 h-8 object-contain rounded bg-panel-surface border border-white/5"
                />
                <button
                  onClick={() => updateBrandKit(kit.id, { watermarkUrl: undefined })}
                  className="text-[10px] text-zinc-600 hover:text-red-400 transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="flex-1 flex items-center justify-center h-8 bg-panel-surface border border-dashed border-white/10 rounded-lg cursor-pointer hover:border-accent/30 transition-colors">
                {isUploadingWatermark ? (
                  <Loader2 size={12} className="animate-spin text-zinc-500" />
                ) : (
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <Upload size={11} />
                    <span className="text-[10px]">Upload</span>
                  </div>
                )}
                <input
                  ref={watermarkInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file, 'watermarkUrl', setIsUploadingWatermark)
                  }}
                />
              </label>
            )}
          </div>

          {/* Watermark controls */}
          {kit.watermarkUrl && (
            <>
              <div className="grid grid-cols-2 gap-1">
                {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => updateBrandKit(kit.id, { watermarkPosition: pos })}
                    className={cn(
                      'text-[10px] py-1.5 rounded-lg border transition-colors capitalize',
                      (kit.watermarkPosition || 'bottom-right') === pos
                        ? 'bg-accent/10 border-accent/30 text-accent'
                        : 'bg-panel-surface border-white/5 text-zinc-500 hover:bg-panel-surface-hover',
                    )}
                  >
                    {pos.replace('-', ' ')}
                  </button>
                ))}
              </div>
              <PanelSlider
                label="Opacity"
                value={Math.round((kit.watermarkOpacity ?? 0.5) * 100)}
                onChange={(v) => updateBrandKit(kit.id, { watermarkOpacity: Math.round(v) / 100 })}
                min={0}
                max={100}
                step={1}
                suffix="%"
                precision={0}
              />
            </>
          )}
        </div>
      )}

      {/* Divider */}
      {activeTab === 'all' && <div className="border-t border-white/5" />}

      {/* Default Voice */}
      {showVoice && (
        <div className="space-y-3">
          {activeTab === 'all' && (
            <h4 className="text-xs font-medium text-zinc-400 tracking-wider uppercase">Default Voice</h4>
          )}
          <PanelSelect
            label="Voice"
            value={kit.defaultVoiceId || ''}
            onChange={(v) => updateBrandKit(kit.id, { defaultVoiceId: v || undefined })}
            options={[
              { value: '', label: 'No default voice' },
              ...availableVoices.map((voice) => ({
                value: voice.voice_id,
                label: `${voice.name}${voice.labels?.accent ? ` (${voice.labels.accent})` : ''}`,
              })),
            ]}
          />
          {kit.defaultVoiceId && (
            <p className="text-[10px] text-zinc-500">Used by default when the orchestrator generates new clips.</p>
          )}
        </div>
      )}

      {/* Delete — only in All tab */}
      {activeTab === 'all' && (
        <button
          onClick={() => deleteBrandKit(kit.id)}
          className="w-full py-2 rounded-lg text-xs text-red-400/60 hover:text-red-400 hover:bg-red-500/10 border border-white/5 transition-colors flex items-center justify-center gap-1.5"
        >
          <Trash2 size={12} />
          Delete Brand Kit
        </button>
      )}
    </div>
  )
}
