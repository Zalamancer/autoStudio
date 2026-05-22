import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface OutlineAssembleConfig extends KineticBaseConfig {
  outlineWidth: number
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length

    // Effect: letters appear first as outlines-only strokes, then the fill "pours in"
    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          whiteSpace: 'nowrap',
          alignItems: 'center',
        }}
      >
        {chars.map((ch, ci) => {
          const charDelay = (ci / totalChars) * 0.45
          let outlineProgress = 0
          let fillProgress = 0
          let scale = 1
          let opacity = 1
          let translateY = 0

          if (phase === 'enter') {
            // Outline draws first (0-60% of enter)
            const outlineP = Math.max(0, Math.min(1, (enterProgress - charDelay * 0.5) / 0.6))
            outlineProgress = easeOutExpo(outlineP)

            // Fill pours in after (40-100% of enter)
            const fillP = Math.max(0, Math.min(1, (enterProgress - charDelay - 0.35) / 0.65))
            fillProgress = easeOutBack(Math.min(1, fillP))

            // Letters slam down from above as outlines snap in
            translateY = (1 - easeOutBack(Math.min(1, (enterProgress - charDelay) / (1 - charDelay)))) * -height * 0.3
            scale = 0.5 + outlineProgress * 0.5
            opacity = Math.min(1, outlineP * 3)
          } else if (phase === 'hold') {
            outlineProgress = 1
            fillProgress = 1
            scale = 1
            opacity = 1
            // Subtle pulse on outline stroke width in hold
            translateY = Math.sin(holdProgress * Math.PI * 4 + ci * 0.7) * 1.5
          } else {
            outlineProgress = 1 - easeInCubic(exitProgress)
            fillProgress = 1 - easeInCubic(Math.min(1, exitProgress * 1.3))
            scale = 1 - easeInCubic(exitProgress) * 0.5
            opacity = 1 - exitProgress * exitProgress
            translateY = easeInCubic(exitProgress) * height * 0.3
          }

          const height_val = 168

          return (
            <div
              key={ci}
              style={{
                position: 'relative',
                display: 'inline-block',
                transform: `translateY(${translateY}px) scale(${scale})`,
                transformOrigin: 'center bottom',
                opacity,
              }}
            >
              {/* Outline layer — always visible once entering */}
              <span
                style={{
                  fontFamily: "'Arial Black', 'Impact', sans-serif",
                  fontSize: 'clamp(52px, 13vw, 168px)',
                  fontWeight: 900,
                  display: 'block',
                  lineHeight: 1,
                  color: 'transparent',
                  WebkitTextStroke: `${2 + (1 - fillProgress) * 2}px ${color}`,
                  opacity: outlineProgress,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {ch}
              </span>

              {/* Fill layer — clips from bottom to top as it fills in */}
              <span
                style={{
                  fontFamily: "'Arial Black', 'Impact', sans-serif",
                  fontSize: 'clamp(52px, 13vw, 168px)',
                  fontWeight: 900,
                  display: 'block',
                  lineHeight: 1,
                  color,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  // Fill pours in from bottom
                  clipPath: `inset(${Math.round((1 - fillProgress) * 100)}% 0 0 0)`,
                  zIndex: 2,
                }}
              >
                {ch}
              </span>
            </div>
          )
        })}
      </div>
    )
  },
}

function OutlineAssembleComponent(props: MotionGraphicProps<OutlineAssembleConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-outline-assemble',
  title: 'Kinetic Outline Assemble',
  description:
    'Letters slam in as hollow outlines first, then fill pours in from the bottom upward — a two-phase stroke-then-fill construction effect.',
  tags: ['kinetic', 'typography', 'outline', 'stroke', 'fill', 'assemble', 'pour', 'two-phase', 'build'],
  category: 'captions',
  component: OutlineAssembleComponent as any,
  defaultConfig: {
    words: ['SOLID', 'FILL', 'BUILD', 'FORM'],
    colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F'],
    bgColor: '#1A1A2E',
    cycleDuration: 1.6,
    outlineWidth: 3,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['SOLID', 'FILL', 'BUILD', 'FORM'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A1A2E', group: 'Style' },
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
      key: 'outlineWidth',
      label: 'Outline Width',
      type: 'number',
      defaultValue: 3,
      min: 1,
      max: 8,
      group: 'Animation',
    },
  ],
})
