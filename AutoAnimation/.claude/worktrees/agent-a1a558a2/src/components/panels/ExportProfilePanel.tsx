import { useState, useMemo } from 'react'
import { Download, Check, AlertTriangle, Monitor, Clock, FileVideo, Hash } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EXPORT_PROFILES } from '@/data/exportProfiles'
import { validateForPlatform } from '@/services/exportProfileService'
import { useEditorStore, useTimelineStore } from '@/stores'

export function ExportProfilePanel() {
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null)
  const aspectRatio = useEditorStore(s => s.aspectRatio)
  const totalFrames = useTimelineStore(s => s.totalFrames)
  const fps = useTimelineStore(s => s.fps)
  const duration = totalFrames / fps

  const profile = useMemo(
    () => selectedProfile ? EXPORT_PROFILES.find(p => p.id === selectedProfile) : null,
    [selectedProfile],
  )

  const validation = useMemo(
    () => profile ? validateForPlatform({ aspectRatio, duration }, profile) : null,
    [profile, aspectRatio, duration],
  )

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-3 py-3 border-b border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <Download size={16} className="text-green-400" />
          <span className="text-sm font-medium text-zinc-200">Export Profiles</span>
        </div>
        <p className="text-[11px] text-zinc-500">Platform-optimized export settings and validation.</p>
      </div>

      {/* Platform Grid */}
      <div className="px-3 py-2 border-b border-white/5">
        <div className="text-[11px] font-medium text-zinc-400 mb-2">Select Platform</div>
        <div className="grid grid-cols-3 gap-1.5">
          {EXPORT_PROFILES.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedProfile(p.id)}
              className={cn(
                'flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl transition-colors text-center',
                selectedProfile === p.id
                  ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                  : 'bg-white/[0.04] text-zinc-500 hover:bg-white/[0.08] hover:text-zinc-300 border border-transparent'
              )}
            >
              <span className="text-[11px] font-medium truncate w-full">{p.name}</span>
              <span className="text-[9px] text-zinc-600">{p.defaultAspectRatio}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Profile Details */}
      {profile && (
        <div className="px-3 py-2 border-b border-white/5 space-y-2">
          <div className="text-[11px] font-medium text-zinc-400">Profile Details</div>
          <div className="space-y-1.5">
            <DetailRow icon={<Monitor size={11} />} label="Resolution" value={`${profile.maxResolution.width}x${profile.maxResolution.height}`} />
            <DetailRow icon={<Clock size={11} />} label="Max Duration" value={profile.maxDuration > 0 ? `${formatDuration(profile.maxDuration)}` : 'Unlimited'} />
            <DetailRow icon={<FileVideo size={11} />} label="Codec" value={`${profile.videoCodec.toUpperCase()} / ${profile.audioCodec.toUpperCase()}`} />
            <DetailRow icon={<Download size={11} />} label="Max File Size" value={formatBytes(profile.maxFileSize)} />
            <DetailRow icon={<Hash size={11} />} label="Hashtag Limit" value={profile.hashtagLimit > 0 ? `${profile.hashtagLimit}` : 'N/A'} />
            <div className="text-[11px] text-zinc-500">
              Aspect Ratios: {profile.aspectRatios.join(', ')}
            </div>
            <div className="text-[11px] text-zinc-500">
              Captions: <span className={cn(
                profile.captionRequirements === 'recommended' || profile.captionRequirements === 'required'
                  ? 'text-yellow-400'
                  : 'text-zinc-500'
              )}>{profile.captionRequirements}</span>
            </div>
          </div>
        </div>
      )}

      {/* Validation */}
      {validation && (
        <div className="px-3 py-2 border-b border-white/5">
          <div className="text-[11px] font-medium text-zinc-400 mb-2">Validation</div>
          {validation.valid ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 text-green-400 text-[11px]">
              <Check size={14} />
              <span>Project is compatible with {profile?.platform}</span>
            </div>
          ) : (
            <div className="space-y-1">
              {validation.issues.map((issue, i) => (
                <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 text-yellow-400 text-[11px]">
                  <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                  <span>{issue}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Export */}
      {profile && (
        <div className="px-3 py-3">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-black text-sm font-medium transition-colors">
            <Download size={16} />
            Export for {profile.platform}
          </button>
        </div>
      )}
    </div>
  )
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5 text-zinc-500">
        {icon}
        <span className="text-[11px]">{label}</span>
      </div>
      <span className="text-[11px] text-zinc-300">{value}</span>
    </div>
  )
}

function formatDuration(seconds: number): string {
  if (seconds >= 3600) return `${(seconds / 3600).toFixed(0)}h`
  if (seconds >= 60) return `${(seconds / 60).toFixed(0)}m`
  return `${seconds}s`
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(0)} MB`
  return `${(bytes / 1_000).toFixed(0)} KB`
}
