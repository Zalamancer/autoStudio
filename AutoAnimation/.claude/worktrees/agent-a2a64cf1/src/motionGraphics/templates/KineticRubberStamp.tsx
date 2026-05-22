import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RubberStampConfig extends KineticBaseConfig {
  inkColor: string
}

function easeOutBounce(t: number): number {
  const n1 = 7.5625
  const d1 = 2.75
  if (t < 1 / d1) return n1 * t * t
  if (t < 2 / d1) {
    t -= 1.5 / d1
    return n1 * t * t + 0.75
  }
  if (t < 2.5 / d1) {
    t -= 2.25 / d1
    return n1 * t * t + 0.9375
  }
  t -= 2.625 / d1
  return n1 * t * t + 0.984375
}

function easeInCubic(t: number): number {
  return t * t * t
}

// Ink spread pattern — irregular blob mask to simulate rubber stamp ink
const inkMaskId = 'stamp-ink-mask'

const stampInkColors = ['#C0392B', '#922B21', '#A93226', '#CB4335', '#B03A2E']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    >
      {/* Aged paper texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: [
            'radial-gradient(ellipse at 20% 80%, rgba(180,150,80,0.07) 0%, transparent 40%)',
            'radial-gradient(ellipse at 80% 20%, rgba(160,130,70,0.05) 0%, transparent 35%)',
            'radial-gradient(ellipse at 50% 50%, rgba(200,170,100,0.03) 0%, transparent 60%)',
          ].join(', '),
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 37 + 13
    const inkColor = stampInkColors[index % stampInkColors.length]
    // Random slight rotation — real stamps never land perfectly straight
    const baseRotation = (seed % 11) - 5

    let scaleY = 1
    let scaleX = 1
    let opacity = 0
    let inkOpacity = 0
    let stampY = 0
    let shadowBlur = 0
    let borderOpacity = 0

    if (phase === 'enter') {
      if (enterProgress < 0.55) {
        // Stamp descends from above
        const p = enterProgress / 0.55
        stampY = (1 - p) * -120
        scaleX = 1 + (1 - p) * 0.05
        scaleY = 1 - (1 - p) * 0.05
        opacity = 0
        inkOpacity = 0
        borderOpacity = 0
      } else if (enterProgress < 0.7) {
        // Impact: squash and ink spreads
        const p = (enterProgress - 0.55) / 0.15
        const squash = Math.sin(p * Math.PI) * 0.18
        scaleX = 1 + squash * 0.6
        scaleY = 1 - squash
        stampY = 0
        inkOpacity = p
        opacity = p
        borderOpacity = p
        shadowBlur = p * 8
      } else {
        // Bounce settle
        const p = (enterProgress - 0.7) / 0.3
        const bounced = easeOutBounce(p)
        scaleX = 1 + (1 - bounced) * 0.04
        scaleY = 1 - (1 - bounced) * 0.04
        inkOpacity = 1
        opacity = 1
        borderOpacity = 1
        shadowBlur = (1 - p) * 8
      }
    } else if (phase === 'hold') {
      // Hold — subtle ink dry effect (opacity micro-variation)
      opacity = 1
      inkOpacity = 0.95 + Math.sin(holdProgress * Math.PI * 4 + seed) * 0.03
      borderOpacity = 1
    } else {
      // Exit — stamp lifts off, leaving ink impression that fades
      const p = easeInCubic(exitProgress)
      stampY = -p * 100
      opacity = 1 - p * 0.6
      inkOpacity = 1 - exitProgress * 0.5
      borderOpacity = 1 - exitProgress
      if (exitProgress > 0.7) opacity = (1 - exitProgress) / 0.3
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${stampY}px)) rotate(${baseRotation}deg) scaleX(${scaleX}) scaleY(${scaleY})`,
          opacity,
        }}
      >
        {/* Ink impression — main colored block */}
        <div
          style={{
            position: 'relative',
            padding: 'clamp(10px, 2.5vw, 28px) clamp(18px, 4.5vw, 52px)',
            border: `clamp(3px, 0.6vw, 6px) solid ${inkColor}`,
            borderRadius: 3,
            // Ink bleed at edges
            boxShadow: [`0 0 ${shadowBlur}px rgba(192,57,43,0.3)`, `inset 0 0 4px rgba(192,57,43,0.08)`].join(', '),
            opacity: borderOpacity,
          }}
        >
          {/* Ink texture overlay — uneven distribution */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `${inkColor}`,
              opacity: inkOpacity * 0.06,
              borderRadius: 2,
              backgroundImage: [
                'radial-gradient(circle at 15% 30%, rgba(255,255,255,0.3) 0%, transparent 20%)',
                'radial-gradient(circle at 80% 70%, rgba(255,255,255,0.2) 0%, transparent 15%)',
                'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.1) 0%, transparent 30%)',
              ].join(', '),
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              position: 'relative',
              fontFamily: "'Courier New', 'Courier', 'American Typewriter', monospace",
              fontSize: 'clamp(36px, 9vw, 118px)',
              fontWeight: 900,
              color: inkColor,
              whiteSpace: 'nowrap',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              opacity: inkOpacity,
              // Slightly uneven ink — text-shadow simulates bleed
              textShadow: [`1px 0 0 ${inkColor}80`, `-1px 0 0 ${inkColor}40`, `0 1px 0 ${inkColor}50`].join(', '),
            }}
          >
            {word}
          </div>
        </div>
      </div>
    )
  },
}

function RubberStampComponent(props: MotionGraphicProps<RubberStampConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-rubber-stamp',
  title: 'Kinetic Rubber Stamp',
  description:
    'Text stamped down with red ink stamp effect — squash on impact, ink spreads, bounces to rest like APPROVED',
  tags: ['kinetic', 'typography', 'stamp', 'rubber', 'ink', 'approved', 'office', 'stationery', 'bureaucratic'],
  category: 'captions',
  component: RubberStampComponent as any,
  defaultConfig: {
    words: ['APPROVED', 'DONE', 'FILED', 'SENT'],
    colors: ['#C0392B', '#922B21', '#A93226', '#B03A2E'],
    bgColor: '#FAF6F0',
    cycleDuration: 1.6,
    inkColor: '#C0392B',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['APPROVED', 'DONE', 'FILED', 'SENT'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#C0392B', '#922B21', '#A93226', '#B03A2E'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FAF6F0', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.6,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
    { key: 'inkColor', label: 'Ink Color', type: 'color', defaultValue: '#C0392B', group: 'Style' },
  ],
})
