/**
 * Brand Panel — Brand kit management for consistent content creation.
 */

import { useState, useRef } from 'react'
import { Briefcase, Plus, Trash2, Save, FolderOpen, Type, Palette as PaletteIcon, Image, Upload } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useBrandStore } from '@/stores/useBrandStore'
import { PanelLayout } from '@/components/ui/PanelHeader'
import { PanelSelect } from '@/components/ui/panel-controls'
import { ColorPicker } from '@/components/ui'
import { cn } from '@/lib/utils'

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
    <div className="space-y-4">
      <h4 className="text-xs font-medium text-zinc-400 tracking-wider flex items-center gap-2 uppercase">
        <Icon size={14} className="text-zinc-500" />
        {title}
      </h4>
      <div className="space-y-3 p-3 bg-zinc-800/20 backdrop-blur-xl rounded-2xl border border-white/5 shadow-inner">
        {children}
      </div>
    </div>
  )
}

function ColorInput({ color, onChange, onRemove }: { color: string; onChange: (c: string) => void; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-1.5 group">
      <ColorPicker color={color} onChange={onChange} />
      <span className="text-[10px] font-mono text-zinc-400 flex-1">{color}</span>
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/20 text-zinc-600 hover:text-red-400 transition-all"
      >
        <Trash2 size={10} />
      </button>
    </div>
  )
}

export function BrandPanel() {
  const {
    kit,
    enabled,
    savedKits,
    setEnabled,
    updateKit,
    addColor,
    removeColor,
    setLogo,
    clearLogo,
    saveKit,
    loadKit,
    deleteKit,
  } = useBrandStore(
    useShallow((s) => ({
      kit: s.kit,
      enabled: s.enabled,
      savedKits: s.savedKits,
      setEnabled: s.setEnabled,
      updateKit: s.updateKit,
      addColor: s.addColor,
      removeColor: s.removeColor,
      setLogo: s.setLogo,
      clearLogo: s.clearLogo,
      saveKit: s.saveKit,
      loadKit: s.loadKit,
      deleteKit: s.deleteKit,
    }))
  )

  const [newColor, setNewColor] = useState('#6366f1')
  const [saveName, setSaveName] = useState('')
  const logoInputRef = useRef<HTMLInputElement>(null)

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    const assetId = `logo_${Date.now()}`
    setLogo(assetId, url)
    e.target.value = ''
  }

  return (
    <PanelLayout icon={Briefcase} title="Brand Kit" iconClassName="text-indigo-400">
      {/* Enable Toggle */}
      <div className="flex items-center justify-between p-3 bg-zinc-800/20 rounded-2xl border border-white/5">
        <div className="flex items-center gap-2">
          <Briefcase size={16} className={enabled ? 'text-indigo-400' : 'text-zinc-500'} />
          <div>
            <div className="text-xs font-medium text-zinc-300">Brand Kit</div>
            <div className="text-[9px] text-zinc-500">Auto-apply to generated clips</div>
          </div>
        </div>
        <button
          onClick={() => setEnabled(!enabled)}
          className={cn(
            'relative w-10 h-5 rounded-full transition-colors duration-200',
            enabled ? 'bg-indigo-500' : 'bg-zinc-700'
          )}
        >
          <div
            className={cn(
              'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200',
              enabled ? 'translate-x-5' : 'translate-x-0.5'
            )}
          />
        </button>
      </div>

      {/* Brand Identity */}
      <Section icon={Briefcase} title="Identity">
        <div className="space-y-2">
          <div>
            <label className="text-[9px] text-zinc-500 uppercase mb-1 block">Brand Name</label>
            <input
              value={kit.name}
              onChange={(e) => updateKit({ name: e.target.value })}
              placeholder="Your Brand"
              className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:border-indigo-500/50 focus:outline-none placeholder:text-zinc-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] text-zinc-500 uppercase mb-1 block">Industry</label>
              <input
                value={kit.industry}
                onChange={(e) => updateKit({ industry: e.target.value })}
                placeholder="Tech, Food..."
                className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:border-indigo-500/50 focus:outline-none placeholder:text-zinc-600"
              />
            </div>
            <PanelSelect
              label="Tone"
              value={kit.tone}
              onChange={(v) => updateKit({ tone: v })}
              options={[
                { value: 'professional', label: 'Professional' },
                { value: 'casual', label: 'Casual' },
                { value: 'playful', label: 'Playful' },
                { value: 'bold', label: 'Bold' },
                { value: 'elegant', label: 'Elegant' },
                { value: 'friendly', label: 'Friendly' },
              ]}
              fullWidth
            />
          </div>
          <div>
            <label className="text-[9px] text-zinc-500 uppercase mb-1 block">Tagline</label>
            <input
              value={kit.tagline}
              onChange={(e) => updateKit({ tagline: e.target.value })}
              placeholder="Your catchy tagline..."
              className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:border-indigo-500/50 focus:outline-none placeholder:text-zinc-600"
            />
          </div>
        </div>
      </Section>

      {/* Colors */}
      <Section icon={PaletteIcon} title="Colors">
        <div className="space-y-2">
          <div className="text-[9px] text-zinc-500 uppercase">Primary</div>
          {kit.primaryColors.map((color, i) => (
            <ColorInput
              key={i}
              color={color}
              onChange={(c) => {
                const colors = [...kit.primaryColors]
                colors[i] = c
                updateKit({ primaryColors: colors })
              }}
              onRemove={() => removeColor(i, 'primary')}
            />
          ))}
          <div className="flex items-center gap-1.5">
            <ColorPicker color={newColor} onChange={(c) => setNewColor(c)} className="!w-5 !h-5" />
            <button
              onClick={() => addColor(newColor, 'primary')}
              className="text-[9px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <Plus size={10} /> Add Color
            </button>
          </div>
        </div>
      </Section>

      {/* Typography */}
      <Section icon={Type} title="Typography">
        <div className="grid grid-cols-2 gap-2">
          <PanelSelect
            label="Headings"
            value={kit.headingFont}
            onChange={(v) => updateKit({ headingFont: v })}
            options={[
              { value: 'Montserrat', label: 'Montserrat' },
              { value: 'Inter', label: 'Inter' },
              { value: 'Roboto', label: 'Roboto' },
              { value: 'Playfair Display', label: 'Playfair Display' },
              { value: 'Space Mono', label: 'Space Mono' },
            ]}
            fullWidth
          />
          <PanelSelect
            label="Body"
            value={kit.bodyFont}
            onChange={(v) => updateKit({ bodyFont: v })}
            options={[
              { value: 'Inter', label: 'Inter' },
              { value: 'Roboto', label: 'Roboto' },
              { value: 'Montserrat', label: 'Montserrat' },
              { value: 'Space Mono', label: 'Space Mono' },
            ]}
            fullWidth
          />
        </div>
      </Section>

      {/* Logo */}
      <Section icon={Image} title="Logo">
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          onChange={handleLogoUpload}
          className="hidden"
        />
        {kit.logoUrl ? (
          <div className="flex items-center gap-2">
            <img src={kit.logoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-contain bg-black/30 border border-white/5" />
            <button onClick={clearLogo} className="text-[9px] text-red-400 hover:text-red-300">Remove</button>
          </div>
        ) : (
          <button
            onClick={() => logoInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-[10px] text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg border border-dashed border-indigo-500/30 transition-colors"
          >
            <Upload size={12} />
            Upload Logo
          </button>
        )}
      </Section>

      {/* Save / Load */}
      <Section icon={Save} title="Saved Kits">
        <div className="flex items-center gap-1.5">
          <input
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Kit name..."
            className="flex-1 bg-black/20 border border-white/5 rounded-lg px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500/50 placeholder:text-zinc-600"
          />
          <button
            onClick={() => {
              if (saveName.trim()) {
                saveKit(saveName)
                setSaveName('')
              }
            }}
            disabled={!saveName.trim()}
            className="px-2 py-1 rounded-lg text-[10px] font-medium bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 border border-indigo-500/30 disabled:opacity-50"
          >
            <Save size={10} className="inline mr-1" />
            Save
          </button>
        </div>
        {savedKits.length > 0 && (
          <div className="space-y-1 mt-2">
            {savedKits.map((saved) => (
              <div
                key={saved.id}
                className="flex items-center justify-between p-1.5 rounded-lg bg-black/20 border border-white/5"
              >
                <button
                  onClick={() => loadKit(saved.id)}
                  className="flex items-center gap-1.5 text-[10px] text-zinc-300 hover:text-white"
                >
                  <FolderOpen size={10} />
                  {saved.name}
                </button>
                <button
                  onClick={() => deleteKit(saved.id)}
                  className="p-0.5 rounded hover:bg-red-500/20 text-zinc-600 hover:text-red-400"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      <div className="h-6 shrink-0" />
    </PanelLayout>
  )
}
