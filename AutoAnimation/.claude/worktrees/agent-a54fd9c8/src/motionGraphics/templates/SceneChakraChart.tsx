import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneChakraChartConfig {
  title: string
  bgColor: string
  textColor: string
}

const CHAKRAS = [
  { name: 'Crown', sanskrit: 'Sahasrara', color: '#9B59B6', element: 'Thought', position: 0 },
  { name: 'Third Eye', sanskrit: 'Ajna', color: '#4834D4', element: 'Light', position: 1 },
  { name: 'Throat', sanskrit: 'Vishuddha', color: '#22A6B3', element: 'Sound', position: 2 },
  { name: 'Heart', sanskrit: 'Anahata', color: '#27AE60', element: 'Air', position: 3 },
  { name: 'Solar Plexus', sanskrit: 'Manipura', color: '#F1C40F', element: 'Fire', position: 4 },
  { name: 'Sacral', sanskrit: 'Svadhisthana', color: '#E67E22', element: 'Water', position: 5 },
  { name: 'Root', sanskrit: 'Muladhara', color: '#E74C3C', element: 'Earth', position: 6 },
]

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneChakraChartComponent({ config, progress }: MotionGraphicProps<SceneChakraChartConfig>) {
  const { title, bgColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1
  const exitScale = exitProgress > 0 ? 1 - exitEased * 0.1 : 1

  const titleEnter = easeOutCubic(Math.min(1, enterProgress / 0.5))

  // Staggered spine line
  const spineEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.6)))

  const isHolding = progress >= 0.2 && progress < 0.8

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Subtle body silhouette glow */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '15%',
          width: '20%',
          height: '70%',
          background: `linear-gradient(180deg, ${CHAKRAS[0].color}06, ${CHAKRAS[3].color}04, ${CHAKRAS[6].color}06)`,
          borderRadius: '40% 40% 30% 30%',
          filter: 'blur(20px)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: 'clamp(16px, 4vw, 40px)',
          opacity: exitOpacity,
          transform: `scale(${exitScale})`,
        }}
      >
        {/* Title */}
        <div
          style={{
            fontSize: 'clamp(18px, 4vw, 34px)',
            fontWeight: 700,
            color: textColor,
            marginBottom: 'clamp(16px, 3vw, 32px)',
            opacity: titleEnter,
            transform: `translateY(${(1 - titleEnter) * 15}px)`,
          }}
        >
          {title}
        </div>

        {/* Chakra list */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {CHAKRAS.map((chakra, i) => {
            const delay = 0.2 + i * 0.08
            const itemEnter = easeOutBack(Math.max(0, Math.min(1, (enterProgress - delay) / 0.5)))
            const pulsePhase = isHolding ? Math.sin(holdProgress * Math.PI * 6 + i * 0.8) * 0.5 + 0.5 : 0
            const glowSize = 4 + pulsePhase * 8

            return (
              <div
                key={chakra.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(10px, 2vw, 20px)',
                  opacity: itemEnter,
                  transform: `translateX(${(1 - itemEnter) * 30}px)`,
                }}
              >
                {/* Chakra circle */}
                <div
                  style={{
                    width: 'clamp(24px, 5vw, 42px)',
                    height: 'clamp(24px, 5vw, 42px)',
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${chakra.color} 30%, ${chakra.color}80 100%)`,
                    boxShadow: `0 0 ${glowSize}px ${chakra.color}60`,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '40%',
                      height: '40%',
                      borderRadius: '50%',
                      background: `${chakra.color}40`,
                      border: `1px solid rgba(255,255,255,0.3)`,
                    }}
                  />
                </div>

                {/* Spine connector line */}
                {i < CHAKRAS.length - 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 'clamp(22px, 4.5vw, 39px)',
                      top: '100%',
                      width: 2,
                      height: 'clamp(8px, 1.5vw, 16px)',
                      background: `linear-gradient(180deg, ${chakra.color}30, ${CHAKRAS[i + 1].color}30)`,
                      opacity: spineEnter,
                    }}
                  />
                )}

                {/* Text info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 'clamp(4px, 0.8vw, 8px)' }}>
                    <span
                      style={{
                        fontSize: 'clamp(13px, 2.5vw, 22px)',
                        fontWeight: 700,
                        color: textColor,
                      }}
                    >
                      {chakra.name}
                    </span>
                    <span
                      style={{
                        fontSize: 'clamp(9px, 1.4vw, 13px)',
                        fontWeight: 400,
                        fontStyle: 'italic',
                        color: `${chakra.color}aa`,
                      }}
                    >
                      {chakra.sanskrit}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 'clamp(9px, 1.3vw, 12px)',
                      fontWeight: 500,
                      color: `${textColor}55`,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginTop: 2,
                    }}
                  >
                    Element: {chakra.element}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-chakra-chart',
  title: 'Chakra Chart',
  description: 'Seven chakra visualization with colors, Sanskrit names, elements, pulsing glow, and staggered reveal animation',
  tags: ['scene', 'chakra', 'meditation', 'yoga', 'energy', 'spiritual', 'mindfulness', 'wellness'],
  category: 'scene-layout',
  component: SceneChakraChartComponent as any,
  defaultConfig: {
    title: 'The 7 Chakras',
    bgColor: '#0a0a12',
    textColor: '#f0f0f0',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'The 7 Chakras', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a12', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#f0f0f0', group: 'Style' },
  ],
})
