import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface VHSRewindConfig extends KineticBaseConfig {
  tearIntensity: number
}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, height }: BackgroundRenderProps) => {
    const time = frame / fps
    // Horizontal tear bands that scroll rapidly upward (rewind feel)
    const tearSpeed = 120
    const tearCount = 8

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Fast-scrolling horizontal noise bands */}
        {Array.from({ length: tearCount }, (_, i) => {
          const y = ((time * tearSpeed + i * 45 + rand(i * 31) * 30) % (height + 40)) - 20
          const tearHeight = 3 + rand(i * 17 + frame) * 8
          const tearShift = (rand(i * 53 + Math.floor(frame * 0.5)) - 0.5) * 30
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: y,
                height: tearHeight,
                transform: `translateX(${tearShift}px)`,
                background: `linear-gradient(90deg, transparent 5%, rgba(255,255,255,${0.04 + rand(i * 7) * 0.06}) 20%, rgba(255,255,255,${0.02 + rand(i * 11) * 0.04}) 80%, transparent 95%)`,
                pointerEvents: 'none',
              }}
            />
          )
        })}
        {/* Tracking line artifacts — thick bars */}
        {Array.from({ length: 3 }, (_, i) => {
          const barY = ((time * 200 + i * 180) % (height + 60)) - 30
          return (
            <div
              key={`bar-${i}`}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: barY,
                height: 12 + rand(frame + i * 29) * 15,
                background: `linear-gradient(0deg, rgba(0,0,0,0.6), rgba(${50 + rand(frame * 3 + i) * 40},${50 + rand(frame * 5 + i) * 40},${80 + rand(frame * 7 + i) * 40},0.3), rgba(0,0,0,0.6))`,
                pointerEvents: 'none',
              }}
            />
          )
        })}
        {/* Color bleed — shifted RGB channels */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, rgba(255,0,0,0.03) 0%, rgba(0,0,255,0.02) 33%, rgba(0,255,0,0.02) 66%, rgba(255,0,0,0.03) 100%)`,
            pointerEvents: 'none',
          }}
        />
        {/* REW indicator */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 16,
            fontFamily: "'Courier New', monospace",
            fontSize: 14,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: 2,
          }}
        >
          {'<< REW'}
        </div>
        {/* Counter display */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 16,
            fontFamily: "'Courier New', monospace",
            fontSize: 12,
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: 1,
          }}
        >
          {String(Math.floor(time * 30) % 9999).padStart(4, '0')}
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index, frame, width }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 73 + 19
    let opacity = 0
    let translateX = 0
    let scaleX = 1

    if (phase === 'enter') {
      // Fast-reverse appearance: text rushes in from the right, decelerating
      const eased = 1 - Math.pow(1 - enterProgress, 4)
      opacity = Math.min(1, enterProgress * 3)
      translateX = (1 - eased) * width * 0.6
      // Horizontal stretch during motion
      scaleX = 1 + (1 - eased) * 0.4
    } else if (phase === 'hold') {
      opacity = 1
      // Jittery horizontal tearing
      translateX = (rand(f * 3 + seed) - 0.5) * 4
      scaleX = 1 + (rand(f * 7 + seed) - 0.5) * 0.02
    } else {
      // Zip off to the left
      const eased = Math.pow(exitProgress, 3)
      opacity = 1 - exitProgress
      translateX = -eased * width * 0.5
      scaleX = 1 + eased * 0.3
    }

    // Horizontal tear offset for top/bottom halves
    const tearOffset = phase === 'hold' ? (rand(f * 11 + seed) - 0.5) * 3 : 0

    return (
      <>
        {/* Top half — slightly offset for tear effect */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${translateX + tearOffset}px), -50%) scaleX(${scaleX})`,
            opacity,
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(40px, 11vw, 150px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 3,
            color,
            whiteSpace: 'nowrap',
            clipPath: 'inset(0 0 50% 0)',
            textShadow: '2px 0 0 rgba(255,0,0,0.3), -2px 0 0 rgba(0,100,255,0.3)',
          }}
        >
          {word}
        </div>
        {/* Bottom half — opposite tear */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${translateX - tearOffset}px), -50%) scaleX(${scaleX})`,
            opacity,
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(40px, 11vw, 150px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 3,
            color,
            whiteSpace: 'nowrap',
            clipPath: 'inset(50% 0 0 0)',
            textShadow: '2px 0 0 rgba(255,0,0,0.3), -2px 0 0 rgba(0,100,255,0.3)',
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function VHSRewindComponent(props: MotionGraphicProps<VHSRewindConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-vhs-rewind',
  title: 'Kinetic VHS Rewind',
  description: 'VHS tape fast-rewind with horizontal tearing, tracking line artifacts, RGB chromatic split, and rushing reverse text entrance',
  tags: ['kinetic', 'typography', 'vhs', 'rewind', 'retro', 'tape', 'analog', 'tracking', 'cinema'],
  category: 'captions',
  component: VHSRewindComponent as any,
  defaultConfig: {
    words: ['REWIND', 'FAST', 'BACK', 'PLAY'],
    colors: ['#E0E0E0', '#D0D0D0', '#F0F0F0', '#C8C8C8'],
    bgColor: '#080810',
    cycleDuration: 1,
    tearIntensity: 50,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['REWIND', 'FAST', 'BACK', 'PLAY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E0E0E0', '#D0D0D0', '#F0F0F0', '#C8C8C8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080810', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
    { key: 'tearIntensity', label: 'Tear Intensity', type: 'number', defaultValue: 50, min: 0, max: 100, group: 'Animation' },
  ],
})
