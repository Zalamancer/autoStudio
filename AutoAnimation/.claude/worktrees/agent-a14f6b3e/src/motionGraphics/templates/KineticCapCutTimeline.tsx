import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CapCutTimelineConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

// Timeline tracks: video, audio, text, effects
const TRACKS = [
  { label: 'Video', color: '#3B82F6', clips: [{ x: 0.02, w: 0.35 }, { x: 0.4, w: 0.25 }, { x: 0.7, w: 0.28 }] },
  { label: 'Audio', color: '#10B981', clips: [{ x: 0.0, w: 0.6 }, { x: 0.65, w: 0.33 }] },
  { label: 'Text', color: '#F59E0B', clips: [{ x: 0.1, w: 0.2 }, { x: 0.45, w: 0.15 }, { x: 0.72, w: 0.1 }] },
  { label: 'FX', color: '#EC4899', clips: [{ x: 0.15, w: 0.08 }, { x: 0.55, w: 0.06 }] },
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Playhead moves across timeline
    const playheadX = ((time * 0.12) % 1)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Top toolbar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 'clamp(24px, 5vw, 40px)',
            background: 'rgba(20,20,20,0.95)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 'clamp(8px, 2vw, 16px)',
            gap: 'clamp(8px, 1.5vw, 12px)',
          }}
        >
          {['✂', '◉', '↩', '⊕', '⚙'].map((icon, i) => (
            <span
              key={i}
              style={{
                fontFamily: 'system-ui, sans-serif',
                fontSize: 'clamp(8px, 1.5vw, 12px)',
                color: i === 1 ? '#EC4899' : 'rgba(255,255,255,0.5)',
                opacity: 0.7,
              }}
            >
              {icon}
            </span>
          ))}
          <div style={{ flex: 1 }} />
          <span
            style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: 'clamp(6px, 1vw, 8px)',
              color: 'rgba(255,255,255,0.3)',
              marginRight: 'clamp(6px, 1.5vw, 12px)',
            }}
          >
            00:15 / 01:00
          </span>
        </div>

        {/* Timeline ruler */}
        <div
          style={{
            position: 'absolute',
            bottom: 'clamp(28px, 6vw, 48px)',
            left: 'clamp(36px, 7vw, 56px)',
            right: 'clamp(8px, 2vw, 16px)',
            height: 'clamp(12px, 2.5vw, 20px)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'flex-end',
          }}
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                borderLeft: '1px solid rgba(255,255,255,0.15)',
                height: i % 5 === 0 ? '60%' : '30%',
              }}
            />
          ))}
          {/* Playhead */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: `${playheadX * 100}%`,
              width: 1,
              bottom: -80,
              background: '#EC4899',
              zIndex: 10,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -4,
                left: -5,
                width: 10,
                height: 10,
                background: '#EC4899',
                borderRadius: 2,
                transform: 'rotate(45deg)',
              }}
            />
          </div>
        </div>

        {/* Play/pause button */}
        <div
          style={{
            position: 'absolute',
            bottom: 'clamp(6px, 1.5vw, 12px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'clamp(20px, 4vw, 32px)',
            height: 'clamp(20px, 4vw, 32px)',
            borderRadius: '50%',
            background: '#EC4899',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(8px, 1.5vw, 12px)',
            color: '#fff',
          }}
        >
          ▶
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const trackAreaH = height * 0.35
    const trackAreaY = height * 0.15
    const trackAreaX = width * 0.1
    const trackAreaW = width * 0.82
    const trackH = trackAreaH / TRACKS.length - 3

    const nodes: React.ReactNode[] = []

    // Track labels and clips slide in
    TRACKS.forEach((track, ti) => {
      const delay = ti * 0.07
      const trackP = easeOutExpo(Math.min(1, Math.max(0, (enterProgress - delay) / 0.25)))
      const trackOpacity = phase === 'exit' ? Math.max(0, 1 - exitProgress * 2) : trackP
      const ty = trackAreaY + ti * (trackH + 3)

      // Track label
      nodes.push(
        <div
          key={`label-${ti}`}
          style={{
            position: 'absolute',
            left: trackAreaX - width * 0.09,
            top: ty,
            height: trackH,
            width: width * 0.08,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            opacity: trackOpacity,
          }}
        >
          <span
            style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: 'clamp(5px, 0.9vw, 7px)',
              color: 'rgba(255,255,255,0.4)',
              fontWeight: 500,
            }}
          >
            {track.label}
          </span>
        </div>,
      )

      // Track background
      nodes.push(
        <div
          key={`track-bg-${ti}`}
          style={{
            position: 'absolute',
            left: trackAreaX,
            top: ty,
            width: trackAreaW,
            height: trackH,
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 3,
            opacity: trackOpacity,
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        />,
      )

      // Clips
      track.clips.forEach((clip, ci) => {
        const clipDelay = delay + ci * 0.04
        const clipP = easeOutBack(Math.min(1, Math.max(0, (enterProgress - clipDelay) / 0.2)))
        const isHighlighted = ti === (index % TRACKS.length) && ci === 0

        nodes.push(
          <div
            key={`clip-${ti}-${ci}`}
            style={{
              position: 'absolute',
              left: trackAreaX + clip.x * trackAreaW,
              top: ty + 1,
              width: clip.w * trackAreaW * clipP,
              height: trackH - 2,
              background: isHighlighted ? color : `${track.color}88`,
              borderRadius: 3,
              opacity: phase === 'exit' ? Math.max(0, 1 - exitProgress * 2) : trackP,
              border: isHighlighted ? `1px solid ${color}` : `1px solid ${track.color}44`,
              overflow: 'hidden',
            }}
          >
            {/* Waveform hint for audio track */}
            {ti === 1 && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `repeating-linear-gradient(90deg, transparent 0px, transparent 2px, ${track.color}33 2px, ${track.color}33 3px)`,
                }}
              />
            )}
          </div>,
        )
      })
    })

    // Word punches out like a text clip being placed on timeline
    const wordP = easeOutBack(Math.min(1, Math.max(0, (enterProgress - 0.5) / 0.5)))
    const wordOpacity = phase === 'exit' ? Math.max(0, 1 - exitProgress * 1.5) : Math.min(1, Math.max(0, (enterProgress - 0.45) * 4))
    const wordY = phase === 'enter' ? (1 - wordP) * 30 : 0
    const pulse = phase === 'hold' ? 1 + Math.sin(f * 0.08) * 0.01 : 1

    nodes.push(
      <div
        key="word"
        style={{
          position: 'absolute',
          top: '60%',
          left: '50%',
          transform: `translateX(-50%) translateY(${wordY}px) scale(${wordP * pulse})`,
          opacity: wordOpacity,
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        <div
          style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: 'clamp(34px, 8.5vw, 118px)',
            fontWeight: 900,
            color,
            textShadow: `0 0 24px ${color}66`,
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

function CapCutTimelineComponent(props: MotionGraphicProps<CapCutTimelineConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-capcut-timeline',
  title: 'Kinetic CapCut Timeline',
  description:
    'CapCut-style video editor timeline with multi-track clips loading in staggered, a playhead sweeping across, then the word drops as a highlighted text clip',
  tags: ['kinetic', 'typography', 'capcut', 'video', 'timeline', 'editing', 'creator', 'tool', 'digital-native'],
  category: 'captions',
  component: CapCutTimelineComponent as any,
  defaultConfig: {
    words: ['CUT', 'EDIT', 'EXPORT', 'VIRAL'],
    colors: ['#EC4899', '#3B82F6', '#F59E0B', '#10B981'],
    bgColor: '#111111',
    cycleDuration: 2.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CUT', 'EDIT', 'EXPORT', 'VIRAL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#EC4899', '#3B82F6', '#F59E0B', '#10B981'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111111', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.4, min: 0.5, max: 5, group: 'Timing' },
  ],
})
