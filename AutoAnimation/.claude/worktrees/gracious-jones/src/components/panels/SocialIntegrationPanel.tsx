import { useState, useCallback, useEffect } from 'react'
import { Share2, TrendingUp, Hash, Clock, Music2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSocialIntegrationStore } from '@/stores/useSocialIntegrationStore'
import { fetchTrendingTopics, fetchTrendingSounds, generateHashtags, getOptimalPostingTimes } from '@/services/socialIntegration'

const PLATFORMS = [
  { id: 'tiktok', name: 'TikTok', icon: 'M' },
  { id: 'youtube-shorts', name: 'YouTube Shorts', icon: 'Y' },
  { id: 'instagram-reels', name: 'Instagram Reels', icon: 'I' },
  { id: 'twitter', name: 'X (Twitter)', icon: 'X' },
  { id: 'linkedin', name: 'LinkedIn', icon: 'L' },
  { id: 'facebook', name: 'Facebook', icon: 'F' },
]

export function SocialIntegrationPanel() {
  const { trendingTopics, trendingSounds, activeHashtags, setTrendingTopics, setTrendingSounds, addHashtag, removeHashtag, setLoading } = useSocialIntegrationStore()
  const [selectedPlatform, setSelectedPlatform] = useState('tiktok')
  const [hashtagInput, setHashtagInput] = useState('')
  const [postingTimes, setPostingTimes] = useState<{ day: string; hour: number; engagement: number }[]>([])

  const loadTrends = useCallback(async (platform: string) => {
    setLoading(true)
    try {
      const [topics, sounds] = await Promise.all([
        fetchTrendingTopics(platform),
        fetchTrendingSounds(platform),
      ])
      setTrendingTopics(topics)
      setTrendingSounds(sounds)
      setPostingTimes(getOptimalPostingTimes(platform))
    } finally {
      setLoading(false)
    }
  }, [setTrendingTopics, setTrendingSounds, setLoading])

  useEffect(() => {
    loadTrends(selectedPlatform)
  }, [selectedPlatform, loadTrends])

  const handleAddHashtag = useCallback(() => {
    if (hashtagInput.trim()) {
      addHashtag(hashtagInput.trim().replace(/^#/, ''))
      setHashtagInput('')
    }
  }, [hashtagInput, addHashtag])

  const handleAutoGenerate = useCallback(() => {
    const tags = generateHashtags('animation video content creator', selectedPlatform)
    tags.forEach(t => addHashtag(t))
  }, [selectedPlatform, addHashtag])

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-3 py-3 border-b border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <Share2 size={16} className="text-green-400" />
          <span className="text-sm font-medium text-zinc-200">Social Integration</span>
        </div>
        <p className="text-[11px] text-zinc-500">Platform trends, hashtags, and posting schedule.</p>
      </div>

      {/* Platform Selector */}
      <div className="px-3 py-2 border-b border-white/5">
        <div className="text-[11px] font-medium text-zinc-400 mb-2">Platform</div>
        <div className="flex flex-wrap gap-1.5">
          {PLATFORMS.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPlatform(p.id)}
              className={cn(
                'px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors',
                selectedPlatform === p.id
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-white/[0.04] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.08]'
              )}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Trending Topics */}
      <div className="px-3 py-2 border-b border-white/5">
        <div className="flex items-center gap-1.5 mb-2">
          <TrendingUp size={12} className="text-zinc-500" />
          <span className="text-[11px] font-medium text-zinc-400">Trending Topics</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {trendingTopics.map(topic => (
            <span key={topic} className="px-2 py-1 rounded-md bg-white/[0.04] text-[11px] text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors">
              {topic}
            </span>
          ))}
        </div>
      </div>

      {/* Trending Sounds */}
      <div className="px-3 py-2 border-b border-white/5">
        <div className="flex items-center gap-1.5 mb-2">
          <Music2 size={12} className="text-zinc-500" />
          <span className="text-[11px] font-medium text-zinc-400">Trending Sounds</span>
        </div>
        <div className="space-y-1">
          {trendingSounds.map((sound, i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors cursor-pointer">
              <Music2 size={11} className="text-zinc-600" />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-zinc-300 truncate">{sound.name}</div>
                <div className="text-[10px] text-zinc-600">{sound.artist}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hashtag Generator */}
      <div className="px-3 py-2 border-b border-white/5">
        <div className="flex items-center gap-1.5 mb-2">
          <Hash size={12} className="text-zinc-500" />
          <span className="text-[11px] font-medium text-zinc-400">Hashtags</span>
          <button onClick={handleAutoGenerate} className="ml-auto text-[10px] text-green-500 hover:text-green-400 transition-colors">Auto-generate</button>
        </div>
        <div className="flex gap-1.5 mb-2">
          <input
            value={hashtagInput}
            onChange={(e) => setHashtagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddHashtag()}
            placeholder="Add hashtag..."
            className="flex-1 px-2 py-1.5 rounded-lg bg-white/[0.04] border border-white/5 text-[11px] text-zinc-200 placeholder-zinc-600 outline-none focus:border-green-500/30"
          />
          <button onClick={handleAddHashtag} className="px-2 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-[11px] hover:bg-green-500/30 transition-colors">Add</button>
        </div>
        <div className="flex flex-wrap gap-1">
          {activeHashtags.map(tag => (
            <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-500/10 text-green-400 text-[11px]">
              #{tag}
              <button onClick={() => removeHashtag(tag)} className="text-green-600 hover:text-green-300 transition-colors">x</button>
            </span>
          ))}
        </div>
      </div>

      {/* Posting Times */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-1.5 mb-2">
          <Clock size={12} className="text-zinc-500" />
          <span className="text-[11px] font-medium text-zinc-400">Best Posting Times</span>
        </div>
        <div className="space-y-1">
          {postingTimes.map((time, i) => (
            <div key={i} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-white/[0.03]">
              <span className="text-[11px] text-zinc-300">{time.day} at {time.hour}:00</span>
              <div className="flex items-center gap-1.5">
                <div className="w-16 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full rounded-full bg-green-500" style={{ width: `${time.engagement * 100}%` }} />
                </div>
                <span className="text-[10px] text-zinc-500">{(time.engagement * 100).toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
