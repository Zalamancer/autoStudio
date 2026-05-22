import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LighthouseBeamConfig extends KineticBaseConfig {}

// Easing: ease-out cubic
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    // Rotating beam sweep — repeats every 3 seconds
    const t = (frame / fps) % 3
    const beamAngle = (t / 3) * 360 // 0..360 deg full rotation

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Beam origin at bottom-center, sweeping like a lighthouse */}
        <div
          style={{
            position: 'absolute',
            bottom: '-20%',
            left: '50%',
            width: '200%',
            height: '200%',
            transformOrigin: '0% 100%',
            transform: `translateX(-50%) rotate(${beamAngle - 90}deg)`,
            background:
              'conic-gradient(from -5deg at 0% 100%, rgba(255,230,80,0.18) 0deg, rgba(255,230,80,0.06) 10deg, transparent 10deg)',
            pointerEvents: 'none',
          }}
        />
        {/* Narrow crisp leading edge */}
        <div
          style={{
            position: 'absolute',
            bottom: '-20%',
            left: '50%',
            width: '200%',
            height: '200%',
            transformOrigin: '0% 100%',
            transform: `translateX(-50%) rotate(${beamAngle - 90}deg)`,
            background:
              'conic-gradient(from -1deg at 0% 100%, rgba(255,240,120,0.55) 0deg, transparent 3deg)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame = 0 }: WordRenderProps) => {
    // Beam sweep reveals text: clip-path expands left→right as beam passes
    // On exit, text fades back into darkness
    const ep = easeOut(enterProgress)
    const clipRight = phase === 'enter' ? ep * 100 : 100
    const clipLeft = phase === 'exit' ? easeOut(exitProgress) * 100 : 0
    const opacity = phase === 'exit' ? 1 - exitProgress * 0.8 : 1

    // Subtle ambient flicker on hold
    const flicker =
      phase === 'hold' ? 1 + Math.sin(frame * 0.7) * 0.015 : 1

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${flicker})`,
          opacity,
          clipPath: `inset(0 ${(100 - clipRight).toFixed(2)}% 0 ${clipLeft.toFixed(2)}%)`,
        }}
      >
        <div
          style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 9vw, 130px)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color,
            whiteSpace: 'nowrap',
            textShadow: `0 0 40px rgba(255,230,80,0.6), 0 0 12px rgba(255,230,80,0.4)`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function LighthouseBeamComponent(props: MotionGraphicProps<LighthouseBeamConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-lighthouse-beam',
  title: 'Lighthouse Beam',
  description:
    'A rotating lighthouse beam sweeps across the frame, revealing text as it passes — like a beam cutting through night fog.',
  tags: ['kinetic', 'typography', 'maritime', 'nautical', 'lighthouse', 'beam', 'sweep', 'reveal'],
  category: 'captions',
  component: LighthouseBeamComponent as any,
  defaultConfig: {
    words: ['NAVIGATE', 'GUIDE', 'SIGNAL', 'BEACON'],
    colors: ['#ffe050', '#ffd700', '#fff8dc', '#ffe050'],
    bgColor: '#0a0f1a',
    cycleDuration: 2.0,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['NAVIGATE', 'GUIDE', 'SIGNAL', 'BEACON'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#ffe050', '#ffd700', '#fff8dc', '#ffe050'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0f1a', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.0,
      min: 0.8,
      max: 5,
      group: 'Timing',
    },
  ],
})
