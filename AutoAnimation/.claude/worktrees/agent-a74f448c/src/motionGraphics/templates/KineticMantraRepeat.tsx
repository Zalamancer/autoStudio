import React from 'react'
import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MantraRepeatConfig extends KineticBaseConfig {
  maxLayers: number
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    // Build stacking echo layers
    const maxLayers = 6
    const layers: React.ReactNode[] = []

    // Calculate how many echoes are visible based on phase
    let visibleLayers = 1
    let mainOpacity = 1

    if (phase === 'enter') {
      const eased = easeOutCubic(enterProgress)
      visibleLayers = Math.max(1, Math.floor(eased * maxLayers))
      mainOpacity = eased
    } else if (phase === 'hold') {
      visibleLayers = maxLayers
      mainOpacity = 1
    } else {
      visibleLayers = Math.max(1, Math.floor((1 - exitProgress) * maxLayers))
      mainOpacity = 1 - exitProgress
    }

    // Seed for deterministic offsets
    const seed = index * 53 + 7

    for (let i = visibleLayers - 1; i >= 0; i--) {
      const layerRatio = i / maxLayers
      const layerOpacity = (1 - layerRatio * 0.85) * mainOpacity
      // Slight offset for each layer — spread outward
      const offsetX = Math.sin((seed + i * 2.3) * 1.7) * i * 3
      const offsetY = Math.cos((seed + i * 3.1) * 1.3) * i * 2.5
      const layerScale = 1 + i * 0.04
      const layerBlur = i * 0.8

      layers.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) scale(${layerScale})`,
            opacity: layerOpacity,
            filter: layerBlur > 0 ? `blur(${layerBlur}px)` : undefined,
            fontFamily: "'Impact', 'Arial Black', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(48px, 14vw, 180px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            whiteSpace: 'nowrap',
            color: i === 0 ? color : `${color}`,
          }}
        >
          {word}
        </div>,
      )
    }

    return <>{layers}</>
  },
}

function MantraRepeatComponent(props: MotionGraphicProps<MantraRepeatConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-mantra-repeat',
  title: 'Kinetic Mantra Repeat',
  description: 'Stacking echo effect where each cycle adds overlapping layers at slight offsets. Mantra-like repetition.',
  tags: ['kinetic', 'typography', 'mantra', 'repeat', 'echo', 'stacking', 'motivational'],
  category: 'captions',
  component: MantraRepeatComponent as any,
  defaultConfig: {
    words: ['FOCUS', 'GRIND', 'RISE'],
    colors: ['#E0E0E0', '#C0C0C0', '#FFFFFF'],
    bgColor: '#111111',
    cycleDuration: 1.8,
    maxLayers: 6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FOCUS', 'GRIND', 'RISE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E0E0E0', '#C0C0C0', '#FFFFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111111', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
    { key: 'maxLayers', label: 'Max Echo Layers', type: 'number', defaultValue: 6, min: 2, max: 12, group: 'Style' },
  ],
})
