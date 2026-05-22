/**
 * Schedule Picker Modal — date/time picker with timezone auto-detection
 * and best-time suggestions based on platform analytics.
 */

import { useState, useMemo } from 'react'
import { Calendar, Clock, Globe, X, Sparkles } from 'lucide-react'
import type { SocialPlatform } from '@/types/social'

interface SchedulePickerModalProps {
  platforms: SocialPlatform[]
  onSchedule: (scheduledAt: string) => void
  onClose: () => void
}

const BEST_TIMES: Record<SocialPlatform, string[]> = {
  tiktok: ['7:00 AM', '12:00 PM', '7:00 PM'],
  instagram: ['11:00 AM', '1:00 PM', '7:00 PM'],
  youtube: ['2:00 PM', '4:00 PM', '9:00 PM'],
  facebook: ['9:00 AM', '1:00 PM', '3:00 PM'],
  x: ['8:00 AM', '12:00 PM', '5:00 PM'],
}

export function SchedulePickerModal({ platforms, onSchedule, onClose }: SchedulePickerModalProps) {
  const detectedTimezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  )

  const now = new Date()
  const defaultDate = now.toISOString().slice(0, 10)
  const defaultTime = `${String(now.getHours() + 1).padStart(2, '0')}:00`

  const [date, setDate] = useState(defaultDate)
  const [time, setTime] = useState(defaultTime)
  const [timezone] = useState(detectedTimezone)

  const suggestedTimes = useMemo(() => {
    if (platforms.length === 0) return []
    const allTimes = platforms.flatMap((p) => BEST_TIMES[p] || [])
    return [...new Set(allTimes)].slice(0, 5)
  }, [platforms])

  const handleSchedule = () => {
    const dateTime = new Date(`${date}T${time}:00`)
    if (isNaN(dateTime.getTime())) return
    onSchedule(dateTime.toISOString())
  }

  const handleSuggestedTime = (timeStr: string) => {
    // Parse time like "7:00 AM" or "2:00 PM"
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i)
    if (!match) return
    let hours = parseInt(match[1])
    const minutes = match[2]
    const period = match[3].toUpperCase()
    if (period === 'PM' && hours !== 12) hours += 12
    if (period === 'AM' && hours === 12) hours = 0
    setTime(`${String(hours).padStart(2, '0')}:${minutes}`)
  }

  const isValidDate = () => {
    const selected = new Date(`${date}T${time}:00`)
    return selected > now
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-[360px] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <Calendar size={16} className="text-blue-400" />
            Schedule Post
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5">
            <X size={16} className="text-zinc-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Date */}
          <div>
            <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={defaultDate}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:border-blue-500/50 focus:outline-none"
            />
          </div>

          {/* Time */}
          <div>
            <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Time</label>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-zinc-500" />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:border-blue-500/50 focus:outline-none"
              />
            </div>
          </div>

          {/* Timezone */}
          <div className="flex items-center gap-2 text-[10px] text-zinc-500">
            <Globe size={12} />
            <span>{timezone}</span>
          </div>

          {/* Best time suggestions */}
          {suggestedTimes.length > 0 && (
            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider flex items-center gap-1 mb-2">
                <Sparkles size={10} />
                Best Times to Post
              </label>
              <div className="flex flex-wrap gap-1.5">
                {suggestedTimes.map((t) => (
                  <button
                    key={t}
                    onClick={() => handleSuggestedTime(t)}
                    className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-[10px] font-medium border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-white/5">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl text-xs text-zinc-400 border border-white/10 hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSchedule}
            disabled={!isValidDate()}
            className="flex-1 py-2 rounded-xl text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 transition-colors"
          >
            Schedule
          </button>
        </div>
      </div>
    </div>
  )
}
