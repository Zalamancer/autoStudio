import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NeonWaveConfig extends KineticBaseConfig {
  waveAmplitude: number
  waveSpeed: number
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
        }}
      >
        {/* Subtle animated gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at ${50 + Math.sin(time) * 20}% ${50 + Math.cos(time * 0.7) * 20}%, rgba(0,255,170,0.05) 0%, transparent 70%)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0
    let translateY = 0
    let blur = 0

    if (phase === 'enter') {
      opacity = enterProgress
      translateY = (1 - enterProgress) * 40
      blur = (1 - enterProgress) * 8
    } else if (phase === 'hold') {
      opacity = 1
      translateY = Math.sin(Date.now() * 0.003) * 5 // subtle wave
    } else {
      opacity = 1 - exitProgress
      translateY = -exitProgress * 30
      blur = exitProgress * 6
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px)`,
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(36px, 10vw, 140px)',
          fontWeight: 300,
          letterSpacing: 8,
          color,
          textShadow: `0 0 10px ${color}, 0 0 30px ${color}, 0 0 80px ${color}`,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function NeonWaveComponent(props: MotionGraphicProps<NeonWaveConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-neon-wave',
  title: 'Kinetic Neon Wave',
  description: 'Flowing words with neon glow trails, sine wave motion, and light streak particles',
  tags: ['kinetic', 'typography', 'neon', 'glow'],
  category: 'captions',
  component: NeonWaveComponent as any,
  defaultConfig: {
    words: ['DREAM', 'CREATE', 'INSPIRE', 'EVOLVE'],
    colors: ['#00FFAA', '#FF3366', '#00BFFF', '#FFD700'],
    bgColor: '#0a0a1a',
    cycleDuration: 1.2,
    waveAmplitude: 20,
    waveSpeed: 3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DREAM', 'CREATE', 'INSPIRE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FFAA', '#FF3366', '#00BFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a1a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
    { key: 'waveAmplitude', label: 'Wave Amplitude', type: 'number', defaultValue: 20, min: 0, max: 50, group: 'Animation' },
  ],
})
