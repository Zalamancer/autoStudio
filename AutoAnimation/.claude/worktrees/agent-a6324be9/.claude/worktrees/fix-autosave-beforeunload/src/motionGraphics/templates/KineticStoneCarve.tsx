import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface StoneCarveConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Stone surface features — veins, speckles, crystalline spots
    const veins: { x1: number; y1: number; x2: number; y2: number; opacity: number; width: number }[] = []
    for (let i = 0; i < 15; i++) {
      const sx = rand(i * 13 + 3) * width
      const sy = rand(i * 17 + 7) * height
      const angle = rand(i * 23) * Math.PI
      const len = 40 + rand(i * 29) * 100
      veins.push({
        x1: sx,
        y1: sy,
        x2: sx + Math.cos(angle) * len,
        y2: sy + Math.sin(angle) * len,
        opacity: 0.03 + rand(i * 31) * 0.05,
        width: 0.3 + rand(i * 37) * 1.5,
      })
    }

    // Dust particles floating near chisel work area
    const dustParticles: { x: number; y: number; size: number; opacity: number }[] = []
    for (let i = 0; i < 10; i++) {
      const seed = i * 43 + Math.floor(frame * 0.06) % 50
      const life = (rand(seed + 70) + t * 0.15) % 1
      dustParticles.push({
        x: width * 0.3 + rand(seed) * width * 0.4,
        y: height * 0.5 - life * 40 + rand(seed + 1) * 20,
        size: 1 + rand(seed + 2) * 2,
        opacity: (1 - life) * 0.06,
      })
    }

    return (
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(155deg, #A8A4A0 0%, ${bgColor} 30%, #9A9690 60%, ${bgColor} 100%)`,
      }}>
        {/* Stone crystalline texture */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            repeating-linear-gradient(120deg, transparent, transparent 2px, rgba(255,255,255,0.01) 2px, rgba(255,255,255,0.01) 3px),
            repeating-linear-gradient(60deg, transparent, transparent 4px, rgba(0,0,0,0.008) 4px, rgba(0,0,0,0.008) 5px)
          `,
        }} />
        {/* Polished stone sheen */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at 40% 35%, rgba(255,255,255,0.05) 0%, transparent 50%)`,
        }} />
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {/* Stone veins */}
          {veins.map((v, i) => (
            <line key={`vein${i}`} x1={v.x1} y1={v.y1} x2={v.x2} y2={v.y2}
              stroke={`rgba(80, 75, 70, ${v.opacity})`} strokeWidth={v.width} />
          ))}
          {/* Mineral speckles */}
          {Array.from({ length: 25 }, (_, i) => (
            <circle key={`spec${i}`}
              cx={rand(i * 67) * width} cy={rand(i * 71 + 3) * height}
              r={0.5 + rand(i * 73) * 1.5}
              fill={`rgba(${60 + rand(i * 79) * 40}, ${55 + rand(i * 83) * 35}, ${50 + rand(i * 89) * 30}, ${0.04 + rand(i * 97) * 0.04})`} />
          ))}
          {/* Dust particles */}
          {dustParticles.map((d, i) => (
            <circle key={`dust${i}`} cx={d.x} cy={d.y} r={d.size}
              fill={`rgba(180, 175, 165, ${d.opacity})`} />
          ))}
          {/* Stone block edge */}
          <rect x={4} y={4} width={width - 8} height={height - 8}
            fill="none" stroke="rgba(90, 85, 78, 0.1)" strokeWidth={2} />
          {/* Mason's mark */}
          <text x={width - 12} y={height - 8} textAnchor="end"
            fill="rgba(90, 85, 78, 0.07)" fontSize={6}
            fontFamily="'Georgia', serif">
            ROMAN INSCRIPTION • V-CUT • MMXXVI
          </text>
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const fontSize = Math.min(width / (word.length * 0.5), 110)
    const f = frame ?? 0
    const chars = word.split('')

    if (phase === 'enter') {
      // Chisel carves each letter — character by character with impact vibration
      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            whiteSpace: 'nowrap',
          }}>
            {chars.map((ch, ci) => {
              const charDelay = ci / chars.length * 0.65
              const charP = Math.max(0, Math.min(1, (enterProgress - charDelay) / 0.35))
              const eased = easeOutCubic(charP)

              // Chisel strike vibration
              const isStriking = charP > 0 && charP < 0.5
              const vibeX = isStriking ? (Math.sin(f * 2.5 + ci * 5) * 2 * (1 - charP * 2)) : 0
              const vibeY = isStriking ? (Math.cos(f * 3 + ci * 3) * 1.5 * (1 - charP * 2)) : 0

              return (
                <span key={ci} style={{ display: 'inline-block', position: 'relative' }}>
                  {/* V-cut shadow — carved groove */}
                  <span style={{
                    position: 'absolute', inset: 0,
                    fontFamily: "'Trajan Pro', 'Cinzel', 'Georgia', serif",
                    fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
                    fontWeight: 700,
                    color: 'transparent',
                    textShadow: eased > 0.3 ? `1px 2px 1px rgba(40, 38, 35, ${0.35 * eased})` : 'none',
                    WebkitTextStroke: eased > 0.3 ? `0.5px rgba(40, 38, 35, ${0.2 * eased})` : 'none',
                    textTransform: 'uppercase',
                    letterSpacing: 8,
                    display: 'inline-block',
                  }}>
                    {ch}
                  </span>
                  {/* Light catch on V-cut upper edge */}
                  <span style={{
                    position: 'absolute', inset: 0,
                    fontFamily: "'Trajan Pro', 'Cinzel', 'Georgia', serif",
                    fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
                    fontWeight: 700,
                    color: 'transparent',
                    WebkitTextStroke: eased > 0.5 ? `0.5px rgba(220, 215, 208, ${0.2 * eased})` : 'none',
                    textTransform: 'uppercase',
                    letterSpacing: 8,
                    display: 'inline-block',
                    transform: 'translate(-0.5px, -0.5px)',
                  }}>
                    {ch}
                  </span>
                  {/* Main carved text */}
                  <span style={{
                    fontFamily: "'Trajan Pro', 'Cinzel', 'Georgia', serif",
                    fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
                    fontWeight: 700,
                    color: eased > 0.2 ? color : 'transparent',
                    textTransform: 'uppercase',
                    letterSpacing: 8,
                    display: 'inline-block',
                    transform: `translate(${vibeX}px, ${vibeY}px)`,
                    opacity: Math.min(1, eased * 1.5),
                  }}>
                    {ch}
                  </span>
                  {/* Chisel spark at active character */}
                  {isStriking && (
                    <svg width={20} height={20} style={{
                      position: 'absolute', top: '30%', right: -8,
                      pointerEvents: 'none', overflow: 'visible',
                    }}>
                      {Array.from({ length: 3 }, (_, si) => {
                        const sa = rand(f + si * 11 + ci * 7) * Math.PI * 2
                        const sd = 3 + rand(f + si * 13 + ci * 9) * 6
                        return (
                          <circle key={si}
                            cx={10 + Math.cos(sa) * sd}
                            cy={10 + Math.sin(sa) * sd}
                            r={0.6}
                            fill={`rgba(200, 195, 180, ${0.3 * (1 - charP * 2)})`} />
                        )
                      })}
                    </svg>
                  )}
                </span>
              )
            })}
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // Fully carved Roman inscription — monumental and still
      const lightShift = Math.sin(holdProgress * Math.PI * 2) * 0.5

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* V-cut groove shadow */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: `translate(calc(-50% + ${0.5 + lightShift * 0.2}px), calc(-50% + ${1.5 + lightShift * 0.1}px))`,
            fontFamily: "'Trajan Pro', 'Cinzel', 'Georgia', serif",
            fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
            fontWeight: 700,
            color: 'transparent',
            WebkitTextStroke: '1px rgba(40, 38, 35, 0.3)',
            textTransform: 'uppercase',
            letterSpacing: 8,
            whiteSpace: 'nowrap',
            filter: 'blur(0.5px)',
          }}>
            {word}
          </div>
          {/* Upper edge highlight */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: `translate(calc(-50% - ${0.5 + lightShift * 0.15}px), calc(-50% - 0.5px))`,
            fontFamily: "'Trajan Pro', 'Cinzel', 'Georgia', serif",
            fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
            fontWeight: 700,
            color: 'transparent',
            WebkitTextStroke: '0.5px rgba(220, 215, 208, 0.2)',
            textTransform: 'uppercase',
            letterSpacing: 8,
            whiteSpace: 'nowrap',
          }}>
            {word}
          </div>
          {/* Main inscription */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Trajan Pro', 'Cinzel', 'Georgia', serif",
            fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
            fontWeight: 700,
            color,
            textTransform: 'uppercase',
            letterSpacing: 8,
            whiteSpace: 'nowrap',
          }}>
            {word}
          </div>
          {/* Decorative serifs/terminals line */}
          <svg width={width} height={height} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <line x1={width * 0.25} y1={height * 0.38}
              x2={width * 0.75} y2={height * 0.38}
              stroke="rgba(90, 85, 78, 0.08)" strokeWidth={0.5} />
            <line x1={width * 0.25} y1={height * 0.62}
              x2={width * 0.75} y2={height * 0.62}
              stroke="rgba(90, 85, 78, 0.08)" strokeWidth={0.5} />
          </svg>
        </div>
      )
    } else {
      // Exit: inscription weathers — stone erodes and text fades
      const erode = exitProgress
      const chars2 = word.split('')
      const letterWidth = fontSize * 0.55

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {chars2.map((ch, ci) => {
            const erosion = erode * (0.6 + rand(ci * 41 + index * 13) * 0.4)
            const baseX = (width - chars2.length * letterWidth) / 2 + ci * letterWidth

            return (
              <div key={ci} style={{
                position: 'absolute',
                left: baseX,
                top: '50%',
                transform: 'translateY(-50%)',
                fontFamily: "'Trajan Pro', 'Cinzel', 'Georgia', serif",
                fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
                fontWeight: 700,
                color,
                textTransform: 'uppercase',
                letterSpacing: 8,
                opacity: 1 - erosion,
                filter: `blur(${erosion * 2}px)`,
                textShadow: `${1 - erosion}px ${2 - erosion * 2}px 1px rgba(40, 38, 35, ${0.3 * (1 - erosion)})`,
              }}>
                {ch}
              </div>
            )
          })}
        </div>
      )
    }
  },
}

function StoneCarveComponent(props: MotionGraphicProps<StoneCarveConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-stone-carve',
  title: 'Stone Carve',
  description: 'Stone carving inscription with text chiseled into granite or marble, V-cut Roman letterforms, dust particles, and stonemason chisel marks',
  tags: ['kinetic', 'typography', 'stone', 'carve', 'chisel', 'marble', 'granite', 'roman', 'inscription', 'material'],
  category: 'captions',
  component: StoneCarveComponent as any,
  defaultConfig: {
    words: ['CARVE', 'STONE', 'ROMAN', 'RELIC'],
    colors: ['#5A5650', '#4E4A45', '#635E58', '#504C47'],
    bgColor: '#B0ACA6',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CARVE', 'STONE', 'ROMAN', 'RELIC'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#5A5650', '#4E4A45', '#635E58', '#504C47'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#B0ACA6', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
