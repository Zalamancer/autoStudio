import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface OrigamiFoldConfig extends KineticBaseConfig {
  foldIntensity: number
}

/** Deterministic pseudo-random 0..1 from integer seed */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Ease out cubic */
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Subtle paper texture grid
    const gridSize = 40
    const cols = Math.ceil(width / gridSize)
    const rows = Math.ceil(height / gridSize)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Paper texture — faint diagonal crease lines */}
        {Array.from({ length: 6 }, (_, i) => {
          const angle = 45 + i * 30
          const offset = (time * 2 + i * 80) % (width + height)
          const opacity = 0.03 + rand(i * 17) * 0.03
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: Math.max(width, height) * 1.5,
                height: 1,
                background: `rgba(255,255,255,${opacity})`,
                transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(${(i - 3) * 60}px)`,
                pointerEvents: 'none',
              }}
            />
          )
        })}
        {/* Paper grain overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.04) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          gap: 2,
          whiteSpace: 'nowrap',
        }}
      >
        {chars.map((ch, ci) => {
          const charDelay = ci / (totalChars + 1) * 0.6
          let foldAngle = 0
          let opacity = 0
          let scaleY = 1
          let translateY = 0
          let shadowIntensity = 0

          if (phase === 'enter') {
            const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay * 0.8)))
            const eased = easeOut(p)
            // Start folded flat (90deg), unfold to 0
            foldAngle = (1 - eased) * -90
            // Paper unfolds from top edge
            scaleY = 0.3 + eased * 0.7
            opacity = p > 0.05 ? Math.min(1, p * 2) : 0
            translateY = (1 - eased) * 20
            // Crease shadow strongest mid-fold
            shadowIntensity = Math.sin(eased * Math.PI) * 0.6
          } else if (phase === 'hold') {
            opacity = 1
            // Gentle paper breathing
            const breathe = Math.sin(holdProgress * Math.PI * 4 + ci * 0.3) * 1.5
            translateY = breathe
            // Subtle fold crease memory
            foldAngle = Math.sin(holdProgress * Math.PI * 2 + ci * 0.5) * 1.5
          } else {
            const p = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.5) / (1 - charDelay * 0.3)))
            const eased = easeOut(p)
            // Fold back up
            foldAngle = eased * 90
            scaleY = 1 - eased * 0.7
            opacity = 1 - eased
            translateY = eased * -15
            shadowIntensity = Math.sin(eased * Math.PI) * 0.4
          }

          // Alternating fold directions for geometric paper feel
          const foldDirection = ci % 2 === 0 ? 1 : -1
          const actualAngle = foldAngle * foldDirection

          // Crease line color
          const creaseOpacity = shadowIntensity * 0.8

          return (
            <div
              key={ci}
              style={{
                position: 'relative',
                display: 'inline-block',
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontSize: 'clamp(40px, 11vw, 150px)',
                fontWeight: 700,
                color,
                opacity,
                transform: `perspective(400px) rotateX(${actualAngle}deg) scaleY(${scaleY}) translateY(${translateY}px)`,
                transformOrigin: ci % 2 === 0 ? 'center top' : 'center bottom',
                textShadow: `0 2px 4px rgba(0,0,0,${0.1 + shadowIntensity * 0.3})`,
                transition: 'none',
              }}
            >
              {ch}
              {/* Crease line overlay */}
              {creaseOpacity > 0.05 && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: '50%',
                    height: 1,
                    background: `rgba(255,255,255,${creaseOpacity})`,
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                  }}
                />
              )}
              {/* Paper shadow on fold */}
              {shadowIntensity > 0.1 && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: ci % 2 === 0
                      ? `linear-gradient(180deg, rgba(0,0,0,${shadowIntensity * 0.2}) 0%, transparent 50%)`
                      : `linear-gradient(0deg, rgba(0,0,0,${shadowIntensity * 0.2}) 0%, transparent 50%)`,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    )
  },
}

function OrigamiFoldComponent(props: MotionGraphicProps<OrigamiFoldConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-origami-fold',
  title: 'Kinetic Origami Fold',
  description: 'Text folds in from flat paper with visible crease lines and geometric paper fold animation, like origami being shaped',
  tags: ['kinetic', 'typography', 'origami', 'paper', 'fold', 'craft', 'geometric'],
  category: 'captions',
  component: OrigamiFoldComponent as any,
  defaultConfig: {
    words: ['FOLD', 'SHAPE', 'CRAFT', 'PAPER'],
    colors: ['#E85D4A', '#2E86AB', '#A23B72', '#F18F01'],
    bgColor: '#FAF3E0',
    cycleDuration: 1.3,
    foldIntensity: 90,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FOLD', 'SHAPE', 'CRAFT', 'PAPER'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E85D4A', '#2E86AB', '#A23B72', '#F18F01'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FAF3E0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
    { key: 'foldIntensity', label: 'Fold Intensity', type: 'number', defaultValue: 90, min: 30, max: 180, group: 'Animation' },
  ],
})
