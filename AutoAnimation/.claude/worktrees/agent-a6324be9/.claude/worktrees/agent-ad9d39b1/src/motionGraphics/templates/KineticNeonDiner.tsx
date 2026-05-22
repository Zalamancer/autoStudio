import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NeonDinerConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor === '#1A0A1E'
            ? 'linear-gradient(160deg, #1A0A1E 0%, #0F0520 50%, #180E25 100%)'
            : bgColor,
        }}
      >
        {/* Retro diner checkerboard floor hint */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '20%',
            background: 'linear-gradient(0deg, rgba(255,255,255,0.03) 0%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Neon tube frame */}
        <div
          style={{
            position: 'absolute',
            inset: '8%',
            border: '2px solid rgba(255,80,150,0.2)',
            borderRadius: 20,
            boxShadow: `
              inset 0 0 15px rgba(255,80,150,0.05),
              0 0 15px rgba(255,80,150,0.08),
              0 0 30px rgba(255,80,150,0.04)
            `,
            pointerEvents: 'none',
          }}
        />
        {/* Corner decorative dots */}
        {[
          { top: '7%', left: '7%' },
          { top: '7%', right: '7%' },
          { bottom: '7%', left: '7%' },
          { bottom: '7%', right: '7%' },
        ].map((pos, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              ...pos,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#FF5096',
              boxShadow: '0 0 8px #FF5096, 0 0 16px #FF5096',
              opacity: 0.6 + Math.sin(time * 3 + i * 1.5) * 0.3,
              pointerEvents: 'none',
            } as any}
          />
        ))}
        {/* Ambient neon glow */}
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '70%',
            height: '40%',
            background: 'radial-gradient(ellipse, rgba(255,80,150,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        {/* Top banner text */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 'clamp(8px, 1.4vw, 12px)',
            fontFamily: "'Georgia', serif",
            color: 'rgba(255,200,100,0.3)',
            letterSpacing: '0.5em',
            textTransform: 'uppercase',
            pointerEvents: 'none',
          }}
        >
          Open 24 Hours
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    let opacity = 0

    if (phase === 'enter') {
      // Neon tube warm-up flicker
      if (enterProgress < 0.1) opacity = 0
      else if (enterProgress < 0.18) opacity = 0.6
      else if (enterProgress < 0.22) opacity = 0.1
      else if (enterProgress < 0.32) opacity = 0.8
      else if (enterProgress < 0.36) opacity = 0.15
      else if (enterProgress < 0.5) opacity = 0.9
      else if (enterProgress < 0.55) opacity = 0.3
      else opacity = 1
    } else if (phase === 'hold') {
      // Warm steady glow with gentle buzz
      opacity = 0.9 + Math.sin(f * 0.08 + index * 2.5) * 0.1
    } else {
      // Fade and flicker out
      if (exitProgress < 0.3) opacity = 1
      else if (exitProgress < 0.4) opacity = 0.4
      else if (exitProgress < 0.5) opacity = 0.9
      else if (exitProgress < 0.65) opacity = 0.2
      else if (exitProgress < 0.75) opacity = 0.6
      else opacity = Math.max(0, 1 - (exitProgress - 0.75) / 0.25)
    }

    // Multi-layer neon glow in warm diner colors
    const glowColor = color
    const glowLayers = [
      `0 0 5px ${glowColor}`,
      `0 0 12px ${glowColor}`,
      `0 0 25px ${glowColor}`,
      `0 0 45px ${glowColor}`,
      `0 0 70px ${glowColor}80`,
    ].join(', ')

    return (
      <div
        style={{
          position: 'absolute',
          top: '48%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          fontFamily: "'Georgia', 'Palatino', serif",
          fontSize: 'clamp(38px, 11vw, 140px)',
          fontWeight: 700,
          fontStyle: 'italic',
          textTransform: 'uppercase',
          letterSpacing: 5,
          color: glowColor,
          textShadow: glowLayers,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
        {/* Neon reflection on surface */}
        <div
          style={{
            position: 'absolute',
            top: '105%',
            left: 0,
            right: 0,
            fontSize: 'inherit',
            fontFamily: 'inherit',
            fontWeight: 'inherit',
            fontStyle: 'inherit',
            letterSpacing: 'inherit',
            textTransform: 'uppercase' as const,
            color: glowColor,
            textShadow: `0 0 8px ${glowColor}`,
            opacity: 0.12,
            transform: 'scaleY(-0.25)',
            transformOrigin: 'top center',
            filter: 'blur(2px)',
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function NeonDinerComponent(props: MotionGraphicProps<NeonDinerConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-neon-diner',
  title: 'Neon Diner',
  description: 'Retro diner neon sign with warm pink/amber glow, tube flicker warm-up, italic serif lettering, and reflection effect',
  tags: ['kinetic', 'food', 'restaurant', 'diner', 'neon', 'retro', 'vintage', 'sign'],
  category: 'captions',
  component: NeonDinerComponent as any,
  defaultConfig: {
    words: ['DINER', 'OPEN', 'EAT', 'FRESH'],
    colors: ['#FF5096', '#FFB347', '#FF5096', '#FFB347'],
    bgColor: '#1A0A1E',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DINER', 'OPEN', 'EAT', 'FRESH'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF5096', '#FFB347', '#FF5096', '#FFB347'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A0A1E', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
