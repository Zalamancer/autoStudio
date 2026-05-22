import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GeologyLayerConfig {
  layerName: string
  depth: string
  era: string
  composition: string
  age: string
  fossils: string
  description: string
  layerColor: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
function easeInCubic(t: number): number { return t * t * t }

function SceneGeologyLayerComponent({ config, frame, durationInFrames }: MotionGraphicProps<GeologyLayerConfig>) {
  const { layerName, depth, era, composition, age, fossils, description, layerColor, bgColor, textColor } = config
  const progress = frame / durationInFrames

  // Geological layers build from bottom (0-0.3)
  const layers = [
    { name: 'Mantle', color: '#CC3300', yStart: 92, height: 10, delay: 0 },
    { name: 'Igneous', color: '#885533', yStart: 78, height: 14, delay: 0.04 },
    { name: 'Metamorphic', color: '#776655', yStart: 65, height: 13, delay: 0.08 },
    { name: 'Sedimentary', color: '#AA8855', yStart: 52, height: 13, delay: 0.12 },
    { name: 'Fossil Layer', color: '#BBAA77', yStart: 41, height: 11, delay: 0.16 },
    { name: 'Topsoil', color: '#557733', yStart: 35, height: 6, delay: 0.2 },
  ]

  const getLayerReveal = (delay: number) =>
    easeOutCubic(Math.max(0, Math.min(1, (progress - delay) / 0.12)))

  // Highlight indicator slides to target layer (0.25-0.4)
  const highlightFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.25) / 0.15)))

  // Layer name (0.3-0.42)
  const nameFade = easeOutBack(Math.max(0, Math.min(1, (progress - 0.3) / 0.12)))

  // Data rows (0.38-0.62)
  const depthFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.38) / 0.1)))
  const eraFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.44) / 0.1)))
  const compFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.5) / 0.1)))
  const ageFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.56) / 0.1)))
  const fossilFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.62) / 0.1)))
  const descFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.68) / 0.12)))

  // Sediment particles in layers
  const particles = Array.from({ length: 20 }, (_, i) => ({
    x: ((i * 47 + 13) % 95) + 2,
    y: ((i * 31 + 7) % 55) + 38,
    size: 2 + ((i * 17) % 4),
    opacity: 0.1 + ((i * 11) % 4) / 20,
  }))

  // Exit
  const exitProg = progress >= 0.85 ? easeInCubic((progress - 0.85) / 0.15) : 0

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        overflow: 'hidden',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        opacity: 1 - exitProg,
      }}
    >
      {/* Cross-section layers - right side */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '35%',
          overflow: 'hidden',
        }}
      >
        {layers.map((layer, i) => {
          const reveal = getLayerReveal(layer.delay)
          const isHighlighted = layer.name === 'Fossil Layer'
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${layer.yStart}%`,
                height: `${layer.height}%`,
                background: layer.color,
                opacity: reveal * (isHighlighted && highlightFade > 0 ? 0.6 + Math.sin(progress * Math.PI * 8) * 0.15 : 0.35),
                transform: `translateX(${(1 - reveal) * 100}%)`,
                borderTop: `1px solid ${layer.color}60`,
              }}
            >
              {/* Layer texture lines */}
              {Array.from({ length: 3 }, (_, j) => (
                <div
                  key={j}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: `${25 + j * 25}%`,
                    height: 1,
                    background: `rgba(0,0,0,${0.05 + j * 0.02})`,
                  }}
                />
              ))}
            </div>
          )
        })}

        {/* Highlight arrow */}
        <div
          style={{
            position: 'absolute',
            left: -8,
            top: '45%',
            transform: 'translateY(-50%)',
            width: 0,
            height: 0,
            borderTop: '8px solid transparent',
            borderBottom: '8px solid transparent',
            borderLeft: `12px solid ${layerColor}`,
            opacity: highlightFade,
          }}
        />

        {/* Depth scale */}
        {layers.map((layer, i) => (
          <div
            key={`label-${i}`}
            style={{
              position: 'absolute',
              right: '105%',
              top: `${layer.yStart + layer.height / 2}%`,
              fontSize: 'clamp(7px, 1.2vw, 10px)',
              color: `${textColor}25`,
              transform: 'translateY(-50%)',
              whiteSpace: 'nowrap',
              opacity: getLayerReveal(layer.delay),
            }}
          >
            {layer.name}
          </div>
        ))}

        {/* Sediment particles */}
        {particles.map((p, i) => (
          <div
            key={`p-${i}`}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              borderRadius: '40%',
              background: `rgba(255,255,255,${p.opacity})`,
              opacity: getLayerReveal(0.1),
            }}
          />
        ))}
      </div>

      {/* Info panel - left side */}
      <div
        style={{
          position: 'absolute',
          left: '5%',
          top: '50%',
          transform: `translateY(-50%) scale(${1 - exitProg * 0.1})`,
          width: '52%',
          maxWidth: 380,
        }}
      >
        {/* Era label */}
        <div
          style={{
            fontSize: 'clamp(9px, 1.6vw, 13px)',
            color: layerColor,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            marginBottom: 'clamp(6px, 1.5vw, 12px)',
            opacity: eraFade,
          }}
        >
          {era}
        </div>

        {/* Layer name */}
        <div
          style={{
            fontSize: 'clamp(24px, 6vw, 48px)',
            fontWeight: 900,
            color: textColor,
            marginBottom: 'clamp(4px, 1vw, 8px)',
            opacity: nameFade,
            transform: `translateY(${(1 - nameFade) * 15}px)`,
          }}
        >
          {layerName}
        </div>

        {/* Age */}
        <div
          style={{
            fontSize: 'clamp(13px, 2.8vw, 22px)',
            color: `${textColor}70`,
            marginBottom: 'clamp(12px, 3vw, 24px)',
            opacity: ageFade,
          }}
        >
          {age}
        </div>

        <div style={{ width: `${nameFade * 40}%`, height: 1, background: `${layerColor}30`, marginBottom: 'clamp(12px, 3vw, 24px)' }} />

        {/* Data rows */}
        <div
          style={{
            fontSize: 'clamp(12px, 2.4vw, 19px)',
            color: `${textColor}80`,
            marginBottom: 'clamp(6px, 1.5vw, 12px)',
            opacity: depthFade,
            transform: `translateX(${(1 - depthFade) * 20}px)`,
          }}
        >
          <span style={{ color: layerColor, fontWeight: 700, marginRight: 8 }}>DEPTH</span>
          {depth}
        </div>

        <div
          style={{
            fontSize: 'clamp(12px, 2.4vw, 19px)',
            color: `${textColor}80`,
            marginBottom: 'clamp(6px, 1.5vw, 12px)',
            opacity: compFade,
            transform: `translateX(${(1 - compFade) * 20}px)`,
          }}
        >
          <span style={{ color: layerColor, fontWeight: 700, marginRight: 8 }}>ROCK</span>
          {composition}
        </div>

        <div
          style={{
            fontSize: 'clamp(12px, 2.4vw, 19px)',
            color: `${textColor}80`,
            marginBottom: 'clamp(12px, 3vw, 24px)',
            opacity: fossilFade,
            transform: `translateX(${(1 - fossilFade) * 20}px)`,
          }}
        >
          <span style={{ color: layerColor, fontWeight: 700, marginRight: 8 }}>FOSSILS</span>
          {fossils}
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: 'clamp(12px, 2.5vw, 20px)',
            color: `${textColor}99`,
            lineHeight: 1.5,
            fontStyle: 'italic',
            borderLeft: `3px solid ${layerColor}40`,
            paddingLeft: 'clamp(8px, 2vw, 14px)',
            opacity: descFade,
            transform: `translateY(${(1 - descFade) * 10}px)`,
          }}
        >
          {description}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-geology-layer',
  title: 'Geology Layer',
  description: 'Geological layer cross-section with animated strata, highlight arrow, depth scale, fossil data, and era information',
  tags: ['scene', 'science', 'geology', 'earth', 'layers', 'fossils', 'educational'],
  category: 'scene-layout',
  component: SceneGeologyLayerComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'layerName', label: 'Layer Name', type: 'text', defaultValue: 'Jurassic Limestone', group: 'Content' },
    { key: 'depth', label: 'Depth', type: 'text', defaultValue: '150-200 meters', group: 'Content' },
    { key: 'era', label: 'Era', type: 'text', defaultValue: 'Mesozoic Era', group: 'Content' },
    { key: 'composition', label: 'Composition', type: 'text', defaultValue: 'Limestone, shale, sandstone', group: 'Content' },
    { key: 'age', label: 'Age', type: 'text', defaultValue: '~150 million years ago', group: 'Content' },
    { key: 'fossils', label: 'Fossils', type: 'text', defaultValue: 'Ammonites, belemnites, bivalves', group: 'Content' },
    { key: 'description', label: 'Description', type: 'text', defaultValue: 'Marine sedimentary layer deposited during warm shallow seas that covered much of the continent', group: 'Content' },
    { key: 'layerColor', label: 'Layer Color', type: 'color', defaultValue: '#BBAA77', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0e1117', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E8E8E8', group: 'Style' },
  ],
  defaultConfig: {
    layerName: 'Jurassic Limestone',
    depth: '150-200 meters',
    era: 'Mesozoic Era',
    composition: 'Limestone, shale, sandstone',
    age: '~150 million years ago',
    fossils: 'Ammonites, belemnites, bivalves',
    description: 'Marine sedimentary layer deposited during warm shallow seas that covered much of the continent',
    layerColor: '#BBAA77',
    bgColor: '#0e1117',
    textColor: '#E8E8E8',
  },
})
