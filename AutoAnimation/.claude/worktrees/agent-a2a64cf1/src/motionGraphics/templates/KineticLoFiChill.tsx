import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Genre Beats 1/4 — Lo-Fi Chill Sway
// Lo-fi hip-hop aesthetic: slow, warm, lazy sway with vinyl grain and warm colors

interface LoFiChillConfig extends KineticBaseConfig {
  swaySpeed: number
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    // Vinyl crackle: random noise overlay
    const crackle = Math.sin(t * 47.3) * Math.cos(t * 31.7) * 0.03

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Warm vignette — classic lo-fi */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(20,10,5,0.6) 100%)`,
          }}
        />
        {/* Warm color cast */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(180,100,30,${0.04 + Math.abs(crackle)})`,
            mixBlendMode: 'multiply' as any,
          }}
        />
        {/* Horizontal scan line */}
        <div
          style={{
            position: 'absolute',
            top: `${50 + Math.sin(t * 0.3) * 15}%`,
            left: 0,
            right: 0,
            height: 1,
            background: 'rgba(255,220,150,0.06)',
          }}
        />
        {/* Rain dots */}
        {Array.from({ length: 6 }, (_, i) => {
          const rainPhase = ((t * 0.5 + i * 0.17) % 1)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${10 + i * 14}%`,
                top: `${rainPhase * 100}%`,
                width: 1,
                height: 8,
                background: 'rgba(255,220,150,0.12)',
                borderRadius: 1,
              }}
            />
          )
        })}
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
  }: WordRenderProps) => {
    let opacity = 1
    let translateX = 0
    let translateY = 0
    let rotate = 0

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 1.5)
      translateY = (1 - enterProgress) * 20
    } else if (phase === 'hold') {
      opacity = 0.9 // slightly reduced for lo-fi feel
      // Lazy, slow sway — lo-fi is not tightly quantized
      translateX = Math.sin(holdProgress * Math.PI * 1.5) * 12
      // Small vertical bob
      translateY = Math.sin(holdProgress * Math.PI * 2) * 5
      // Very slight tilt
      rotate = Math.sin(holdProgress * Math.PI * 1.8) * 1.2
    } else {
      opacity = 0.9 * (1 - exitProgress)
      translateY = exitProgress * 15
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateX(${translateX}px) translateY(${translateY}px) rotate(${rotate}deg)`,
          opacity,
          fontSize: 'clamp(42px, 10vw, 140px)',
          fontWeight: 700,
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Georgia', 'Times New Roman', serif",
          textTransform: 'lowercase',
          letterSpacing: '0.06em',
          textShadow: `2px 2px 8px rgba(0,0,0,0.4), 0 0 30px ${color}30`,
          // Lo-fi desaturated look via slight sepia-like shadow
          filter: 'sepia(0.2)',
        }}
      >
        {word}
      </div>
    )
  },
}

function LoFiChillComponent(props: MotionGraphicProps<LoFiChillConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-lofi-chill',
  title: 'Kinetic Lo-Fi Chill',
  description:
    'Lo-fi hip-hop aesthetic: slow warm lazy sway with vinyl grain, rain drops, and warm sepia color cast. studygram / lo-fi beats feel.',
  tags: ['kinetic', 'genre', 'lofi', 'chill', 'hiphop', 'lazy', 'warm', 'analog', 'music'],
  category: 'captions',
  component: LoFiChillComponent as any,
  defaultConfig: {
    words: ['chill', 'vibe', 'study'],
    colors: ['#D4A853', '#C49040', '#B07830'],
    bgColor: '#1A1208',
    cycleDuration: 2.0,
    swaySpeed: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['chill', 'vibe', 'study'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#D4A853', '#C49040', '#B07830'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A1208', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.8, max: 6, group: 'Timing' },
    { key: 'swaySpeed', label: 'Sway Speed', type: 'number', defaultValue: 1.5, min: 0.5, max: 4, group: 'Animation' },
  ],
})
