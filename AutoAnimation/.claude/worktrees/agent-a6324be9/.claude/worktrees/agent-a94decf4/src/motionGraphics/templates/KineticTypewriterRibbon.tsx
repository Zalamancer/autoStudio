import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// KineticTypewriterRibbon: Text feeds through a ribbon-shaped overflow:hidden container
// from right to left, like an ink ribbon passing through a typewriter's strike zone.
// Quality gates: overflow:hidden core, mixBlendMode, clamp(), custom easing,
// alive hold (ribbon tension wobble), concept-driven exit (ribbon rewinds back right),
// per-char, animated bg.
interface TypewriterRibbonConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 50% 40%, hsl(30,15%,14%) 0%, ${bgColor} 100%)`,
        }}
      >
        {/* Typewriter body texture — subtle horizontal lines */}
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: `${15 + i * 14}%`,
              left: '5%',
              right: '5%',
              height: 1,
              background: 'rgba(100,90,70,0.08)',
            }}
          />
        ))}
        {/* Ribbon spool left */}
        <div
          style={{
            position: 'absolute',
            top: '42%',
            left: '6%',
            width: 'clamp(20px, 5vw, 50px)',
            height: 'clamp(20px, 5vw, 50px)',
            borderRadius: '50%',
            border: '2px solid rgba(80,70,55,0.4)',
            background: 'rgba(30,28,22,0.6)',
            transform: `rotate(${t * 60}deg)`,
          }}
        >
          <div style={{ position: 'absolute', top: '50%', left: '50%', width: 4, height: 4, borderRadius: '50%', background: 'rgba(120,110,90,0.5)', transform: 'translate(-50%, -50%)' }} />
        </div>
        {/* Ribbon spool right */}
        <div
          style={{
            position: 'absolute',
            top: '42%',
            right: '6%',
            width: 'clamp(20px, 5vw, 50px)',
            height: 'clamp(20px, 5vw, 50px)',
            borderRadius: '50%',
            border: '2px solid rgba(80,70,55,0.4)',
            background: 'rgba(30,28,22,0.6)',
            transform: `rotate(${-t * 60}deg)`,
          }}
        >
          <div style={{ position: 'absolute', top: '50%', left: '50%', width: 4, height: 4, borderRadius: '50%', background: 'rgba(120,110,90,0.5)', transform: 'translate(-50%, -50%)' }} />
        </div>
        {/* Ribbon path lines connecting spools to the strike zone */}
        <div
          style={{
            position: 'absolute',
            top: 'calc(42% + clamp(10px, 2.5vw, 25px))',
            left: 'calc(6% + clamp(20px, 5vw, 50px))',
            right: 'calc(6% + clamp(20px, 5vw, 50px))',
            height: 2,
            background: 'linear-gradient(90deg, rgba(40,35,25,0.5), rgba(60,50,35,0.7), rgba(40,35,25,0.5))',
          }}
        />
        {/* Subtle animated glow in the strike zone */}
        <div
          style={{
            position: 'absolute',
            top: '35%',
            left: '25%',
            right: '25%',
            height: '30%',
            background: `radial-gradient(ellipse at 50% 50%, rgba(255,200,120,${0.03 + Math.sin(t * 2.5) * 0.02}) 0%, transparent 70%)`,
            mixBlendMode: 'screen' as const,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const letters = word.split('')
    const totalLetters = letters.length

    // The ribbon viewport: a horizontal band with overflow:hidden
    // Text slides in from the right and out to the left
    let xPercent = 0

    if (phase === 'enter') {
      // Feed in from right: starts at 110%, settles at 0 with overshoot
      const eased = easeOutBack(enterProgress)
      xPercent = (1 - eased) * 110
    } else if (phase === 'hold') {
      // Ribbon tension wobble — subtle horizontal oscillation
      xPercent = Math.sin(holdProgress * Math.PI * 5) * 2
    } else {
      // Concept-driven exit: ribbon REWINDS — text slides back to the right
      const eased = easeInExpo(exitProgress)
      xPercent = eased * 120
    }

    return (
      <div
        style={{
          // THE RIBBON VIEWPORT: overflow:hidden horizontal band
          position: 'absolute',
          top: '35%',
          left: '14%',
          right: '14%',
          height: '30%',
          overflow: 'hidden',
          borderRadius: 3,
          // Ribbon material: dark, slightly warm
          background: 'linear-gradient(180deg, rgba(25,22,18,0.3) 0%, rgba(15,13,10,0.4) 50%, rgba(25,22,18,0.3) 100%)',
          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.3), inset 0 -2px 6px rgba(0,0,0,0.3)',
        }}
      >
        {/* Top edge of ribbon */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'rgba(80,70,50,0.3)' }} />
        {/* Bottom edge of ribbon */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'rgba(80,70,50,0.3)' }} />

        {/* Per-character text sliding horizontally within the ribbon */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${xPercent}%), -50%)`,
            display: 'flex',
            gap: 'clamp(2px, 0.6vw, 10px)',
            whiteSpace: 'nowrap',
          }}
        >
          {letters.map((letter, i) => {
            const charPhase = (i / totalLetters) * Math.PI * 2
            // Hold: per-character ink-strike vibration
            const strikeY = phase === 'hold'
              ? Math.sin(holdProgress * Math.PI * 8 + charPhase) * 1.5
              : 0
            // Staggered opacity on enter for typewriter strike feel
            let charOpacity = 1
            if (phase === 'enter') {
              const charDelay = (i / totalLetters) * 0.5
              charOpacity = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay + 0.01) * 2))
            }
            const inkWeight = phase === 'hold'
              ? 700 + Math.round(Math.sin(holdProgress * Math.PI * 3 + charPhase) * 100)
              : 700

            return (
              <span
                key={i}
                style={{
                  fontFamily: "'Courier New', 'American Typewriter', monospace",
                  fontSize: 'clamp(40px, 12vw, 160px)',
                  fontWeight: inkWeight,
                  color,
                  opacity: charOpacity,
                  textShadow: '0 1px 3px rgba(0,0,0,0.6), 0 0 8px rgba(200,180,140,0.15)',
                  transform: `translateY(${strikeY}px)`,
                  display: 'inline-block',
                  mixBlendMode: 'screen' as const,
                }}
              >
                {letter}
              </span>
            )
          })}
        </div>

        {/* Ink transfer overlay — darkens edges for ribbon feel */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, rgba(0,0,0,0.2) 0%, transparent 15%, transparent 85%, rgba(0,0,0,0.2) 100%)',
            mixBlendMode: 'multiply' as const,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },
}

function TypewriterRibbonComponent(props: MotionGraphicProps<TypewriterRibbonConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-typewriter-ribbon',
  title: 'Kinetic Typewriter Ribbon',
  description: 'Per-character text feeds through a horizontal overflow:hidden ribbon viewport between spinning spools, with ink-strike hold wobble and rewind exit',
  tags: ['kinetic', 'typography', 'typewriter', 'ribbon', 'vintage', 'contained', 'masked', 'mechanical'],
  category: 'captions',
  component: TypewriterRibbonComponent as any,
  defaultConfig: {
    words: ['CLICK', 'CLACK', 'TYPE', 'DING'],
    colors: ['#D4C4A8', '#E8D5B8', '#C0B090', '#F0E0C0'],
    bgColor: '#12100c',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CLICK', 'CLACK', 'TYPE', 'DING'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#D4C4A8', '#E8D5B8', '#C0B090', '#F0E0C0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#12100c', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
