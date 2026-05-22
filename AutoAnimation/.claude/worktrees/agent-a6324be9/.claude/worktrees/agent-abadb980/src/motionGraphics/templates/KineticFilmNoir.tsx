import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FilmNoirConfig extends KineticBaseConfig {
  blindSpeed: number
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    // Venetian blind shadows sweeping diagonally across the frame
    const blindOffset = (time * 60) % 200 - 50
    const blindAngle = -25
    const blindSpacing = 40
    const blindWidth = 18

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Smoky atmosphere gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 80% 70% at 30% 40%, rgba(60,55,50,0.3) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        {/* Venetian blind shadow bars */}
        {Array.from({ length: 14 }, (_, i) => {
          const y = blindOffset + i * blindSpacing
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: '-20%',
                right: '-20%',
                top: y,
                height: blindWidth,
                background: 'rgba(0,0,0,0.35)',
                transform: `rotate(${blindAngle}deg)`,
                transformOrigin: 'center',
                filter: 'blur(2px)',
                pointerEvents: 'none',
              }}
            />
          )
        })}
        {/* Hard light cone from upper right — like a desk lamp */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'conic-gradient(from 200deg at 85% 10%, rgba(255,250,230,0.08) 0deg, transparent 35deg, transparent 360deg)',
            pointerEvents: 'none',
          }}
        />
        {/* Film grain noise overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(255,255,255,0.01) 2px,
              rgba(255,255,255,0.01) 3px
            )`,
            pointerEvents: 'none',
          }}
        />
        {/* High contrast vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    let opacity = 0
    let translateX = 0
    let skewX = 0

    if (phase === 'enter') {
      // Emerge from shadow — slide in from left with slight skew
      const eased = 1 - Math.pow(1 - enterProgress, 3)
      opacity = eased
      translateX = (1 - eased) * -60
      skewX = (1 - eased) * -4
    } else if (phase === 'hold') {
      opacity = 1
      // Subtle sway like cigarette smoke
      translateX = Math.sin(f * 0.04 + index * 2) * 2
    } else {
      // Fade into darkness to the right
      const eased = Math.pow(exitProgress, 2)
      opacity = 1 - eased
      translateX = eased * 40
      skewX = eased * 3
    }

    return (
      <>
        {/* Shadow duplicate underneath for depth */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${translateX + 3}px), calc(-50% + 3px)) skewX(${skewX}deg)`,
            opacity: opacity * 0.25,
            fontFamily: "'Georgia', 'Bodoni Moda', serif",
            fontSize: 'clamp(40px, 11vw, 150px)',
            fontWeight: 700,
            fontStyle: 'italic',
            textTransform: 'uppercase',
            letterSpacing: 6,
            color: '#000000',
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
        {/* Main text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${translateX}px), -50%) skewX(${skewX}deg)`,
            opacity,
            fontFamily: "'Georgia', 'Bodoni Moda', serif",
            fontSize: 'clamp(40px, 11vw, 150px)',
            fontWeight: 700,
            fontStyle: 'italic',
            textTransform: 'uppercase',
            letterSpacing: 6,
            color,
            textShadow: '0 0 20px rgba(255,250,240,0.15)',
            whiteSpace: 'nowrap',
            filter: 'contrast(1.3) brightness(1.1)',
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function FilmNoirComponent(props: MotionGraphicProps<FilmNoirConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-film-noir',
  title: 'Kinetic Film Noir',
  description: '1940s noir title with venetian blind shadows sweeping across, high contrast B&W, hard light cone, and smoky atmosphere',
  tags: ['kinetic', 'typography', 'noir', 'film', '1940s', 'detective', 'shadow', 'cinema', 'vintage'],
  category: 'captions',
  component: FilmNoirComponent as any,
  defaultConfig: {
    words: ['DANGER', 'DAME', 'ALIBI', 'NOIR'],
    colors: ['#E8E4DC', '#D8D4CC', '#F0ECE4', '#C8C4BC'],
    bgColor: '#0c0c0c',
    cycleDuration: 1.3,
    blindSpeed: 60,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DANGER', 'DAME', 'ALIBI', 'NOIR'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E8E4DC', '#D8D4CC', '#F0ECE4', '#C8C4BC'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c0c0c', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
    { key: 'blindSpeed', label: 'Blind Speed', type: 'number', defaultValue: 60, min: 20, max: 120, group: 'Animation' },
  ],
})
