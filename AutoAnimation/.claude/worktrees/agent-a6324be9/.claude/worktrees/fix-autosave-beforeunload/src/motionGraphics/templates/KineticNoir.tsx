import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NoirConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    // Venetian blinds shadow rotation
    const blindAngle = Math.sin(time * 0.3) * 5

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(160deg, #0D0D0D 0%, ${bgColor} 40%, #1A1A1A 100%)`,
        }}
      >
        {/* Venetian blind shadows — diagonal light slats */}
        {Array.from({ length: 10 }, (_, i) => {
          const y = -10 + i * 12
          const slantOpacity = 0.06 + Math.sin(time * 0.5 + i * 0.3) * 0.02
          return (
            <div
              key={`blind-${i}`}
              style={{
                position: 'absolute',
                left: '-10%',
                right: '-10%',
                top: `${y}%`,
                height: '5%',
                background: `linear-gradient(180deg, rgba(200,180,140,${slantOpacity}) 0%, transparent 40%, transparent 60%, rgba(200,180,140,${slantOpacity * 0.5}) 100%)`,
                transform: `rotate(${blindAngle - 15}deg)`,
                pointerEvents: 'none',
              }}
            />
          )
        })}
        {/* Spotlight cone from upper corner */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: '80%',
            height: '120%',
            background: 'radial-gradient(ellipse at 80% 10%, rgba(200,180,140,0.06) 0%, transparent 50%)',
            pointerEvents: 'none',
          }}
        />
        {/* Smoke/fog drift */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at ${50 + Math.sin(time * 0.4) * 20}% ${60 + Math.sin(time * 0.3) * 15}%, rgba(100,90,70,0.08) 0%, transparent 50%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Deep vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Film grain noise */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.01) 2px, rgba(255,255,255,0.01) 3px)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 43 + 7
    let opacity = 0
    let translateX = 0
    let skewY = 0

    if (phase === 'enter') {
      // Dramatic slide from shadow with hard edge
      const eased = 1 - Math.pow(1 - enterProgress, 4)
      opacity = enterProgress < 0.15 ? 0 : eased
      translateX = (1 - eased) * (seed % 2 === 0 ? -80 : 80)
      skewY = (1 - eased) * (seed % 2 === 0 ? -3 : 3)
    } else if (phase === 'hold') {
      opacity = 1
      // Very subtle sway, like cigarette smoke movement
      translateX = Math.sin(f * 0.04 + seed) * 2
    } else {
      const eased = exitProgress * exitProgress
      opacity = 1 - eased
      translateX = eased * (seed % 2 === 0 ? 60 : -60)
    }

    // Hard shadow offset
    const shadowX = 6
    const shadowY = 6

    return (
      <>
        {/* Hard drop shadow — noir style */}
        <div
          style={{
            position: 'absolute',
            top: '46%',
            left: '50%',
            transform: `translate(calc(-50% + ${translateX + shadowX}px), calc(-50% + ${shadowY}px)) skewY(${skewY}deg)`,
            opacity: opacity * 0.4,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(42px, 12vw, 155px)',
            fontWeight: 900,
            fontStyle: 'italic',
            color: '#000000',
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            textTransform: 'uppercase',
          }}
        >
          {word}
        </div>
        {/* Main text */}
        <div
          style={{
            position: 'absolute',
            top: '46%',
            left: '50%',
            transform: `translate(calc(-50% + ${translateX}px), -50%) skewY(${skewY}deg)`,
            opacity,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(42px, 12vw, 155px)',
            fontWeight: 900,
            fontStyle: 'italic',
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            textTransform: 'uppercase',
            textShadow: '0 0 20px rgba(200,180,140,0.15)',
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function NoirComponent(props: MotionGraphicProps<NoirConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-noir',
  title: 'Kinetic Noir',
  description: 'Film noir style with venetian blind shadows, hard text shadows, dramatic spotlight, smoke drift, and deep vignette',
  tags: ['kinetic', 'typography', 'noir', 'film-noir', 'vintage', 'dramatic', 'shadow', 'detective', 'cinema'],
  category: 'captions',
  component: NoirComponent as any,
  defaultConfig: {
    words: ['SHADOW', 'MYSTERY', 'DANGER', 'NIGHT'],
    colors: ['#E8DCC8', '#D4C8B0', '#C9BDA5', '#E8DCC8'],
    bgColor: '#0A0A0A',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SHADOW', 'MYSTERY', 'DANGER', 'NIGHT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E8DCC8', '#D4C8B0', '#C9BDA5', '#E8DCC8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A0A', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
