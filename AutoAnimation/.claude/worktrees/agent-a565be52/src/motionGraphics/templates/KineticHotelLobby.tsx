import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface HotelLobbyConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Marble wall — warm cream with veining */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(175deg, #f0e8d8 0%, #e8dcc8 25%, #f2ead8 50%, #e5d9c5 75%, #ede3d0 100%)',
          }}
        />
        {/* Marble veins — diagonal streaks */}
        {Array.from({ length: 8 }, (_, i) => {
          const startX = rand(i * 31) * 100
          const startY = rand(i * 47) * 100
          const angle = 30 + rand(i * 17) * 30
          const veinWidth = 1 + rand(i * 53) * 2
          const veinLength = 20 + rand(i * 67) * 40
          const veinOpacity = 0.03 + rand(i * 83) * 0.04

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${startX}%`,
                top: `${startY}%`,
                width: veinLength + '%',
                height: veinWidth,
                background: `rgba(180,160,130,${veinOpacity})`,
                transform: `rotate(${angle}deg)`,
                transformOrigin: '0 50%',
                filter: 'blur(1px)',
                pointerEvents: 'none',
              }}
            />
          )
        })}
        {/* Marble panel seam — subtle vertical line */}
        <div
          style={{
            position: 'absolute',
            left: '33%',
            top: '5%',
            bottom: '5%',
            width: 1,
            background: 'rgba(160,140,110,0.15)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '66%',
            top: '5%',
            bottom: '5%',
            width: 1,
            background: 'rgba(160,140,110,0.15)',
            pointerEvents: 'none',
          }}
        />
        {/* Warm backlight glow behind where the letters will be mounted */}
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '15%',
            right: '15%',
            height: '40%',
            background: 'radial-gradient(ellipse at 50% 50%, rgba(255,220,160,0.08) 0%, rgba(255,200,120,0.03) 40%, transparent 70%)',
            filter: 'blur(15px)',
            pointerEvents: 'none',
          }}
        />
        {/* Ceiling light — warm downlight */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '30%',
            right: '30%',
            height: '25%',
            background: 'linear-gradient(180deg, rgba(255,230,180,0.06) 0%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Floor reflection — polished marble floor line */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '12%',
            background: 'linear-gradient(180deg, rgba(220,210,190,0.06) 0%, rgba(200,190,170,0.03) 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Subtle wainscot molding line */}
        <div
          style={{
            position: 'absolute',
            bottom: '12%',
            left: '5%',
            right: '5%',
            height: 2,
            background: 'linear-gradient(90deg, transparent, rgba(180,160,120,0.12), transparent)',
            pointerEvents: 'none',
          }}
        />
        {/* Top crown molding */}
        <div
          style={{
            position: 'absolute',
            top: '5%',
            left: '5%',
            right: '5%',
            height: 3,
            background: 'linear-gradient(90deg, transparent, rgba(180,160,120,0.1), transparent)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const chars = word.toUpperCase().split('')
    const totalChars = chars.length
    const f = frame ?? 0

    return (
      <div
        style={{
          position: 'absolute',
          top: '48%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          gap: 'clamp(4px, 1.2vw, 14px)',
          whiteSpace: 'nowrap',
        }}
      >
        {chars.map((ch, ci) => {
          const charDelay = ci / (totalChars + 1) * 0.5

          let charOpacity = 0
          let backlightIntensity = 0
          let mountShadow = 0
          let scaleAmount = 1

          if (phase === 'enter') {
            // Letters illuminate from behind — backlight fades on, then brass letter becomes visible
            const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay * 0.5)))
            const eased = easeOutCubic(p)

            if (p < 0.4) {
              // Backlight glows before letter is visible
              backlightIntensity = easeOutCubic(p / 0.4)
              charOpacity = 0
              mountShadow = 0
            } else {
              // Letter fades in with mounting depth
              backlightIntensity = 1
              charOpacity = easeOutCubic((p - 0.4) / 0.6)
              mountShadow = easeOutCubic((p - 0.4) / 0.6)
            }
          } else if (phase === 'hold') {
            charOpacity = 1
            backlightIntensity = 0.9 + Math.sin(f * 0.03 + ci * 0.5) * 0.1
            mountShadow = 1
          } else {
            const p = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.3) / (1 - charDelay * 0.2)))
            // Backlight dims first, then letter fades
            charOpacity = 1 - easeOutCubic(p * 0.8)
            backlightIntensity = 1 - easeOutCubic(p)
            mountShadow = 1 - p
          }

          if (ch === ' ') {
            return <div key={ci} style={{ width: 'clamp(10px, 2.5vw, 24px)' }} />
          }

          return (
            <div
              key={ci}
              style={{
                position: 'relative',
                display: 'inline-block',
              }}
            >
              {/* Backlight halo per character */}
              {backlightIntensity > 0.05 && (
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: 'clamp(40px, 10vw, 100px)',
                    height: 'clamp(40px, 10vw, 100px)',
                    transform: 'translate(-50%, -50%)',
                    background: `radial-gradient(ellipse at center, rgba(255,220,160,${backlightIntensity * 0.12}) 0%, rgba(255,200,120,${backlightIntensity * 0.04}) 50%, transparent 75%)`,
                    filter: 'blur(8px)',
                    pointerEvents: 'none',
                    zIndex: 0,
                  }}
                />
              )}
              {/* Brass mounted letter */}
              <span
                style={{
                  position: 'relative',
                  fontFamily: "'Playfair Display', 'Georgia', 'Didot', serif",
                  fontSize: 'clamp(36px, 10vw, 120px)',
                  fontWeight: 700,
                  color: 'transparent',
                  display: 'inline-block',
                  lineHeight: 1,
                  letterSpacing: 2,
                  opacity: charOpacity,
                  // Brass metallic gradient
                  background: `linear-gradient(160deg, #C9A94E 0%, #E8D48A 20%, #C49838 40%, #A07830 60%, #C9A94E 80%, #E8D48A 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  // Mounting depth shadow — letters are raised off the wall
                  filter: mountShadow > 0.1
                    ? `drop-shadow(2px 3px ${4 + mountShadow * 4}px rgba(60,40,20,${mountShadow * 0.4})) drop-shadow(0 1px 1px rgba(0,0,0,${mountShadow * 0.2}))`
                    : 'none',
                  zIndex: 1,
                }}
              >
                {ch}
              </span>
              {/* Specular highlight on brass — top edge catch */}
              {charOpacity > 0.5 && (
                <span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    fontFamily: "'Playfair Display', 'Georgia', 'Didot', serif",
                    fontSize: 'clamp(36px, 10vw, 120px)',
                    fontWeight: 700,
                    color: 'transparent',
                    WebkitTextStroke: `1px rgba(255,240,200,${charOpacity * 0.1})`,
                    display: 'inline-block',
                    lineHeight: 1,
                    letterSpacing: 2,
                    pointerEvents: 'none',
                    zIndex: 2,
                  }}
                >
                  {ch}
                </span>
              )}
            </div>
          )
        })}
      </div>
    )
  },
}

function HotelLobbyComponent(props: MotionGraphicProps<HotelLobbyConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-hotel-lobby',
  title: 'Hotel Lobby Signage',
  description:
    'Backlit brass letters mounted on a marble wall with warm ambient lighting. Features marble veining, mounting shadows, brass metallic gradients, and subtle backlight halos for luxury hospitality feel.',
  tags: ['kinetic', 'typography', 'hotel', 'lobby', 'brass', 'marble', 'luxury', 'signage', 'hospitality', 'backlit'],
  category: 'captions',
  component: HotelLobbyComponent as any,
  defaultConfig: {
    words: ['MAJESTIC', 'WELCOME', 'CONCIERGE', 'SUITE'],
    colors: ['#C9A94E', '#E8D48A', '#C49838', '#D4B060'],
    bgColor: '#f0e8d8',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['MAJESTIC', 'WELCOME', 'CONCIERGE', 'SUITE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C9A94E', '#E8D48A', '#C49838', '#D4B060'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f0e8d8', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
