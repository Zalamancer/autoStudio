import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SpotifyQueueConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const QUEUE_TRACKS = [
  { title: 'Now Playing', artist: 'Current Vibes', duration: '3:24', active: true, color: '#1DB954' },
  { title: 'Next in Queue', artist: 'Upcoming Beat', duration: '2:58', active: false, color: '#535353' },
  { title: 'After this', artist: 'Another Banger', duration: '4:02', active: false, color: '#535353' },
  { title: 'Recommended', artist: 'Discover Weekly', duration: '3:41', active: false, color: '#535353' },
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const progress = (time * 0.05) % 1
    // Audio wave animation
    const bars = Array.from({ length: 5 }, (_, i) => 0.3 + Math.abs(Math.sin(time * 3 + i * 0.8)) * 0.7)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Spotify-style album art gradient top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '35%',
            background: 'linear-gradient(180deg, rgba(29,185,84,0.18) 0%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Mini now-playing bar at top */}
        <div
          style={{
            position: 'absolute',
            top: 'clamp(6px, 1.5vw, 12px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'clamp(120px, 36vw, 240px)',
            height: 'clamp(20px, 4vw, 32px)',
            background: 'rgba(30,215,96,0.12)',
            borderRadius: 100,
            border: '1px solid rgba(29,185,84,0.3)',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 'clamp(6px, 1.5vw, 12px)',
            paddingRight: 'clamp(6px, 1.5vw, 12px)',
            gap: 'clamp(5px, 1vw, 8px)',
          }}
        >
          {/* Animated equalizer bars */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: 'clamp(8px, 1.5vw, 12px)' }}>
            {bars.map((h, i) => (
              <div
                key={i}
                style={{
                  width: 'clamp(1.5px, 0.3vw, 2.5px)',
                  height: `${h * 100}%`,
                  background: '#1DB954',
                  borderRadius: 1,
                }}
              />
            ))}
          </div>
          <span
            style={{
              fontFamily: '"Circular", system-ui, sans-serif',
              fontSize: 'clamp(6px, 1.1vw, 9px)',
              color: '#1DB954',
              fontWeight: 600,
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            Current Vibes · Now Playing
          </span>
          {/* Skip button */}
          <span style={{ fontSize: 'clamp(8px, 1.5vw, 12px)', color: '#1DB954', opacity: 0.8 }}>⏭</span>
        </div>

        {/* Progress bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 'clamp(8px, 1.8vw, 14px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'clamp(120px, 40vw, 260px)',
          }}
        >
          <div
            style={{
              height: 'clamp(2px, 0.4vw, 3px)',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 100,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress * 100}%`,
                background: '#1DB954',
                borderRadius: 100,
              }}
            />
          </div>
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const nodes: React.ReactNode[] = []

    const queueY = height * 0.18
    const queueX = width * 0.1
    const queueW = width * 0.8
    const rowH = Math.min(height * 0.12, 36)

    // Queue items slide in and skip animation
    QUEUE_TRACKS.forEach((track, i) => {
      const delay = i * 0.09
      const trackP = easeOutExpo(Math.min(1, Math.max(0, (enterProgress - delay) / 0.25)))
      // Skip to next: first track slides up and fades when word appears
      const skipOffset = phase === 'enter' && enterProgress > 0.55 && i === 0
        ? -Math.min(1, (enterProgress - 0.55) / 0.2) * rowH * 0.8
        : 0
      const trackOpacity = phase === 'exit'
        ? Math.max(0, 1 - exitProgress * 2)
        : i === 0 && phase === 'enter' && enterProgress > 0.55
        ? Math.max(0, 1 - (enterProgress - 0.55) / 0.15)
        : trackP

      nodes.push(
        <div
          key={`track-${i}`}
          style={{
            position: 'absolute',
            left: queueX,
            top: queueY + i * (rowH + 4) + skipOffset,
            width: queueW,
            height: rowH,
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(6px, 1.5vw, 12px)',
            opacity: trackOpacity,
            background: track.active ? 'rgba(29,185,84,0.08)' : 'transparent',
            borderRadius: 6,
            paddingLeft: 'clamp(6px, 1.2vw, 10px)',
            paddingRight: 'clamp(6px, 1.2vw, 10px)',
          }}
        >
          {/* Album art placeholder */}
          <div
            style={{
              width: rowH - 8,
              height: rowH - 8,
              borderRadius: 4,
              background: track.active ? 'rgba(29,185,84,0.3)' : 'rgba(255,255,255,0.08)',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(8px, 1.5vw, 12px)',
            }}
          >
            {track.active ? '▶' : '♪'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: '"Circular", system-ui, sans-serif',
                fontSize: 'clamp(7px, 1.3vw, 10px)',
                fontWeight: track.active ? 700 : 400,
                color: track.active ? '#1DB954' : 'rgba(255,255,255,0.85)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {track.title}
            </div>
            <div
              style={{
                fontFamily: '"Circular", system-ui, sans-serif',
                fontSize: 'clamp(6px, 1vw, 8px)',
                color: 'rgba(255,255,255,0.45)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {track.artist}
            </div>
          </div>
          <span
            style={{
              fontFamily: '"Circular", system-ui, sans-serif',
              fontSize: 'clamp(6px, 1vw, 8px)',
              color: 'rgba(255,255,255,0.35)',
            }}
          >
            {track.duration}
          </span>
        </div>,
      )
    })

    // Word rises like a track name getting promoted to now playing
    const wordP = easeOutBack(Math.min(1, Math.max(0, (enterProgress - 0.5) / 0.5)))
    const wordOpacity = phase === 'exit' ? Math.max(0, 1 - exitProgress * 1.5) : Math.min(1, Math.max(0, (enterProgress - 0.45) * 4))
    const pulse = phase === 'hold' ? 1 + Math.sin(f * 0.07) * 0.012 : 1

    nodes.push(
      <div
        key="word"
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '50%',
          transform: `translateX(-50%) scale(${wordP * pulse})`,
          opacity: wordOpacity,
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        <div
          style={{
            fontFamily: '"Circular", system-ui, sans-serif',
            fontSize: 'clamp(34px, 8.5vw, 118px)',
            fontWeight: 900,
            color,
            textShadow: `0 0 30px ${color}55`,
            letterSpacing: -2,
          }}
        >
          {word}
        </div>
      </div>,
    )

    return <>{nodes}</>
  },
}

function SpotifyQueueComponent(props: MotionGraphicProps<SpotifyQueueConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-spotify-queue',
  title: 'Kinetic Spotify Queue',
  description:
    'Spotify queue panel with live equalizer bars, tracks slide in, the now-playing row skips off as the word pops in as the new track title with a green glow',
  tags: ['kinetic', 'typography', 'spotify', 'music', 'queue', 'streaming', 'platform', 'digital-native', 'interaction'],
  category: 'captions',
  component: SpotifyQueueComponent as any,
  defaultConfig: {
    words: ['NEXT', 'VIBE', 'BANGER', 'FIRE'],
    colors: ['#1DB954', '#FF6437', '#1877F2', '#A259FF'],
    bgColor: '#121212',
    cycleDuration: 2.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['NEXT', 'VIBE', 'BANGER', 'FIRE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1DB954', '#FF6437', '#1877F2', '#A259FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#121212', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.3, min: 0.5, max: 5, group: 'Timing' },
  ],
})
