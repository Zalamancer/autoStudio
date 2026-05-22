import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// KineticZipperPull: Zipper teeth separate horizontally left/right from center-top,
// with a pull tab that drags across the top. Distinct from KineticZipperReveal (which runs top-to-bottom).
interface ZipperPullConfig extends KineticBaseConfig {
  toothRows: number
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const config = (globalThis as any).__zipperPullConfig ?? { toothRows: 16 }
    const toothRows = Math.max(8, Math.min(30, config.toothRows ?? 16))

    let zipProgress = 0
    if (phase === 'enter') {
      zipProgress = easeOutCubic(enterProgress)
    } else if (phase === 'hold') {
      zipProgress = 1
    } else {
      zipProgress = 1 - easeInCubic(exitProgress)
    }

    // Zipper seam runs horizontally across the center of the frame.
    // Pull tab starts at left edge and drags right. Each tooth pair it passes spreads open.
    const seamY = height * 0.5
    const seamThickness = height * 0.35 // total height the zipper fabric covers
    const halfSeam = seamThickness / 2

    const toothSpacing = width / toothRows
    const toothW = toothSpacing * 0.5
    const toothH = 8

    // Pull tab position travels left-to-right
    const pullX = zipProgress * width

    const teethElements = []
    for (let i = 0; i < toothRows; i++) {
      const toothCenterX = (i + 0.5) * toothSpacing
      const isOpen = toothCenterX < pullX

      // Teeth spread: top teeth rise, bottom teeth descend
      const spreadFactor = isOpen ? 1 : 0
      const topY = seamY - halfSeam * spreadFactor - toothH / 2
      const botY = seamY + halfSeam * spreadFactor - toothH / 2

      const metalShade = 160 + (i % 2) * 20
      const toothOpacity = isOpen ? 0.25 : 0.75

      // Top tooth
      teethElements.push(
        <div
          key={`t-${i}`}
          style={{
            position: 'absolute',
            left: toothCenterX - toothW / 2,
            top: topY,
            width: toothW,
            height: toothH,
            background: `rgba(${metalShade},${metalShade},${metalShade + 8},${toothOpacity})`,
            borderRadius: 2,
          }}
        />,
      )
      // Bottom tooth
      teethElements.push(
        <div
          key={`b-${i}`}
          style={{
            position: 'absolute',
            left: toothCenterX - toothW / 2,
            top: botY,
            width: toothW,
            height: toothH,
            background: `rgba(${metalShade},${metalShade},${metalShade + 8},${toothOpacity})`,
            borderRadius: 2,
          }}
        />,
      )
    }

    // Fabric panels: two horizontal bands that spread apart as zipper opens
    const topFabricBottom = seamY - halfSeam * zipProgress
    const botFabricTop = seamY + halfSeam * zipProgress

    // Pull tab handle
    const pullHandleW = 22
    const pullHandleH = 28
    const clampedPullX = Math.max(pullHandleW / 2, Math.min(width - pullHandleW / 2, pullX))

    const textOpacity =
      phase === 'enter'
        ? Math.min(1, enterProgress * 3)
        : phase === 'hold'
          ? 1
          : 1 - exitProgress

    return (
      <>
        {/* Text revealed behind opening zipper */}
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

        {/* Top fabric band */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: topFabricBottom,
            background: 'linear-gradient(180deg, rgba(45,47,58,0.96) 0%, rgba(55,58,72,0.94) 100%)',
          }}
        />

        {/* Bottom fabric band */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: botFabricTop,
            width: '100%',
            height: height - botFabricTop,
            background: 'linear-gradient(0deg, rgba(45,47,58,0.96) 0%, rgba(55,58,72,0.94) 100%)',
          }}
        />

        {/* Closed seam area (right of pull tab) */}
        <div
          style={{
            position: 'absolute',
            left: pullX,
            top: seamY - halfSeam * 0.08,
            width: width - pullX,
            height: halfSeam * 0.16,
            background: 'rgba(30,31,40,0.7)',
          }}
        />

        {/* Zipper teeth */}
        {teethElements}

        {/* Pull tab */}
        <div
          style={{
            position: 'absolute',
            left: clampedPullX - pullHandleW / 2,
            top: seamY - pullHandleH / 2,
            width: pullHandleW,
            height: pullHandleH,
            background: 'linear-gradient(180deg, #D4D6DE, #9A9CA8)',
            borderRadius: 4,
            boxShadow: '0 3px 10px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.15)',
            zIndex: 10,
          }}
        >
          {/* Pull tab ring at top */}
          <div
            style={{
              position: 'absolute',
              top: -8,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 10,
              height: 10,
              borderRadius: '50%',
              border: '2px solid rgba(180,182,190,0.8)',
            }}
          />
          {/* Grip ridges */}
          {[6, 10, 14, 18].map((topPos) => (
            <div
              key={topPos}
              style={{
                position: 'absolute',
                top: topPos,
                left: 3,
                right: 3,
                height: 1,
                background: 'rgba(80,82,90,0.4)',
                borderRadius: 1,
              }}
            />
          ))}
        </div>
      </>
    )
  },
}

function ZipperPullComponent(props: MotionGraphicProps<ZipperPullConfig>) {
  ;(globalThis as any).__zipperPullConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-zipper-pull',
  title: 'Kinetic Zipper Pull',
  description: 'A pull tab drags horizontally across the frame, separating zipper teeth left/right to reveal text through the parting fabric',
  tags: ['kinetic', 'typography', 'zipper', 'pull', 'reveal', 'horizontal', 'mechanical', 'geometric'],
  category: 'captions',
  component: ZipperPullComponent as any,
  defaultConfig: {
    words: ['PULL', 'TEAR', 'SPLIT', 'OPEN'],
    colors: ['#FF6B6B', '#FF8E8E', '#FFB3B3', '#FF4444'],
    bgColor: '#111318',
    cycleDuration: 1.5,
    toothRows: 16,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['PULL', 'TEAR', 'SPLIT', 'OPEN'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF6B6B', '#FF8E8E', '#FFB3B3', '#FF4444'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111318', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.4,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'toothRows',
      label: 'Tooth Count',
      type: 'number',
      defaultValue: 16,
      min: 8,
      max: 30,
      group: 'Animation',
    },
  ],
})
