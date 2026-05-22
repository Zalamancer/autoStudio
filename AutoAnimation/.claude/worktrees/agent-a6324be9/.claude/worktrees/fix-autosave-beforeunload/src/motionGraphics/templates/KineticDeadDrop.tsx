import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DeadDropConfig extends KineticBaseConfig {}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    // Crumpled paper crease lines
    const creases: { x1: number; y1: number; x2: number; y2: number; opacity: number }[] = []
    for (let i = 0; i < 8; i++) {
      creases.push({
        x1: seededRand(i * 41 + 7) * width,
        y1: seededRand(i * 67 + 13) * height,
        x2: seededRand(i * 41 + 7) * width + (seededRand(i * 89 + 31) - 0.5) * 200,
        y2: seededRand(i * 67 + 13) * height + (seededRand(i * 73 + 17) - 0.5) * 200,
        opacity: 0.04 + seededRand(i * 53) * 0.04,
      })
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Crumpled paper crease shadows */}
        {creases.map((c, i) => {
          const angle = Math.atan2(c.y2 - c.y1, c.x2 - c.x1) * (180 / Math.PI)
          const length = Math.sqrt((c.x2 - c.x1) ** 2 + (c.y2 - c.y1) ** 2)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: c.x1,
                top: c.y1,
                width: length,
                height: 1,
                background: `rgba(100,80,50,${c.opacity})`,
                transform: `rotate(${angle}deg)`,
                transformOrigin: '0 0',
                pointerEvents: 'none',
              }}
            />
          )
        })}

        {/* Torn edge top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: 'linear-gradient(180deg, rgba(120,90,50,0.12), transparent)',
            clipPath:
              'polygon(0 0, 5% 60%, 10% 20%, 15% 80%, 20% 30%, 25% 70%, 30% 10%, 35% 90%, 40% 40%, 45% 80%, 50% 20%, 55% 60%, 60% 0, 65% 70%, 70% 30%, 75% 80%, 80% 10%, 85% 60%, 90% 30%, 95% 70%, 100% 0)',
            pointerEvents: 'none',
          }}
        />

        {/* Torn edge bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 6,
            background: 'linear-gradient(0deg, rgba(120,90,50,0.12), transparent)',
            clipPath:
              'polygon(0 100%, 4% 30%, 8% 80%, 13% 20%, 18% 70%, 22% 40%, 27% 90%, 32% 10%, 37% 60%, 42% 30%, 48% 80%, 53% 20%, 58% 70%, 63% 40%, 68% 90%, 73% 10%, 78% 60%, 83% 30%, 88% 80%, 94% 40%, 100% 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Coffee stain ring */}
        <div
          style={{
            position: 'absolute',
            top: '18%',
            right: '12%',
            width: 55,
            height: 55,
            borderRadius: '50%',
            border: '3px solid rgba(120,80,30,0.06)',
            background: 'radial-gradient(circle, rgba(120,80,30,0.02) 60%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Newspaper cipher marks — circled letters scattered */}
        {Array.from({ length: 5 }).map((_, i) => {
          const cx = seededRand(i * 97 + 3) * width * 0.6 + width * 0.15
          const cy = seededRand(i * 61 + 19) * height * 0.5 + height * 0.2
          return (
            <div
              key={`mark${i}`}
              style={{
                position: 'absolute',
                left: cx,
                top: cy,
                width: 14,
                height: 14,
                borderRadius: '50%',
                border: '1px solid rgba(180,50,30,0.08)',
                pointerEvents: 'none',
              }}
            />
          )
        })}

        {/* Faint pencil scrawl lines (coded notes) */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={`scrawl${i}`}
            style={{
              position: 'absolute',
              left: 20 + seededRand(i * 83) * 40,
              top: height * 0.7 + i * 14,
              width: 50 + seededRand(i * 47) * 60,
              height: 1,
              background: 'rgba(80,80,80,0.05)',
              transform: `rotate(${(seededRand(i * 29) - 0.5) * 4}deg)`,
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Aged paper vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: 'inset 0 0 50px rgba(80,60,20,0.15)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 199 + 43
    const totalChars = word.length

    if (phase === 'enter') {
      // Paper unfolds: text scales from compressed/hidden to full
      // Simulates crumpled paper opening up
      const unfoldProgress = Math.pow(enterProgress, 0.6)
      const scaleX = 0.3 + unfoldProgress * 0.7
      const scaleY = 0.1 + unfoldProgress * 0.9
      const rotateZ = (1 - unfoldProgress) * 8
      const opacity = Math.pow(enterProgress, 1.2)

      // Characters appear with handwritten wobble
      const chars = word.split('').map((ch, ci) => {
        const charDelay = (ci / (totalChars + 1)) * 0.3
        const charOpacity = Math.max(0, Math.min(1, (enterProgress - charDelay) / 0.7))
        const wobbleY = (seededRand(seed + ci * 37) - 0.5) * 4
        const wobbleR = (seededRand(seed + ci * 61) - 0.5) * 6

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              opacity: charOpacity,
              transform: `translateY(${wobbleY}px) rotate(${wobbleR}deg)`,
            }}
          >
            {ch}
          </span>
        )
      })

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scaleX(${scaleX}) scaleY(${scaleY}) rotate(${rotateZ}deg)`,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(36px, 9vw, 130px)',
            fontWeight: 400,
            fontStyle: 'italic',
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            opacity,
          }}
        >
          {chars}
        </div>
      )
    } else if (phase === 'hold') {
      // Fully unfolded handwritten text with slight tremor
      const tremor = Math.sin(f * 0.08) * 0.3

      const chars = word.split('').map((ch, ci) => {
        const wobbleY = (seededRand(seed + ci * 37) - 0.5) * 4
        const wobbleR = (seededRand(seed + ci * 61) - 0.5) * 6

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              transform: `translateY(${wobbleY}px) rotate(${wobbleR}deg)`,
            }}
          >
            {ch}
          </span>
        )
      })

      // Underline/circle on specific characters (cipher mark)
      const markedChar = seed % totalChars

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${tremor}px))`,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(36px, 9vw, 130px)',
            fontWeight: 400,
            fontStyle: 'italic',
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
          }}
        >
          {chars.map((charEl, ci) =>
            ci === markedChar ? (
              <span
                key={`marked-${ci}`}
                style={{
                  display: 'inline-block',
                  textDecoration: 'underline',
                  textDecorationColor: 'rgba(180,50,30,0.3)',
                  textDecorationStyle: 'wavy',
                  textUnderlineOffset: 4,
                }}
              >
                {charEl}
              </span>
            ) : (
              charEl
            ),
          )}
        </div>
      )
    } else {
      // Exit: paper crumples back up
      const crumpleProgress = Math.pow(exitProgress, 0.8)
      const scaleX = 1 - crumpleProgress * 0.6
      const scaleY = 1 - crumpleProgress * 0.85
      const rotateZ = crumpleProgress * -6
      const opacity = 1 - Math.pow(exitProgress, 1.5)

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scaleX(${scaleX}) scaleY(${scaleY}) rotate(${rotateZ}deg)`,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(36px, 9vw, 130px)',
            fontWeight: 400,
            fontStyle: 'italic',
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            opacity,
          }}
        >
          {word}
        </div>
      )
    }
  },
}

function DeadDropComponent(props: MotionGraphicProps<DeadDropConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-dead-drop',
  title: 'Kinetic Dead Drop',
  description:
    'Dead drop message: crumpled paper unfolds to reveal handwritten coded text, torn edges, coffee stain ring, newspaper cipher marks, pencil scrawl notes',
  tags: ['kinetic', 'typography', 'dead-drop', 'spy', 'handwritten', 'coded', 'paper', 'intelligence', 'secret'],
  category: 'captions',
  component: DeadDropComponent as any,
  defaultConfig: {
    words: ['NORTH', 'BENCH', 'SEVEN', 'DUSK'],
    colors: ['#3A3025', '#3A3025', '#3A3025', '#3A3025'],
    bgColor: '#DDD0B8',
    cycleDuration: 1.4,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['NORTH', 'BENCH', 'SEVEN', 'DUSK'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#3A3025', '#3A3025', '#3A3025', '#3A3025'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#DDD0B8', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.4,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
