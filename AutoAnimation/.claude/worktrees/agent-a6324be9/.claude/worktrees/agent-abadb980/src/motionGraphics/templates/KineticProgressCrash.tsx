import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ProgressCrashConfig extends KineticBaseConfig {}

function seededVal(seed: number): number {
  const x = Math.sin(seed * 91.233 + 17.6532) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ frame, fps, bgColor }: BackgroundRenderProps) => {
    const time = frame / fps

    // Progress bar stuck at 99%, glitching
    const baseProgress = 0.99
    // Tiny jitter after 0.5s
    const jitterTime = Math.max(0, time - 0.5)
    const jitter = Math.sin(jitterTime * 47) * 0.005 * Math.min(1, jitterTime * 2)
    const barProgress = Math.min(1, baseProgress + jitter)

    // Glitch: every ~0.8s, bar flickers
    const glitchPhase = Math.sin(time * 7.3)
    const isGlitching = glitchPhase > 0.85

    const barColor = isGlitching ? '#FF4444' : '#4ADE80'

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Browser/OS download dialog chrome */}
        <div
          style={{
            position: 'absolute',
            top: '12%',
            left: '8%',
            right: '8%',
            background: '#1E1E1E',
            borderRadius: 10,
            padding: 'clamp(12px, 3vw, 26px)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {/* Title row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'clamp(8px, 2vw, 16px)',
            }}
          >
            <span
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: 'clamp(8px, 1.6vw, 14px)',
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              Downloading...
            </span>
            <span
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: 'clamp(9px, 1.8vw, 16px)',
                fontWeight: 700,
                color: isGlitching ? '#FF4444' : 'rgba(255,255,255,0.9)',
              }}
            >
              {isGlitching ? 'ERR' : '99%'}
            </span>
          </div>

          {/* Progress track */}
          <div
            style={{
              width: '100%',
              height: 'clamp(6px, 1.4vw, 12px)',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 100,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${barProgress * 100}%`,
                height: '100%',
                background: barColor,
                borderRadius: 100,
                boxShadow: isGlitching ? `0 0 8px ${barColor}` : 'none',
                transition: 'background 0.05s',
              }}
            />
          </div>

          {/* Sub-info row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 'clamp(4px, 1vw, 8px)',
            }}
          >
            <span
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: 'clamp(6px, 1.2vw, 10px)',
                color: 'rgba(255,255,255,0.3)',
              }}
            >
              {isGlitching ? 'Connection lost' : '1.2 GB of 1.2 GB'}
            </span>
            <span
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: 'clamp(6px, 1.2vw, 10px)',
                color: isGlitching ? '#FF4444' : 'rgba(255,255,255,0.3)',
              }}
            >
              {isGlitching ? '0 B/s' : '0 B/s — Stalled'}
            </span>
          </div>
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0

    let opacity = 1
    let translateY = 0
    let scale = 1
    let glitchX = 0
    let glitchColor = color

    if (phase === 'enter') {
      // Bar hits 99%, stalls, then EXPLODES into the word
      if (enterProgress < 0.5) {
        // Nothing visible yet — the progress bar is stalling
        opacity = 0
      } else {
        // The crash explosion — word slams in
        const t = (enterProgress - 0.5) / 0.5
        const bounce = t < 0.6 ? t / 0.6 : 1 + Math.sin(((t - 0.6) / 0.4) * Math.PI) * 0.12
        scale = bounce
        opacity = Math.min(1, (t - 0.05) * 5)
        // Brief glitch flash on entry
        glitchX = t < 0.2 ? (seededVal(f) - 0.5) * 12 : 0
      }
    } else if (phase === 'hold') {
      // Subtle glitch tick
      const glitchTick = Math.sin(f * 0.23) > 0.88
      glitchX = glitchTick ? (seededVal(f * 0.01) - 0.5) * 6 : 0
      glitchColor = glitchTick ? '#FF4444' : color
    } else {
      opacity = 1 - exitProgress * 1.5
      scale = 1 + exitProgress * 0.2
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '55%',
          left: '50%',
          transform: `translate(calc(-50% + ${glitchX}px), -50%) scale(${scale})`,
          opacity,
        }}
      >
        {/* Error icon above word */}
        {phase !== 'enter' || enterProgress > 0.55 ? (
          <div
            style={{
              textAlign: 'center',
              marginBottom: 'clamp(4px, 1vw, 8px)',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: 'clamp(9px, 2vw, 16px)',
              color: '#FF4444',
              opacity: phase === 'enter' ? (enterProgress - 0.5) * 4 : 1,
              letterSpacing: 1,
            }}
          >
            ⚠ Download Failed
          </div>
        ) : null}

        <div
          style={{
            fontFamily: "'Impact', 'Arial Black', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(32px, 8vw, 112px)',
            fontWeight: 900,
            color: glitchColor,
            whiteSpace: 'nowrap',
            textAlign: 'center',
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function ProgressCrashComponent(props: MotionGraphicProps<ProgressCrashConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-progress-crash',
  title: 'Kinetic Progress Crash',
  description:
    'Download bar stalls at 99%, glitches red, then crashes — word explodes in as the failed state, with download dialog chrome, stall text, and error flash',
  tags: ['kinetic', 'typography', 'progress', 'loading', 'crash', 'error', 'ui', 'digital', 'download'],
  category: 'captions',
  component: ProgressCrashComponent as any,
  defaultConfig: {
    words: ['FAILED', 'STUCK', 'BROKEN', 'CRASHED'],
    colors: ['#FF4444', '#FF6B6B', '#FF4444', '#FF6B6B'],
    bgColor: '#0D0D0D',
    cycleDuration: 2.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['FAILED', 'STUCK', 'BROKEN', 'CRASHED'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF4444', '#FF6B6B', '#FF4444', '#FF6B6B'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D0D0D', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.5,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
