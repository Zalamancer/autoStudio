import { useState, useEffect } from 'react'
import {
  Monitor,
  Key,
  Film,
  Zap,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Palette,
  LogOut,
  Sun,
  Moon,
  Briefcase,
  Tag,
  Sparkles,
  Loader2,
  X,
} from 'lucide-react'

import { useEditorStore, useCanvasStore } from '@/stores'
import { useTimelineStore } from '@/stores'
import { useAuthStore } from '@/stores/useAuthStore'
import { ColorPicker } from '@/components/ui'
import { useSettingsStore, type Resolution, type ExportQuality, type Theme } from '@/stores/useSettingsStore'
import { useCreatorProfileStore } from '@/stores/useCreatorProfileStore'
import { NICHE_TAG_OPTIONS } from '@/types/promotions'
import { ApiKeyManagement } from './ApiKeyManagement'
import type { AspectRatio } from '@/types'

import {
  PanelSection,
  PanelButtonGroup,
  PanelActionButton,
  PanelToggle,
  PanelSlider,
} from '@/components/ui/panel-controls'

const ASPECT_RATIOS: { label: string; value: AspectRatio }[] = [
  { label: '9:16', value: '9:16' },
  { label: '16:9', value: '16:9' },
  { label: '1:1', value: '1:1' },
  { label: '4:3', value: '4:3' },
]

const FPS_OPTIONS = [
  { label: '24 fps', value: '24' },
  { label: '30 fps', value: '30' },
  { label: '60 fps', value: '60' },
  { label: '120 fps', value: '120' },
]

const RESOLUTION_OPTIONS: { label: string; value: Resolution }[] = [
  { label: '8K (4320p)', value: '8k' },
  { label: '4K (2160p)', value: '4k' },
  { label: '2K (1440p)', value: '2k' },
  { label: '1080p', value: '1080p' },
  { label: '720p', value: '720p' },
  { label: '480p', value: '480p' },
]

const QUALITY_OPTIONS: { label: string; value: ExportQuality }[] = [
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getApiKeyStatus(key: string | undefined): boolean {
  return Boolean(key && key.length > 0)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SettingsPanel() {
  const aspectRatio = useEditorStore((s) => s.aspectRatio)
  const setAspectRatio = useEditorStore((s) => s.setAspectRatio)

  const fps = useTimelineStore((s) => s.fps)
  const setFps = useTimelineStore((s) => s.setFps)

  const setCanvasDimensions = useCanvasStore((s) => s.setCanvasDimensions)
  const canvasWidth = useCanvasStore((s) => s.canvasWidth)
  const canvasHeight = useCanvasStore((s) => s.canvasHeight)

  const usePixiRenderer = useEditorStore((s) => s.usePixiRenderer)
  const togglePixiRenderer = useEditorStore((s) => s.togglePixiRenderer)

  const { user, signOut } = useAuthStore()

  // Persisted settings (survives page refresh)
  const settings = useSettingsStore()
  const setSetting = useSettingsStore((s) => s.setSetting)

  const updateSetting = setSetting

  // API key statuses
  const elevenLabsConnected = getApiKeyStatus(
    import.meta.env.VITE_ELEVENLABS_API_KEY
  )
  const geminiConnected = getApiKeyStatus(import.meta.env.VITE_GEMINI_API_KEY)
  const supabaseConnected = getApiKeyStatus(
    import.meta.env.VITE_SUPABASE_URL
  ) && getApiKeyStatus(import.meta.env.VITE_SUPABASE_ANON_KEY)

  // Aspect ratio change handler (also updates canvas dimensions)
  const handleAspectRatioChange = (ratio: string) => {
    const typedRatio = ratio as AspectRatio
    setAspectRatio(typedRatio)
    const dims: Record<string, { w: number; h: number }> = {
      '16:9': { w: 1920, h: 1080 },
      '9:16': { w: 1080, h: 1920 },
      '1:1': { w: 1080, h: 1080 },
      '4:3': { w: 1440, h: 1080 },
    }
    const d = dims[typedRatio]
    if (d) setCanvasDimensions(d.w, d.h)
  }

  return (
    <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-8 custom-scrollbar">

      {/* ---- User Account ---- */}
      {user && (
        <PanelSection title="Account" noBorder>
          <div className="flex items-center justify-between bg-black/20 border border-white/5 rounded-2xl p-4 animate-in zoom-in-95 duration-200">
            <div>
              <p className="text-sm font-medium text-white">{user.email}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">
                Signed in since {new Date(user.last_sign_in_at || '').toLocaleDateString()}
              </p>
            </div>
            <PanelActionButton
              variant="secondary"
              onClick={() => signOut()}
              icon={LogOut}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/20"
            >
              Sign Out
            </PanelActionButton>
          </div>
        </PanelSection>
      )}

      {/* ---- Appearance ---- */}
      <PanelSection title="Appearance">
        <div>
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            {settings.theme === 'dark' ? <Moon size={12} /> : <Sun size={12} />}
            Theme
          </label>
          <PanelButtonGroup
            options={[
              { label: 'Dark', value: 'dark' },
              { label: 'Light', value: 'light' },
            ]}
            value={settings.theme}
            onChange={(v) => updateSetting('theme', v as Theme)}
          />
        </div>
      </PanelSection>

      {/* ---- Canvas Settings ---- */}
      <PanelSection title="Canvas">
        <div className="space-y-6">
          {/* Aspect Ratio */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <Monitor size={12} />
                Aspect Ratio
              </label>
              <span className="text-[10px] text-zinc-600">
                {canvasWidth} x {canvasHeight}
              </span>
            </div>
            <PanelButtonGroup
              options={ASPECT_RATIOS}
              value={aspectRatio}
              onChange={handleAspectRatioChange}
            />
          </div>

          {/* FPS */}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">
              Default FPS
            </label>
            <PanelButtonGroup
              options={FPS_OPTIONS}
              value={fps.toString()}
              onChange={(v) => setFps(parseInt(v))}
            />
          </div>

          {/* Background Color */}
          <div className="flex items-center justify-between bg-black/20 border border-white/5 rounded-2xl p-3">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <Palette size={12} />
              Background Color
            </label>
            <div className="flex items-center gap-2 bg-zinc-900/50 rounded-lg p-1 border border-white/5">
              <span className="text-xs text-zinc-400 font-mono px-2">
                {settings.canvasBgColor}
              </span>
              <ColorPicker color={settings.canvasBgColor} onChange={(c) => updateSetting('canvasBgColor', c)} />
            </div>
          </div>

        </div>
      </PanelSection>

      {/* ---- API Connections ---- */}
      <PanelSection title="API Connections">
        <div className="space-y-2">
          {[
            { name: 'ElevenLabs', connected: elevenLabsConnected },
            { name: 'Gemini', connected: geminiConnected },
            { name: 'Supabase', connected: supabaseConnected },
            { name: 'Pixabay', connected: getApiKeyStatus(import.meta.env.VITE_PIXABAY_API_KEY) },
          ].map((api) => (
            <div
              key={api.name}
              className="flex items-center justify-between bg-black/20 border border-white/5 rounded-xl p-3 transition-colors hover:bg-black/30"
            >
              <span className="text-xs font-medium text-zinc-300 flex items-center gap-2">
                <Key size={12} className="text-zinc-500" />
                {api.name}
              </span>
              <div className="flex items-center gap-1.5">
                {api.connected ? (
                  <div className="flex items-center gap-1 bg-green-500/10 text-green-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-green-500/20">
                    <CheckCircle2 size={10} />
                    Connected
                  </div>
                ) : (
                  <div className="flex items-center gap-1 bg-red-500/10 text-red-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-red-500/20">
                    <XCircle size={10} />
                    Not Configured
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-zinc-600 mt-3 text-center">
          API keys are configured via environment variables (.env file).
        </p>
      </PanelSection>

      {/* ---- Export Defaults ---- */}
      <PanelSection title="Export Defaults">
        <div className="space-y-6">
          {/* Resolution */}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Film size={12} />
              Default Resolution
            </label>
            <PanelButtonGroup
              options={RESOLUTION_OPTIONS}
              value={settings.defaultResolution}
              onChange={(v) => updateSetting('defaultResolution', v as Resolution)}
            />
          </div>

          {/* Format */}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">
              Default Format
            </label>
            <PanelButtonGroup
              options={[
                { label: 'WebM', value: 'webm' },
                { label: 'MP4', value: 'mp4' },
                { label: 'GIF', value: 'gif' },
              ]}
              value={settings.defaultFormat}
              onChange={(v) => updateSetting('defaultFormat', v as 'webm' | 'mp4' | 'gif')}
            />
          </div>

          {/* Quality */}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">
              Default Quality
            </label>
            <PanelButtonGroup
              options={QUALITY_OPTIONS}
              value={settings.defaultQuality}
              onChange={(v) => updateSetting('defaultQuality', v as ExportQuality)}
            />
          </div>
        </div>
      </PanelSection>

      {/* ---- Performance ---- */}
      <PanelSection title="Performance">
        <div className="space-y-4">
          <PanelToggle
            label="GPU Renderer"
            description="Use PixiJS WebGL for canvas (faster)"
            checked={usePixiRenderer}
            onChange={togglePixiRenderer}
          />

          <PanelToggle
            label="Reduced Motion"
            description="Disable non-essential animations"
            checked={settings.reducedMotion}
            onChange={(v) => updateSetting('reducedMotion', v)}
          />

          <PanelToggle
            label="Auto-save"
            description="Automatically save project changes"
            checked={settings.autoSave}
            onChange={(v) => updateSetting('autoSave', v)}
          />

          {settings.autoSave && (
            <div className="pl-4 border-l-2 border-zinc-800 animate-in slide-in-from-left-2 duration-200">
              <PanelSlider
                label="Save Interval"
                value={settings.autoSaveInterval}
                onChange={(v) => updateSetting('autoSaveInterval', v)}
                min={30}
                max={300}
                step={10}
                suffix="s"
              />
            </div>
          )}
        </div>
      </PanelSection>

      {/* ---- API Keys ---- */}
      {user && <ApiKeyManagement />}

      {/* ---- Creator Profile ---- */}
      {user && <CreatorProfileSection />}

      {/* ---- About ---- */}
      <PanelSection title="About" noBorder>
        <div className="bg-black/20 border border-white/5 rounded-2xl p-4 text-center space-y-3">
          <div className="inline-flex items-center gap-2">
            <Zap size={16} className="text-yellow-500" />
            <span className="text-sm font-bold text-white tracking-widest uppercase">
              AutoAnimation
            </span>
            <span className="text-[9px] text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded-md border border-white/10">
              v0.1.0
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed max-w-sm mx-auto">
            Generate short-form talking character videos with automated lip sync,
            emotions, and animated backgrounds.
          </p>

          <a
            href="https://github.com/Zalamancer/AutoAnimation"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-col items-center gap-1.5 mt-2 group"
          >
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-white/5 group-hover:border-zinc-500 group-hover:bg-zinc-700 transition-all">
              <ExternalLink size={12} className="text-zinc-400 group-hover:text-white" />
            </div>
            <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300">GitHub</span>
          </a>
        </div>
      </PanelSection>

    </div>
  )
}

// ── Creator Profile Section ──────────────────────────────────────────────

function CreatorProfileSection() {
  const {
    profile,
    isLoading,
    isSuggestingTags,
    suggestedTags,
    fetchProfile,
    updateProfile,
    toggleOptIn,
    suggestTagsAction,
    clearSuggestedTags,
  } = useCreatorProfileStore()

  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!loaded) {
      fetchProfile()
      setLoaded(true)
    }
  }, [loaded, fetchProfile])

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '')
      setBio(profile.bio || '')
    }
  }, [profile])

  const handleSaveProfile = () => {
    updateProfile({
      display_name: displayName.trim() || undefined,
      bio: bio.trim() || undefined,
    })
  }

  const handleToggleTag = (tag: string) => {
    const current = profile?.niche_tags ?? []
    const updated = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag]
    updateProfile({ niche_tags: updated })
  }

  const handleAddSuggestedTag = (tag: string) => {
    const current = profile?.niche_tags ?? []
    if (!current.includes(tag)) {
      updateProfile({ niche_tags: [...current, tag] })
    }
  }

  if (isLoading) {
    return (
      <PanelSection title="Creator Profile">
        <div className="flex justify-center py-4">
          <Loader2 size={16} className="text-zinc-500 animate-spin" />
        </div>
      </PanelSection>
    )
  }

  return (
    <PanelSection title="Creator Profile">
      <div className="space-y-4">
        {/* Opt-in toggle */}
        <PanelToggle
          label="Available for commercial work"
          description="Opt in to receive promotion requests from enterprises"
          checked={profile?.opted_in ?? false}
          onChange={() => toggleOptIn()}
        />

        {/* Display name */}
        <div>
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-1">
            <Briefcase size={10} />
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            onBlur={handleSaveProfile}
            placeholder="Your creator name"
            className="w-full px-3 py-2 rounded-lg bg-black/20 border border-white/5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/30"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            onBlur={handleSaveProfile}
            placeholder="Tell enterprises about your style..."
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-black/20 border border-white/5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/30 resize-none"
          />
        </div>

        {/* Niche tags */}
        <div>
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1">
            <Tag size={10} />
            Niche Tags
          </label>
          <div className="flex flex-wrap gap-1.5">
            {NICHE_TAG_OPTIONS.map((tag) => (
              <button
                key={tag}
                onClick={() => handleToggleTag(tag)}
                className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider border transition-all ${
                  (profile?.niche_tags ?? []).includes(tag)
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                    : 'bg-black/10 text-zinc-600 border-transparent hover:text-zinc-400 hover:bg-white/5'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* AI tag suggestion */}
        <div>
          <PanelActionButton
            variant="secondary"
            onClick={suggestTagsAction}
            disabled={isSuggestingTags}
            icon={isSuggestingTags ? Loader2 : Sparkles}
            className="text-[10px] font-bold text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 border-purple-500/20"
          >
            {isSuggestingTags ? 'Analyzing...' : 'Suggest Tags'}
          </PanelActionButton>

          {suggestedTags.length > 0 && (
            <div className="mt-2 space-y-1.5">
              <span className="text-[9px] text-zinc-500">AI Suggestions:</span>
              <div className="flex flex-wrap gap-1.5">
                {suggestedTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleAddSuggestedTag(tag)}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
                  >
                    + {tag}
                  </button>
                ))}
                <button
                  onClick={clearSuggestedTags}
                  className="p-1 rounded text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  <X size={10} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        {profile && (profile.total_submissions > 0 || profile.total_approvals > 0) && (
          <div className="flex gap-4 pt-1">
            <div className="text-center">
              <p className="text-sm font-bold text-white">{profile.total_submissions}</p>
              <p className="text-[9px] text-zinc-500 uppercase tracking-widest">Submissions</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-emerald-400">{profile.total_approvals}</p>
              <p className="text-[9px] text-zinc-500 uppercase tracking-widest">Approved</p>
            </div>
          </div>
        )}
      </div>
    </PanelSection>
  )
}
