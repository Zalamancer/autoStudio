import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GodCutMatchConfig extends KineticBaseConfig {
  matchIntensity: number
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // God Cut / Match Cut: cuts on matching shapes/movements
    // Stanley Kubrick's bone-to-spaceship level of abstraction
    // Visualized as geometric shape morphing between cuts

    const morphProgress = (time * 0.4) % 1.0
    const eased = morphProgress < 0.5
      ? 4 * morphProgress * morphProgress * morphProgress
      : 1 - Math.pow(-2 * morphProgress + 2, 3) / 2

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Outgoing shape — bone/primitive form */}
        <div
          style={{
            position: 'absolute',
            left: '25%',
            top: '50%',
            width: 60,
            height: 60,
            transform: `translate(-50%, -50%) scale(${1 - eased * 0.3}) rotate(${eased * 45}deg)`,
            borderRadius: `${eased * 50}%`,
            border: `2px solid rgba(255,255,255,${0.12 - eased * 0.08})`,
            pointerEvents: 'none',
          }}
        />
        {/* Incoming shape — evolved form */}
        <div
          style={{
            position: 'absolute',
            left: '75%',
            top: '50%',
            width: 60,
            height: 60,
            transform: `translate(-50%, -50%) scale(${0.7 + eased * 0.3}) rotate(${(1 - eased) * -45}deg)`,
            borderRadius: `${(1 - eased) * 50}%`,
            border: `2px solid rgba(255,255,255,${0.04 + eased * 0.08})`,
            pointerEvents: 'none',
          }}
        />
        {/* Cut line — the edit point */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '20%',
            bottom: '20%',
            width: 1,
            background: `rgba(255,255,255,${0.06 + Math.sin(time * 3) * 0.02})`,
            pointerEvents: 'none',
          }}
        />
        {/* Match axis lines */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '50%',
            height: 1,
            background: 'rgba(255,255,255,0.04)',
            pointerEvents: 'none',
          }}
        />
        {/* Flash on cut */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(255,255,255,${Math.max(0, 0.06 - Math.abs(morphProgress - 0.5) * 0.2)})`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    let opacity = 1
    let scale = 1
    let rotate = 0

    if (phase === 'enter') {
      // Hard match cut — instantaneous with brief flash
      const snap = Math.min(1, enterProgress * 6)
      opacity = snap
      // Shape morphs into word
      scale = 0.6 + snap * 0.4
      rotate = (1 - snap) * (index % 2 === 0 ? 8 : -8)
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1 + Math.sin(t * 0.8 + index) * 0.005
    } else {
      // Dissolves into next matching shape
      const ease = exitProgress * exitProgress
      opacity = 1 - ease
      scale = 1 + ease * 0.15
      rotate = ease * (index % 2 === 0 ? -5 : 5)
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotate}deg)`,
          opacity,
          fontFamily: "'Arial Black', 'Impact', sans-serif",
          fontSize: 'clamp(44px, 12vw, 162px)',
          fontWeight: 900,
          color,
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
          letterSpacing: 2,
          textShadow: `0 0 30px ${color}33, 0 2px 6px rgba(0,0,0,0.7)`,
        }}
      >
        {word}
      </div>
    )
  },
}

function GodCutMatchComponent(props: MotionGraphicProps<GodCutMatchConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-god-cut-match',
  title: 'Kinetic God Cut Match',
  description: 'Kubrick-style match cut — geometric shapes morph between outgoing and incoming forms with hard flash transitions and rotating shape evolution',
  tags: ['kinetic', 'typography', 'match cut', 'kubrick', 'edit', 'morph', 'cinematic', 'geometric'],
  category: 'captions',
  component: GodCutMatchComponent as any,
  defaultConfig: {
    words: ['MATCH', 'MORPH', 'EVOLVE', 'CUT'],
    colors: ['#FFFFFF', '#E0E0FF', '#FFFFFF', '#F0F0F0'],
    bgColor: '#060606',
    cycleDuration: 1.3,
    matchIntensity: 80,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['MATCH', 'MORPH', 'EVOLVE', 'CUT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#E0E0FF', '#FFFFFF', '#F0F0F0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060606', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.5, max: 5, group: 'Timing' },
    { key: 'matchIntensity', label: 'Match Intensity', type: 'number', defaultValue: 80, min: 20, max: 150, group: 'Animation' },
  ],
})
