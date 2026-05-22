import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FreezeFrameConfig extends KineticBaseConfig {
  frameJitter: number
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // VHS freeze-frame artifacts: horizontal displacement bands
    const bandCount = 5
    const bands = Array.from({ length: bandCount }, (_, i) => {
      const seed = i * 71 + 13
      const scrollY = ((time * (8 + (seed % 4)) + i * 23) % 110) - 5
      const xShift = ((seed * 17) % 10) - 5
      const opacity = 0.06 + (i % 3) * 0.03
      const height = 3 + (seed % 5)
      return { scrollY, xShift, opacity, height }
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* CRT scan lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 4px)',
            pointerEvents: 'none',
          }}
        />
        {/* VHS freeze displacement bands */}
        {bands.map((band, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${band.xShift}%`,
              right: 0,
              top: `${band.scrollY}%`,
              height: band.height,
              background: `rgba(255,255,255,${band.opacity})`,
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* Desaturated overlay — frozen frame looks washed out */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(220,210,180,0.04)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 53 + 17

    let translateY = 0
    let opacity = 1
    let scale = 1
    // Freeze-frame jitter: tiny vertical stutter during hold
    let jitterY = 0

    if (phase === 'enter') {
      // Slam down from slightly above with easeOutBack overshoot
      const eased = easeOutBack(Math.min(1, enterProgress))
      translateY = (1 - eased) * -60
      opacity = Math.min(1, enterProgress * 3)
      scale = 0.85 + eased * 0.15
    } else if (phase === 'hold') {
      // VHS freeze: subtle vertical jitter every few frames
      const jitterSeed = Math.floor(holdProgress * 20)
      const jitterActive = (jitterSeed + seed) % 7 === 0
      jitterY = jitterActive ? ((seed % 3) - 1) * 1.5 : 0
      translateY = jitterY
      opacity = 1
      scale = 1
    } else {
      // Exit: brief static then hard cut to white then nothing
      if (exitProgress < 0.3) {
        opacity = 1
        jitterY = ((Math.floor(exitProgress * 40) + seed) % 3) * 1.5
        translateY = jitterY
      } else if (exitProgress < 0.45) {
        // White flash frame
        opacity = 1
      } else {
        opacity = 0
      }
      scale = 1
    }

    // RGB color fringing on hold (VHS color bleed)
    const fringe = phase === 'hold' ? 1.5 : phase === 'enter' ? (1 - enterProgress) * 3 : 0

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* White flash on exit */}
        {phase === 'exit' && exitProgress >= 0.3 && exitProgress < 0.45 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(255,255,255,0.9)',
              pointerEvents: 'none',
            }}
          />
        )}
        {/* Red channel fringe */}
        {fringe > 0.3 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${-fringe}px), calc(-50% + ${translateY}px)) scale(${scale})`,
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              fontSize: 'clamp(40px, 13vw, 168px)',
              fontWeight: 900,
              color: 'rgba(255,0,80,0.35)',
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
              letterSpacing: 2,
              opacity,
              pointerEvents: 'none',
              mixBlendMode: 'screen',
            }}
          >
            {word}
          </div>
        )}
        {/* Cyan channel fringe */}
        {fringe > 0.3 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${fringe}px), calc(-50% + ${translateY}px)) scale(${scale})`,
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              fontSize: 'clamp(40px, 13vw, 168px)',
              fontWeight: 900,
              color: 'rgba(0,200,255,0.35)',
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
              letterSpacing: 2,
              opacity,
              pointerEvents: 'none',
              mixBlendMode: 'screen',
            }}
          >
            {word}
          </div>
        )}
        {/* Main text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale})`,
            opacity,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(40px, 13vw, 168px)',
            fontWeight: 900,
            color,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            letterSpacing: 2,
            textShadow: `0 2px 0 rgba(0,0,0,0.7), 0 0 20px rgba(255,255,255,0.1)`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function FreezeFrameComponent(props: MotionGraphicProps<FreezeFrameConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-freeze-frame',
  title: 'Kinetic Freeze Frame',
  description: 'Text slams in and locks with a VHS freeze-frame aesthetic: scan lines, color fringing, horizontal displacement bands, and jitter',
  tags: ['kinetic', 'typography', 'freeze-frame', 'vhs', 'film', 'retro', 'cinematic'],
  category: 'captions',
  component: FreezeFrameComponent as any,
  defaultConfig: {
    words: ['FREEZE', 'HOLD', 'LOCK', 'STOP'],
    colors: ['#FFFFFF', '#E8E8D0', '#FFFFFF', '#E8E8D0'],
    bgColor: '#0c0c0c',
    cycleDuration: 1.6,
    frameJitter: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FREEZE', 'HOLD', 'LOCK', 'STOP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#E8E8D0', '#FFFFFF', '#E8E8D0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c0c0c', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
    { key: 'frameJitter', label: 'Frame Jitter', type: 'number', defaultValue: 1.5, min: 0, max: 5, group: 'Animation' },
  ],
})
