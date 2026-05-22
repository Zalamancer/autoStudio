import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ZFightFlickerConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Z-fighting: two surfaces at nearly identical depth alternate which is "on top"
// Produces rapid flickering between two color/opacity states

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Depth buffer visualization — faint grid showing z-values
    const cells = 8
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Z-depth grid overlay */}
        {Array.from({ length: cells * cells }, (_, i) => {
          const col = i % cells
          const row = Math.floor(i / cells)
          const zVal = rand(col * 7 + row * 13 + Math.floor(time * 3))
          const flicker = rand(col * 3 + row * 17 + Math.floor(time * 8)) < 0.08
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${(col / cells) * 100}%`,
                top: `${(row / cells) * 100}%`,
                width: `${100 / cells}%`,
                height: `${100 / cells}%`,
                background: flicker
                  ? `rgba(255,80,40,${zVal * 0.15})`
                  : `rgba(40,120,255,${zVal * 0.06})`,
                borderRight: '1px solid rgba(255,255,255,0.03)',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
              }}
            />
          )
        })}
        {/* Depth readout */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 12,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(255,100,40,0.25)',
            letterSpacing: 1,
          }}
        >
          Z-DEPTH: {(0.9999 + Math.sin(time * 4) * 0.00005).toFixed(5)}
        </div>
        <div
          style={{
            position: 'absolute',
            top: 18,
            right: 12,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(40,120,255,0.2)',
            letterSpacing: 1,
          }}
        >
          DEPTH PRECISION ERROR
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 179 + 41

    // Z-fight flicker rate: alternates which "layer" is on top every few frames
    const fightRate = 3 // frames per flip
    const fightFlip = Math.floor(f / fightRate) % 2 === 0

    // Secondary layer color — the "other polygon" fighting for depth
    const fightColor = fightFlip ? color : '#FF4422'
    const fightOffset = fightFlip ? 0 : rand(seed + f) * 4 - 2

    let opacity = 1
    let scale = 1
    let glitchX = 0

    if (phase === 'enter') {
      opacity = enterProgress
      scale = 0.92 + enterProgress * 0.08
      // Z-fight starts immediately during entry — rapid flickering between depths
      glitchX = (1 - enterProgress) * (rand(seed + f) - 0.5) * 10
    } else if (phase === 'hold') {
      opacity = 1
      // Fight calms during hold but erupts in bursts
      const burstA = holdProgress > 0.3 && holdProgress < 0.38
      const burstB = holdProgress > 0.65 && holdProgress < 0.72
      if (!burstA && !burstB) {
        // Calm: only occasional single-frame flip
        const calmFight = rand(seed + Math.floor(holdProgress * 60)) < 0.04
        if (!calmFight) return (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontSize: 'clamp(40px, 11vw, 160px)',
              fontWeight: 900,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 2,
              textShadow: `0 0 8px ${color}40`,
            }}
          >
            {word}
          </div>
        )
      }
    } else {
      opacity = 1 - exitProgress
      scale = 1 - exitProgress * 0.06
      glitchX = exitProgress * (rand(seed + f + 99) - 0.5) * 12
    }

    const activeFlicker = phase !== 'hold' || (holdProgress > 0.3 && holdProgress < 0.38) || (holdProgress > 0.65 && holdProgress < 0.72)

    return (
      <>
        {/* Layer A — primary polygon */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${glitchX}px), -50%) scale(${scale})`,
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(40px, 11vw, 160px)',
            fontWeight: 900,
            color: activeFlicker && fightFlip ? fightColor : color,
            whiteSpace: 'nowrap',
            letterSpacing: 2,
            opacity,
          }}
        >
          {word}
        </div>
        {/* Layer B — competing polygon at nearly same Z, offset by rounding error */}
        {activeFlicker && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${glitchX + fightOffset}px), -50%) scale(${scale})`,
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontSize: 'clamp(40px, 11vw, 160px)',
              fontWeight: 900,
              color: fightFlip ? '#FF4422' : color,
              whiteSpace: 'nowrap',
              letterSpacing: 2,
              opacity: opacity * (fightFlip ? 0.7 : 0.3),
              mixBlendMode: 'screen',
            }}
          >
            {word}
          </div>
        )}
      </>
    )
  },
}

function ZFightFlickerComponent(props: MotionGraphicProps<ZFightFlickerConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-z-fight-flicker',
  title: 'Kinetic Z-Fight Flicker',
  description: 'GPU z-fighting render glitch — two polygon layers at identical depth compete, producing rapid color flicker and depth precision errors',
  tags: ['kinetic', 'typography', 'glitch', 'gpu', 'render', 'z-fighting', 'depth', 'digital', 'tech'],
  category: 'captions',
  component: ZFightFlickerComponent as any,
  defaultConfig: {
    words: ['DEPTH', 'ERROR', 'FIGHT', 'GLITCH'],
    colors: ['#00FFCC', '#00DDAA', '#00FFAA', '#00CCFF'],
    bgColor: '#060a12',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DEPTH', 'ERROR', 'FIGHT', 'GLITCH'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FFCC', '#00DDAA', '#00FFAA', '#00CCFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060a12', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
