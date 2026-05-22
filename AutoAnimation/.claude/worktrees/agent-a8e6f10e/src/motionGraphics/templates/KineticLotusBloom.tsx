import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LotusBloomConfig extends KineticBaseConfig {
  petalCount: number
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const petalCount = 12
    const centerX = width / 2
    const centerY = height * 0.55

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Water reflection gradient */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '30%',
            background: 'linear-gradient(180deg, transparent 0%, rgba(255,182,193,0.03) 50%, rgba(255,182,193,0.06) 100%)',
          }}
        />

        {/* Lotus petals background */}
        {Array.from({ length: petalCount }, (_, i) => {
          const angle = (i / petalCount) * Math.PI * 2 - Math.PI / 2
          const openAmount = 0.6 + Math.sin(time * 0.3 + i * 0.2) * 0.15
          const petalLength = Math.min(width, height) * 0.18
          const petalWidth = petalLength * 0.35
          const dist = petalLength * openAmount * 0.5

          const px = centerX + Math.cos(angle) * dist
          const py = centerY + Math.sin(angle) * dist * 0.6
          const rotation = (angle * 180) / Math.PI + 90
          const layerOpacity = 0.04 + (i % 3) * 0.015

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: px,
                top: py,
                width: petalWidth,
                height: petalLength,
                transform: `translate(-50%, -100%) rotate(${rotation}deg) scaleY(${openAmount})`,
                borderRadius: '50% 50% 45% 45%',
                background: `linear-gradient(180deg, rgba(255,182,193,${layerOpacity}) 0%, rgba(255,105,180,${layerOpacity * 1.5}) 100%)`,
                transformOrigin: 'bottom center',
              }}
            />
          )
        })}

        {/* Center circle */}
        <div
          style={{
            position: 'absolute',
            left: centerX,
            top: centerY,
            width: Math.min(width, height) * 0.06,
            height: Math.min(width, height) * 0.06,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,215,0,0.12) 0%, rgba(255,182,193,0.04) 100%)',
          }}
        />

        {/* Floating petal particles */}
        {Array.from({ length: 6 }, (_, i) => {
          const seed = i * 137.5
          const x = ((Math.sin(time * 0.2 + seed) + 1) / 2) * width
          const y = ((Math.cos(time * 0.15 + seed * 0.7) + 1) / 2) * height
          const rot = time * 20 + seed
          const particleOpacity = 0.06 + Math.sin(time * 0.5 + i) * 0.03

          return (
            <div
              key={`fp-${i}`}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: 8,
                height: 12,
                borderRadius: '50% 50% 45% 45%',
                background: `rgba(255,182,193,${particleOpacity})`,
                transform: `rotate(${rot}deg)`,
              }}
            />
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let rotateX = 0
    let translateY = 0

    if (phase === 'enter') {
      // Unfold like a petal opening
      const eased = easeOutCubic(enterProgress)
      opacity = eased
      scale = 0.5 + eased * 0.5
      rotateX = (1 - eased) * -60
      translateY = (1 - eased) * 30
    } else if (phase === 'hold') {
      opacity = 1
      // Gentle sway like a flower in breeze
      const sway = Math.sin(holdProgress * Math.PI * 4) * 0.5
      rotateX = sway
      translateY = Math.sin(holdProgress * Math.PI * 2) * 3
    } else {
      // Close like petals folding
      const eased = easeInOutQuad(exitProgress)
      opacity = 1 - eased
      scale = 1 - eased * 0.3
      rotateX = eased * 45
      translateY = eased * -20
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '45%',
          left: '50%',
          transform: `translate(-50%, -50%) perspective(600px) rotateX(${rotateX}deg) scale(${scale}) translateY(${translateY}px)`,
          opacity,
          fontFamily: "'Georgia', 'Palatino Linotype', serif",
          fontSize: 'clamp(36px, 10vw, 130px)',
          fontWeight: 300,
          letterSpacing: 4,
          whiteSpace: 'nowrap',
          color,
          textShadow: `0 0 25px ${color}30, 0 2px 8px rgba(0,0,0,0.3)`,
        }}
      >
        {word}
      </div>
    )
  },
}

function LotusBloomComponent(props: MotionGraphicProps<LotusBloomConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-lotus-bloom',
  title: 'Kinetic Lotus Bloom',
  description: 'Words unfold like lotus petals opening, with animated lotus flower background and floating petal particles',
  tags: ['kinetic', 'typography', 'meditation', 'lotus', 'flower', 'bloom', 'zen', 'mindfulness', 'nature'],
  category: 'captions',
  component: LotusBloomComponent as any,
  defaultConfig: {
    words: ['BLOOM', 'GROW', 'RADIATE', 'FLOURISH'],
    colors: ['#FFB6C1', '#FF69B4', '#FF1493', '#DB7093'],
    bgColor: '#100a14',
    cycleDuration: 1.8,
    petalCount: 12,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BLOOM', 'GROW', 'RADIATE', 'FLOURISH'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFB6C1', '#FF69B4', '#FF1493', '#DB7093'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#100a14', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
    { key: 'petalCount', label: 'Petal Count', type: 'number', defaultValue: 12, min: 6, max: 24, group: 'Style' },
  ],
})
