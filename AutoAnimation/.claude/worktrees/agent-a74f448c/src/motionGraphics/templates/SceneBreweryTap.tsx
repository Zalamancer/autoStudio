import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BreweryTapConfig {
  breweryName: string
  beers: string[]
  styles: string[]
  abvs: string[]
  bgColor: string
  accentColor: string
  textColor: string
  headerColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneBreweryTapComponent({ config, progress }: MotionGraphicProps<BreweryTapConfig>) {
  const { breweryName, beers, styles, abvs, bgColor, accentColor, textColor, headerColor } = config

  const enterProgress = progress < 0.22 ? progress / 0.22 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Board drops in
  const boardEnter = easeOutCubic(Math.min(1, enterProgress / 0.35))
  const boardY = (1 - boardEnter) * -80

  // Header slides
  const headerEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.25)))

  // Lines draw
  const lineEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.2)))

  // Beer rows staggered
  const getBeerProgress = (i: number): number => {
    const start = 0.3 + i * 0.08
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - start) / 0.2)))
  }

  const displayBeers = beers.slice(0, 6)

  // Beer color indicators (amber/dark/light tones)
  const beerColors = ['#D4A017', '#8B4513', '#F5DEB3', '#CD853F', '#B8860B', '#A0522D']

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
      }}
    >
      {/* Grain texture */}
      {Array.from({ length: 30 }, (_, i) => {
        const seed = i * 53 + 7
        const x = (seed * 11) % 100
        const y = (seed * 17) % 100
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: 1,
              height: 1 + (seed % 3),
              background: `rgba(255,255,255,0.02)`,
              pointerEvents: 'none',
            }}
          />
        )
      })}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '5%',
          opacity: exitOpacity,
          transform: `translateY(${exitEased * -50}px)`,
        }}
      >
        <div
          style={{
            background: '#1A1410',
            borderRadius: 8,
            maxWidth: 460,
            width: '100%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
            border: '4px solid #3D2B1F',
            overflow: 'hidden',
            transform: `translateY(${boardY}px)`,
            opacity: boardEnter,
          }}
        >
          {/* Header */}
          <div
            style={{
              background: headerColor,
              padding: 'clamp(14px, 2.5vh, 22px) clamp(20px, 3.5%, 32px)',
              textAlign: 'center',
              opacity: headerEnter,
            }}
          >
            <div
              style={{
                fontSize: 'clamp(8px, 1.2vw, 10px)',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.7)',
                textTransform: 'uppercase',
                letterSpacing: '0.25em',
                marginBottom: 4,
              }}
            >
              On Tap Today
            </div>
            <div
              style={{
                fontSize: 'clamp(20px, 4.5vw, 32px)',
                fontWeight: 900,
                color: '#FFFFFF',
                textTransform: 'uppercase',
                letterSpacing: 3,
              }}
            >
              {breweryName}
            </div>
          </div>

          {/* Column headers */}
          <div
            style={{
              display: 'flex',
              padding: 'clamp(8px, 1.2vh, 12px) clamp(16px, 3%, 24px)',
              borderBottom: '2px solid rgba(255,255,255,0.08)',
              opacity: lineEnter,
            }}
          >
            <div style={{ flex: 1, fontSize: 'clamp(8px, 1.2vw, 10px)', fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Beer
            </div>
            <div style={{ width: '30%', fontSize: 'clamp(8px, 1.2vw, 10px)', fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.12em', textAlign: 'center' }}>
              Style
            </div>
            <div style={{ width: '15%', fontSize: 'clamp(8px, 1.2vw, 10px)', fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.12em', textAlign: 'right' }}>
              ABV
            </div>
          </div>

          {/* Beer list */}
          <div style={{ padding: '0 clamp(16px, 3%, 24px)' }}>
            {displayBeers.map((beer, i) => {
              const bp = getBeerProgress(i)
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: 'clamp(10px, 1.5vh, 14px) 0',
                    borderBottom: i < displayBeers.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    opacity: bp,
                    transform: `translateX(${(1 - bp) * 20}px)`,
                  }}
                >
                  {/* Beer color dot */}
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: beerColors[i % beerColors.length],
                      marginRight: 'clamp(8px, 1.5vw, 12px)',
                      flexShrink: 0,
                      boxShadow: `0 0 6px ${beerColors[i % beerColors.length]}40`,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 'clamp(13px, 2.2vw, 17px)',
                        fontWeight: 700,
                        color: textColor,
                      }}
                    >
                      {beer}
                    </div>
                  </div>
                  <div
                    style={{
                      width: '30%',
                      fontSize: 'clamp(10px, 1.6vw, 13px)',
                      color: `${textColor}90`,
                      textAlign: 'center',
                    }}
                  >
                    {styles[i] || ''}
                  </div>
                  <div
                    style={{
                      width: '15%',
                      fontSize: 'clamp(12px, 2vw, 15px)',
                      fontWeight: 800,
                      color: accentColor,
                      textAlign: 'right',
                    }}
                  >
                    {abvs[i] || ''}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: 'clamp(10px, 1.5vh, 14px) clamp(16px, 3%, 24px)',
              textAlign: 'center',
              fontSize: 'clamp(8px, 1.2vw, 10px)',
              color: 'rgba(255,255,255,0.3)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              opacity: getBeerProgress(displayBeers.length - 1),
            }}
          >
            Ask your server about our rotating selections
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-brewery-tap',
  title: 'Brewery Tap List',
  description: 'Dark brewery tap list board with beer color dots, ABV column, style labels, and warm amber accents on dark wood',
  tags: ['scene', 'food', 'beer', 'brewery', 'tap', 'craft', 'bar', 'pub'],
  category: 'scene-layout',
  component: SceneBreweryTapComponent as any,
  defaultConfig: {
    breweryName: 'Iron Hops Brewery',
    beers: ['Golden Harvest Lager', 'Midnight Stout', 'Hazy Daydream IPA', 'Copper Ale', 'Wheat & Honey', 'Dark Roast Porter'],
    styles: ['Lager', 'Stout', 'IPA', 'Amber Ale', 'Wheat', 'Porter'],
    abvs: ['4.5%', '6.8%', '7.2%', '5.4%', '4.8%', '6.1%'],
    bgColor: '#0D0A07',
    accentColor: '#D4A017',
    textColor: '#F0E6D0',
    headerColor: '#2D1B0E',
  },
  configSchema: [
    { key: 'breweryName', label: 'Brewery Name', type: 'text', defaultValue: 'Iron Hops Brewery', group: 'Content' },
    { key: 'beers', label: 'Beer Names', type: 'text-array', defaultValue: ['Golden Harvest Lager', 'Midnight Stout', 'Hazy Daydream IPA', 'Copper Ale', 'Wheat & Honey', 'Dark Roast Porter'], group: 'Content' },
    { key: 'styles', label: 'Styles', type: 'text-array', defaultValue: ['Lager', 'Stout', 'IPA', 'Amber Ale', 'Wheat', 'Porter'], group: 'Content' },
    { key: 'abvs', label: 'ABVs', type: 'text-array', defaultValue: ['4.5%', '6.8%', '7.2%', '5.4%', '4.8%', '6.1%'], group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D0A07', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#D4A017', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#F0E6D0', group: 'Style' },
    { key: 'headerColor', label: 'Header Color', type: 'color', defaultValue: '#2D1B0E', group: 'Style' },
  ],
})
