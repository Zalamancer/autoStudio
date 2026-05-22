import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ScribbleConfig extends KineticBaseConfig {}

/** Generate a rough squiggly underline path */
function squigglyPath(x1: number, x2: number, y: number, seed: number): string {
  const segments = 20
  const step = (x2 - x1) / segments
  let d = `M ${x1} ${y}`
  for (let i = 1; i <= segments; i++) {
    const x = x1 + step * i
    const yOff = Math.sin(seed * 3 + i * 1.5) * 4 + Math.cos(seed * 7 + i * 2.3) * 3
    d += ` L ${x} ${y + yOff}`
  }
  return d
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    >
      {/* Notebook-style dots */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width }: WordRenderProps) => {
    const seed = index * 59 + 31
    const doodleColor = color
    const underlineW = Math.min(width * 0.5, 400)
    const underlinePath = squigglyPath(0, underlineW, 10, seed)
    const underlineLen = underlineW + 60

    // Doodle elements: star, arrow, exclamation
    const doodleElements = [
      // Star
      <svg key="star" width="30" height="30" viewBox="0 0 30 30" style={{ position: 'absolute', top: '-30%', right: '-8%' }}>
        <path
          d="M15 2 L18 11 L27 11 L20 17 L22 26 L15 21 L8 26 L10 17 L3 11 L12 11 Z"
          fill="none"
          stroke={doodleColor}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.6}
        />
      </svg>,
      // Arrow pointing to text
      <svg key="arrow" width="50" height="30" viewBox="0 0 50 30" style={{ position: 'absolute', bottom: '-40%', left: '-12%' }}>
        <path
          d="M 5 25 C 15 5, 30 5, 45 10 M 40 5 L 45 10 L 38 12"
          fill="none"
          stroke={doodleColor}
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.5}
        />
      </svg>,
      // Exclamation marks
      <div
        key="excl"
        style={{
          position: 'absolute',
          top: '-20%',
          left: '-10%',
          fontFamily: "'Comic Sans MS', cursive",
          fontSize: 'clamp(20px, 4vw, 40px)',
          color: doodleColor,
          opacity: 0.5,
          transform: 'rotate(-15deg)',
        }}
      >
        !!
      </div>,
    ]

    if (phase === 'enter') {
      // Word appears, then doodles animate in one by one
      const wordAppear = Math.min(1, enterProgress * 2)
      const doodleStart = 0.4
      const doodleProgress = enterProgress > doodleStart ? (enterProgress - doodleStart) / (1 - doodleStart) : 0
      const underlineDrawn = Math.min(1, doodleProgress * 2)
      const elementsVisible = Math.floor(doodleProgress * (doodleElements.length + 1))

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Word */}
          <div
            style={{
              position: 'relative',
              fontFamily: "'Segoe Print', 'Comic Sans MS', cursive",
              fontSize: 'clamp(40px, 10vw, 120px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              opacity: wordAppear,
              transform: `scale(${0.9 + wordAppear * 0.1})`,
            }}
          >
            {word}
            {/* Squiggly underline */}
            <svg
              width={underlineW}
              height={20}
              viewBox={`0 0 ${underlineW} 20`}
              style={{ position: 'absolute', bottom: '-10%', left: '50%', transform: 'translateX(-50%)' }}
            >
              <path
                d={underlinePath}
                fill="none"
                stroke={doodleColor}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeDasharray={underlineLen}
                strokeDashoffset={underlineLen * (1 - underlineDrawn)}
                opacity={0.6}
              />
            </svg>
            {/* Doodle elements */}
            {doodleElements.map((el, di) => (
              <div
                key={di}
                style={{
                  opacity: di < elementsVisible ? Math.min(1, (doodleProgress - di / doodleElements.length) * 3) : 0,
                  transform: di < elementsVisible ? 'scale(1)' : 'scale(0.5)',
                  transition: 'none',
                }}
              >
                {el}
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (phase === 'hold') {
      // Doodles wiggle
      const wiggle = Math.sin(holdProgress * Math.PI * 4 + seed) * 2
      const starWiggle = Math.sin(holdProgress * Math.PI * 6 + seed * 2) * 3

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${wiggle * 0.3}px))`,
          }}
        >
          <div
            style={{
              position: 'relative',
              fontFamily: "'Segoe Print', 'Comic Sans MS', cursive",
              fontSize: 'clamp(40px, 10vw, 120px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
            }}
          >
            {word}
            <svg
              width={underlineW}
              height={20}
              viewBox={`0 0 ${underlineW} 20`}
              style={{
                position: 'absolute',
                bottom: '-10%',
                left: '50%',
                transform: `translateX(-50%) translateY(${wiggle * 0.5}px)`,
              }}
            >
              <path
                d={underlinePath}
                fill="none"
                stroke={doodleColor}
                strokeWidth={2.5}
                strokeLinecap="round"
                opacity={0.6}
              />
            </svg>
            {doodleElements.map((el, di) => (
              <div
                key={di}
                style={{
                  transform: `translate(${Math.sin(holdProgress * Math.PI * 5 + di * 2) * 2}px, ${Math.cos(holdProgress * Math.PI * 4 + di * 3) * starWiggle * 0.5}px)`,
                }}
              >
                {el}
              </div>
            ))}
          </div>
        </div>
      )
    }

    // Exit: doodles scatter, word fades
    const opacity = 1 - exitProgress

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
        }}
      >
        <div
          style={{
            position: 'relative',
            fontFamily: "'Segoe Print', 'Comic Sans MS', cursive",
            fontSize: 'clamp(40px, 10vw, 120px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            transform: `scale(${1 - exitProgress * 0.1})`,
          }}
        >
          {word}
          <svg
            width={underlineW}
            height={20}
            viewBox={`0 0 ${underlineW} 20`}
            style={{
              position: 'absolute',
              bottom: '-10%',
              left: '50%',
              transform: 'translateX(-50%)',
              opacity: 1 - exitProgress,
            }}
          >
            <path
              d={underlinePath}
              fill="none"
              stroke={doodleColor}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeDasharray={underlineLen}
              strokeDashoffset={-underlineLen * exitProgress}
              opacity={0.6}
            />
          </svg>
          {doodleElements.map((el, di) => (
            <div
              key={di}
              style={{
                transform: `translate(${exitProgress * (di % 2 === 0 ? 40 : -40)}px, ${exitProgress * -30}px)`,
                opacity: 1 - exitProgress * 1.5,
              }}
            >
              {el}
            </div>
          ))}
        </div>
      </div>
    )
  },
}

function ScribbleComponent(props: MotionGraphicProps<ScribbleConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-scribble',
  title: 'Kinetic Scribble',
  description: 'Scribble doodle aesthetic with hand-drawn underlines, arrows, and stars that wiggle around text',
  tags: ['kinetic', 'typography', 'scribble', 'doodle', 'handdrawn', 'fun', 'organic', 'informal'],
  category: 'captions',
  component: ScribbleComponent as any,
  defaultConfig: {
    words: ['WOW', 'COOL', 'NICE', 'YAY'],
    colors: ['#E74C3C', '#3498DB', '#F39C12', '#2ECC71'],
    bgColor: '#FFFEF5',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['WOW', 'COOL', 'NICE', 'YAY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E74C3C', '#3498DB', '#F39C12', '#2ECC71'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFEF5', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.3, max: 5, group: 'Timing' },
  ],
})
