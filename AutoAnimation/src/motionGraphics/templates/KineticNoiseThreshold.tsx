import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NoiseThresholdConfig extends KineticBaseConfig {
  noiseGrain: number
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Layered value-noise approximation using multiple sin frequencies
function noise2D(x: number, y: number, t: number): number {
  const n1 = Math.sin(x * 3.1 + y * 2.7 + t * 4.3) * 0.5 + 0.5
  const n2 = Math.sin(x * 7.3 + y * 5.1 - t * 3.7) * 0.5 + 0.5
  const n3 = Math.sin(x * 1.7 - y * 8.3 + t * 2.1) * 0.5 + 0.5
  return n1 * 0.5 + n2 * 0.3 + n3 * 0.2
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInQuad(t: number): number {
  return t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Large-grain noise texture in background (rolling clouds of noise)
    const cellW = 40
    const cellH = 35
    const cols = Math.ceil(width / cellW) + 1
    const rows = Math.ceil(height / cellH) + 1

    const cells: React.ReactNode[] = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const nx = c / cols
        const ny = r / rows
        const noiseVal = noise2D(nx * 3, ny * 3, t * 0.08)
        const alpha = noiseVal * 0.04

        cells.push(
          <div
            key={`bg-${r}_${c}`}
            style={{
              position: 'absolute',
              left: c * cellW,
              top: r * cellH,
              width: cellW,
              height: cellH,
              background: `rgba(160,175,200,${alpha})`,
            }}
          />,
        )
      }
    }

    return <div style={{ position: 'absolute', inset: 0, background: bgColor }}>{cells}</div>
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    frame,
    width,
    height,
  }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30
    const cfg = (globalThis as any).__noiseThresholdConfig ?? { noiseGrain: 20 }
    const noiseGrain = cfg.noiseGrain ?? 20

    // Noise threshold reveal: a threshold value sweeps from 0 to 1
    // Pixels where noise value < threshold are "revealed" (clear), above = noise
    // This creates an organic blotchy reveal pattern

    let threshold = 0 // 0 = all noise, 1 = all clear
    let textOpacity = 0

    if (phase === 'enter') {
      threshold = easeOutExpo(enterProgress)
      textOpacity = easeOutExpo(Math.max(0, (enterProgress - 0.1) / 0.9))
    } else if (phase === 'hold') {
      threshold = 1
      textOpacity = 1
    } else {
      threshold = 1 - easeInQuad(exitProgress)
      textOpacity = 1 - easeInQuad(exitProgress)
    }

    // Build noise cell grid
    const cellW = noiseGrain
    const cellH = noiseGrain
    const cols = Math.ceil(width / cellW)
    const rows = Math.ceil(height / cellH)

    const cells: React.ReactNode[] = []

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const nx = (c + 0.5) / cols
        const ny = (r + 0.5) / rows

        // Time-evolving noise value for this cell
        const noiseVal = noise2D(nx * 4 + index * 1.3, ny * 4 + index * 0.7, t * 0.15)

        // Below threshold = revealed (transparent), above = noise block
        const isRevealed = noiseVal < threshold

        // Transition zone: cells near the threshold boundary flicker
        const distFromThreshold = Math.abs(noiseVal - threshold)
        const isTransition = distFromThreshold < 0.08

        if (isRevealed && !isTransition) continue // Fully revealed cells show through

        let cellAlpha = 0
        let cellColor = ''

        if (isTransition) {
          // Dissolving edge: flicker between noise and clear
          const flicker = Math.sin(t * 15 + c * 3.7 + r * 2.3) * 0.5 + 0.5
          cellAlpha = isRevealed ? flicker * 0.4 : (1 - threshold * 0.5) * (0.4 + flicker * 0.4)
          cellColor = isRevealed ? `rgba(140,160,200,${cellAlpha})` : `rgba(80,90,110,${cellAlpha})`
        } else {
          // Fully unrevealed: solid noise block
          const noiseLevel = noiseVal * 0.8 + 0.1
          const noiseAlpha = (1 - threshold * 0.7) * 0.85
          const brightness = Math.floor(noiseLevel * 80)
          cellColor = `rgba(${40 + brightness},${45 + brightness},${60 + brightness},${noiseAlpha})`
        }

        cells.push(
          <div
            key={`wd-${r}_${c}`}
            style={{
              position: 'absolute',
              left: c * cellW,
              top: r * cellH,
              width: cellW,
              height: cellH,
              background: cellColor,
            }}
          />,
        )
      }
    }

    // Threshold front: a subtle glow sweep at the reveal boundary
    const frontY = height * (1 - threshold)

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Text underneath noise */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 12vw, 155px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            opacity: textOpacity,
            textShadow: `0 0 20px ${color}40`,
          }}
        >
          {word}
        </div>

        {/* Noise cell overlay */}
        {cells}

        {/* Threshold front glow */}
        {threshold > 0.02 && threshold < 0.98 && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: frontY - 15,
              right: 0,
              height: 30,
              background: `radial-gradient(ellipse at 50% 50%, rgba(180,200,240,0.15), transparent 70%)`,
              filter: 'blur(8px)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    )
  },
}

function NoiseThresholdComponent(props: MotionGraphicProps<NoiseThresholdConfig>) {
  ;(globalThis as any).__noiseThresholdConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-noise-threshold',
  title: 'Kinetic Noise Threshold',
  description:
    'A noise threshold sweeps across the frame — cells below the threshold dissolve to reveal text underneath, with flickering transition edges',
  tags: ['kinetic', 'typography', 'noise', 'threshold', 'interference', 'organic', 'reveal', 'dissolve', 'grain'],
  category: 'captions',
  component: NoiseThresholdComponent as any,
  defaultConfig: {
    words: ['EMERGE', 'RESOLVE', 'CLEAR', 'FORM'],
    colors: ['#E0ECFF', '#C8DAFF', '#F0F5FF', '#B4CAFF'],
    bgColor: '#080c16',
    cycleDuration: 1.6,
    noiseGrain: 20,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['EMERGE', 'RESOLVE', 'CLEAR', 'FORM'],
      group: 'Content',
    },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E0ECFF', '#C8DAFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080c16', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.6,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'noiseGrain',
      label: 'Grain Size (px)',
      type: 'number',
      defaultValue: 20,
      min: 8,
      max: 50,
      group: 'Animation',
    },
  ],
})
