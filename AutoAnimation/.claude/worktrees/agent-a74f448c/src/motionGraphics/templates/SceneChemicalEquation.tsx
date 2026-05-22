import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ChemicalEquationConfig {
  reactants: string
  products: string
  reactionType: string
  catalyst: string
  energyChange: string
  description: string
  bgColor: string
  textColor: string
  accentColor: string
  arrowColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
function easeInCubic(t: number): number { return t * t * t }

function SceneChemicalEquationComponent({ config, frame, durationInFrames }: MotionGraphicProps<ChemicalEquationConfig>) {
  const { reactants, products, reactionType, catalyst, energyChange, description, bgColor, textColor, accentColor, arrowColor } = config
  const progress = frame / durationInFrames

  // Reactants slide in from left (0.05-0.2)
  const reactFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.05) / 0.15)))

  // Arrow draws in (0.2-0.35)
  const arrowDraw = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.2) / 0.15)))

  // Products slide in from right (0.3-0.45)
  const prodFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.3) / 0.15)))

  // Catalyst label (0.35-0.45)
  const catFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.35) / 0.1)))

  // Details appear (0.45-0.65)
  const typeFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.45) / 0.1)))
  const energyFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.52) / 0.1)))
  const descFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.58) / 0.12)))

  // Arrow glow pulse (0.5-0.8)
  const arrowPulse = progress >= 0.5 && progress < 0.8 ? Math.sin(((progress - 0.5) / 0.3) * Math.PI * 6) * 0.5 + 0.5 : 0

  // Floating formula particles
  const particles = Array.from({ length: 12 }, (_, i) => {
    const x = ((i * 59 + 17) % 90) + 5
    const y = ((i * 41 + 29) % 90) + 5
    const drift = Math.sin(progress * Math.PI * 4 + i * 1.3) * 2
    return { x: x + drift, y: y + Math.cos(progress * Math.PI * 3 + i) * 1.5 }
  })

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
        transform: `scale(${1 - exitProg * 0.15})`,
      }}
    >
      {/* Background particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: 3,
            height: 3,
            borderRadius: '50%',
            background: `${accentColor}0A`,
          }}
        />
      ))}

      {/* Equation container - centered */}
      <div
        style={{
          position: 'absolute',
          top: '25%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '85%',
          maxWidth: 600,
          textAlign: 'center',
        }}
      >
        {/* Reaction type label */}
        <div
          style={{
            fontSize: 'clamp(10px, 2vw, 16px)',
            color: accentColor,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            marginBottom: 'clamp(16px, 4vw, 32px)',
            opacity: typeFade,
          }}
        >
          {reactionType}
        </div>

        {/* Main equation row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'clamp(10px, 2.5vw, 24px)',
            marginBottom: 'clamp(8px, 2vw, 16px)',
          }}
        >
          {/* Reactants */}
          <div
            style={{
              fontSize: 'clamp(22px, 6vw, 48px)',
              fontWeight: 800,
              color: textColor,
              fontFamily: "'Courier New', monospace",
              opacity: reactFade,
              transform: `translateX(${(1 - reactFade) * -60}px)`,
            }}
          >
            {reactants}
          </div>

          {/* Arrow */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              position: 'relative',
              minWidth: 'clamp(40px, 10vw, 80px)',
            }}
          >
            {/* Catalyst above arrow */}
            <div
              style={{
                fontSize: 'clamp(9px, 1.8vw, 14px)',
                color: `${accentColor}CC`,
                fontWeight: 600,
                position: 'absolute',
                top: '-1.8em',
                whiteSpace: 'nowrap',
                opacity: catFade,
              }}
            >
              {catalyst}
            </div>
            {/* Arrow line */}
            <div
              style={{
                width: `${arrowDraw * 100}%`,
                height: 3,
                background: arrowColor,
                borderRadius: 2,
                boxShadow: arrowPulse > 0 ? `0 0 ${arrowPulse * 12}px ${arrowColor}60` : 'none',
                position: 'relative',
              }}
            >
              {/* Arrow head */}
              {arrowDraw > 0.8 && (
                <div
                  style={{
                    position: 'absolute',
                    right: -2,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 0,
                    height: 0,
                    borderTop: '6px solid transparent',
                    borderBottom: '6px solid transparent',
                    borderLeft: `10px solid ${arrowColor}`,
                  }}
                />
              )}
            </div>
          </div>

          {/* Products */}
          <div
            style={{
              fontSize: 'clamp(22px, 6vw, 48px)',
              fontWeight: 800,
              color: textColor,
              fontFamily: "'Courier New', monospace",
              opacity: prodFade,
              transform: `translateX(${(1 - prodFade) * 60}px)`,
            }}
          >
            {products}
          </div>
        </div>
      </div>

      {/* Bottom info */}
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80%',
          maxWidth: 500,
        }}
      >
        {/* Energy change */}
        <div
          style={{
            fontSize: 'clamp(13px, 2.8vw, 22px)',
            color: `${textColor}80`,
            marginBottom: 'clamp(8px, 2vw, 16px)',
            opacity: energyFade,
            transform: `translateX(${(1 - energyFade) * 20}px)`,
          }}
        >
          <span style={{ color: accentColor, fontWeight: 700, marginRight: 8 }}>ENERGY</span>
          {energyChange}
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: 'clamp(13px, 2.8vw, 22px)',
            color: `${textColor}99`,
            lineHeight: 1.5,
            borderLeft: `3px solid ${accentColor}50`,
            paddingLeft: 'clamp(8px, 2vw, 16px)',
            opacity: descFade,
            transform: `translateY(${(1 - descFade) * 12}px)`,
          }}
        >
          {description}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-chemical-equation',
  title: 'Chemical Equation',
  description: 'Balanced chemical equation with animated reactants, arrow, products, catalyst label, energy change, and description',
  tags: ['scene', 'science', 'chemistry', 'equation', 'reaction', 'educational'],
  category: 'scene-layout',
  component: SceneChemicalEquationComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'reactants', label: 'Reactants', type: 'text', defaultValue: '2H2 + O2', group: 'Content' },
    { key: 'products', label: 'Products', type: 'text', defaultValue: '2H2O', group: 'Content' },
    { key: 'reactionType', label: 'Reaction Type', type: 'text', defaultValue: 'Combustion', group: 'Content' },
    { key: 'catalyst', label: 'Catalyst', type: 'text', defaultValue: 'Spark', group: 'Content' },
    { key: 'energyChange', label: 'Energy Change', type: 'text', defaultValue: 'Exothermic (-572 kJ/mol)', group: 'Content' },
    { key: 'description', label: 'Description', type: 'text', defaultValue: 'Hydrogen combustion produces water and releases energy', group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#FF9F43', group: 'Style' },
    { key: 'arrowColor', label: 'Arrow Color', type: 'color', defaultValue: '#FFD700', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0e1117', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E8E8E8', group: 'Style' },
  ],
  defaultConfig: {
    reactants: '2H2 + O2',
    products: '2H2O',
    reactionType: 'Combustion',
    catalyst: 'Spark',
    energyChange: 'Exothermic (-572 kJ/mol)',
    description: 'Hydrogen combustion produces water and releases energy',
    accentColor: '#FF9F43',
    arrowColor: '#FFD700',
    bgColor: '#0e1117',
    textColor: '#E8E8E8',
  },
})
