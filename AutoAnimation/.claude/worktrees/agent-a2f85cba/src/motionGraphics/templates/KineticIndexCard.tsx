import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface IndexCardConfig extends KineticBaseConfig {}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const cardColors = [
  { bg: '#FFFEF5', line: 'rgba(150,170,210,0.35)', accent: '#E8E4D0' },
  { bg: '#FFF5F5', line: 'rgba(200,150,150,0.3)', accent: '#F0D8D8' },
  { bg: '#F5FFF5', line: 'rgba(130,180,150,0.3)', accent: '#D8EDDB' },
  { bg: '#F5F8FF', line: 'rgba(140,160,210,0.3)', accent: '#D8E2F4' },
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    >
      {/* Cork board-style subtle warm background dots */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: [
            'radial-gradient(circle at 10% 20%, rgba(180,140,80,0.07) 0%, transparent 12%)',
            'radial-gradient(circle at 90% 80%, rgba(160,120,60,0.05) 0%, transparent 10%)',
            'radial-gradient(circle at 60% 40%, rgba(200,160,90,0.04) 0%, transparent 8%)',
          ].join(', '),
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 59 + 23
    const cardScheme = cardColors[index % cardColors.length]
    const baseRotation = ((seed % 9) - 4) * 0.6 // subtle tilt

    let rotateX = 0
    let opacity = 1
    let translateY = 0
    let shadowY = 4
    let shadowBlur = 12

    if (phase === 'enter') {
      // Card flips in on X axis — like flipping an index card toward you
      const eased = easeOutBack(enterProgress)
      rotateX = 90 - 90 * eased
      opacity = Math.min(1, enterProgress * 3)
      translateY = (1 - eased) * 20
      shadowY = 4 + (1 - eased) * 20
      shadowBlur = 12 + (1 - eased) * 20
    } else if (phase === 'hold') {
      // Slight rhythmic tilt/bob
      const bob = Math.sin(holdProgress * Math.PI * 2 + seed) * 2
      translateY = bob
      rotateX = Math.sin(holdProgress * Math.PI * 3 + seed * 0.5) * 1.5
    } else {
      // Card flips back away
      const eased = easeInCubic(exitProgress)
      rotateX = eased * 90
      opacity = 1 - exitProgress * 0.8
      if (exitProgress > 0.8) opacity = (1 - exitProgress) / 0.2
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px)) rotate(${baseRotation}deg)`,
          opacity,
          perspective: 1000,
        }}
      >
        <div
          style={{
            transform: `rotateX(${rotateX}deg)`,
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
          }}
        >
          {/* Index card */}
          <div
            style={{
              position: 'relative',
              background: cardScheme.bg,
              padding: 'clamp(16px, 4vw, 44px) clamp(22px, 5.5vw, 60px)',
              paddingTop: 'clamp(28px, 6vw, 58px)',
              boxShadow: `2px ${shadowY}px ${shadowBlur}px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.1)`,
              borderRadius: 2,
              minWidth: 'clamp(200px, 40vw, 480px)',
            }}
          >
            {/* Top colored stripe — like index card header */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 'clamp(12px, 2.5vw, 22px)',
                background: cardScheme.accent,
                borderRadius: '2px 2px 0 0',
              }}
            />

            {/* Ruled lines */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                top: 'clamp(28px, 6vw, 58px)',
                backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 29px, ${cardScheme.line} 29px, ${cardScheme.line} 30px)`,
                backgroundPosition: '0 6px',
                borderRadius: '0 0 2px 2px',
                pointerEvents: 'none',
              }}
            />

            {/* Red left margin line */}
            <div
              style={{
                position: 'absolute',
                top: 'clamp(28px, 6vw, 58px)',
                bottom: 0,
                left: 'clamp(32px, 6vw, 60px)',
                width: 1,
                background: 'rgba(200,100,100,0.25)',
                pointerEvents: 'none',
              }}
            />

            <div
              style={{
                position: 'relative',
                fontFamily: "'Courier New', 'Courier', monospace",
                fontSize: 'clamp(30px, 7.5vw, 100px)',
                fontWeight: 700,
                color,
                whiteSpace: 'nowrap',
                letterSpacing: '0.04em',
              }}
            >
              {word}
            </div>
          </div>
        </div>
      </div>
    )
  },
}

function IndexCardComponent(props: MotionGraphicProps<IndexCardConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-index-card',
  title: 'Kinetic Index Card',
  description: 'Text written on a ruled index card that flips into view — ruled lines, colored header stripe, and 3D flip entrance',
  tags: ['kinetic', 'typography', 'index card', 'notecard', 'office', 'study', 'stationery', 'flip'],
  category: 'captions',
  component: IndexCardComponent as any,
  defaultConfig: {
    words: ['REVIEW', 'STUDY', 'NOTES', 'LEARN'],
    colors: ['#1C3A5E', '#2E4B1E', '#4A1C3A', '#1C3A4A'],
    bgColor: '#D4C5A9',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['REVIEW', 'STUDY', 'NOTES', 'LEARN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1C3A5E', '#2E4B1E', '#4A1C3A', '#1C3A4A'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#D4C5A9', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.3, max: 5, group: 'Timing' },
  ],
})
