import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RecyclingGuideConfig {
  title: string
  cat1Name: string
  cat1Items: string
  cat1Color: string
  cat2Name: string
  cat2Items: string
  cat2Color: string
  cat3Name: string
  cat3Items: string
  cat3Color: string
  cat4Name: string
  cat4Items: string
  cat4Color: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const binIcons = ['\u{267B}\uFE0F', '\u{1F4E6}', '\u{1F34E}', '\u{26A0}\uFE0F']

function SceneRecyclingGuideComponent({ config, progress }: MotionGraphicProps<RecyclingGuideConfig>) {
  const { title, cat1Name, cat1Items, cat1Color, cat2Name, cat2Items, cat2Color, cat3Name, cat3Items, cat3Color, cat4Name, cat4Items, cat4Color, bgColor, textColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  const titleEnter = easeOutCubic(Math.min(1, enterProgress / 0.3))

  const categories = [
    { name: cat1Name, items: cat1Items, color: cat1Color, icon: binIcons[0] },
    { name: cat2Name, items: cat2Items, color: cat2Color, icon: binIcons[1] },
    { name: cat3Name, items: cat3Items, color: cat3Color, icon: binIcons[2] },
    { name: cat4Name, items: cat4Items, color: cat4Color, icon: binIcons[3] },
  ]

  const getCatProgress = (idx: number) =>
    easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.2 - idx * 0.1) / 0.4)))

  // Bounce effect on hold
  const getHoldBounce = (idx: number) => {
    if (progress < 0.25 || progress >= 0.8) return 1
    return 1 + Math.sin(holdProgress * Math.PI * 4 + idx * 1.2) * 0.02
  }

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
          transform: `translateY(${exitEased * 30}px)`,
        }}
      >
        {/* Title with recycle icon */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 'clamp(16px, 3vh, 28px)',
            opacity: titleEnter,
            transform: `translateY(${(1 - titleEnter) * 15}px)`,
          }}
        >
          <div style={{ fontSize: 'clamp(22px, 5.5vw, 38px)', fontWeight: 900, color: textColor, letterSpacing: '-0.02em' }}>
            {title}
          </div>
          <div style={{ fontSize: 'clamp(10px, 1.6vw, 13px)', color: `${textColor}77`, fontWeight: 500, marginTop: '4px' }}>
            Sort it right, save the planet
          </div>
        </div>

        {/* Category grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'clamp(8px, 1.5vw, 14px)',
            width: '100%',
            maxWidth: '420px',
          }}
        >
          {categories.map((cat, i) => {
            const catProg = getCatProgress(i)
            const items = cat.items.split(',').map(s => s.trim()).filter(Boolean)
            const bounce = getHoldBounce(i)

            return (
              <div
                key={i}
                style={{
                  background: `${cat.color}12`,
                  border: `2px solid ${cat.color}35`,
                  borderRadius: 'clamp(8px, 1.5vw, 14px)',
                  padding: 'clamp(10px, 2vw, 18px)',
                  opacity: catProg,
                  transform: `scale(${catProg * bounce})`,
                }}
              >
                {/* Bin header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'clamp(4px, 0.8vw, 8px)',
                    marginBottom: 'clamp(6px, 1vh, 10px)',
                  }}
                >
                  <div
                    style={{
                      width: 'clamp(28px, 6vw, 40px)',
                      height: 'clamp(28px, 6vw, 40px)',
                      borderRadius: 'clamp(6px, 1vw, 10px)',
                      background: cat.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 'clamp(14px, 3vw, 20px)',
                    }}
                  >
                    {cat.icon}
                  </div>
                  <div style={{ fontSize: 'clamp(12px, 2vw, 16px)', fontWeight: 800, color: cat.color }}>
                    {cat.name}
                  </div>
                </div>

                {/* Item list */}
                {items.map((item, j) => (
                  <div
                    key={j}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '3px',
                    }}
                  >
                    <div
                      style={{
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        background: cat.color,
                        flexShrink: 0,
                        opacity: 0.6,
                      }}
                    />
                    <span style={{ fontSize: 'clamp(9px, 1.4vw, 12px)', color: `${textColor}cc`, fontWeight: 500 }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-recycling-guide',
  title: 'Recycling Guide',
  description: 'Recycling guide with 4 color-coded categories, each showing bin type and accepted items. Cards appear with bounce animation.',
  tags: ['scene', 'recycling', 'guide', 'waste', 'eco', 'sustainability', 'sort', 'green'],
  category: 'scene-layout',
  component: SceneRecyclingGuideComponent as any,
  defaultConfig: {
    title: 'Recycling Guide',
    cat1Name: 'Recyclable',
    cat1Items: 'Paper, Cardboard, Glass, Cans',
    cat1Color: '#4CAF50',
    cat2Name: 'Compost',
    cat2Items: 'Food scraps, Yard waste, Coffee grounds',
    cat2Color: '#8D6E63',
    cat3Name: 'General',
    cat3Items: 'Styrofoam, Chip bags, Diapers',
    cat3Color: '#78909C',
    cat4Name: 'Hazardous',
    cat4Items: 'Batteries, Paint, Electronics',
    cat4Color: '#FF7043',
    bgColor: '#0D1F0D',
    textColor: '#E8F5E9',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Recycling Guide', group: 'Content' },
    { key: 'cat1Name', label: 'Category 1 Name', type: 'text', defaultValue: 'Recyclable', group: 'Content' },
    { key: 'cat1Items', label: 'Category 1 Items', type: 'text', defaultValue: 'Paper, Cardboard, Glass, Cans', group: 'Content' },
    { key: 'cat1Color', label: 'Category 1 Color', type: 'color', defaultValue: '#4CAF50', group: 'Style' },
    { key: 'cat2Name', label: 'Category 2 Name', type: 'text', defaultValue: 'Compost', group: 'Content' },
    { key: 'cat2Items', label: 'Category 2 Items', type: 'text', defaultValue: 'Food scraps, Yard waste, Coffee grounds', group: 'Content' },
    { key: 'cat2Color', label: 'Category 2 Color', type: 'color', defaultValue: '#8D6E63', group: 'Style' },
    { key: 'cat3Name', label: 'Category 3 Name', type: 'text', defaultValue: 'General', group: 'Content' },
    { key: 'cat3Items', label: 'Category 3 Items', type: 'text', defaultValue: 'Styrofoam, Chip bags, Diapers', group: 'Content' },
    { key: 'cat3Color', label: 'Category 3 Color', type: 'color', defaultValue: '#78909C', group: 'Style' },
    { key: 'cat4Name', label: 'Category 4 Name', type: 'text', defaultValue: 'Hazardous', group: 'Content' },
    { key: 'cat4Items', label: 'Category 4 Items', type: 'text', defaultValue: 'Batteries, Paint, Electronics', group: 'Content' },
    { key: 'cat4Color', label: 'Category 4 Color', type: 'color', defaultValue: '#FF7043', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D1F0D', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E8F5E9', group: 'Style' },
  ],
})
