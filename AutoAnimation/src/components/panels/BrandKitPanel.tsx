import { useState, useRef } from 'react'
import {
  Palette,
  Plus,
  Type,
  Image,
  Volume2,
  Loader2,
  Check,
  Upload,
  X,
  Settings2,
  Sparkles,
  Globe,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useShallow } from 'zustand/react/shallow'
import { useBrandKitStore } from '@/stores/useBrandKitStore'
import { ColorPicker } from '@/components/ui'
import type { BrandKit } from '@/types/brandKit'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { PanelSlider, PanelSelect } from '@/components/ui/panel-controls'
import { useEditorStore } from '@/stores'

// ── Color swatch input ──────────────────────────────────────────────────────
function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-[10px] text-zinc-500 w-20 shrink-0">{label}</label>
      <ColorPicker color={value} onChange={onChange} />
    </div>
  )
}

// ── Section wrapper ─────────────────────────────────────────────────────────
function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-[11px] font-medium text-zinc-400 tracking-wider flex items-center gap-2 uppercase">
        <Icon size={13} className="text-zinc-500" />
        {title}
      </h4>
      <div className="space-y-3 p-3 bg-panel-surface rounded-lg border border-white/5">{children}</div>
    </div>
  )
}

// ── Kit editor ──────────────────────────────────────────────────────────────
export function KitEditor({ kit }: { kit: BrandKit }) {
  const updateBrandKit = useBrandKitStore((s) => s.updateBrandKit)
  const availableVoices = useVoiceStore((s) => s.availableVoices)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const watermarkInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingWatermark, setIsUploadingWatermark] = useState(false)

  const uploadLogo = useBrandKitStore((s) => s.uploadLogo)
  const uploadWatermark = useBrandKitStore((s) => s.uploadWatermark)

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
      // Fallback to base64 if upload fails
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

  return (
    <div className="space-y-4">
      {/* Brand Name & Metadata */}
      <Section icon={Settings2} title="Brand Identity">
        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-zinc-500 mb-1 block">Brand Name</label>
            <input
              value={kit.name}
              onChange={(e) => updateBrandKit(kit.id, { name: e.target.value })}
              className="w-full bg-panel-bg border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:border-accent/50 focus:outline-none"
            />
          </div>
          <PanelSelect
            label="Tone"
            value={kit.tone}
            onChange={(v) => updateBrandKit(kit.id, { tone: v })}
            options={TONE_OPTIONS.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
            fullWidth
          />
        </div>
      </Section>

      {/* Colors */}
      <Section icon={Palette} title="Colors">
        <div className="space-y-2.5">
          <ColorInput
            label="Primary"
            value={kit.primaryColor}
            onChange={(v) => updateBrandKit(kit.id, { primaryColor: v })}
          />
          <ColorInput
            label="Secondary"
            value={kit.secondaryColor}
            onChange={(v) => updateBrandKit(kit.id, { secondaryColor: v })}
          />
          <ColorInput
            label="Accent"
            value={kit.accentColor}
            onChange={(v) => updateBrandKit(kit.id, { accentColor: v })}
          />
          {kit.bgColor && (
            <ColorInput
              label="Background"
              value={kit.bgColor}
              onChange={(v) => updateBrandKit(kit.id, { bgColor: v })}
            />
          )}
        </div>

        {/* Color preview */}
        <div className="flex gap-1 mt-2">
          {[kit.primaryColor, kit.secondaryColor, kit.accentColor, kit.bgColor].filter(Boolean).map((color, i) => (
            <div key={i} className="flex-1 h-6 rounded-lg border border-white/10" style={{ backgroundColor: color }} />
          ))}
        </div>
      </Section>

      {/* Typography */}
      <Section icon={Type} title="Typography">
        <div className="space-y-3">
          <PanelSelect
            label="Heading Font"
            value={kit.headingFont}
            onChange={(v) => updateBrandKit(kit.id, { headingFont: v })}
            options={FONT_OPTIONS.map((f) => ({ value: f, label: f }))}
            fullWidth
          />
          <PanelSelect
            label="Body Font"
            value={kit.bodyFont}
            onChange={(v) => updateBrandKit(kit.id, { bodyFont: v })}
            options={FONT_OPTIONS.map((f) => ({ value: f, label: f }))}
            fullWidth
          />

          {/* Preview */}
          <div className="p-3 rounded-lg border border-white/5 bg-panel-bg">
            <p className="text-sm font-bold text-zinc-200" style={{ fontFamily: kit.headingFont }}>
              Heading Preview
            </p>
            <p className="text-xs text-zinc-400 mt-1" style={{ fontFamily: kit.bodyFont }}>
              Body text preview — {kit.bodyFont}
            </p>
          </div>
        </div>
      </Section>

      {/* Logo & Watermark */}
      <Section icon={Image} title="Logo & Watermark">
        <div className="space-y-3">
          {/* Logo */}
          <div>
            <label className="text-[10px] text-zinc-500 mb-1 block">Logo</label>
            {kit.logoUrl ? (
              <div className="flex items-center gap-2">
                <img
                  src={kit.logoUrl}
                  alt="Logo"
                  className="w-12 h-12 object-contain rounded-lg bg-panel-bg border border-white/5"
                />
                <button
                  onClick={() => updateBrandKit(kit.id, { logoUrl: undefined })}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center w-full h-14 bg-panel-bg border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-accent/30 transition-colors">
                {isUploadingLogo ? (
                  <Loader2 size={16} className="animate-spin text-zinc-500" />
                ) : (
                  <div className="flex items-center gap-2 text-zinc-500">
                    <Upload size={14} />
                    <span className="text-[10px]">Upload logo</span>
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
          <div>
            <label className="text-[10px] text-zinc-500 mb-1 block">Watermark</label>
            {kit.watermarkUrl ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <img
                    src={kit.watermarkUrl}
                    alt="Watermark"
                    className="w-10 h-10 object-contain rounded-lg bg-panel-bg border border-white/5"
                  />
                  <button
                    onClick={() => updateBrandKit(kit.id, { watermarkUrl: undefined })}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex items-center justify-center w-full h-14 bg-panel-bg border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-accent/30 transition-colors">
                {isUploadingWatermark ? (
                  <Loader2 size={16} className="animate-spin text-zinc-500" />
                ) : (
                  <div className="flex items-center gap-2 text-zinc-500">
                    <Upload size={14} />
                    <span className="text-[10px]">Upload watermark</span>
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
          {/* Watermark Position & Opacity */}
          {kit.watermarkUrl && (
            <div className="space-y-2 mt-2">
              <div>
                <label className="text-[10px] text-zinc-500 mb-1 block">Position</label>
                <div className="grid grid-cols-2 gap-1">
                  {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => updateBrandKit(kit.id, { watermarkPosition: pos })}
                      className={cn(
                        'text-[10px] py-1.5 rounded-lg border transition-colors capitalize',
                        (kit.watermarkPosition || 'bottom-right') === pos
                          ? 'bg-accent/20 border-accent/30 text-accent'
                          : 'bg-panel-bg border-white/5 text-zinc-500 hover:border-white/10',
                      )}
                    >
                      {pos.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>
              <PanelSlider
                label="Opacity"
                value={Math.round((kit.watermarkOpacity ?? 0.5) * 100)}
                onChange={(v) => updateBrandKit(kit.id, { watermarkOpacity: Math.round(v) / 100 })}
                min={0}
                max={100}
                step={1}
                suffix="%"
                compact
              />
            </div>
          )}
        </div>
      </Section>

      {/* Default Voice */}
      <Section icon={Volume2} title="Default Voice">
        <PanelSelect
          value={kit.defaultVoiceId || ''}
          onChange={(v) => updateBrandKit(kit.id, { defaultVoiceId: v || undefined })}
          options={[
            { value: '', label: 'No default voice' },
            ...availableVoices.map((voice) => ({
              value: voice.voice_id,
              label: `${voice.name}${voice.labels?.accent ? ` (${voice.labels.accent})` : ''}`,
            })),
          ]}
          fullWidth
        />
        {kit.defaultVoiceId && (
          <p className="text-[10px] text-zinc-500 mt-1">
            This voice will be used by default when the orchestrator generates new clips.
          </p>
        )}
      </Section>
    </div>
  )
}

// ── Pill tabs ──────────────────────────────────────────────────────────────
const BRAND_TABS = [
  { id: 'kits' as const, label: 'Kits', icon: Palette },
  { id: 'fonts' as const, label: 'Fonts', icon: Type },
  { id: 'assets' as const, label: 'Assets', icon: Image },
]

// ── Main Panel ──────────────────────────────────────────────────────────────
export function BrandKitPanel() {
  const { brandKits, activeBrandKitId, createBrandKit, setActiveBrandKit } = useBrandKitStore(
    useShallow((s) => ({
      brandKits: s.brandKits,
      activeBrandKitId: s.activeBrandKitId,
      createBrandKit: s.createBrandKit,
      setActiveBrandKit: s.setActiveBrandKit,
    })),
  )

  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [importUrl, setImportUrl] = useState('')
  const [importLoading, setImportLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'kits' | 'fonts' | 'assets'>('kits')

  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)

  const q = search.toLowerCase().trim()
  const filteredKits = q ? brandKits.filter((k) => k.name.toLowerCase().includes(q)) : brandKits

  const handleCreateKit = (name: string) => {
    createBrandKit({
      name,
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      accentColor: '#F59E0B',
      headingFont: 'Inter',
      bodyFont: 'Inter',
      tone: 'professional',
    })
    // The newly created kit is the last one in the array
    const kits = useBrandKitStore.getState().brandKits
    const newKit = kits[kits.length - 1]
    if (newKit) {
      setActiveBrandKit(newKit.id)
      setRightPanelTab('brand-kit-properties')
    }
    setNewName('')
    setIsCreating(false)
  }

  const handleImportFromUrl = async () => {
    if (!importUrl.trim()) return
    setImportLoading(true)
    try {
      const { extractBrandFromUrl } = await import('@/services/brandKitService')
      const extracted = await extractBrandFromUrl(importUrl.trim())
      const domain = new URL(importUrl.trim()).hostname.replace('www.', '')
      createBrandKit({
        name: domain,
        primaryColor: extracted.primaryColor || '#3B82F6',
        secondaryColor: extracted.secondaryColor || '#1E40AF',
        accentColor: extracted.accentColor || '#F59E0B',
        bgColor: extracted.bgColor,
        headingFont: extracted.headingFont || 'Inter',
        bodyFont: extracted.bodyFont || 'Inter',
        tone: extracted.tone || 'professional',
      })
      // Select the new kit and open in right panel
      const kits = useBrandKitStore.getState().brandKits
      const newKit = kits[kits.length - 1]
      if (newKit) {
        setActiveBrandKit(newKit.id)
        setRightPanelTab('brand-kit-properties')
      }
      setIsImporting(false)
      setImportUrl('')
    } catch {
      // Silently fail — create with defaults
      setIsImporting(false)
    } finally {
      setImportLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Pill Tab Bar ── */}
      <div className="shrink-0 flex items-center gap-1 px-3 py-2 border-b border-white/5">
        {BRAND_TABS.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
              style={{
                flex: isActive ? 2 : 1,
                transition:
                  'flex 300ms cubic-bezier(0.25, 1, 0.5, 1), background-color 200ms, color 200ms, padding 200ms',
              }}
              className={cn(
                'relative h-8 rounded-lg flex items-center justify-center gap-1.5 overflow-hidden',
                isActive ? 'bg-white text-black px-2' : 'text-gray-400 hover:text-white hover:bg-panel-surface',
              )}
            >
              <Icon size={16} className="shrink-0" />
              <span
                style={{ transition: 'max-width 300ms cubic-bezier(0.25, 1, 0.5, 1) 50ms, opacity 200ms ease 60ms' }}
                className={cn(
                  'text-[11px] font-medium truncate',
                  isActive ? 'max-w-[80px] opacity-100' : 'max-w-0 opacity-0',
                )}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>

      {activeTab === 'fonts' ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
          <Type size={28} className="mb-3" />
          <span className="text-sm text-gray-400">Fonts library coming soon</span>
          <span className="text-xs text-gray-600 mt-1">Manage and preview brand fonts here</span>
        </div>
      ) : activeTab === 'assets' ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
          <Image size={28} className="mb-3" />
          <span className="text-sm text-gray-400">Brand assets coming soon</span>
          <span className="text-xs text-gray-600 mt-1">Upload and organize brand assets here</span>
        </div>
      ) : (
        <>
          {/* ── Search Bar ── */}
          {brandKits.length > 0 && (
            <div className="shrink-0 px-3 py-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search brand kits..."
                  className="w-full pl-8 pr-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 border border-white/5 focus:border-accent/30 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* ── Scrollable content ── */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
            {/* Kit selector tabs */}
            {filteredKits.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {filteredKits.map((kit) => (
                  <button
                    key={kit.id}
                    onClick={() => {
                      setActiveBrandKit(kit.id)
                      setRightPanelTab('brand-kit-properties')
                    }}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                      activeBrandKitId === kit.id
                        ? 'bg-accent/10 text-accent border-accent/30'
                        : 'bg-panel-surface text-zinc-400 border-white/5 hover:bg-panel-surface-hover',
                    )}
                  >
                    <div
                      className="w-3 h-3 rounded-full border border-white/20"
                      style={{ backgroundColor: kit.primaryColor }}
                    />
                    {kit.name}
                  </button>
                ))}
              </div>
            )}

            {/* Create new kit */}
            {isCreating ? (
              <div className="flex items-center gap-2">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Brand name..."
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newName.trim()) {
                      handleCreateKit(newName.trim())
                    }
                    if (e.key === 'Escape') setIsCreating(false)
                  }}
                  className="flex-1 bg-panel-bg border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:border-accent/50 focus:outline-none placeholder:text-zinc-600"
                />
                <button
                  onClick={() => {
                    if (newName.trim()) handleCreateKit(newName.trim())
                  }}
                  disabled={!newName.trim()}
                  className="p-2 rounded-lg bg-accent text-white hover:bg-[#5a8aff] disabled:bg-zinc-700 disabled:text-zinc-500 transition-colors"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false)
                    setNewName('')
                  }}
                  className="p-2 rounded-lg bg-panel-surface text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsCreating(true)}
                  className="flex-1 py-2.5 rounded-lg border-2 border-dashed border-white/10 text-zinc-500 text-xs font-medium hover:border-accent/30 hover:text-accent transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={14} />
                  Create
                </button>
                <button
                  onClick={() => setIsImporting(true)}
                  className="flex-1 py-2.5 rounded-lg border-2 border-dashed border-white/10 text-zinc-500 text-xs font-medium hover:border-accent/30 hover:text-accent transition-all flex items-center justify-center gap-2"
                >
                  <Globe size={14} />
                  Import URL
                </button>
              </div>
            )}

            {/* Import from URL */}
            {isImporting && (
              <div className="flex items-center gap-2">
                <input
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  placeholder="https://example.com"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleImportFromUrl()
                    if (e.key === 'Escape') {
                      setIsImporting(false)
                      setImportUrl('')
                    }
                  }}
                  className="flex-1 bg-panel-bg border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:border-accent/50 focus:outline-none placeholder:text-zinc-600"
                />
                <button
                  onClick={handleImportFromUrl}
                  disabled={!importUrl.trim() || importLoading}
                  className="p-2 rounded-lg bg-accent text-white hover:bg-[#5a8aff] disabled:bg-zinc-700 disabled:text-zinc-500 transition-colors"
                >
                  {importLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                </button>
                <button
                  onClick={() => {
                    setIsImporting(false)
                    setImportUrl('')
                  }}
                  className="p-2 rounded-lg bg-panel-surface text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Empty state */}
            {brandKits.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                <Palette size={28} className="mb-3" />
                <span className="text-sm text-gray-400">No brand kits yet</span>
                <span className="text-xs text-gray-600 mt-1">Create a brand kit to auto-apply your identity</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
