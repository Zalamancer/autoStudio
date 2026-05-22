import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Film Aesthetic: Elevated Horror (A24 style) — slow dread reveal, desaturated, psalm-like title cards
// Mechanic: text fades in painfully slowly from pure darkness with a "breathing" quality

interface ElevatedHorrorConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Slow breathing darkness — the dread IS the mechanic
    const breathe = 0.5 + Math.sin(time * 0.4) * 0.5   // very slow inhale/exhale
    const vignetteStrength = 0.7 + breathe * 0.15

    // Barely-visible film grain simulation via noise pattern
    const grainOpacity = 0.04 + Math.sin(time * 47) * 0.01  // flicker

    return (
      <div style={{ position: 'absolute', inset: 0, background: '#080808' }}>
        {/* Breathing vignette — the core horror mechanic */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, rgba(20,15,10,0) 20%, rgba(0,0,0,${vignetteStrength}) 100%)`,
          }}
        />
        {/* Barely-there grain */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: grainOpacity,
            backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'300\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'300\' height=\'300\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
            backgroundRepeat: 'repeat',
          }}
        />
        {/* Thin horizontal scar — like an A24 letterbox artifact */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: '8%', height: 1, background: 'rgba(255,255,255,0.03)' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: '8%', height: 1, background: 'rgba(255,255,255,0.03)' }} />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame, fps }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / (fps ?? 30)

    // Elevated horror reveal: agonizingly slow fade with slight upward drift
    // The slowness is the horror
    const slowEase = (t: number) => Math.pow(t, 0.4)   // very fast early, slow settle

    let opacity = 0
    let translateY = 0
    let blur = 0
    let scale = 1

    if (phase === 'enter') {
      const e = slowEase(enterProgress)
      opacity = e * 0.9
      translateY = (1 - e) * 15
      blur = (1 - e) * 2
      scale = 0.98 + e * 0.02
    } else if (phase === 'hold') {
      // Breathing: barely perceptible, like watching something alive
      opacity = 0.88 + Math.sin(time * 0.5) * 0.05
      translateY = Math.sin(time * 0.3) * 2
      blur = 0
      scale = 1
    } else {
      // Exit: doesn't rush — it seeps away
      opacity = 0.88 * (1 - Math.pow(exitProgress, 0.5))
      translateY = exitProgress * -8
      blur = exitProgress * 1.5
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
          opacity,
          filter: `blur(${blur}px)`,
          fontFamily: "'Georgia', 'Palatino', serif",
          fontSize: 'clamp(28px, 7.5vw, 100px)',
          fontWeight: 300,
          fontStyle: 'italic',
          textTransform: 'lowercase',
          letterSpacing: 6,
          color: color || '#d4cfc8',
          whiteSpace: 'nowrap',
          // Desaturated — elevated horror avoids saturation
          filter: `blur(${blur}px) saturate(0.3)`,
        }}
      >
        {word}
      </div>
    )
  },
}

function ElevatedHorrorComponent(props: MotionGraphicProps<ElevatedHorrorConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-elevated-horror',
  title: 'Kinetic Elevated Horror',
  description: 'A24 elevated horror: agonizingly slow desaturated italic fade-in with breathing vignette and film grain',
  tags: ['kinetic', 'typography', 'horror', 'elevated horror', 'a24', 'dread', 'film', 'slow reveal'],
  category: 'captions',
  component: ElevatedHorrorComponent as any,
  defaultConfig: {
    words: ['something', 'is', 'wrong', 'here'],
    colors: ['#c8c4bc', '#d4cfc8', '#b8b4ac', '#e0dbd2'],
    bgColor: '#080808',
    cycleDuration: 2.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['something', 'is', 'wrong', 'here'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#c8c4bc', '#d4cfc8', '#b8b4ac', '#e0dbd2'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080808', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.8, max: 6, group: 'Timing' },
  ],
})
