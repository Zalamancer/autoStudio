import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SyrupPourConfig extends KineticBaseConfig {
  viscosity: number
}

function easeOutExpo(t: number): number { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t) }

// Viscous easing — starts fast, then slows dramatically like thick syrup
function easeViscous(t: number, viscosity: number): number {
  const k = 1 + viscosity * 0.05
  return 1 - Math.pow(1 - t, k)
}

function easeInCubic(t: number): number { return t * t * t }

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Syrup pool at bottom */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '18%',
          background: `linear-gradient(180deg, transparent 0%, rgba(180,100,20,${0.12 + Math.sin(time * 0.8) * 0.03}) 100%)`,
        }} />
        {/* Subtle warm glow from top — pour spout */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '40%',
          right: '40%',
          height: '30%',
          background: `radial-gradient(ellipse at 50% 0%, rgba(255,180,50,0.06) 0%, transparent 100%)`,
        }} />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, height }: WordRenderProps) => {
    const chars = word.split('')

    return (
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        alignItems: 'flex-end',
        whiteSpace: 'nowrap',
        gap: 0,
      }}>
        {chars.map((ch, ci) => {
          // Syrup pour: each letter drips down from above with viscous lag
          const viscosityDelay = ci * 0.07  // lagged pour per letter
          let translateY = 0
          let scaleY = 1
          let scaleX = 1
          let opacity = 1

          if (phase === 'enter') {
            const p = Math.max(0, Math.min(1, (enterProgress - viscosityDelay) / (1 - viscosityDelay * 0.6)))
            const poured = easeViscous(p, 8)

            // Falls from top, slows as it thickens
            translateY = -height * 0.55 * (1 - poured)
            // Syrup stretches vertically as it pours — elongated drop shape
            scaleY = 1 + (1 - poured) * 0.8
            scaleX = 1 - (1 - poured) * 0.35  // thin when stretched
            opacity = Math.min(1, p * 3)
          } else if (phase === 'hold') {
            // Syrup sags — very subtle downward pull of gravity
            const sag = Math.sin(holdProgress * Math.PI) * 3
            translateY = sag * (1 + ci * 0.3)
            scaleY = 1 + holdProgress * 0.03
          } else {
            // Drip away — runs down and off screen
            const ep = easeInCubic(exitProgress)
            translateY = ep * height * 0.6
            scaleY = 1 + ep * 0.4
            scaleX = 1 - ep * 0.2
            opacity = 1 - ep * ep
          }

          // Trailing drip element below each character
          const dripLength = phase === 'enter' ? (1 - easeViscous(Math.max(0, enterProgress - viscosityDelay), 8)) * 40 : 0

          return (
            <div key={ci} style={{ position: 'relative', display: 'inline-block' }}>
              {/* Drip trail */}
              {dripLength > 2 && (
                <div style={{
                  position: 'absolute',
                  bottom: -dripLength,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 4,
                  height: dripLength,
                  background: `linear-gradient(180deg, ${color} 0%, ${color}00 100%)`,
                  borderRadius: '0 0 4px 4px',
                }} />
              )}
              <span style={{
                display: 'inline-block',
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontSize: 'clamp(44px, 11vw, 150px)',
                fontWeight: 900,
                color,
                transform: `translateY(${translateY}px) scaleX(${scaleX}) scaleY(${scaleY})`,
                transformOrigin: 'center top',
                opacity,
                whiteSpace: 'pre',
                textShadow: `0 4px 12px rgba(0,0,0,0.4), 0 8px 24px ${color}33`,
                lineHeight: 1,
              }}>
                {ch}
              </span>
            </div>
          )
        })}
      </div>
    )
  },
}

function SyrupPourComponent(props: MotionGraphicProps<SyrupPourConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-syrup-pour',
  title: 'Kinetic Syrup Pour',
  description: 'Letters pour in from above with viscous syrup physics — each character drips down slowly, stretching into elongated drops before settling, with trailing drip threads',
  tags: ['kinetic', 'typography', 'syrup', 'pour', 'drip', 'liquid', 'viscous', 'fluid', 'gravity'],
  category: 'captions',
  component: SyrupPourComponent as any,
  defaultConfig: {
    words: ['SWEET', 'DRIP', 'POUR', 'FLOW'],
    colors: ['#D4A017', '#C77B3F', '#E8B84B', '#F5CBA7'],
    bgColor: '#1A0A00',
    cycleDuration: 1.6,
    viscosity: 8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SWEET', 'DRIP', 'POUR', 'FLOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#D4A017', '#C77B3F', '#E8B84B', '#F5CBA7'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A0A00', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
    { key: 'viscosity', label: 'Viscosity', type: 'number', defaultValue: 8, min: 1, max: 20, group: 'Animation' },
  ],
})
