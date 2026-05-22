import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ChakraGlowConfig extends KineticBaseConfig {}

const CHAKRA_COLORS = ['#FF0000', '#FF7700', '#FFD700', '#00CC00', '#0088FF', '#4400CC', '#8800CC']
const CHAKRA_NAMES = ['Root', 'Sacral', 'Solar', 'Heart', 'Throat', 'Third Eye', 'Crown']

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeOutQuint(t: number): number { return 1 - Math.pow(1 - t, 5) }

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const chakraIndex = Math.floor((time * 0.5) % 7)
    const chakraBlend = (time * 0.5) % 1
    const currentColor = CHAKRA_COLORS[chakraIndex]
    const nextColor = CHAKRA_COLORS[(chakraIndex + 1) % 7]

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Central aura glow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: Math.min(width, height) * 0.8,
            height: Math.min(width, height) * 0.8,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${currentColor}10 0%, ${nextColor}05 40%, transparent 70%)`,
            opacity: 0.6 + Math.sin(time * 2) * 0.2,
          }}
        />

        {/* Chakra dots along spine */}
        {CHAKRA_COLORS.map((clr, i) => {
          const y = 15 + (i / 6) * 70
          const isActive = i === chakraIndex
          const glowIntensity = isActive ? 0.5 + Math.sin(time * 4) * 0.3 : 0.12
          const dotSize = isActive ? 10 : 6

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: '8%',
                top: `${y}%`,
                width: dotSize,
                height: dotSize,
                borderRadius: '50%',
                background: clr,
                opacity: glowIntensity,
                boxShadow: isActive ? `0 0 12px ${clr}, 0 0 24px ${clr}60` : 'none',
                transform: 'translate(-50%, -50%)',
              }}
            />
          )
        })}

        {/* Rotating energy ring */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: Math.min(width, height) * 0.5,
            height: Math.min(width, height) * 0.5,
            transform: `translate(-50%, -50%) rotate(${time * 30}deg)`,
            borderRadius: '50%',
            border: `1px solid ${currentColor}15`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: Math.min(width, height) * 0.55,
            height: Math.min(width, height) * 0.55,
            transform: `translate(-50%, -50%) rotate(${-time * 20}deg)`,
            borderRadius: '50%',
            border: `1px solid ${nextColor}10`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame = 0 }: WordRenderProps) => {
    const time = frame / 30
    const chakraIndex = index % 7
    const chakraColor = CHAKRA_COLORS[chakraIndex]

    let opacity = 0
    let scale = 1
    let glowSize = 0

    if (phase === 'enter') {
      const eased = easeOutQuint(enterProgress)
      opacity = eased
      scale = 0.6 + eased * 0.4
      glowSize = eased * 20
    } else if (phase === 'hold') {
      opacity = 1
      // Pulsing glow during hold
      const pulse = Math.sin(holdProgress * Math.PI * 6) * 0.5 + 0.5
      glowSize = 15 + pulse * 15
      scale = 1 + pulse * 0.03
    } else {
      const eased = easeOutCubic(exitProgress)
      opacity = 1 - eased
      scale = 1 + eased * 0.2
      glowSize = (1 - eased) * 20
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '48%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          textAlign: 'center',
        }}
      >
        {/* Main word */}
        <div
          style={{
            fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(36px, 11vw, 140px)',
            fontWeight: 800,
            letterSpacing: 4,
            whiteSpace: 'nowrap',
            color: chakraColor,
            textShadow: `0 0 ${glowSize}px ${chakraColor}80, 0 0 ${glowSize * 2}px ${chakraColor}40, 0 0 ${glowSize * 3}px ${chakraColor}20`,
          }}
        >
          {word}
        </div>

        {/* Chakra name subtitle */}
        <div
          style={{
            fontFamily: "'Georgia', serif",
            fontSize: 'clamp(10px, 2vw, 18px)',
            fontWeight: 400,
            letterSpacing: 6,
            textTransform: 'uppercase',
            color: `${chakraColor}88`,
            marginTop: 'clamp(6px, 1.5vw, 14px)',
          }}
        >
          {CHAKRA_NAMES[chakraIndex]} Chakra
        </div>
      </div>
    )
  },
}

function ChakraGlowComponent(props: MotionGraphicProps<ChakraGlowConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-chakra-glow',
  title: 'Kinetic Chakra Glow',
  description: 'Words cycle through chakra colors with glowing aura, animated spine dots, and rotating energy rings',
  tags: ['kinetic', 'typography', 'meditation', 'chakra', 'energy', 'glow', 'spiritual', 'mindfulness', 'yoga'],
  category: 'captions',
  component: ChakraGlowComponent as any,
  defaultConfig: {
    words: ['GROUND', 'CREATE', 'POWER', 'LOVE', 'SPEAK', 'SEE', 'KNOW'],
    colors: CHAKRA_COLORS,
    bgColor: '#08080f',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GROUND', 'CREATE', 'POWER', 'LOVE', 'SPEAK', 'SEE', 'KNOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: CHAKRA_COLORS, group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#08080f', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
