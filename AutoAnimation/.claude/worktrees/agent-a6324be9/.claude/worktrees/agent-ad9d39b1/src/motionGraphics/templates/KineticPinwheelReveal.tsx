import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PinwheelRevealConfig extends KineticBaseConfig {
  gridSize: number
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function easeInBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return c3 * t * t * t - c1 * t * t
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, width, height }: WordRenderProps) => {
    const cfg = (globalThis as any).__pinwheelRevealConfig ?? { gridSize: 60 }
    const sz = cfg.gridSize ?? 60
    const cols = Math.ceil(width / sz) + 1
    const rows = Math.ceil(height / sz) + 1
    const seed = index * 97

    const pinwheels: React.ReactNode[] = []

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const tileIndex = row * cols + col
        const tileSeed = seed + tileIndex * 61

        const cx = col * sz + sz * 0.5
        const cy = row * sz + sz * 0.5

        // Distance from centre of canvas normalised 0..1 — used for radial stagger
        const dx = (cx - width / 2) / width
        const dy = (cy - height / 2) / height
        const distNorm = Math.sqrt(dx * dx + dy * dy) * 1.4
        const stagger = distNorm * 0.55 + pseudoRandom(tileSeed) * 0.1

        // Spin direction alternates by chessboard
        const spinDir = (row + col) % 2 === 0 ? 1 : -1

        let rotation = 0
        let opacity = 1
        let scaleVal = 1

        if (phase === 'enter') {
          const delayed = Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger * 0.7)))
          const eased = easeOutQuart(delayed)
          // Spin from 45° → 0°, scale from 0.2 → 1
          rotation = spinDir * 45 * (1 - eased)
          scaleVal = 0.2 + eased * 0.8
          opacity = Math.min(1, delayed * 2.5)
          // Once fully spun in, the blades become transparent
          if (delayed > 0.9) opacity = 1 - (delayed - 0.9) / 0.1
        } else if (phase === 'hold') {
          opacity = 0
        } else {
          const delayed = Math.max(0, Math.min(1, (exitProgress - (1 - stagger) * 0.4) / 0.6))
          const eased = easeInBack(Math.min(1, delayed))
          rotation = spinDir * 90 * eased
          scaleVal = 1 + eased * 0.3
          opacity = Math.max(0, 1 - delayed * 1.5)
        }

        if (opacity <= 0.01) { continue }

        const hue = 260 + pseudoRandom(tileSeed + 3) * 60
        const lightness = 18 + pseudoRandom(tileSeed + 4) * 12

        // Each pinwheel = 4 triangular blades rotated around centre
        const blades: React.ReactNode[] = []
        for (let b = 0; b < 4; b++) {
          const bladeAngle = b * 90 + rotation
          const bladeHue = hue + b * 15
          blades.push(
            <div
              key={b}
              style={{
                position: 'absolute',
                left: sz * 0.5 - sz * 0.45,
                top: sz * 0.5 - sz * 0.45,
                width: sz * 0.45,
                height: sz * 0.45,
                background: `hsl(${bladeHue},22%,${lightness}%)`,
                transformOrigin: '100% 100%',
                transform: `rotate(${bladeAngle}deg)`,
                clipPath: 'polygon(0% 100%, 100% 100%, 100% 0%)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            />,
          )
        }

        pinwheels.push(
          <div
            key={tileIndex}
            style={{
              position: 'absolute',
              left: cx - sz * 0.5,
              top: cy - sz * 0.5,
              width: sz,
              height: sz,
              opacity,
              transform: `scale(${scaleVal})`,
              transformOrigin: `${sz * 0.5}px ${sz * 0.5}px`,
            }}
          >
            {blades}
          </div>,
        )
      }
    }

    let textOpacity = 0
    if (phase === 'enter') textOpacity = Math.min(1, enterProgress * 3)
    else if (phase === 'hold') textOpacity = 1
    else textOpacity = Math.max(0, 1 - exitProgress * 2)

    return (
      <>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            opacity: textOpacity,
          }}
        >
          {word}
        </div>
        {pinwheels}
      </>
    )
  },
}

function PinwheelRevealComponent(props: MotionGraphicProps<PinwheelRevealConfig>) {
  ;(globalThis as any).__pinwheelRevealConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-pinwheel-reveal',
  title: 'Kinetic Pinwheel Reveal',
  description: 'Windmill/pinwheel tiles spin and shrink away from the centre outward to reveal text',
  tags: ['kinetic', 'typography', 'pinwheel', 'windmill', 'tile', 'reveal', 'pattern', 'spin', 'geometric'],
  category: 'captions',
  component: PinwheelRevealComponent as any,
  defaultConfig: {
    words: ['SPIN', 'WIND', 'ROTATE', 'TURN'],
    colors: ['#FF6BFF', '#6BFFFF', '#FFD700', '#FF6BFF'],
    bgColor: '#0a0814',
    cycleDuration: 1.5,
    gridSize: 60,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SPIN', 'WIND', 'ROTATE', 'TURN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6BFF', '#6BFFFF', '#FFD700'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0814', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
    { key: 'gridSize', label: 'Pinwheel Grid Size (px)', type: 'number', defaultValue: 60, min: 30, max: 120, group: 'Animation' },
  ],
})
