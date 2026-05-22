import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CompostGuideConfig {
  title: string
  greenItems: string
  brownItems: string
  avoidItems: string
  temperature: number
  daysToFinish: number
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneCompostGuideComponent({ config, progress }: MotionGraphicProps<CompostGuideConfig>) {
  const { title, greenItems, brownItems, avoidItems, temperature, daysToFinish, bgColor, textColor, accentColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  const titleEnter = easeOutCubic(Math.min(1, enterProgress / 0.25))

  const sections = [
    { label: 'Greens (Nitrogen)', items: greenItems, color: '#4CAF50', icon: '\u{1F7E2}' },
    { label: 'Browns (Carbon)', items: brownItems, color: '#8D6E63', icon: '\u{1F7E4}' },
    { label: 'Avoid', items: avoidItems, color: '#EF5350', icon: '\u{1F6AB}' },
  ]

  const getSectionProg = (idx: number) =>
    easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.2 - idx * 0.12) / 0.35)))

  // Thermometer animation
  const thermProg = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.35)))
  const displayTemp = Math.round(thermProg * temperature)
  const thermFill = thermProg * (temperature / 80) * 100

  // Days counter
  const daysProg = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.3)))

  // Decomposition steam effect during hold
  const steamOpacity = progress >= 0.2 && progress < 0.8
    ? 0.2 + Math.sin(holdProgress * Math.PI * 6) * 0.15
    : 0

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '5%',
          opacity: exitOpacity,
          transform: `scale(${exitProgress > 0 ? 1 - exitEased * 0.08 : 1})`,
        }}
      >
        {/* Title */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 'clamp(14px, 2.5vh, 24px)',
            opacity: titleEnter,
            transform: `translateY(${(1 - titleEnter) * 12}px)`,
          }}
        >
          <div style={{ fontSize: 'clamp(20px, 5vw, 34px)', fontWeight: 900, color: textColor }}>
            {title}
          </div>
          <div style={{ fontSize: 'clamp(10px, 1.6vw, 12px)', color: `${textColor}77`, fontWeight: 500, marginTop: '2px' }}>
            What goes in your compost bin
          </div>
        </div>

        {/* Compost sections */}
        <div style={{ width: '100%', maxWidth: '400px', marginBottom: 'clamp(14px, 2.5vh, 22px)' }}>
          {sections.map((sec, i) => {
            const secProg = getSectionProg(i)
            const items = sec.items.split(',').map(s => s.trim()).filter(Boolean)

            return (
              <div
                key={i}
                style={{
                  marginBottom: 'clamp(8px, 1.5vh, 14px)',
                  opacity: secProg,
                  transform: `translateX(${(1 - secProg) * 25}px)`,
                }}
              >
                {/* Section header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'clamp(6px, 1vw, 10px)',
                    marginBottom: 'clamp(4px, 0.8vh, 8px)',
                  }}
                >
                  <span style={{ fontSize: 'clamp(12px, 2.5vw, 16px)' }}>{sec.icon}</span>
                  <span style={{ fontSize: 'clamp(12px, 2vw, 15px)', fontWeight: 800, color: sec.color }}>
                    {sec.label}
                  </span>
                </div>
                {/* Items as tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', paddingLeft: 'clamp(20px, 4vw, 30px)' }}>
                  {items.map((item, j) => (
                    <span
                      key={j}
                      style={{
                        background: `${sec.color}12`,
                        border: `1px solid ${sec.color}30`,
                        borderRadius: '100px',
                        padding: 'clamp(2px, 0.4vw, 4px) clamp(8px, 1.5vw, 12px)',
                        fontSize: 'clamp(9px, 1.3vw, 11px)',
                        color: `${textColor}cc`,
                        fontWeight: 500,
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom stats row */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(12px, 3vw, 24px)',
            width: '100%',
            maxWidth: '360px',
          }}
        >
          {/* Temperature */}
          <div
            style={{
              flex: 1,
              background: `${textColor}08`,
              borderRadius: 'clamp(8px, 1.5vw, 12px)',
              padding: 'clamp(10px, 2vw, 16px)',
              textAlign: 'center',
              opacity: thermProg,
              transform: `translateY(${(1 - thermProg) * 12}px)`,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Steam effect */}
            {[0, 1, 2].map((s) => (
              <div
                key={s}
                style={{
                  position: 'absolute',
                  top: `${10 + s * 15}%`,
                  left: `${30 + s * 20}%`,
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: `${textColor}`,
                  opacity: steamOpacity * (0.5 + s * 0.15),
                  filter: 'blur(3px)',
                  transform: `translateY(${-steamOpacity * 10}px)`,
                }}
              />
            ))}
            <div style={{ fontSize: 'clamp(10px, 1.5vw, 12px)', color: `${textColor}77`, fontWeight: 600, marginBottom: '4px' }}>
              {"🌡"}{'️'} Temp
            </div>
            <div style={{ fontSize: 'clamp(22px, 5vw, 34px)', fontWeight: 900, color: '#FF8A65' }}>
              {displayTemp}{'°'}
            </div>
            {/* Mini thermometer */}
            <div style={{ width: '100%', height: '4px', background: `${textColor}15`, borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
              <div style={{ width: `${thermFill}%`, height: '100%', background: 'linear-gradient(90deg, #FFB74D, #FF5722)', borderRadius: '2px' }} />
            </div>
          </div>

          {/* Days to finish */}
          <div
            style={{
              flex: 1,
              background: `${textColor}08`,
              borderRadius: 'clamp(8px, 1.5vw, 12px)',
              padding: 'clamp(10px, 2vw, 16px)',
              textAlign: 'center',
              opacity: daysProg,
              transform: `translateY(${(1 - daysProg) * 12}px)`,
            }}
          >
            <div style={{ fontSize: 'clamp(10px, 1.5vw, 12px)', color: `${textColor}77`, fontWeight: 600, marginBottom: '4px' }}>
              {'⏰'} Ready In
            </div>
            <div style={{ fontSize: 'clamp(22px, 5vw, 34px)', fontWeight: 900, color: accentColor }}>
              {Math.round(daysProg * daysToFinish)}
            </div>
            <div style={{ fontSize: 'clamp(9px, 1.3vw, 11px)', color: `${textColor}66`, fontWeight: 500 }}>
              days
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-compost-guide',
  title: 'Compost Guide',
  description: 'Composting guide with green/brown/avoid categories, tagged items, temperature gauge with steam effect, and days-to-finish counter.',
  tags: ['scene', 'compost', 'guide', 'organic', 'eco', 'sustainability', 'waste', 'garden'],
  category: 'scene-layout',
  component: SceneCompostGuideComponent as any,
  defaultConfig: {
    title: 'Compost Guide',
    greenItems: 'Fruit scraps, Vegetables, Coffee grounds, Grass',
    brownItems: 'Dry leaves, Cardboard, Paper, Straw',
    avoidItems: 'Meat, Dairy, Oil, Pet waste',
    temperature: 55,
    daysToFinish: 90,
    bgColor: '#1a1408',
    textColor: '#EFEBE9',
    accentColor: '#8D6E63',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Compost Guide', group: 'Content' },
    { key: 'greenItems', label: 'Green Items', type: 'text', defaultValue: 'Fruit scraps, Vegetables, Coffee grounds, Grass', group: 'Content' },
    { key: 'brownItems', label: 'Brown Items', type: 'text', defaultValue: 'Dry leaves, Cardboard, Paper, Straw', group: 'Content' },
    { key: 'avoidItems', label: 'Avoid Items', type: 'text', defaultValue: 'Meat, Dairy, Oil, Pet waste', group: 'Content' },
    { key: 'temperature', label: 'Temperature', type: 'number', defaultValue: 55, min: 0, max: 80, group: 'Content' },
    { key: 'daysToFinish', label: 'Days to Finish', type: 'number', defaultValue: 90, min: 1, max: 365, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1408', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#EFEBE9', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#8D6E63', group: 'Style' },
  ],
})
