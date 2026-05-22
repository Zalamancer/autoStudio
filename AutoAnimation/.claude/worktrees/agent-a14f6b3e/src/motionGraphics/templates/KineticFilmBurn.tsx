import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FilmBurnConfig extends KineticBaseConfig {}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps

    // Multiple drifting burn circles
    const burn1X = 30 + Math.sin(time * 0.7) * 25
    const burn1Y = 40 + Math.cos(time * 0.5) * 20
    const burn1Size = 35 + Math.sin(time * 1.2) * 10

    const burn2X = 70 + Math.cos(time * 0.9) * 20
    const burn2Y = 55 + Math.sin(time * 0.6) * 25
    const burn2Size = 25 + Math.cos(time * 0.8) * 8

    const burn3X = 50 + Math.sin(time * 1.1) * 30
    const burn3Y = 30 + Math.cos(time * 1.3) * 15
    const burn3Size = 20 + Math.sin(time * 1.5) * 6

    // Pulse intensity
    const pulse = 0.4 + Math.sin(time * 2.5) * 0.15

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Primary burn */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse ${burn1Size}% ${burn1Size * 0.7}% at ${burn1X}% ${burn1Y}%, rgba(255,140,0,${pulse}), rgba(255,80,0,${pulse * 0.5}), transparent)`,
            pointerEvents: 'none',
          }}
        />
        {/* Secondary burn */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse ${burn2Size}% ${burn2Size * 0.8}% at ${burn2X}% ${burn2Y}%, rgba(255,200,50,${pulse * 0.7}), rgba(255,120,0,${pulse * 0.3}), transparent)`,
            mixBlendMode: 'screen',
            pointerEvents: 'none',
          }}
        />
        {/* Tertiary burn — subtle amber */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse ${burn3Size}% ${burn3Size * 0.6}% at ${burn3X}% ${burn3Y}%, rgba(255,180,80,${pulse * 0.5}), transparent)`,
            mixBlendMode: 'screen',
            pointerEvents: 'none',
          }}
        />
        {/* Overall warm tint */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(180, 80, 0, 0.08)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0
    let scale = 1

    if (phase === 'enter') {
      // Text appears through the burn
      opacity = easeOutQuad(enterProgress)
      scale = 0.95 + enterProgress * 0.05
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
    } else {
      // Burn covers text on exit
      opacity = 1 - easeOutQuad(exitProgress)
      scale = 1 + exitProgress * 0.05
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: 'clamp(38px, 11vw, 150px)',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color,
          textShadow: '0 0 30px rgba(255,140,0,0.4), 0 2px 6px rgba(0,0,0,0.5)',
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function FilmBurnComponent(props: MotionGraphicProps<FilmBurnConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-film-burn',
  title: 'Kinetic Film Burn',
  description:
    'Film burn and light leak overlays with drifting orange/amber radial gradients that reveal text through the heat',
  tags: ['kinetic', 'typography', 'film', 'burn', 'light-leak', 'vintage', 'cinematic'],
  category: 'captions',
  component: FilmBurnComponent as any,
  defaultConfig: {
    words: ['THROUGH', 'THE', 'FIRE', 'REBORN'],
    colors: ['#FFFFFF', '#FFFFFF', '#FFD700', '#FFFFFF'],
    bgColor: '#1a0800',
    cycleDuration: 1.3,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['THROUGH', 'THE', 'FIRE', 'REBORN'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFFFFF', '#FFFFFF', '#FFD700', '#FFFFFF'],
      group: 'Style',
    },
    {
      key: 'bgColor',
      label: 'Background',
      type: 'color',
      defaultValue: '#1a0800',
      group: 'Style',
    },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.3,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
