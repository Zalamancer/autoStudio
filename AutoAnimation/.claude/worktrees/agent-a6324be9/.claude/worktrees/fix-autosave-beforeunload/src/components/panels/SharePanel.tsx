import { useState, useCallback, useEffect, useRef } from 'react'
import {
  Share2,
  Facebook,
  Instagram,
  Music2,
  AtSign,
  Link2,
  Copy,
  CheckCheck,
  AlertCircle,
  Globe,
  Users,
  Lock,
  Calendar,
  Image,
  ToggleLeft,
  ToggleRight,
  Film,
  Loader2,
  ExternalLink,
  Unlink,
  CheckCircle2,
  Youtube,
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  Eye,
  Heart,
  Play,
  Inbox,
  Send,
  X,
} from 'lucide-react'
import { PanelSelect, PanelSlider } from '@/components/ui/panel-controls'
import { useEditorStore } from '@/stores'
import { useRecordingsStore } from '@/stores/useRecordingsStore'
import { getRecordingBlob } from '@/services/recordingsDB'
import { supabase } from '@/services/supabase'
import type { SocialPlatform, SocialAccount, TikTokProfile, TikTokVideo } from '@/types/social'
import {
  connectPlatform,
  disconnectPlatform,
  getSocialAccounts,
  publishToInstagram,
  publishToFacebook,
  publishToTikTok,
  publishToX,
  publishToYouTube,
  getTikTokProfile,
  getTikTokVideos,
  schedulePost,
  getScheduledPosts,
  cancelScheduledPost,
  generateMetadata,
} from '@/services/socialPublish'
import { useAnalyticsStore } from '@/stores/useAnalyticsStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useLearningStore } from '@/stores/useLearningStore'
// usePublishStore used by PublishQueuePanel child component
import { PrePublishScore } from './PrePublishScore'
import { SchedulePickerModal } from './publish/SchedulePickerModal'
import { PublishQueuePanel } from './publish/PublishQueuePanel'
import type { ScheduledPost } from '@/types/social'

// ── Platform config ──────────────────────────────────────────────────────
const PLATFORMS: Array<{
  id: SocialPlatform
  label: string
  icon: typeof Facebook
  color: string
  bgColor: string
}> = [
  { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-400', bgColor: 'bg-pink-500/10' },
  { id: 'tiktok', label: 'TikTok', icon: Music2, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' },
  { id: 'x', label: 'X', icon: AtSign, color: 'text-zinc-300', bgColor: 'bg-zinc-500/10' },
  { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-400', bgColor: 'bg-red-500/10' },
]

// ── Toggle component ─────────────────────────────────────────────────────
function Toggle({ enabled, onChange, label }: { enabled: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button onClick={() => onChange(!enabled)} className="flex items-center justify-between w-full py-1.5">
      <span className="text-xs text-zinc-400">{label}</span>
      {enabled ? (
        <ToggleRight size={20} className="text-green-400" />
      ) : (
        <ToggleLeft size={20} className="text-zinc-600" />
      )}
    </button>
  )
}

// ── Tri-state toggle (null = unselected, then true/false) ────────────────
function TriStateToggle({
  value,
  onChange,
  label,
}: {
  value: boolean | null
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      onClick={() => onChange(value === null ? true : !value)}
      className="flex items-center justify-between w-full py-1.5"
    >
      <span className="text-xs text-zinc-400">{label}</span>
      {value === null ? (
        <div className="w-5 h-5 rounded-full border-2 border-zinc-600 flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full" />
        </div>
      ) : value ? (
        <ToggleRight size={20} className="text-green-400" />
      ) : (
        <ToggleLeft size={20} className="text-zinc-600" />
      )}
    </button>
  )
}

// ── Radio group ──────────────────────────────────────────────────────────
function RadioGroup({
  options,
  value,
  onChange,
  label,
}: {
  options: Array<{ value: string; label: string; icon?: typeof Globe }>
  value: string
  onChange: (v: string) => void
  label: string
}) {
  return (
    <div>
      <label className="text-xs text-zinc-400 mb-1.5 block">{label}</label>
      <div className="flex gap-1">
        {options.map((opt) => {
          const Icon = opt.icon
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded transition-colors ${
                value === opt.value
                  ? 'bg-blue-600/90 shadow-glow text-white border-transparent'
                  : 'bg-zinc-900/50 border border-white/5 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              {Icon && <Icon size={12} />}
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Form data types ─────────────────────────────────────────────────────
interface FacebookFormData {
  description: string
  privacy: string
  useSchedule: boolean
  scheduledTime: string
}

interface InstagramFormData {
  caption: string
  hashtags: string
  postType: string
  coverTime: number
}

interface TikTokFormData {
  description: string
  hashtags: string
  privacy: string
  allowComments: boolean | null
  allowDuets: boolean | null
  allowStitches: boolean | null
  postMode: 'direct' | 'draft'
  contentDisclosure: boolean
  brandContentToggle: boolean
  brandOrganicToggle: boolean
}

interface XFormData {
  tweetText: string
  altText: string
  threadContinuation: boolean
}

interface YouTubeFormData {
  title: string
  description: string
  tags: string
  privacy: string
  madeForKids: boolean
  uploadType: 'short' | 'long'
}

// ── Facebook Form ────────────────────────────────────────────────────────
function FacebookForm({ data, onChange }: { data: FacebookFormData; onChange: (d: FacebookFormData) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-zinc-400 mb-1 block">Description</label>
        <textarea
          value={data.description}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          placeholder="Write a description for your video..."
          rows={3}
          className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white placeholder-zinc-600 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50"
        />
      </div>

      <RadioGroup
        label="Privacy"
        value={data.privacy}
        onChange={(v) => onChange({ ...data, privacy: v })}
        options={[
          { value: 'public', label: 'Public', icon: Globe },
          { value: 'friends', label: 'Friends', icon: Users },
          { value: 'only_me', label: 'Only Me', icon: Lock },
        ]}
      />

      <Toggle
        label="Schedule post"
        enabled={data.useSchedule}
        onChange={(v) => onChange({ ...data, useSchedule: v })}
      />
      {data.useSchedule && (
        <div>
          <label className="text-xs text-zinc-400 mb-1 flex items-center gap-1">
            <Calendar size={12} />
            Schedule time
          </label>
          <input
            type="datetime-local"
            value={data.scheduledTime}
            onChange={(e) => onChange({ ...data, scheduledTime: e.target.value })}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          />
        </div>
      )}
    </div>
  )
}

// ── Instagram Form ───────────────────────────────────────────────────────
function InstagramForm({ data, onChange }: { data: InstagramFormData; onChange: (d: InstagramFormData) => void }) {
  return (
    <div className="space-y-3">
      <RadioGroup
        label="Post Type"
        value={data.postType}
        onChange={(v) => onChange({ ...data, postType: v })}
        options={[
          { value: 'reels', label: 'Reels', icon: Film },
          { value: 'feed', label: 'Feed Post', icon: Image },
        ]}
      />

      <div>
        <label className="text-xs text-zinc-400 mb-1 block">Caption</label>
        <textarea
          value={data.caption}
          onChange={(e) => onChange({ ...data, caption: e.target.value })}
          placeholder="Write a caption..."
          rows={3}
          className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white placeholder-zinc-600 resize-none focus:outline-none focus:ring-1 focus:ring-pink-500/50"
        />
      </div>

      <div>
        <label className="text-xs text-zinc-400 mb-1 block">Hashtags</label>
        <input
          value={data.hashtags}
          onChange={(e) => onChange({ ...data, hashtags: e.target.value })}
          placeholder="#animation #video #content"
          className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-pink-500/50"
        />
      </div>

      <PanelSlider
        label="Cover Image Time"
        value={data.coverTime}
        onChange={(v) => onChange({ ...data, coverTime: v })}
        min={0}
        max={60}
        step={0.1}
        precision={1}
        suffix="s"
      />
    </div>
  )
}

// ── TikTok Form ──────────────────────────────────────────────────────────
function TikTokForm({ data, onChange }: { data: TikTokFormData; onChange: (d: TikTokFormData) => void }) {
  // Check if content disclosure is invalid (toggle on but neither sub-option selected)
  const disclosureInvalid = data.contentDisclosure && !data.brandOrganicToggle && !data.brandContentToggle

  return (
    <div className="space-y-3">
      {/* Post mode toggle */}
      <RadioGroup
        label="Post Mode"
        value={data.postMode}
        onChange={(v) => onChange({ ...data, postMode: v as 'direct' | 'draft' })}
        options={[
          { value: 'direct', label: 'Post directly', icon: Send },
          { value: 'draft', label: 'Save as draft', icon: Inbox },
        ]}
      />

      {data.postMode === 'draft' && (
        <div className="flex items-start gap-2 p-2 bg-cyan-500/10 border border-cyan-500/20 rounded">
          <AlertCircle size={12} className="text-cyan-400 mt-0.5 shrink-0" />
          <p className="text-[10px] text-cyan-300/90">
            Video will be sent to your TikTok inbox for review before posting.
          </p>
        </div>
      )}

      <div>
        <label className="text-xs text-zinc-400 mb-1 block">Description</label>
        <textarea
          value={data.description}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          placeholder="Describe your video..."
          rows={3}
          className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white placeholder-zinc-600 resize-none focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
        />
      </div>

      <div>
        <label className="text-xs text-zinc-400 mb-1 block">Hashtags</label>
        <input
          value={data.hashtags}
          onChange={(e) => onChange({ ...data, hashtags: e.target.value })}
          placeholder="#fyp #animation #viral"
          className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
        />
      </div>

      {/* Privacy — no default pre-selected (TikTok guideline) */}
      <div>
        <PanelSelect
          label="Who can view this video"
          value={data.privacy}
          onChange={(v) => onChange({ ...data, privacy: v })}
          options={[
            { value: '', label: 'Select privacy level' },
            { value: 'private', label: 'Only me' },
          ]}
          fullWidth
        />
        <p className="text-[9px] text-zinc-600 mt-1">
          Sandbox mode: only "Only me" is available. More options after approval.
        </p>
      </div>

      {/* Interaction settings — no defaults pre-selected (TikTok guideline) */}
      <div className="space-y-1.5 pt-1">
        <label className="text-xs text-zinc-400 block">Interaction settings</label>
        <TriStateToggle
          label="Allow comments"
          value={data.allowComments}
          onChange={(v) => onChange({ ...data, allowComments: v })}
        />
        <TriStateToggle
          label="Allow duets"
          value={data.allowDuets}
          onChange={(v) => onChange({ ...data, allowDuets: v })}
        />
        <TriStateToggle
          label="Allow stitches"
          value={data.allowStitches}
          onChange={(v) => onChange({ ...data, allowStitches: v })}
        />
      </div>

      {/* Content disclosure toggle (TikTok guideline — must be present, default off) */}
      <div className="pt-2 border-t border-zinc-800">
        <Toggle
          label="Disclose video content"
          enabled={data.contentDisclosure}
          onChange={(v) =>
            onChange({
              ...data,
              contentDisclosure: v,
              ...(!v ? { brandOrganicToggle: false, brandContentToggle: false } : {}),
            })
          }
        />
        <p className="text-[9px] text-zinc-600 mt-0.5">
          Turn on to disclose that this video promotes goods or services.
        </p>

        {data.contentDisclosure && (
          <div className="mt-2 ml-3 space-y-1">
            <Toggle
              label="Your brand — promotes yourself or your business"
              enabled={data.brandOrganicToggle}
              onChange={(v) => onChange({ ...data, brandOrganicToggle: v })}
            />
            <Toggle
              label="Branded content — paid partnership with a third party"
              enabled={data.brandContentToggle}
              onChange={(v) => onChange({ ...data, brandContentToggle: v })}
            />
            {disclosureInvalid && (
              <p className="text-[10px] text-amber-400 mt-1">You must select at least one option above to publish.</p>
            )}
          </div>
        )}
      </div>

      {/* Consent text (TikTok guideline) */}
      <p className="text-[9px] text-zinc-500 leading-relaxed">
        By posting, you agree to TikTok&apos;s{' '}
        <a
          href="https://www.tiktok.com/legal/music-usage-confirmation"
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-500 hover:underline"
        >
          Music Usage Confirmation
        </a>
        {data.brandContentToggle && (
          <>
            {' '}
            and{' '}
            <a
              href="https://www.tiktok.com/legal/branded-content-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-500 hover:underline"
            >
              Branded Content Policy
            </a>
          </>
        )}
        .
      </p>

      {/* Processing delay notice (TikTok guideline) */}
      <div className="flex items-start gap-2 p-2 bg-zinc-800/50 border border-zinc-700/50 rounded">
        <AlertCircle size={11} className="text-zinc-500 mt-0.5 shrink-0" />
        <p className="text-[9px] text-zinc-500">
          After uploading, your video may take a few minutes to process before it appears on TikTok.
        </p>
      </div>
    </div>
  )
}

// ── TikTok Profile Card ─────────────────────────────────────────────────
function TikTokProfileCard({ onDisconnect }: { onDisconnect: () => void }) {
  const [profile, setProfile] = useState<TikTokProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getTikTokProfile().then((p) => {
      setProfile(p)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 size={16} className="animate-spin text-cyan-400" />
      </div>
    )
  }

  if (!profile) return null

  const formatCount = (n?: number) => {
    if (n == null) return '—'
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return n.toString()
  }

  return (
    <div className="p-3 bg-zinc-900/60 backdrop-blur-md border border-cyan-500/20 rounded-xl space-y-3">
      {/* Avatar + name + verified */}
      <div className="flex items-center gap-3">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl100 || profile.avatarUrl}
            alt=""
            className="w-12 h-12 rounded-full ring-2 ring-cyan-500/30"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
            <Music2 size={20} className="text-cyan-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-white truncate">{profile.displayName}</span>
            {profile.isVerified && <BadgeCheck size={14} className="text-cyan-400 shrink-0" />}
          </div>
          {profile.bioDescription && (
            <p className="text-[10px] text-zinc-400 line-clamp-2 mt-0.5">{profile.bioDescription}</p>
          )}
        </div>
        <button
          onClick={onDisconnect}
          className="text-zinc-500 hover:text-red-400 transition-colors shrink-0"
          title="Disconnect"
        >
          <Unlink size={14} />
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-1">
        {[
          { label: 'Followers', value: formatCount(profile.followerCount) },
          { label: 'Following', value: formatCount(profile.followingCount) },
          { label: 'Videos', value: formatCount(profile.videoCount) },
          { label: 'Likes', value: formatCount(profile.likesCount) },
        ].map((stat) => (
          <div key={stat.label} className="text-center py-1.5 bg-zinc-800/50 rounded">
            <div className="text-xs font-medium text-white">{stat.value}</div>
            <div className="text-[9px] text-zinc-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* View profile link */}
      {profile.profileDeepLink && (
        <a
          href={profile.profileDeepLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          View Profile <ExternalLink size={10} />
        </a>
      )}
    </div>
  )
}

// ── TikTok Videos List ──────────────────────────────────────────────────
function TikTokVideosList() {
  const [videos, setVideos] = useState<TikTokVideo[]>([])
  const [cursor, setCursor] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    getTikTokVideos().then((resp) => {
      setVideos(resp.videos)
      setCursor(resp.cursor)
      setHasMore(resp.hasMore)
      setLoading(false)
    })
  }, [])

  const loadMore = async () => {
    setLoadingMore(true)
    const resp = await getTikTokVideos(cursor)
    setVideos((prev) => [...prev, ...resp.videos])
    setCursor(resp.cursor)
    setHasMore(resp.hasMore)
    setLoadingMore(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-3">
        <Loader2 size={14} className="animate-spin text-zinc-500" />
        <span className="text-[10px] text-zinc-500 ml-2">Loading videos...</span>
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="border-t border-zinc-700/40 pt-3">
        <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-medium mb-2">
          <Play size={12} className="text-cyan-400" />
          Your TikTok Videos
        </div>
        <p className="text-[10px] text-zinc-500 py-3 text-center">No videos published yet.</p>
      </div>
    )
  }

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const formatCount = (n?: number) => {
    if (n == null) return '—'
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return n.toString()
  }

  return (
    <div className="border-t border-zinc-700/40 pt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-xs text-zinc-300 hover:text-white transition-colors mb-2"
      >
        <span className="flex items-center gap-1.5 font-medium">
          <Play size={12} className="text-cyan-400" />
          Your TikTok Videos ({videos.length}
          {hasMore ? '+' : ''})
        </span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {videos.map((video) => (
              <a
                key={video.id}
                href={video.shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-zinc-800/50 rounded-lg overflow-hidden border border-white/5 hover:border-cyan-500/30 transition-colors"
              >
                {/* Cover image */}
                <div className="relative aspect-[9/16] bg-zinc-900">
                  {video.coverImageUrl ? (
                    <img src={video.coverImageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film size={20} className="text-zinc-700" />
                    </div>
                  )}
                  {/* Duration badge */}
                  <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/70 rounded text-[9px] text-white">
                    {formatDuration(video.duration)}
                  </div>
                </div>
                {/* Info */}
                <div className="p-1.5">
                  <p className="text-[10px] text-zinc-300 line-clamp-1">
                    {video.title || video.videoDescription || 'Untitled'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-0.5 text-[9px] text-zinc-500">
                      <Eye size={9} /> {formatCount(video.viewCount)}
                    </span>
                    <span className="flex items-center gap-0.5 text-[9px] text-zinc-500">
                      <Heart size={9} /> {formatCount(video.likeCount)}
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full py-1.5 text-[10px] text-cyan-400 hover:text-cyan-300 bg-cyan-500/5 rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {loadingMore ? <Loader2 size={10} className="animate-spin" /> : null}
              {loadingMore ? 'Loading...' : 'Load more'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── X (Twitter) Form ─────────────────────────────────────────────────────
function XForm({ data, onChange }: { data: XFormData; onChange: (d: XFormData) => void }) {
  const charCount = data.tweetText.length
  const overLimit = charCount > 280

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-zinc-400">Tweet</label>
          <span
            className={`text-[10px] ${overLimit ? 'text-red-400' : charCount > 250 ? 'text-yellow-400' : 'text-zinc-500'}`}
          >
            {charCount}/280
          </span>
        </div>
        <textarea
          value={data.tweetText}
          onChange={(e) => onChange({ ...data, tweetText: e.target.value })}
          placeholder="What's happening?"
          rows={3}
          className={`w-full bg-zinc-800 border rounded px-2 py-1.5 text-xs text-white placeholder-zinc-600 resize-none focus:outline-none focus:ring-1 ${
            overLimit ? 'border-red-500 focus:ring-red-500/50' : 'border-zinc-700 focus:ring-zinc-500/50'
          }`}
        />
      </div>

      <div>
        <label className="text-xs text-zinc-400 mb-1 block">Media alt text</label>
        <input
          value={data.altText}
          onChange={(e) => onChange({ ...data, altText: e.target.value })}
          placeholder="Describe the video for accessibility..."
          className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-500/50"
        />
      </div>

      <Toggle
        label="Thread continuation"
        enabled={data.threadContinuation}
        onChange={(v) => onChange({ ...data, threadContinuation: v })}
      />
    </div>
  )
}

// ── YouTube Form ────────────────────────────────────────────────────────
function YouTubeForm({ data, onChange }: { data: YouTubeFormData; onChange: (d: YouTubeFormData) => void }) {
  return (
    <div className="space-y-3">
      <RadioGroup
        label="Upload Type"
        value={data.uploadType}
        onChange={(v) => onChange({ ...data, uploadType: v as 'short' | 'long' })}
        options={[
          { value: 'short', label: 'Short', icon: Film },
          { value: 'long', label: 'Long Video', icon: Youtube },
        ]}
      />

      {data.uploadType === 'short' && (
        <div className="flex items-start gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded">
          <AlertCircle size={12} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-[10px] text-red-300/90">
            Shorts must be vertical (9:16) and under 60 seconds. #Shorts will be added to the title automatically.
          </p>
        </div>
      )}

      <div>
        <label className="text-xs text-zinc-400 mb-1 block">Title</label>
        <input
          value={data.title}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          placeholder={data.uploadType === 'short' ? 'Give your Short a title...' : 'Give your video a title...'}
          maxLength={100}
          className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-red-500/50"
        />
      </div>

      <div>
        <label className="text-xs text-zinc-400 mb-1 block">Description</label>
        <textarea
          value={data.description}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          placeholder="Describe your video..."
          rows={3}
          className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white placeholder-zinc-600 resize-none focus:outline-none focus:ring-1 focus:ring-red-500/50"
        />
      </div>

      <div>
        <label className="text-xs text-zinc-400 mb-1 block">Tags (comma-separated)</label>
        <input
          value={data.tags}
          onChange={(e) => onChange({ ...data, tags: e.target.value })}
          placeholder="animation, shorts, creative"
          className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-red-500/50"
        />
      </div>

      <RadioGroup
        label="Privacy"
        value={data.privacy}
        onChange={(v) => onChange({ ...data, privacy: v })}
        options={[
          { value: 'public', label: 'Public', icon: Globe },
          { value: 'unlisted', label: 'Unlisted', icon: Link2 },
          { value: 'private', label: 'Private', icon: Lock },
        ]}
      />

      <div className="space-y-1 pt-1">
        <Toggle
          label="Made for kids"
          enabled={data.madeForKids}
          onChange={(v) => onChange({ ...data, madeForKids: v })}
        />
      </div>
    </div>
  )
}

// ── Helper: upload video blob to Supabase Storage for public URL ─────────
async function uploadVideoForPublishing(recordingId: string, format: string): Promise<string> {
  const blob = await getRecordingBlob(recordingId)
  if (!blob) throw new Error('Video not found in local storage')
  if (!supabase) throw new Error('Supabase not configured')

  const ext = format === 'mp4' ? 'mp4' : 'webm'
  const path = `social/${recordingId}.${ext}`

  const { error } = await supabase.storage
    .from('audio') // Reuse existing bucket (videos are also media)
    .upload(path, blob, {
      upsert: true,
      contentType: format === 'mp4' ? 'video/mp4' : 'video/webm',
    })

  if (error) throw new Error(`Upload failed: ${error.message}`)

  const { data } = supabase.storage.from('audio').getPublicUrl(path)
  return data.publicUrl
}

// ── Inline sign-in form ──────────────────────────────────────────────────
function InlineSignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const { signIn, signUp, signInWithGoogle, isLoading, error, clearError } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    if (isSignUp) {
      await signUp(email, password)
    } else {
      await signIn(email, password)
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-center py-4">
        <Lock size={28} className="text-zinc-600 mx-auto mb-2" />
        <p className="text-sm text-zinc-300 font-medium">Sign in to publish</p>
        <p className="text-xs text-zinc-500 mt-1">An account is required to connect social platforms.</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded">
          <AlertCircle size={12} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-[10px] text-red-300">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="Email"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-green-500/50"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          placeholder="Password"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-green-500/50"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 bg-green-600 hover:bg-green-500 disabled:bg-zinc-600 rounded-lg text-xs font-medium text-white transition-colors flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 size={14} className="animate-spin" />}
          {isSignUp ? 'Create Account' : 'Sign In'}
        </button>
      </form>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-zinc-700" />
        <span className="text-[10px] text-zinc-500">or</span>
        <div className="flex-1 h-px bg-zinc-700" />
      </div>

      <button
        onClick={() => signInWithGoogle()}
        disabled={isLoading}
        className="w-full py-2 bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 rounded-xl text-xs text-zinc-300 transition-colors flex items-center justify-center gap-2"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </button>

      <p className="text-center text-[10px]">
        <button
          onClick={() => {
            setIsSignUp(!isSignUp)
            clearError()
          }}
          className="text-green-400 hover:text-green-300"
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </p>
    </div>
  )
}

// ── Main SharePanel ──────────────────────────────────────────────────────
export function SharePanel() {
  const user = useAuthStore((s) => s.user)
  const shareRecordingId = useEditorStore((s) => s.shareRecordingId)
  const recording = useRecordingsStore((s) => s.recordings.find((r) => r.id === shareRecordingId))
  const [activePlatform, setActivePlatform] = useState<SocialPlatform>('instagram')
  const [copiedLink, setCopiedLink] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishStage, setPublishStage] = useState<{ step: string; progress: number }>({ step: '', progress: 0 })
  const [smoothProgress, setSmoothProgress] = useState(0)
  const progressRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  // Smooth progress animation — gradually fills toward target
  useEffect(() => {
    if (progressRef.current) clearInterval(progressRef.current)
    if (!publishing && publishStage.progress === 0) {
      setSmoothProgress(0)
      return
    }
    if (publishStage.progress >= 100) {
      setSmoothProgress(100)
      return
    }
    progressRef.current = setInterval(() => {
      setSmoothProgress((prev) => {
        const target = publishStage.progress
        const maxDrift = target + 15 // drift slightly ahead of target for natural feel
        if (prev >= maxDrift) return prev
        const increment = prev < 30 ? 0.8 : prev < 60 ? 0.4 : 0.2
        return Math.min(prev + increment, maxDrift)
      })
    }, 200)
    return () => {
      if (progressRef.current) clearInterval(progressRef.current)
    }
  }, [publishing, publishStage.progress])
  const [publishResult, setPublishResult] = useState<{ success: boolean; postUrl?: string; error?: string } | null>(
    null,
  )

  // Real account data from backend
  const [accounts, setAccounts] = useState<SocialAccount[]>([
    { platform: 'facebook', connected: false },
    { platform: 'instagram', connected: false },
    { platform: 'tiktok', connected: false },
    { platform: 'x', connected: false },
    { platform: 'youtube', connected: false },
  ])

  // Form state (lifted to parent so we can read values on publish)
  const [fbForm, setFbForm] = useState<FacebookFormData>({
    description: '',
    privacy: 'public',
    useSchedule: false,
    scheduledTime: '',
  })
  const [igForm, setIgForm] = useState<InstagramFormData>({
    caption: '',
    hashtags: '',
    postType: 'reels',
    coverTime: 0,
  })
  const [ttForm, setTtForm] = useState<TikTokFormData>({
    description: '',
    hashtags: '',
    privacy: '',
    allowComments: null,
    allowDuets: null,
    allowStitches: null,
    postMode: 'direct',
    contentDisclosure: false,
    brandContentToggle: false,
    brandOrganicToggle: false,
  })
  const [xForm, setXForm] = useState<XFormData>({ tweetText: '', altText: '', threadContinuation: false })
  const [ytForm, setYtForm] = useState<YouTubeFormData>({
    title: '',
    description: '',
    tags: '',
    privacy: 'public',
    madeForKids: false,
    uploadType: 'short',
  })

  // Scheduling state
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([])
  const [generatingMetadata, setGeneratingMetadata] = useState(false)

  // Fetch scheduled posts
  const fetchScheduled = useCallback(async () => {
    try {
      const posts = await getScheduledPosts()
      setScheduledPosts(posts)
    } catch {
      // Silently fail
    }
  }, [])

  useEffect(() => {
    fetchScheduled()
  }, [fetchScheduled])

  // Handle AI metadata generation
  const handleGenerateMetadata = useCallback(async () => {
    setGeneratingMetadata(true)
    try {
      const contentSummary = recording?.name || 'Animated video'
      const result = await generateMetadata(contentSummary, activePlatform)
      // Auto-fill form fields based on platform
      if (activePlatform === 'youtube') {
        setYtForm((prev) => ({
          ...prev,
          title: result.title || prev.title,
          description: result.description || prev.description,
          tags: result.hashtags?.join(', ') || prev.tags,
        }))
      } else if (activePlatform === 'instagram') {
        setIgForm((prev) => ({
          ...prev,
          caption: result.description || prev.caption,
          hashtags: result.hashtags?.map((h: string) => (h.startsWith('#') ? h : `#${h}`)).join(' ') || prev.hashtags,
        }))
      } else if (activePlatform === 'tiktok') {
        setTtForm((prev) => ({
          ...prev,
          description: result.description || prev.description,
          hashtags: result.hashtags?.map((h: string) => (h.startsWith('#') ? h : `#${h}`)).join(' ') || prev.hashtags,
        }))
      } else if (activePlatform === 'facebook') {
        setFbForm((prev) => ({
          ...prev,
          description: result.description || prev.description,
        }))
      } else if (activePlatform === 'x') {
        setXForm((prev) => ({
          ...prev,
          tweetText: result.description ? result.description.slice(0, 280) : prev.tweetText,
        }))
      }
    } catch (err) {
      console.warn('[SharePanel] Metadata generation failed:', err)
    } finally {
      setGeneratingMetadata(false)
    }
  }, [recording, activePlatform])

  // Handle schedule post
  const handleSchedulePost = useCallback(
    async (scheduledAt: string) => {
      if (!shareRecordingId || !recording) return
      setShowScheduleModal(false)
      try {
        const videoUrl = await uploadVideoForPublishing(shareRecordingId, recording.format)
        await schedulePost(activePlatform, videoUrl, shareRecordingId, {}, scheduledAt)
        await fetchScheduled()
      } catch (err: unknown) {
        setConnectError(err instanceof Error ? err.message : String(err))
      }
    },
    [shareRecordingId, recording, activePlatform, fetchScheduled],
  )

  // Handle cancel scheduled post
  const handleCancelScheduledPost = useCallback(async (postId: string) => {
    try {
      await cancelScheduledPost(postId)
      setScheduledPosts((prev) => prev.filter((p) => p.id !== postId))
    } catch (err: any) {
      setConnectError(err.message || 'Failed to cancel post')
    }
  }, [])

  // Fetch accounts on mount and after OAuth
  const fetchAccounts = useCallback(async () => {
    const accts = await getSocialAccounts()
    setAccounts(accts)
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const handleConnect = useCallback(
    async (platform: SocialPlatform) => {
      setConnectError(null)
      setConnecting(true)
      try {
        const result = await connectPlatform(platform)
        if (result.success) {
          await fetchAccounts() // Refresh account list
        } else if (result.error) {
          setConnectError(result.error)
        }
      } finally {
        setConnecting(false)
      }
    },
    [fetchAccounts],
  )

  const handleDisconnect = useCallback(
    async (platform: SocialPlatform) => {
      try {
        await disconnectPlatform(platform)
        await fetchAccounts()
      } catch (err: any) {
        setConnectError(err.message)
      }
    },
    [fetchAccounts],
  )

  const handlePublish = useCallback(async () => {
    if (!shareRecordingId || !recording) return

    setPublishing(true)
    setPublishResult(null)
    setConnectError(null)
    setPublishStage({ step: 'Preparing video...', progress: 5 })
    let processingTimer: ReturnType<typeof setTimeout> | undefined

    try {
      // Upload video to Supabase Storage to get a public URL
      setPublishStage({ step: 'Uploading to cloud storage...', progress: 15 })
      const videoUrl = await uploadVideoForPublishing(shareRecordingId, recording.format)
      setPublishStage({ step: `Uploading to ${activePlatformConfig.label}...`, progress: 35 })

      // Start a timer to show processing stage after 8s (platform-side processing)
      processingTimer = setTimeout(() => {
        setPublishStage({ step: `Processing on ${activePlatformConfig.label}...`, progress: 70 })
      }, 8000)

      let result: { success: boolean; postUrl?: string; postId?: string; error?: string }

      if (activePlatform === 'instagram') {
        result = await publishToInstagram(videoUrl, {
          caption: igForm.caption,
          hashtags: igForm.hashtags,
          postType: igForm.postType as 'reels' | 'feed',
          coverImageTimestamp: igForm.coverTime || undefined,
        })
      } else if (activePlatform === 'facebook') {
        result = await publishToFacebook(videoUrl, {
          pageId: '', // Backend uses stored page_id
          description: fbForm.description,
          privacy: fbForm.privacy as 'public' | 'friends' | 'only_me',
          scheduledTime: fbForm.useSchedule ? fbForm.scheduledTime : undefined,
        })
      } else if (activePlatform === 'tiktok') {
        result = await publishToTikTok(videoUrl, {
          description: ttForm.description,
          hashtags: ttForm.hashtags,
          privacy: ttForm.privacy as 'public' | 'friends' | 'private',
          allowComments: ttForm.allowComments ?? false,
          allowDuets: ttForm.allowDuets ?? false,
          allowStitches: ttForm.allowStitches ?? false,
          postMode: ttForm.postMode,
          brandContentToggle: ttForm.brandContentToggle,
          brandOrganicToggle: ttForm.brandOrganicToggle,
        })
      } else if (activePlatform === 'x') {
        result = await publishToX(videoUrl, {
          tweetText: xForm.tweetText,
          mediaAltText: xForm.altText,
          threadContinuation: xForm.threadContinuation,
        })
      } else {
        result = await publishToYouTube(videoUrl, {
          title: ytForm.title,
          description: ytForm.description,
          tags: ytForm.tags,
          privacy: ytForm.privacy as 'public' | 'unlisted' | 'private',
          madeForKids: ytForm.madeForKids,
          uploadType: ytForm.uploadType,
        })
      }

      clearTimeout(processingTimer)
      setPublishStage({ step: result.success ? 'Published!' : 'Failed', progress: 100 })
      setPublishResult(result)

      if (result.success) {
        // Register published post for analytics tracking
        const postId = `post_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        useAnalyticsStore.getState().addPublishedPost({
          id: postId,
          recordingId: shareRecordingId,
          platform: activePlatform,
          postId: result.postId || '',
          postUrl: result.postUrl || '',
          publishedAt: new Date().toISOString(),
          metrics: null,
        })

        // Capture project feature snapshot for the AI learning system
        useLearningStore
          .getState()
          .captureSnapshot(shareRecordingId, activePlatform, postId)
          .catch((err) => console.warn('[Learning] Snapshot capture failed:', err))
      }
    } catch (err: any) {
      clearTimeout(processingTimer)
      setPublishStage({ step: 'Failed', progress: 100 })
      setPublishResult({ success: false, error: err.message })
    } finally {
      setPublishing(false)
    }
  }, [shareRecordingId, recording, activePlatform, igForm, fbForm, ttForm, xForm, ytForm])

  const handleCopyLink = useCallback(() => {
    if (!publishResult?.postUrl) return
    navigator.clipboard.writeText(publishResult.postUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }, [publishResult])

  // Show sign-in form if not authenticated
  if (!user) {
    return <InlineSignIn />
  }

  if (!recording) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Share2 size={32} className="text-zinc-600 mb-3" />
        <p className="text-sm text-zinc-400">No recording selected</p>
        <p className="text-xs text-zinc-500 mt-1">Export a video first, then use Share.</p>
      </div>
    )
  }

  const activeAccount = accounts.find((a) => a.platform === activePlatform)
  const activePlatformConfig = PLATFORMS.find((p) => p.id === activePlatform)!

  return (
    <div className="space-y-5">
      {/* Recording preview header */}
      <div className="flex items-center gap-3 p-3 bg-zinc-900/40 backdrop-blur-md rounded-xl border border-white/5">
        {recording.thumbnailUrl ? (
          <img
            src={recording.thumbnailUrl}
            alt={recording.name}
            className="w-20 h-12 object-contain rounded bg-black"
          />
        ) : (
          <div className="w-20 h-12 bg-zinc-900 rounded flex items-center justify-center">
            <Film size={16} className="text-zinc-600" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-white truncate">{recording.name}</h3>
          <p className="text-[10px] text-zinc-500">
            {recording.format.toUpperCase()} &middot; {recording.width}x{recording.height} &middot;{' '}
            {Math.round(recording.durationSec)}s
          </p>
        </div>
      </div>

      {/* Platform tabs */}
      <div className="flex gap-1">
        {PLATFORMS.map((p) => {
          const Icon = p.icon
          const isActive = activePlatform === p.id
          const acct = accounts.find((a) => a.platform === p.id)
          return (
            <button
              key={p.id}
              onClick={() => {
                setActivePlatform(p.id)
                setConnectError(null)
                setPublishResult(null)
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs rounded-lg transition-colors relative ${
                isActive
                  ? `${p.bgColor} ${p.color} ring-1 ring-current/30`
                  : 'bg-zinc-900/50 border border-white/5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
              }`}
            >
              <Icon size={14} />
              {p.label}
              {acct?.connected && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-zinc-900" />
              )}
            </button>
          )
        })}
      </div>

      {/* Account connection section */}
      {activeAccount && !activeAccount.connected && (
        <div className="p-3 bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-xl">
          <p className="text-xs text-zinc-400 mb-2">
            Connect your {activePlatformConfig.label} account to publish directly.
          </p>
          <button
            onClick={() => handleConnect(activePlatform)}
            disabled={connecting}
            className={`w-full flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-colors ${activePlatformConfig.bgColor} ${activePlatformConfig.color} hover:brightness-110 disabled:opacity-50`}
          >
            {connecting ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
            {connecting ? 'Connecting...' : `Connect ${activePlatformConfig.label}`}
          </button>
        </div>
      )}

      {/* Connected account info */}
      {activeAccount?.connected && activePlatform === 'tiktok' && (
        <TikTokProfileCard onDisconnect={() => handleDisconnect('tiktok')} />
      )}
      {activeAccount?.connected && activePlatform !== 'tiktok' && (
        <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="flex items-center gap-2">
            {activeAccount.avatarUrl ? (
              <img src={activeAccount.avatarUrl} alt="" className="w-6 h-6 rounded-full" />
            ) : (
              <CheckCircle2 size={16} className="text-green-400" />
            )}
            <div>
              <p className="text-xs text-green-300 font-medium">{activeAccount.username || 'Connected'}</p>
              {activeAccount.pageName && <p className="text-[10px] text-green-400/60">{activeAccount.pageName}</p>}
            </div>
          </div>
          <button
            onClick={() => handleDisconnect(activePlatform)}
            className="text-zinc-500 hover:text-red-400 transition-colors"
            title="Disconnect"
          >
            <Unlink size={14} />
          </button>
        </div>
      )}

      {/* Error message */}
      {connectError && (
        <div className="flex items-start gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded">
          <AlertCircle size={12} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-[10px] text-amber-300/90">{connectError}</p>
        </div>
      )}

      {/* Platform-specific form */}
      <div className="border-t border-zinc-700/40 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
            {(() => {
              const Icon = activePlatformConfig.icon
              return <Icon size={13} className={activePlatformConfig.color} />
            })()}
            {activePlatformConfig.label} Settings
          </h4>
          {activeAccount?.connected && (
            <button
              onClick={handleGenerateMetadata}
              disabled={generatingMetadata}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium bg-violet-500/10 text-violet-400 rounded-lg hover:bg-violet-500/20 transition-colors disabled:opacity-50"
            >
              {generatingMetadata ? <Loader2 size={10} className="animate-spin" /> : <Globe size={10} />}
              Generate with AI
            </button>
          )}
        </div>

        {activePlatform === 'facebook' && <FacebookForm data={fbForm} onChange={setFbForm} />}
        {activePlatform === 'instagram' && <InstagramForm data={igForm} onChange={setIgForm} />}
        {activePlatform === 'tiktok' && <TikTokForm data={ttForm} onChange={setTtForm} />}
        {activePlatform === 'x' && <XForm data={xForm} onChange={setXForm} />}
        {activePlatform === 'youtube' && <YouTubeForm data={ytForm} onChange={setYtForm} />}
      </div>

      {/* TikTok videos list */}
      {activePlatform === 'tiktok' && activeAccount?.connected && <TikTokVideosList />}

      {/* Publish result */}
      {publishResult && (
        <div
          className={`p-3 rounded-lg border ${
            publishResult.success ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'
          }`}
        >
          {publishResult.success ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-green-400" />
              <div className="flex-1">
                <p className="text-xs text-green-300">Published successfully!</p>
                {publishResult.postUrl && (
                  <a
                    href={publishResult.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-green-400/80 hover:text-green-300 flex items-center gap-1 mt-0.5"
                  >
                    View post <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-xs text-red-300">{publishResult.error}</p>
            </div>
          )}
        </div>
      )}

      {/* AI Pre-publish Score */}
      {activeAccount?.connected && !publishResult?.success && <PrePublishScore platform={activePlatform} />}

      {/* Publish progress bar */}
      {publishing && (
        <div className="space-y-2 py-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-300 font-medium">{publishStage.step}</span>
            <span className="text-[10px] text-zinc-500 tabular-nums">{Math.round(smoothProgress)}%</span>
          </div>
          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${smoothProgress}%`,
                background: 'linear-gradient(90deg, #06b6d4, #8b5cf6, #ec4899)',
              }}
            />
          </div>
          <p className="text-[9px] text-zinc-600">This may take up to a minute depending on video size.</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 pt-2 border-t border-zinc-700/40">
        <button
          onClick={handlePublish}
          disabled={
            publishing ||
            !activeAccount?.connected ||
            (activePlatform === 'tiktok' &&
              (!ttForm.privacy ||
                ttForm.allowComments === null ||
                ttForm.allowDuets === null ||
                ttForm.allowStitches === null ||
                (ttForm.contentDisclosure && !ttForm.brandOrganicToggle && !ttForm.brandContentToggle)))
          }
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            activeAccount?.connected
              ? `${activePlatformConfig.bgColor} ${activePlatformConfig.color} hover:brightness-110`
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
          } disabled:opacity-50`}
        >
          {publishing ? <Loader2 size={15} className="animate-spin" /> : <Share2 size={15} />}
          {publishing
            ? 'Publishing...'
            : activePlatform === 'tiktok' && ttForm.postMode === 'draft'
              ? 'Save as Draft'
              : `Publish to ${activePlatformConfig.label}`}
        </button>
        {activeAccount?.connected && (
          <button
            onClick={() => setShowScheduleModal(true)}
            className="px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm rounded-lg transition-colors"
            title="Schedule for later"
          >
            <Calendar size={16} />
          </button>
        )}
        {publishResult?.postUrl && (
          <button
            onClick={handleCopyLink}
            className="px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm rounded-lg transition-colors"
            title="Copy post link"
          >
            {copiedLink ? <CheckCheck size={16} className="text-green-400" /> : <Copy size={16} />}
          </button>
        )}
      </div>

      {!activeAccount?.connected && (
        <p className="text-[10px] text-zinc-600 text-center">
          Connect your {activePlatformConfig.label} account above to enable publishing.
        </p>
      )}

      {/* Scheduled Posts */}
      {scheduledPosts.length > 0 && (
        <div className="border-t border-zinc-700/40 pt-4 space-y-2">
          <h4 className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
            <Calendar size={13} className="text-zinc-500" />
            Scheduled Posts
          </h4>
          {scheduledPosts.map((post) => (
            <div
              key={post.id}
              className="flex items-center justify-between p-2.5 bg-zinc-900/40 border border-white/5 rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-medium text-zinc-300 capitalize">{post.platform}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                      post.status === 'pending'
                        ? 'bg-amber-500/10 text-amber-400'
                        : post.status === 'published'
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    {post.status}
                  </span>
                </div>
                <p className="text-[9px] text-zinc-500 mt-0.5">{new Date(post.scheduledAt).toLocaleString()}</p>
              </div>
              {post.status === 'pending' && (
                <button
                  onClick={() => handleCancelScheduledPost(post.id)}
                  className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                  title="Cancel"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Publish Queue */}
      <PublishQueuePanel />

      {/* Schedule Picker Modal */}
      {showScheduleModal && (
        <SchedulePickerModal
          platforms={[activePlatform]}
          onSchedule={handleSchedulePost}
          onClose={() => setShowScheduleModal(false)}
        />
      )}
    </div>
  )
}
