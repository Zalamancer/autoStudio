import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SunDialConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    // Sun position moves across the sky
    const sunAngle = (time * 0.3) % (Math.PI * 2)
    const sunX = 50 + Math.cos(sunAngle) * 35
    const sunY = 15 + Math.sin(sunAngle) * 10

    // Sky color transitions: warm morning to noon to evening
    const warmth = Math.sin(sunAngle)
    const skyTop = warmth > 0.5
      ? `rgba(135,180,220,0.08)`
      : `rgba(255,140,60,0.06)`

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Sky gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, ${skyTop} 0%, transparent 60%)`,
          }}
        />
        {/* Sun */}
        <div
          style={{
            position: 'absolute',
            left: `${sunX}%`,
            top: `${sunY}%`,
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,220,100,0.6) 0%, rgba(255,180,50,0.2) 50%, transparent 70%)',
            boxShadow: '0 0 40px rgba(255,200,80,0.15), 0 0 80px rgba(255,180,50,0.08)',
            transform: 'translate(-50%, -50%)',
          }}
        />
        {/* Ground plane */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '20%',
            background: 'linear-gradient(0deg, rgba(180,160,120,0.08) 0%, transparent 100%)',
          }}
        />
        {/* Hour markers around the dial */}
        {Array.from({ length: 12 }, (_, i) => {
          const markerAngle = (i / 12) * Math.PI * 2 - Math.PI / 2
          const radius = 42
          const mx = 50 + Math.cos(markerAngle) * radius
          const my = 50 + Math.sin(markerAngle) * radius
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${mx}%`,
                top: `${my}%`,
                width: i % 3 === 0 ? 8 : 4,
                height: i % 3 === 0 ? 3 : 2,
                background: `rgba(200,180,140,${i % 3 === 0 ? 0.25 : 0.12})`,
                borderRadius: 1,
                transform: `translate(-50%, -50%) rotate(${(i / 12) * 360}deg)`,
              }}
            />
          )
        })}
        {/* Center gnomon dot */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'rgba(200,180,140,0.3)',
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 10px rgba(200,180,140,0.15)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 30

    // Shadow angle rotates like a sundial
    const sunAngle = (time * 0.3) % (Math.PI * 2)
    const shadowAngle = sunAngle + Math.PI // opposite of sun
    const shadowLength = 0.5 + Math.abs(Math.cos(sunAngle)) * 1.5

    let opacity = 0
    let textScale = 1

    if (phase === 'enter') {
      opacity = Math.pow(enterProgress, 0.5)
      textScale = 0.8 + enterProgress * 0.2
    } else if (phase === 'hold') {
      opacity = 1
      textScale = 1
    } else {
      opacity = 1 - Math.pow(exitProgress, 0.5)
      textScale = 1 - exitProgress * 0.2
    }

    const shadowX = Math.cos(shadowAngle) * 25 * shadowLength
    const shadowY = Math.sin(shadowAngle) * 15 * shadowLength
    const shadowBlur = 4 + shadowLength * 6
    const shadowScale = 1 + shadowLength * 0.15

    return (
      <>
        {/* Long shadow cast by the text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${shadowX}px), calc(-50% + ${shadowY}px)) scale(${textScale * shadowScale}) skewX(${Math.cos(shadowAngle) * 8}deg)`,
            fontFamily: "'Georgia', 'Garamond', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 6,
            color: 'rgba(0,0,0,0.35)',
            filter: `blur(${shadowBlur}px)`,
            opacity: opacity * 0.7,
            whiteSpace: 'nowrap',
            transformOrigin: 'center center',
          }}
        >
          {word}
        </div>
        {/* Secondary mid-shadow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${shadowX * 0.4}px), calc(-50% + ${shadowY * 0.4}px)) scale(${textScale * (1 + shadowLength * 0.05)})`,
            fontFamily: "'Georgia', 'Garamond', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 6,
            color: 'rgba(0,0,0,0.2)',
            filter: `blur(${shadowBlur * 0.4}px)`,
            opacity: opacity * 0.5,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
        {/* Main text (the gnomon) */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${textScale})`,
            fontFamily: "'Georgia', 'Garamond', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 6,
            color,
            textShadow: `0 1px 3px rgba(0,0,0,0.3), 0 0 15px rgba(255,220,120,${0.1 * opacity})`,
            opacity,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function SunDialComponent(props: MotionGraphicProps<SunDialConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-sun-dial',
  title: 'Kinetic Sun Dial',
  description: 'Text shadow rotates like a sundial as the sun moves, shadow length changes to indicate time passing, with hour markers',
  tags: ['kinetic', 'typography', 'sundial', 'shadow', 'time', 'sun', 'light', 'ancient', 'elegant'],
  category: 'captions',
  component: SunDialComponent as any,
  defaultConfig: {
    words: ['TIME', 'DAWN', 'NOON', 'DUSK'],
    colors: ['#D4A574', '#C8956A', '#D4A574', '#B8845A'],
    bgColor: '#1a1610',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TIME', 'DAWN', 'NOON', 'DUSK'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#D4A574', '#C8956A', '#D4A574', '#B8845A'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1610', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
