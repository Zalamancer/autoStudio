import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneCompetitorMatrixConfig {
  competitors: string[]
  features: string[]
  title: string
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneCompetitorMatrixComponent({ config, progress }: MotionGraphicProps<SceneCompetitorMatrixConfig>) {
  const { competitors, features, title, bgColor, textColor, accentColor } = config

  // Parse competitors: "Name:Y,Y,N,Y" format
  const parsed = competitors.map(c => {
    const [name, ...rest] = c.split(':')
    const vals = (rest.join(':') || '').split(',').map(v => v.trim().toUpperCase())
    return { name: (name || '').trim(), values: vals }
  })

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0
  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  const cols = parsed.length + 1
  const rows = features.length + 1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '5% 6%',
        opacity: exitOpacity,
      }}>
        {/* Title */}
        <div style={{
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(13px, 2.8vw, 22px)',
          fontWeight: 700,
          color: textColor,
          marginBottom: 'clamp(12px, 3vw, 28px)',
          opacity: easeOutCubic(enterProgress),
          letterSpacing: '-0.01em',
        }}>
          {title}
        </div>

        {/* Matrix table */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `minmax(60px, 1.2fr) repeat(${parsed.length}, 1fr)`,
          gap: 1,
          width: '100%',
          maxWidth: 500,
          background: `${textColor}06`,
          borderRadius: 'clamp(8px, 1.5vw, 14px)',
          overflow: 'hidden',
          border: `1px solid ${textColor}08`,
        }}>
          {/* Header row */}
          <div style={{
            padding: 'clamp(8px, 2vw, 14px)',
            background: `${textColor}04`,
          }} />
          {parsed.map((comp, ci) => {
            const stagger = ci * 0.08
            const cellEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger))))
            const isFirst = ci === 0
            return (
              <div key={`h-${ci}`} style={{
                padding: 'clamp(8px, 2vw, 14px)',
                textAlign: 'center',
                background: isFirst ? `${accentColor}12` : `${textColor}04`,
                opacity: cellEnter,
                borderLeft: `1px solid ${textColor}06`,
              }}>
                <div style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(9px, 1.8vw, 13px)',
                  fontWeight: 700,
                  color: isFirst ? accentColor : textColor,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}>
                  {comp.name}
                </div>
              </div>
            )
          })}

          {/* Feature rows */}
          {features.map((feature, fi) => {
            const rowStagger = fi * 0.08 + 0.1
            const rowEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - rowStagger) / (0.8 - rowStagger))))
            return (
              <React.Fragment key={`r-${fi}`}>
                {/* Feature label */}
                <div style={{
                  padding: 'clamp(8px, 2vw, 14px)',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(8px, 1.6vw, 12px)',
                  fontWeight: 600,
                  color: `${textColor}80`,
                  display: 'flex',
                  alignItems: 'center',
                  background: fi % 2 === 0 ? 'transparent' : `${textColor}02`,
                  opacity: rowEnter,
                  borderTop: `1px solid ${textColor}06`,
                }}>
                  {feature}
                </div>
                {/* Values */}
                {parsed.map((comp, ci) => {
                  const val = comp.values[fi] || 'N'
                  const isYes = val === 'Y' || val === 'YES'
                  const isFirst = ci === 0
                  const cellStagger = rowStagger + ci * 0.04
                  const cellEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - cellStagger) / (0.8 - cellStagger))))
                  // Hold: checkmarks bounce
                  const holdBounce = progress >= 0.25 && progress < 0.8 && isYes && isFirst
                    ? 1 + Math.sin(holdProgress * Math.PI * 4 + fi + ci) * 0.08
                    : 1

                  return (
                    <div key={`c-${fi}-${ci}`} style={{
                      padding: 'clamp(8px, 2vw, 14px)',
                      textAlign: 'center',
                      background: isFirst
                        ? fi % 2 === 0 ? `${accentColor}06` : `${accentColor}08`
                        : fi % 2 === 0 ? 'transparent' : `${textColor}02`,
                      borderTop: `1px solid ${textColor}06`,
                      borderLeft: `1px solid ${textColor}06`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: cellEnter,
                    }}>
                      <div style={{
                        fontSize: 'clamp(12px, 2.5vw, 18px)',
                        fontWeight: 700,
                        transform: `scale(${cellEnter * holdBounce})`,
                        color: isYes
                          ? isFirst ? accentColor : '#10B981'
                          : `${textColor}25`,
                      }}>
                        {isYes ? '\u2713' : '\u2717'}
                      </div>
                    </div>
                  )
                })}
              </React.Fragment>
            )
          })}
        </div>

        {/* "Our product" highlight note */}
        {parsed.length > 0 && (
          <div style={{
            marginTop: 'clamp(10px, 2.5vw, 20px)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            opacity: easeOutCubic(Math.max(0, (enterProgress - 0.6) / 0.4)),
          }}>
            <div style={{
              width: 8, height: 8,
              borderRadius: 2,
              background: accentColor,
            }} />
            <span style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(8px, 1.4vw, 11px)',
              fontWeight: 500,
              color: `${textColor}50`,
            }}>
              = Your product (highlighted)
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-competitor-matrix',
  title: 'Competitor Matrix',
  description: 'Competitive analysis feature matrix with check/cross marks, highlighted own product column, staggered cell entrance animation.',
  tags: ['scene', 'competitor', 'matrix', 'comparison', 'analysis', 'marketing', 'business', 'features'],
  category: 'scene-layout',
  component: SceneCompetitorMatrixComponent as any,
  defaultConfig: {
    competitors: ['Us:Y,Y,Y,Y,Y', 'Competitor A:Y,N,Y,N,Y', 'Competitor B:N,Y,N,Y,N'],
    features: ['AI Analytics', 'Real-time Data', 'Custom Reports', 'API Access', '24/7 Support'],
    title: 'Feature Comparison',
    accentColor: '#3B82F6',
    bgColor: '#0f172a',
    textColor: '#e2e8f0',
  },
  configSchema: [
    { key: 'competitors', label: 'Competitors (Name:Y,N,Y...)', type: 'text-array', defaultValue: ['Us:Y,Y,Y,Y,Y', 'Competitor A:Y,N,Y,N,Y', 'Competitor B:N,Y,N,Y,N'], group: 'Content' },
    { key: 'features', label: 'Features', type: 'text-array', defaultValue: ['AI Analytics', 'Real-time Data', 'Custom Reports', 'API Access', '24/7 Support'], group: 'Content' },
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Feature Comparison', group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#3B82F6', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
  ],
})
