import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface HalftoneResolveConfig extends KineticBaseConfig {
  dotSpacing: number
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInQuad(t: number): number {
  return t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Background: very subtle halftone dot field slowly pulsing
    const dotSpacing = 14
    const cols = Math.ceil(width / dotSpacing)
    const rows = Math.ceil(height / dotSpacing)
    const dots: React.ReactNode[] = []

    for (let r = 0; r < rows; r += 2) {
      for (let c = 0; c < cols; c += 2) {
        const dotX = c * dotSpacing + (r % 2 === 0 ? 0 : dotSpacing / 2)
        const dotY = r * dotSpacing
        const pulse = Math.sin(t * 0.5 + (c + r) * 0.3) * 0.5 + 0.5
        const dotSize = 1 + pulse * 1
        const alpha = 0.04 + pulse * 0.02

        dots.push(
          <div
            key={`bg-${r}_${c}`}
            style={{
              position: 'absolute',
              left: dotX - dotSize / 2,
              top: dotY - dotSize / 2,
              width: dotSize,
              height: dotSize,
              borderRadius: '50%',
              background: `rgba(160,180,210,${alpha})`,
            }}
          />,
        )
      }
    }

    return <div style={{ position: 'absolute', inset: 0, background: bgColor }}>{dots}</div>
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
    const cfg = (globalThis as any).__halftoneResolveConfig ?? { dotSpacing: 12 }
    const dotSpacing = cfg.dotSpacing ?? 12

    // Halftone resolve: dots shrink from large-coverage (opaque) to tiny-coverage (clear)
    // revealing text underneath as the halftone "resolves" to full tone

    // At max halftone: dots are large, covering most of the frame
    // At resolved: dots shrink to nothing

    let dotSizeFactor = 1 // 0 = dots gone (resolved), 1 = maximum dot size
    let textOpacity = 0
    let dotColor = color

    if (phase === 'enter') {
      const ep = easeOutExpo(enterProgress)
      dotSizeFactor = 1 - ep
      textOpacity = easeOutExpo(Math.max(0, (enterProgress - 0.15) / 0.85))
      dotColor = color
    } else if (phase === 'hold') {
      dotSizeFactor = 0
      textOpacity = 1
      dotColor = color
    } else {
      const ep = easeInQuad(exitProgress)
      dotSizeFactor = ep
      textOpacity = 1 - ep
    }

    // Build halftone dot grid
    const cols = Math.ceil(width / dotSpacing)
    const rows = Math.ceil(height / dotSpacing)
    const dots: React.ReactNode[] = []

    const maxDotSize = dotSpacing * 0.92 // max dot fills the cell

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Offset every other row (angled halftone grid)
        const dotX = c * dotSpacing + (r % 2 === 0 ? 0 : dotSpacing / 2) + dotSpacing / 2
        const dotY = r * dotSpacing + dotSpacing / 2

        if (dotX < 0 || dotX > width + dotSpacing || dotY < 0 || dotY > height + dotSpacing) continue

        // Each dot has an individual size based on noise + wave
        // Dots near center resolve faster
        const distFromCenter = Math.hypot((dotX / width - 0.5) * 2, (dotY / height - 0.5) * 2)
        const centerBonus = Math.max(0, 1 - distFromCenter) * 0.15

        // Staggered timing: dots resolve in a radial wave from center
        const delayedFactor = Math.max(0, dotSizeFactor - centerBonus * dotSizeFactor)

        const dotSize = maxDotSize * delayedFactor

        if (dotSize < 0.5) continue

        // Dot tone variation: darker near edges of the pattern
        const dotAlpha = 0.7 + rand(c * 37 + r * 53 + index) * 0.3

        // Parse color for dot rendering (use the word color for the halftone dots)
        dots.push(
          <div
            key={`wd-${r}_${c}`}
            style={{
              position: 'absolute',
              left: dotX - dotSize / 2,
              top: dotY - dotSize / 2,
              width: dotSize,
              height: dotSize,
              borderRadius: '50%',
              background: dotColor,
              opacity: dotAlpha,
            }}
          />,
        )
      }
    }

    // Scan line highlight during transition (mimics print head pass)
    const scanLineY = (1 - dotSizeFactor) * height
    const scanVisible = dotSizeFactor > 0.02 && dotSizeFactor < 0.98

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Text revealed as halftone resolves */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(40px, 12vw, 155px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            opacity: textOpacity,
            textShadow: `0 0 20px ${color}50`,
          }}
        >
          {word}
        </div>

        {/* Halftone dot overlay */}
        {dots}

        {/* Resolution scan line */}
        {scanVisible && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: scanLineY - 2,
              height: 4,
              background: `linear-gradient(90deg, transparent, rgba(220,230,255,0.2) 20%, rgba(220,230,255,0.3) 50%, rgba(220,230,255,0.2) 80%, transparent)`,
              filter: 'blur(2px)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    )
  },
}

function HalftoneResolveComponent(props: MotionGraphicProps<HalftoneResolveConfig>) {
  ;(globalThis as any).__halftoneResolveConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-halftone-resolve',
  title: 'Kinetic Halftone Resolve',
  description:
    'A halftone dot grid starts at maximum coverage and shrinks radially to nothing, resolving from print to clean text with a scan-line sweep',
  tags: ['kinetic', 'typography', 'halftone', 'dots', 'print', 'interference', 'resolve', 'reveal', 'pattern'],
  category: 'captions',
  component: HalftoneResolveComponent as any,
  defaultConfig: {
    words: ['PRINT', 'DOT', 'RESOLVE', 'TONE'],
    colors: ['#F0E8D8', '#E8DCC8', '#F8F0E0', '#DDD0BC'],
    bgColor: '#100e0a',
    cycleDuration: 1.5,
    dotSpacing: 12,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['PRINT', 'DOT', 'RESOLVE', 'TONE'],
      group: 'Content',
    },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F0E8D8', '#E8DCC8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#100e0a', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'dotSpacing',
      label: 'Dot Spacing (px)',
      type: 'number',
      defaultValue: 12,
      min: 6,
      max: 30,
      group: 'Animation',
    },
  ],
})
