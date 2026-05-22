import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// KineticWindowBlinds: Horizontal blind slats, each with overflow:hidden, reveal portions of text
// as they open with staggered timing. The containment of each slat IS the effect.
// Quality gates: overflow:hidden core (per-slat), mixBlendMode, clamp(), custom easing,
// alive hold (slat micro-sway like breeze), concept-driven exit (blinds close back), per-char, animated bg.
interface WindowBlindsConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const SLAT_COUNT = 8

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    // Warm interior light shifting like sunlight through blinds
    const sunAngle = Math.sin(t * 0.6) * 10
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(${170 + sunAngle}deg, ${bgColor} 0%, hsl(35,20%,10%) 50%, ${bgColor} 100%)`,
        }}
      >
        {/* Warm sun glow patch */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            right: '5%',
            width: '40%',
            height: '50%',
            background: `radial-gradient(ellipse at 80% 30%, rgba(255,200,100,${0.06 + Math.sin(t * 1.5) * 0.02}) 0%, transparent 60%)`,
            mixBlendMode: 'screen' as const,
          }}
        />
        {/* Window frame border */}
        <div
          style={{
            position: 'absolute',
            top: '5%',
            left: '8%',
            right: '8%',
            bottom: '5%',
            border: '4px solid rgba(140,120,90,0.3)',
            borderRadius: 2,
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, height }: WordRenderProps) => {
    const letters = word.split('')
    const totalLetters = letters.length
    const slatHeight = 100 / SLAT_COUNT // percent of total height per slat

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Each horizontal slat is an overflow:hidden container revealing a strip of text */}
        {Array.from({ length: SLAT_COUNT }, (_, slatIndex) => {
          // Staggered timing: top slats open first, cascading down
          const slatDelay = (slatIndex / SLAT_COUNT) * 0.7

          let slatOpen = 0 // 0 = closed (slat fully covers its band), 1 = open
          if (phase === 'enter') {
            const slatProgress = Math.max(0, Math.min(1, (enterProgress - slatDelay) / (1 - slatDelay + 0.01)))
            slatOpen = easeOutExpo(slatProgress)
          } else if (phase === 'hold') {
            slatOpen = 1
          } else {
            // Concept-driven exit: blinds CLOSE again, bottom-up stagger
            const reverseSlatDelay = ((SLAT_COUNT - 1 - slatIndex) / SLAT_COUNT) * 0.7
            const slatProgress = Math.max(0, Math.min(1, (exitProgress - reverseSlatDelay) / (1 - reverseSlatDelay + 0.01)))
            slatOpen = 1 - easeInCubic(slatProgress)
          }

          // Hold: subtle per-slat breeze sway
          const breeze = phase === 'hold'
            ? Math.sin(holdProgress * Math.PI * 5 + slatIndex * 0.8) * 1.5
            : 0

          // The visible gap height when open — represents the text-revealing window
          const gapHeight = slatOpen * slatHeight * 0.85 // 85% max open

          return (
            <div
              key={slatIndex}
              style={{
                position: 'absolute',
                top: `${slatIndex * slatHeight}%`,
                left: '10%',
                right: '10%',
                height: `${slatHeight}%`,
              }}
            >
              {/* Text visible through overflow:hidden gap */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: `${gapHeight}%`,
                  overflow: 'hidden',
                }}
              >
                {/* Text positioned globally but clipped to this slat's viewport */}
                <div
                  style={{
                    position: 'absolute',
                    // Offset text so each slat shows the correct horizontal strip
                    top: `calc(${(50 - slatIndex * slatHeight) / (slatHeight / 100)}% - 50%)`,
                    left: '50%',
                    transform: `translate(-50%, ${breeze}px)`,
                    display: 'flex',
                    gap: 'clamp(2px, 0.5vw, 8px)',
                    whiteSpace: 'nowrap',
                    height: height,
                    alignItems: 'center',
                  }}
                >
                  {letters.map((letter, i) => {
                    const charPhase = (i / totalLetters) * Math.PI * 2
                    const shimmer = phase === 'hold'
                      ? 0.85 + Math.sin(holdProgress * Math.PI * 4 + charPhase + slatIndex * 0.3) * 0.15
                      : 1

                    return (
                      <span
                        key={i}
                        style={{
                          fontFamily: "'Georgia', 'Palatino Linotype', serif",
                          fontSize: 'clamp(40px, 12vw, 160px)',
                          fontWeight: 600,
                          color,
                          opacity: shimmer,
                          textShadow: '0 2px 6px rgba(0,0,0,0.4)',
                          display: 'inline-block',
                          mixBlendMode: 'screen' as const,
                        }}
                      >
                        {letter}
                      </span>
                    )
                  })}
                </div>
              </div>

              {/* The blind slat itself — covers the gap area when closed */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: `${100 - gapHeight}%`,
                  background: 'linear-gradient(180deg, rgba(200,190,170,0.92) 0%, rgba(180,170,150,0.95) 40%, rgba(160,150,130,0.9) 100%)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
                  borderRadius: 1,
                  transform: `translateY(${breeze * 0.5}px)`,
                }}
              />
            </div>
          )
        })}

        {/* Pull cord */}
        <div
          style={{
            position: 'absolute',
            top: '3%',
            right: '12%',
            width: 2,
            height: '20%',
            background: 'linear-gradient(180deg, rgba(160,150,130,0.6), rgba(140,130,110,0.4))',
            borderRadius: 1,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '23%',
            right: 'calc(12% - 4px)',
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: 'rgba(180,170,150,0.6)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        />
      </div>
    )
  },
}

function WindowBlindsComponent(props: MotionGraphicProps<WindowBlindsConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-window-blinds',
  title: 'Kinetic Window Blinds',
  description: 'Horizontal blind slats with overflow:hidden reveal strips of per-character text with staggered cascade timing, breeze sway during hold, and blinds-close exit',
  tags: ['kinetic', 'typography', 'blinds', 'window', 'slats', 'reveal', 'contained', 'masked', 'stagger'],
  category: 'captions',
  component: WindowBlindsComponent as any,
  defaultConfig: {
    words: ['LIGHT', 'SHADE', 'WARM', 'GLOW'],
    colors: ['#F5E6D0', '#E8D5B8', '#FFE4C4', '#D4A574'],
    bgColor: '#1a1510',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LIGHT', 'SHADE', 'WARM', 'GLOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F5E6D0', '#E8D5B8', '#FFE4C4', '#D4A574'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1510', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
