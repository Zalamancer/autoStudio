import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WineCardConfig {
  wineName: string
  winery: string
  year: string
  region: string
  notes: string
  pairing: string
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneWineCardComponent({ config, progress }: MotionGraphicProps<WineCardConfig>) {
  const { wineName, winery, year, region, notes, pairing, bgColor, cardColor, accentColor, textColor } = config

  const enterProgress = progress < 0.22 ? progress / 0.22 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Card slides from right
  const cardEnter = easeOutCubic(Math.min(1, enterProgress / 0.4))
  const cardX = (1 - cardEnter) * 60

  // Wine glass icon scales
  const glassEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.3)))

  // Details fade in staggered
  const getDetailProgress = (i: number): number => {
    const start = 0.35 + i * 0.1
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - start) / 0.25)))
  }

  // Decorative line
  const lineEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.25)))

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Georgia', 'Palatino', serif",
      }}
    >
      {/* Subtle wine-stain background accent */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          right: '10%',
          width: 120,
          height: 120,
          borderRadius: '50%',
          border: '3px solid rgba(128,0,32,0.04)',
          background: 'radial-gradient(circle, rgba(128,0,32,0.02) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6%',
          opacity: exitOpacity,
          transform: `translateX(${exitEased * 40}px)`,
        }}
      >
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(14px, 2vw, 22px)',
            padding: 'clamp(24px, 4.5%, 40px)',
            maxWidth: 420,
            width: '100%',
            boxShadow: '0 10px 36px rgba(0,0,0,0.08)',
            borderLeft: `4px solid ${accentColor}`,
            transform: `translateX(${cardX}px)`,
            opacity: cardEnter,
          }}
        >
          {/* Wine glass icon */}
          <div
            style={{
              fontSize: 'clamp(28px, 5vw, 42px)',
              textAlign: 'center',
              marginBottom: 'clamp(8px, 1.5vh, 14px)',
              transform: `scale(${glassEnter})`,
              opacity: glassEnter,
            }}
          >
            {'\uD83C\uDF77'}
          </div>

          {/* Wine name */}
          <div
            style={{
              fontSize: 'clamp(22px, 5vw, 36px)',
              fontWeight: 700,
              color: textColor,
              textAlign: 'center',
              lineHeight: 1.2,
              marginBottom: 'clamp(2px, 0.5vh, 6px)',
              opacity: cardEnter,
            }}
          >
            {wineName}
          </div>

          {/* Winery + year */}
          <div
            style={{
              fontSize: 'clamp(11px, 1.8vw, 14px)',
              color: `${textColor}80`,
              textAlign: 'center',
              marginBottom: 'clamp(6px, 1vh, 12px)',
              opacity: getDetailProgress(0),
            }}
          >
            {winery} &middot; {year}
          </div>

          {/* Decorative divider */}
          <div
            style={{
              height: 1,
              background: `linear-gradient(90deg, transparent, ${accentColor}40, transparent)`,
              margin: 'clamp(8px, 1.5vh, 14px) 15%',
              transform: `scaleX(${lineEnter})`,
              transformOrigin: 'center',
            }}
          />

          {/* Region */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 8,
              alignItems: 'center',
              marginBottom: 'clamp(12px, 2vh, 18px)',
              opacity: getDetailProgress(1),
              transform: `translateY(${(1 - getDetailProgress(1)) * 10}px)`,
            }}
          >
            <span style={{ fontSize: 'clamp(10px, 1.5vw, 12px)', color: accentColor, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              Region
            </span>
            <span style={{ fontSize: 'clamp(12px, 2vw, 15px)', color: textColor, fontWeight: 500 }}>
              {region}
            </span>
          </div>

          {/* Tasting Notes */}
          <div
            style={{
              marginBottom: 'clamp(12px, 2vh, 18px)',
              opacity: getDetailProgress(2),
              transform: `translateY(${(1 - getDetailProgress(2)) * 10}px)`,
            }}
          >
            <div
              style={{
                fontSize: 'clamp(9px, 1.4vw, 11px)',
                fontWeight: 700,
                color: accentColor,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                marginBottom: 'clamp(4px, 0.6vh, 8px)',
              }}
            >
              Tasting Notes
            </div>
            <div
              style={{
                fontSize: 'clamp(12px, 1.9vw, 15px)',
                color: `${textColor}CC`,
                lineHeight: 1.5,
                fontStyle: 'italic',
              }}
            >
              {notes}
            </div>
          </div>

          {/* Pairing */}
          <div
            style={{
              background: `${accentColor}08`,
              borderRadius: 10,
              padding: 'clamp(10px, 1.8vh, 16px)',
              opacity: getDetailProgress(3),
              transform: `translateY(${(1 - getDetailProgress(3)) * 10}px)`,
            }}
          >
            <div
              style={{
                fontSize: 'clamp(9px, 1.4vw, 11px)',
                fontWeight: 700,
                color: accentColor,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                marginBottom: 'clamp(3px, 0.4vh, 6px)',
              }}
            >
              Pairs With
            </div>
            <div
              style={{
                fontSize: 'clamp(12px, 1.9vw, 15px)',
                color: textColor,
                fontWeight: 500,
              }}
            >
              {pairing}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-wine-card',
  title: 'Wine Card',
  description: 'Elegant wine tasting notes card with vineyard details, tasting notes, and food pairing on warm cream background',
  tags: ['scene', 'food', 'wine', 'tasting', 'sommelier', 'restaurant', 'elegant'],
  category: 'scene-layout',
  component: SceneWineCardComponent as any,
  defaultConfig: {
    wineName: 'Chateau Margaux',
    winery: 'Margaux Estate',
    year: '2018',
    region: 'Bordeaux, France',
    notes: 'Rich blackcurrant and cedar with hints of violet. Silky tannins and a long, elegant finish.',
    pairing: 'Grilled lamb chops, aged Gouda',
    bgColor: '#F9F3EC',
    cardColor: '#FFFFFF',
    accentColor: '#800020',
    textColor: '#2C1810',
  },
  configSchema: [
    { key: 'wineName', label: 'Wine Name', type: 'text', defaultValue: 'Chateau Margaux', group: 'Content' },
    { key: 'winery', label: 'Winery', type: 'text', defaultValue: 'Margaux Estate', group: 'Content' },
    { key: 'year', label: 'Year', type: 'text', defaultValue: '2018', group: 'Content' },
    { key: 'region', label: 'Region', type: 'text', defaultValue: 'Bordeaux, France', group: 'Content' },
    { key: 'notes', label: 'Tasting Notes', type: 'text', defaultValue: 'Rich blackcurrant and cedar with hints of violet. Silky tannins and a long, elegant finish.', group: 'Content' },
    { key: 'pairing', label: 'Pairs With', type: 'text', defaultValue: 'Grilled lamb chops, aged Gouda', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F9F3EC', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#800020', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#2C1810', group: 'Style' },
  ],
})
