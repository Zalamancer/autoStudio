import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface VinylRecordConfig extends KineticBaseConfig {
  vinylColor: string
  labelColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const size = Math.min(width, height) * 0.7
    const rotation = time * 45

    const grooves = 18
    const grooveElements = Array.from({ length: grooves }).map((_, i) => {
      const radius = (size * 0.2) + ((size * 0.42) * (i / grooves))
      const grooveOpacity = 0.08 + (i % 3) * 0.03
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: radius * 2,
            height: radius * 2,
            borderRadius: '50%',
            border: `1px solid rgba(255,255,255,${grooveOpacity})`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Subtle wood grain background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `repeating-linear-gradient(
              90deg,
              transparent,
              transparent 40px,
              rgba(139,90,43,0.03) 40px,
              rgba(139,90,43,0.03) 42px
            )`,
          }}
        />

        {/* Vinyl record */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: size,
            height: size,
            borderRadius: '50%',
            background: `radial-gradient(circle, #1a1a1a 18%, #111 19%, #222 20%, #111 80%, #1a1a1a 82%, #0d0d0d 100%)`,
            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
            boxShadow: '0 8px 40px rgba(0,0,0,0.6), inset 0 0 20px rgba(0,0,0,0.3)',
          }}
        >
          {/* Groove rings */}
          {grooveElements}

          {/* Outer highlight */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(255,255,255,0.02) 100%)',
            }}
          />

          {/* Center label */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: size * 0.32,
              height: size * 0.32,
              borderRadius: '50%',
              background: `radial-gradient(circle, #E74C3C 0%, #C0392B 60%, #A93226 100%)`,
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.3)',
            }}
          >
            {/* Center spindle */}
            <div
              style={{
                width: size * 0.04,
                height: size * 0.04,
                borderRadius: '50%',
                background: '#333',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
              }}
            />
          </div>
        </div>

        {/* Tonearm */}
        <div
          style={{
            position: 'absolute',
            top: '12%',
            right: '18%',
            width: 4,
            height: size * 0.45,
            background: 'linear-gradient(to bottom, #888, #666)',
            borderRadius: 2,
            transform: `rotate(${20 + Math.sin(time * 0.3) * 2}deg)`,
            transformOrigin: 'top center',
            boxShadow: '2px 2px 8px rgba(0,0,0,0.4)',
          }}
        >
          {/* Tonearm head */}
          <div
            style={{
              position: 'absolute',
              bottom: -6,
              left: -4,
              width: 12,
              height: 16,
              background: '#777',
              borderRadius: '2px 2px 4px 4px',
            }}
          />
          {/* Pivot */}
          <div
            style={{
              position: 'absolute',
              top: -6,
              left: -6,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: '#999',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}
          />
        </div>
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    exitProgress,
    phase,
  }: WordRenderProps) => {
    let opacity = 1
    let scale = 1
    let blur = 0

    if (phase === 'enter') {
      const eased = easeOutCubic(enterProgress)
      opacity = eased
      scale = 0.6 + 0.4 * eased
      blur = (1 - eased) * 4
    } else if (phase === 'exit') {
      opacity = 1 - exitProgress
      scale = 1 + 0.3 * exitProgress
      blur = exitProgress * 4
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          fontSize: 'clamp(36px, 9vw, 120px)',
          fontWeight: 800,
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Georgia', 'Times New Roman', serif",
          textShadow: `0 4px 20px rgba(0,0,0,0.7)`,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          letterSpacing: '0.03em',
          zIndex: 10,
        }}
      >
        {word}
      </div>
    )
  },
}

function VinylRecordComponent(props: MotionGraphicProps<VinylRecordConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-vinyl-record',
  title: 'Kinetic Vinyl Record',
  description:
    'Spinning vinyl record with concentric grooves, center label, and tonearm. Retro music aesthetic with text overlaid.',
  tags: ['kinetic', 'music', 'vinyl', 'record', 'retro', 'turntable', 'analog'],
  category: 'captions',
  component: VinylRecordComponent as any,
  defaultConfig: {
    words: ['VINYL', 'VIBES', 'ONLY'],
    colors: ['#F5E6CA', '#E8D5B5', '#FFEEDD'],
    bgColor: '#1A1008',
    cycleDuration: 1.5,
    vinylColor: '#111111',
    labelColor: '#E74C3C',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['VINYL', 'VIBES', 'ONLY'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#F5E6CA', '#E8D5B5', '#FFEEDD'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A1008', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
