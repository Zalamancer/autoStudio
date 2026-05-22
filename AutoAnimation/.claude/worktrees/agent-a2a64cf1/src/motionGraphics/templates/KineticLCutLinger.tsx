import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LCutLingerConfig extends KineticBaseConfig {
  lingerFrames: number
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // L-Cut: picture changes but previous audio lingers
    // Dissolve-style crossfade at picture cut point
    const crossfadePos = (time * 0.25) % 1.0
    const dissolve = Math.sin(time * 1.5) * 0.5 + 0.5

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Outgoing frame ghost — picture left but audio still plays */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(255,255,255,${dissolve * 0.03})`,
            pointerEvents: 'none',
          }}
        />
        {/* Fading audio waveform — previous scene's audio lingering */}
        {Array.from({ length: 16 }, (_, i) => {
          const x = (i / 16) * 100
          const h = 3 + Math.sin(time * 5 + i * 0.9 - 1.5) * 2.5
          const fadingAlpha = Math.max(0, 0.3 - crossfadePos * 0.25) // fading out
          return (
            <div
              key={`fade-${i}`}
              style={{
                position: 'absolute',
                left: `${x}%`,
                bottom: '18%',
                width: '4%',
                height: h,
                background: `rgba(180,220,255,${fadingAlpha})`,
                borderRadius: 1,
                pointerEvents: 'none',
              }}
            />
          )
        })}
        {/* Incoming audio — new scene picture, old scene sound */}
        {Array.from({ length: 16 }, (_, i) => {
          const x = (i / 16) * 100
          const h = 3 + Math.sin(time * 6 + i * 1.1) * 2
          return (
            <div
              key={`in-${i}`}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: '18%',
                width: '4%',
                height: h,
                background: `rgba(255,200,80,${0.15 + crossfadePos * 0.15})`,
                borderRadius: 1,
                pointerEvents: 'none',
              }}
            />
          )
        })}
        {/* L-shape indicator — the edit shape */}
        <div
          style={{
            position: 'absolute',
            left: '48%',
            top: '15%',
            width: 2,
            height: '35%',
            background: 'rgba(255,200,80,0.3)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '48%',
            top: '50%',
            width: '20%',
            height: 2,
            background: 'rgba(180,220,255,0.3)',
            pointerEvents: 'none',
          }}
        />
        {/* L-cut label */}
        <div
          style={{
            position: 'absolute',
            left: '70%',
            top: '48%',
            fontFamily: 'monospace',
            fontSize: 8,
            color: 'rgba(180,220,255,0.5)',
            letterSpacing: 1,
            pointerEvents: 'none',
          }}
        >
          L-CUT
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    let opacity = 1
    let translateX = 0
    let blur = 0
    let ghostOpacity = 0

    if (phase === 'enter') {
      // Snappy cut-in — picture arrives instantly
      opacity = Math.min(1, enterProgress * 4)
      translateX = (1 - Math.min(1, enterProgress * 4)) * 8
    } else if (phase === 'hold') {
      opacity = 1
      translateX = Math.sin(t * 0.4 + index * 0.8) * 0.8
    } else {
      // Linger — picture cuts but audio ghost stays
      const exitEase = Math.pow(exitProgress, 2)
      opacity = 1 - exitEase * 0.6 // doesn't go to zero immediately
      ghostOpacity = exitEase * 0.15 // faint ghost copy
      translateX = exitEase * 5
      blur = exitEase * 2
    }

    return (
      <div style={{ position: 'absolute', top: '50%', left: '50%' }}>
        {/* Ghost — lingering audio representation */}
        {ghostOpacity > 0 && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(calc(-50% + 3px), calc(-50% + 2px))`,
              opacity: ghostOpacity,
              fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
              fontSize: 'clamp(40px, 10.5vw, 145px)',
              fontWeight: 700,
              color: 'rgba(180,220,255,0.8)',
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
              letterSpacing: 10,
              filter: 'blur(3px)',
            }}
          >
            {word}
          </div>
        )}
        <div
          style={{
            transform: `translate(calc(-50% + ${translateX}px), -50%)`,
            opacity,
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
            fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
            fontSize: 'clamp(40px, 10.5vw, 145px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: 10,
            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function LCutLingerComponent(props: MotionGraphicProps<LCutLingerConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-lcut-linger',
  title: 'Kinetic L-Cut Linger',
  description: 'L-cut editing technique — picture cuts cleanly but audio ghost lingers as a blurred echo layer, with dual audio waveforms and L-shape edit indicator',
  tags: ['kinetic', 'typography', 'l-cut', 'editing', 'linger', 'ghost', 'transition', 'film', 'dissolve'],
  category: 'captions',
  component: LCutLingerComponent as any,
  defaultConfig: {
    words: ['ECHO', 'LINGER', 'STAY', 'HOLD'],
    colors: ['#B4DCFF', '#FFFFFF', '#B4DCFF', '#E0F0FF'],
    bgColor: '#080e18',
    cycleDuration: 1.5,
    lingerFrames: 12,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ECHO', 'LINGER', 'STAY', 'HOLD'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#B4DCFF', '#FFFFFF', '#B4DCFF', '#E0F0FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080e18', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
    { key: 'lingerFrames', label: 'Linger Frames', type: 'number', defaultValue: 12, min: 3, max: 30, group: 'Animation' },
  ],
})
