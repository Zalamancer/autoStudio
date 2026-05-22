import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface VectorStrokeConfig extends KineticBaseConfig {
  strokeWidth: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Engineering grid paper feel */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
          `,
          backgroundSize: `${Math.round(width / 20)}px ${Math.round(width / 20)}px`,
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length

    // The core effect: each letter draws in stroke-by-stroke
    // Letters are stacked with a geometric construction reveal
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
        {/* Construction lines that sweep across */}
        {phase === 'enter' && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: 2,
              background: `linear-gradient(90deg, transparent, ${color}60, transparent)`,
              transform: `translateY(-50%) scaleX(${easeOutExpo(enterProgress)})`,
              transformOrigin: 'left center',
              pointerEvents: 'none',
            }}
          />
        )}

        {chars.map((ch, ci) => {
          const charDelay = (ci / totalChars) * 0.55
          let charProgress = 0
          let opacity = 0
          let clipProgress = 0
          let skewX = 0
          let strokeOpacity = 0

          if (phase === 'enter') {
            const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay)))
            charProgress = easeOutExpo(p)
            clipProgress = charProgress
            opacity = Math.min(1, p * 2.5)
            // Letters materialize with a slight skew that straightens
            skewX = (1 - charProgress) * -12
            strokeOpacity = Math.max(0, 1 - p * 2)
          } else if (phase === 'hold') {
            charProgress = 1
            clipProgress = 1
            opacity = 1
            // Subtle construction-line pulse in hold
            strokeOpacity = Math.sin(holdProgress * Math.PI * 3) * 0.15
          } else {
            charProgress = 1
            clipProgress = 1
            const p = Math.max(0, (exitProgress - (1 - (ci + 1) / totalChars) * 0.3) / 0.7)
            opacity = 1 - easeInExpo(Math.min(1, p))
            skewX = easeInExpo(Math.min(1, exitProgress)) * 8
          }

          return (
            <div
              key={ci}
              style={{
                position: 'relative',
                display: 'inline-block',
              }}
            >
              {/* Stroke construction line behind each char */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  right: 0,
                  height: 3,
                  background: color,
                  transform: `translateY(-50%) scaleX(${clipProgress})`,
                  transformOrigin: 'left center',
                  opacity: strokeOpacity + (phase === 'enter' ? Math.max(0, 0.6 - charProgress * 0.6) : 0),
                  pointerEvents: 'none',
                }}
              />
              <span
                style={{
                  fontFamily: "'Arial Black', 'Impact', sans-serif",
                  fontSize: 'clamp(52px, 13vw, 168px)',
                  fontWeight: 900,
                  color,
                  opacity,
                  display: 'inline-block',
                  transform: `skewX(${skewX}deg)`,
                  // Clip-path draws each letter from left to right
                  clipPath: `inset(0 ${Math.round((1 - clipProgress) * 100)}% 0 0)`,
                  lineHeight: 1,
                  letterSpacing: 2,
                  textShadow: `1px 1px 0 rgba(0,0,0,0.5), 0 0 20px ${color}30`,
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

function VectorStrokeComponent(props: MotionGraphicProps<VectorStrokeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-vector-stroke',
  title: 'Kinetic Vector Stroke',
  description: 'Each letter draws in from left to right like a vector path being rendered — construction lines sweep across, then the filled letter materializes with geometric precision.',
  tags: ['kinetic', 'typography', 'stroke', 'draw', 'vector', 'construction', 'geometric', 'assembly'],
  category: 'captions',
  component: VectorStrokeComponent as any,
  defaultConfig: {
    words: ['BUILD', 'DRAW', 'TRACE', 'CONSTRUCT'],
    colors: ['#00D4FF', '#FF6B35', '#7BF178', '#FFD60A'],
    bgColor: '#0A0E1A',
    cycleDuration: 1.5,
    strokeWidth: 3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BUILD', 'DRAW', 'TRACE', 'CONSTRUCT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00D4FF', '#FF6B35', '#7BF178', '#FFD60A'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0E1A', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
    { key: 'strokeWidth', label: 'Stroke Width', type: 'number', defaultValue: 3, min: 1, max: 8, group: 'Animation' },
  ],
})
