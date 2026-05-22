import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface StampCollectionConfig extends KineticBaseConfig {}

/**
 * Generate perforated edge path — the zigzag semicircle border of a postage stamp.
 * Returns a CSS polygon clip-path string.
 */
function perfClipPath(teethX: number, teethY: number): string {
  const points: string[] = []
  const dx = 100 / teethX
  const dy = 100 / teethY
  const r = 1.2 // perforation radius in percent

  // Top edge (left to right)
  for (let i = 0; i <= teethX; i++) {
    const x = i * dx
    points.push(`${x}% ${i % 2 === 0 ? 0 : r}%`)
  }
  // Right edge (top to bottom)
  for (let i = 1; i <= teethY; i++) {
    const y = i * dy
    points.push(`${i % 2 === 0 ? 100 : 100 - r}% ${y}%`)
  }
  // Bottom edge (right to left)
  for (let i = teethX; i >= 0; i--) {
    const x = i * dx
    points.push(`${x}% ${i % 2 === 0 ? 100 : 100 - r}%`)
  }
  // Left edge (bottom to top)
  for (let i = teethY - 1; i >= 1; i--) {
    const y = i * dy
    points.push(`${i % 2 === 0 ? 0 : r}% ${y}%`)
  }

  return `polygon(${points.join(', ')})`
}

const stampClip = perfClipPath(14, 18)

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const stampW = Math.min(width * 0.5, height * 0.65)
    const stampH = stampW * 1.35

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Album page texture — faint grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }}
        />
        {/* Stamp body with perforated edges */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: stampW,
            height: stampH,
            transform: `translate(-50%, -50%) rotate(${Math.sin(time * 0.4) * 0.5}deg)`,
            background: 'linear-gradient(160deg, #f8f4ee 0%, #f0e8d8 40%, #e8dcc8 100%)',
            clipPath: stampClip,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}
        >
          {/* Stamp inner border */}
          <div
            style={{
              position: 'absolute',
              top: '6%',
              left: '6%',
              right: '6%',
              bottom: '6%',
              border: '2px solid rgba(120,60,40,0.2)',
              borderRadius: 2,
            }}
          />
          {/* Denomination / value */}
          <div
            style={{
              position: 'absolute',
              bottom: '10%',
              right: '10%',
              fontFamily: "'Georgia', serif",
              fontSize: stampW * 0.06,
              color: 'rgba(120,60,40,0.4)',
              fontWeight: 700,
            }}
          >
            32c
          </div>
          {/* Country name top */}
          <div
            style={{
              position: 'absolute',
              top: '8%',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: "'Georgia', serif",
              fontSize: stampW * 0.04,
              color: 'rgba(120,60,40,0.3)',
              letterSpacing: 4,
              textTransform: 'uppercase',
            }}
          >
            United States
          </div>
        </div>
        {/* Cancellation mark — wavy postmark lines */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', width: stampW * 1.1, height: stampH * 0.3, transform: 'translate(-50%, -50%) rotate(-15deg)', opacity: 0.12, overflow: 'hidden' }}>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: `${i * 18}%`, height: 2, background: '#333', transform: `translateX(${Math.sin(i * 2.5) * 3}px)` }} />
          ))}
        </div>
        {/* Circular date postmark */}
        <div style={{ position: 'absolute', top: '38%', right: '28%', width: stampW * 0.35, height: stampW * 0.35, borderRadius: '50%', border: '2px solid rgba(50,50,50,0.1)', transform: 'rotate(-10deg)' }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontFamily: "'Courier New', monospace", fontSize: stampW * 0.03, color: 'rgba(50,50,50,0.12)', whiteSpace: 'nowrap' }}>
            JAN 15 1968
          </div>
        </div>
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    width,
    height,
  }: WordRenderProps) => {
    const stampW = Math.min(width * 0.5, height * 0.65)
    let opacity = 0
    let scale = 1
    let stampRotate = 0

    if (phase === 'enter') {
      // Stamp pressed down — drops from above and impacts
      if (enterProgress < 0.5) {
        const dropT = enterProgress / 0.5
        const eased = dropT * dropT
        opacity = eased
        scale = 0.6 + eased * 0.5
        stampRotate = (1 - eased) * 8
      } else {
        // Impact settle — slight overshoot bounce
        const settleT = (enterProgress - 0.5) / 0.5
        opacity = 1
        scale = 1.1 - settleT * 0.1
        stampRotate = Math.sin(settleT * Math.PI * 2) * 1.5
      }
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      stampRotate = Math.sin(holdProgress * Math.PI * 2) * 0.3
    } else {
      // Peel away
      opacity = 1 - exitProgress
      scale = 1 - exitProgress * 0.15
      stampRotate = exitProgress * -5
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale}) rotate(${stampRotate}deg)`,
          opacity,
        }}
      >
        <div
          style={{
            fontFamily: "'Georgia', 'Palatino Linotype', serif",
            fontSize: `clamp(24px, ${stampW * 0.09}px, 64px)`,
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            textTransform: 'uppercase',
            textAlign: 'center',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function StampCollectionComponent(props: MotionGraphicProps<StampCollectionConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-stamp-collection',
  title: 'Kinetic Stamp Collection',
  description:
    'Postage stamp with perforated edges on album page. Features wavy-line cancellation mark, circular date postmark, and denomination. Text stamps down with an impact settle.',
  tags: ['kinetic', 'typography', 'stamp', 'postage', 'philately', 'analog', 'mail', 'vintage', 'collection'],
  category: 'captions',
  component: StampCollectionComponent as any,
  defaultConfig: {
    words: ['LIBERTY', 'JUSTICE', 'FREEDOM', 'UNITY'],
    colors: ['#6b2a1a', '#6b2a1a', '#6b2a1a', '#6b2a1a'],
    bgColor: '#e8e0d0',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LIBERTY', 'JUSTICE', 'FREEDOM', 'UNITY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#6b2a1a', '#6b2a1a', '#6b2a1a', '#6b2a1a'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#e8e0d0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
  ],
})
