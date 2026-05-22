import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CyanotypeConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // UV light sweep across the paper
    const uvSweepX = ((time * 30) % 140) - 20

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Paper texture — fibrous watercolor paper base */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(77deg, transparent, transparent 3px, rgba(255,255,255,0.02) 3px, rgba(255,255,255,0.02) 4px)',
            pointerEvents: 'none',
          }}
        />
        {/* UV light sweep beam */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${uvSweepX}%`,
            width: '15%',
            background: 'linear-gradient(90deg, transparent, rgba(180,160,255,0.08), rgba(200,180,255,0.12), rgba(180,160,255,0.08), transparent)',
            filter: 'blur(6px)',
            pointerEvents: 'none',
          }}
        />
        {/* Prussian blue chemical wash tone */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, rgba(0,40,80,0.1), transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        {/* Organic edge bleed — uneven paper edges */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: 'inset 5px 5px 30px rgba(0,20,60,0.15), inset -5px -5px 30px rgba(0,20,60,0.15)',
            pointerEvents: 'none',
          }}
        />
        {/* Water stain marks from rinse process */}
        <div
          style={{
            position: 'absolute',
            top: '15%',
            right: '10%',
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.03), transparent 70%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 61 + 23
    let opacity = 0
    let clipX = 0

    if (phase === 'enter') {
      // UV exposure sweep — letters reveal left to right as UV light passes
      clipX = enterProgress * 100
      opacity = enterProgress
    } else if (phase === 'hold') {
      clipX = 100
      opacity = 1
    } else {
      clipX = 100
      // Fade like paper washing away unexposed chemical
      opacity = 1 - exitProgress
    }

    // Organic edge bleed effect — slight wobble at the reveal boundary
    const bleedOffset = Math.sin(f * 0.1 + seed) * 2

    return (
      <>
        {/* White shadow / negative space where object blocked light */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(calc(-50% + 1px), calc(-50% + 1px))',
            fontFamily: "'Georgia', 'Palatino', serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 700,
            color: 'rgba(230,235,240,0.12)',
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            textTransform: 'uppercase',
            opacity: opacity * 0.5,
            clipPath: `inset(0 ${100 - clipX + bleedOffset}% 0 0)`,
          }}
        >
          {word}
        </div>
        {/* Main Prussian blue text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Palatino', serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            textTransform: 'uppercase',
            opacity,
            clipPath: `inset(0 ${100 - clipX}% 0 0)`,
            textShadow: '0 0 8px rgba(0,60,120,0.4), 0 0 20px rgba(0,40,100,0.2)',
          }}
        >
          {word}
        </div>
        {/* Organic bleed fringe at the reveal edge */}
        {phase === 'enter' && clipX < 95 && (
          <div
            style={{
              position: 'absolute',
              top: '30%',
              bottom: '30%',
              left: `${clipX / 2 + 25}%`,
              width: 6,
              background: 'linear-gradient(0deg, transparent, rgba(0,60,140,0.15), rgba(0,80,160,0.1), transparent)',
              filter: 'blur(3px)',
              pointerEvents: 'none',
            }}
          />
        )}
      </>
    )
  },
}

function CyanotypeComponent(props: MotionGraphicProps<CyanotypeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-cyanotype',
  title: 'Kinetic Cyanotype',
  description: 'Sun-print photogram: text exposed as deep Prussian blue on white with UV light sweep reveal and organic edge bleed',
  tags: ['kinetic', 'typography', 'cyanotype', 'blueprint', 'blue', 'photography', 'darkroom', 'sun-print'],
  category: 'captions',
  component: CyanotypeComponent as any,
  defaultConfig: {
    words: ['EXPOSE', 'RINSE', 'DRY', 'PRINT'],
    colors: ['#0a3d6b', '#0d4a7a', '#063058', '#104e85'],
    bgColor: '#e8edf2',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['EXPOSE', 'RINSE', 'DRY', 'PRINT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#0a3d6b', '#0d4a7a', '#063058', '#104e85'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#e8edf2', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
