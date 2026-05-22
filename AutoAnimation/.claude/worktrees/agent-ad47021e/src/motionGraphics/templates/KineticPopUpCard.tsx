import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PopUpCardConfig extends KineticBaseConfig {}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Pop-up card: paper engineering where scored/folded tabs create 3D elements
// that rise when card is opened. The animation simulates the card opening
// and the text rising up from flat to full height — V-fold mechanism.
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    const f = frame ?? 0
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Card base with spine crease */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: '50%',
            width: 2,
            background: `linear-gradient(180deg, transparent 5%, rgba(0,0,0,0.08) 20%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.08) 80%, transparent 95%)`,
            transform: 'translateX(-50%)',
          }}
        />
        {/* Left card panel */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '50%',
            bottom: 0,
            background: 'rgba(255,255,255,0.04)',
          }}
        />
        {/* Score lines (fold guides) */}
        {[0.25, 0.75].map((pos, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: '20%',
              bottom: '20%',
              left: `${pos * 100}%`,
              width: 1,
              background: 'rgba(0,0,0,0.06)',
              borderStyle: 'dashed',
            }}
          />
        ))}
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
    frame,
  }: WordRenderProps) => {
    const f = frame ?? 0
    const chars = word.split('')

    // Pop-up mechanism: V-fold — text panel attached at two points,
    // folds perpendicular to card surface when opened
    let openProgress = 0
    let opacity = 0

    if (phase === 'enter') {
      openProgress = easeOutBack(Math.min(1, enterProgress * 1.1))
      opacity = Math.min(1, enterProgress * 3)
    } else if (phase === 'hold') {
      openProgress = 1
      opacity = 1
    } else {
      openProgress = Math.max(0, 1 - exitProgress * 1.2)
      opacity = Math.max(0, 1 - exitProgress * 1.5)
    }

    // Pop-up rises from 0 (flat with card) to full height
    // Simulated via scaleY + perspective + slight backward tilt
    const riseHeight = openProgress  // 0 = flat, 1 = fully risen
    const tiltDeg = (1 - openProgress) * 80  // Starts lying flat, rises to vertical

    // Card panel tab colors (layered paper look)
    const tabColors = ['#F8E8F0', '#E8F0F8', '#F8F0E8', '#E8F8F0']
    const tabColor = tabColors[index % tabColors.length]

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%)`,
          perspective: 600,
          opacity,
        }}
      >
        {/* Tab/backing panel that represents the pop-up element */}
        <div
          style={{
            transform: `rotateX(${-tiltDeg}deg) scaleY(${0.1 + riseHeight * 0.9})`,
            transformOrigin: 'center bottom',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Paper tab shadow (cast on card surface) */}
          <div
            style={{
              position: 'absolute',
              bottom: -4,
              left: '-8%',
              right: '-8%',
              height: 12,
              background: `radial-gradient(ellipse, rgba(0,0,0,${0.25 * (1 - riseHeight)}) 0%, transparent 70%)`,
              filter: `blur(${(1 - riseHeight) * 3 + 2}px)`,
              pointerEvents: 'none',
            }}
          />

          {/* Paper tab face */}
          <div
            style={{
              position: 'absolute',
              inset: '-12% -8%',
              background: tabColor,
              borderRadius: 4,
              boxShadow: `0 ${riseHeight * 8}px ${riseHeight * 16}px rgba(0,0,0,${0.15 + riseHeight * 0.1}), inset 0 1px 2px rgba(255,255,255,0.5)`,
            }}
          />

          {/* Score line at top of tab (fold point) */}
          <div
            style={{
              position: 'absolute',
              top: '-12%',
              left: '-8%',
              right: '-8%',
              height: 2,
              background: `rgba(0,0,0,0.12)`,
              borderRadius: 1,
            }}
          />

          {/* Main text content */}
          <div
            style={{
              display: 'flex',
              gap: 2,
              position: 'relative',
              zIndex: 1,
            }}
          >
            {chars.map((ch, ci) => (
              <span
                key={ci}
                style={{
                  fontFamily: "'Georgia', 'Palatino', serif",
                  fontSize: 'clamp(40px, 10vw, 140px)',
                  fontWeight: 700,
                  color,
                  display: 'inline-block',
                  lineHeight: 1.1,
                  letterSpacing: 1,
                  textShadow: `0 ${riseHeight * 2}px ${riseHeight * 4}px rgba(0,0,0,0.1)`,
                  // Each char rises slightly staggered
                  transform: `translateY(${(1 - riseHeight) * 8}px)`,
                  transition: undefined,
                }}
              >
                {ch}
              </span>
            ))}
          </div>

          {/* Decorative cut detail lines */}
          {[0.2, 0.8].map((pos, di) => (
            <div
              key={di}
              style={{
                position: 'absolute',
                top: '10%',
                bottom: '10%',
                left: `${pos * 100}%`,
                width: 1,
                background: `rgba(0,0,0,0.08)`,
                borderStyle: 'dashed',
              }}
            />
          ))}
        </div>
      </div>
    )
  },
}

function PopUpCardComponent(props: MotionGraphicProps<PopUpCardConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-pop-up-card',
  title: 'Kinetic Pop-Up Card',
  description: 'Paper engineering V-fold mechanism: text panel rises from flat to vertical as card opens — score lines, paper tab backing, cast shadow that compresses as text rises, full pop-up card mechanism animated',
  tags: ['kinetic', 'typography', 'pop-up', 'paper', 'card', 'craft', 'fold', 'engineering', '3D', 'greeting'],
  category: 'captions',
  component: PopUpCardComponent as any,
  defaultConfig: {
    words: ['POP', 'OPEN', 'RISE', 'CARD'],
    colors: ['#C0392B', '#2980B9', '#27AE60', '#8E44AD'],
    bgColor: '#FDF9F0',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['POP', 'OPEN', 'RISE', 'CARD'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C0392B', '#2980B9', '#27AE60', '#8E44AD'], group: 'Style' },
    { key: 'bgColor', label: 'Card Color', type: 'color', defaultValue: '#FDF9F0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.4, max: 5, group: 'Timing' },
  ],
})
