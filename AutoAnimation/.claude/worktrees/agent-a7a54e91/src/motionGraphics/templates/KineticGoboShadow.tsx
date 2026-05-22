import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GoboShadowConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

// Gobo: theatrical lighting cut with shaped pattern — casts text-shaped shadows
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Stage lighting — warm spotlight cone from above
    const spotX = 50 + Math.sin(time * 0.4) * 8
    const spotY = 20 + Math.sin(time * 0.6) * 5
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Spotlight cone */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse 55% 70% at ${spotX}% ${spotY}%, rgba(255,220,140,0.18) 0%, rgba(255,180,60,0.06) 50%, transparent 80%)`,
          }}
        />
        {/* Stage floor gradient */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '30%',
            background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const time = (frame ?? 0) / 30
    const backEased = easeOutBack(Math.min(enterProgress, 1))

    // Gobo slides into position — shadow sweeps across
    // Entry: text slides in from top (gobo rotates into beam)
    const slideIn = phase === 'enter' ? backEased : 1
    const translateY = phase === 'enter' ? -(1 - slideIn) * 80 : phase === 'exit' ? -exitProgress * 60 : 0

    // Shadow offset — moves as if spotlight position shifts
    const lightX = 50 + Math.sin(time * 0.4) * 8
    const shadowOffsetX = (lightX - 50) * 0.4
    const shadowOffsetY = phase === 'hold' ? 4 + Math.sin(time * 0.5) * 2 : 4
    const shadowBlur = phase === 'hold' ? 8 + Math.sin(time * 0.7) * 3 : 6

    const opacity = phase === 'enter' ? Math.min(1, enterProgress * 2.5) : phase === 'exit' ? 1 - exitProgress : 1

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px))`,
          opacity,
        }}
      >
        {/* Gobo shadow — cast on stage floor */}
        <div
          style={{
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(44px, 13vw, 170px)',
            fontWeight: 900,
            color: 'transparent',
            whiteSpace: 'nowrap',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            textShadow: `${shadowOffsetX}px ${shadowOffsetY + 40}px ${shadowBlur + 10}px rgba(0,0,0,0.6), ${shadowOffsetX * 0.5}px ${shadowOffsetY + 20}px ${shadowBlur}px rgba(0,0,0,0.4)`,
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
          }}
        >
          {word}
        </div>

        {/* Lit text */}
        <div
          style={{
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(44px, 13vw, 170px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            textShadow: `0 0 30px rgba(255,220,140,0.4), ${shadowOffsetX * 0.1}px ${shadowOffsetY * 0.1}px ${shadowBlur * 0.3}px rgba(0,0,0,0.5)`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function GoboShadowComponent(props: MotionGraphicProps<GoboShadowConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-gobo-shadow',
  title: 'Kinetic Gobo Shadow',
  description:
    'Theatre gobo light projection — text is lit by a warm spotlight that casts a dramatic angled shadow, which shifts as the light source subtly moves',
  tags: ['kinetic', 'typography', 'gobo', 'shadow', 'projection', 'theatre', 'spotlight', 'light'],
  category: 'captions',
  component: GoboShadowComponent as any,
  defaultConfig: {
    words: ['STAGE', 'LIGHT', 'CAST', 'SHADOW'],
    colors: ['#FFE8B0', '#FFCC70', '#FFF0C0', '#FFD880'],
    bgColor: '#080400',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['STAGE', 'LIGHT', 'CAST', 'SHADOW'],
      group: 'Content',
    },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFE8B0', '#FFCC70'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080400', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
