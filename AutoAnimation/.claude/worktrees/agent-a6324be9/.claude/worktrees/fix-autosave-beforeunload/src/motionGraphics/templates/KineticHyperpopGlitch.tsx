import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Music Genre: Hyperpop — glitch maximalism, chromatic aberration, candy colors, digital chaos
// Animation mechanic: RGB split chromatic aberration + random pixel displacement every frame

interface HyperpopGlitchConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Chaotic multi-color gradient that pulses — hyperpop IS maximalism
    const hue1 = (time * 60) % 360
    const hue2 = (hue1 + 120) % 360
    const hue3 = (hue1 + 240) % 360

    // Glitch bars — random horizontal tears
    const glitchBars = Array.from({ length: 5 }, (_, i) => {
      const seed = Math.floor(time * 12 + i * 7) % 100
      const y = (seed * 19 + i * 23) % 90
      const show = Math.sin(time * 15 + i * 3.7) > 0.7
      const offset = ((seed * 13) % 20) - 10
      return show ? (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${y}%`,
            height: 2 + (seed % 6),
            background: `hsl(${(hue1 + i * 40) % 360}, 100%, 60%)`,
            transform: `translateX(${offset}px)`,
            opacity: 0.6,
          }}
        />
      ) : null
    })

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, hsl(${hue1}, 90%, 15%) 0%, hsl(${hue2}, 80%, 12%) 50%, hsl(${hue3}, 90%, 18%) 100%)`,
        }}
      >
        {glitchBars}
        {/* Candy grid overlay */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`, backgroundSize: '30px 30px' }} />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame, fps }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / (fps ?? 30)

    let opacity = 0
    let scale = 1
    let translateY = 0

    if (phase === 'enter') {
      // Hyperpop enter: rapid stutter then snap in
      const beats = Math.floor(enterProgress * 8)
      opacity = beats % 2 === 0 ? enterProgress : enterProgress * 0.3
      scale = 0.5 + enterProgress * 0.5 + Math.sin(enterProgress * 20) * 0.05
      translateY = (1 - enterProgress) * -20
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1 + Math.sin(time * 8) * 0.015  // subtle pulse on beat
      translateY = Math.sin(time * 12) * 2
    } else {
      opacity = Math.max(0, 1 - exitProgress * 3)
      scale = 1 + exitProgress * 0.3
    }

    // Chromatic aberration: 3 copies offset in R, G, B
    const glitchOffset = phase === 'hold' ? Math.sin(time * 20) * 3 : 0
    const chaos = phase === 'enter' && enterProgress < 0.7 ? (1 - enterProgress) * 8 : glitchOffset

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
          opacity,
        }}
      >
        {/* Red channel */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${chaos}px), -50%)`,
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          fontSize: 'clamp(40px, 12vw, 160px)',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: 3,
          color: '#ff0050',
          whiteSpace: 'nowrap',
          opacity: 0.7,
          mixBlendMode: 'screen',
        }}>{word}</div>
        {/* Cyan channel */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% - ${chaos}px), -50%)`,
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          fontSize: 'clamp(40px, 12vw, 160px)',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: 3,
          color: '#00ffff',
          whiteSpace: 'nowrap',
          opacity: 0.7,
          mixBlendMode: 'screen',
        }}>{word}</div>
        {/* Main */}
        <div style={{
          position: 'relative',
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          fontSize: 'clamp(40px, 12vw, 160px)',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: 3,
          color,
          whiteSpace: 'nowrap',
        }}>{word}</div>
      </div>
    )
  },
}

function HyperpopGlitchComponent(props: MotionGraphicProps<HyperpopGlitchConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-hyperpop-glitch',
  title: 'Kinetic Hyperpop Glitch',
  description: 'Hyperpop maximalism: RGB chromatic aberration split, digital glitch bars, chaotic candy color gradients',
  tags: ['kinetic', 'typography', 'hyperpop', 'glitch', 'maximalism', 'music', 'chromatic', 'aesthetic'],
  category: 'captions',
  component: HyperpopGlitchComponent as any,
  defaultConfig: {
    words: ['GLITCH', 'POP', 'CHAOS', 'LOUD'],
    colors: ['#ff00ff', '#00ffff', '#ff0050', '#ffff00'],
    bgColor: '#0d0018',
    cycleDuration: 0.9,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GLITCH', 'POP', 'CHAOS', 'LOUD'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ff00ff', '#00ffff', '#ff0050', '#ffff00'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0018', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 0.9, min: 0.3, max: 5, group: 'Timing' },
  ],
})
