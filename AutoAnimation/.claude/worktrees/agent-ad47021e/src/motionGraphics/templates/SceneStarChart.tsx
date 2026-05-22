import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneStarChartConfig {
  title: string
  rightAscension: string
  declination: string
  epoch: string
  region: string
  magnitude: string
  bgColor: string
  textColor: string
  accentColor: string
  gridColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneStarChartComponent({ config, progress }: MotionGraphicProps<SceneStarChartConfig>) {
  const { title, rightAscension, declination, epoch, region, magnitude, bgColor, textColor, accentColor, gridColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.85 ? (progress - 0.85) / 0.15 : 0
  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  const gridEnter = easeOutCubic(Math.min(1, enterProgress / 0.4))
  const starsEnter = easeOutCubic(Math.max(0, (enterProgress - 0.15) / 0.5))
  const titleEnter = easeOutCubic(Math.max(0, (enterProgress - 0.4) / 0.4))
  const dataEnter = easeOutCubic(Math.max(0, (enterProgress - 0.6) / 0.4))

  // Chart area boundaries
  const chartLeft = 10
  const chartRight = 90
  const chartTop = 15
  const chartBottom = 65

  // Star positions on chart (seeded)
  const chartStars = Array.from({ length: 25 }, (_, i) => ({
    x: chartLeft + ((i * 61 + 17) % (chartRight - chartLeft)),
    y: chartTop + ((i * 43 + 11) % (chartBottom - chartTop)),
    size: 2 + ((i * 13) % 4),
    brightness: 0.3 + ((i * 29) % 7) / 10,
    label: i < 5 ? String.fromCharCode(945 + i) : '', // Alpha, beta, gamma...
  }))

  // Connect some stars into a pattern
  const connections = [
    [0, 1], [1, 2], [2, 3], [3, 4], [1, 3],
  ]

  // Slow chart rotation during hold
  const isHolding = progress >= 0.2 && progress < 0.85
  const chartRotation = isHolding ? holdProgress * 2 : 0

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        overflow: 'hidden',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        opacity: exitOpacity,
      }}
    >
      {/* Chart grid */}
      <div
        style={{
          position: 'absolute',
          left: `${chartLeft}%`,
          top: `${chartTop}%`,
          width: `${chartRight - chartLeft}%`,
          height: `${chartBottom - chartTop}%`,
          opacity: gridEnter,
          transform: `rotate(${chartRotation}deg)`,
        }}
      >
        {/* Horizontal grid lines */}
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={`h-${i}`}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${(i / 5) * 100}%`,
              height: 1,
              background: `${gridColor}15`,
            }}
          />
        ))}
        {/* Vertical grid lines */}
        {Array.from({ length: 9 }, (_, i) => (
          <div
            key={`v-${i}`}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${(i / 8) * 100}%`,
              width: 1,
              background: `${gridColor}15`,
            }}
          />
        ))}
        {/* Border */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            border: `1px solid ${gridColor}25`,
            borderRadius: 2,
          }}
        />
      </div>

      {/* RA/Dec axis labels */}
      <div style={{ position: 'absolute', bottom: `${100 - chartBottom - 3}%`, left: '50%', transform: 'translateX(-50%)', fontSize: 'clamp(7px, 1.3vw, 9px)', color: `${textColor}30`, letterSpacing: 1, opacity: gridEnter }}>
        RIGHT ASCENSION
      </div>
      <div style={{ position: 'absolute', top: '38%', left: `${chartLeft - 4}%`, transform: 'rotate(-90deg) translateX(-50%)', fontSize: 'clamp(7px, 1.3vw, 9px)', color: `${textColor}30`, letterSpacing: 1, opacity: gridEnter, transformOrigin: '0 0' }}>
        DECLINATION
      </div>

      {/* Constellation lines (SVG) */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: starsEnter }}>
        {connections.map(([a, b], i) => {
          if (a >= chartStars.length || b >= chartStars.length) return null
          const lineProgress = Math.max(0, Math.min(1, (starsEnter - i / connections.length * 0.5) / 0.5))
          const star1 = chartStars[a]
          const star2 = chartStars[b]
          const dx = star2.x - star1.x
          const dy = star2.y - star1.y
          return (
            <line
              key={i}
              x1={`${star1.x}%`}
              y1={`${star1.y}%`}
              x2={`${star1.x + dx * lineProgress}%`}
              y2={`${star1.y + dy * lineProgress}%`}
              stroke={accentColor}
              strokeWidth={1}
              opacity={0.35}
            />
          )
        })}
      </svg>

      {/* Chart stars */}
      {chartStars.map((star, i) => {
        const starDelay = i / chartStars.length * 0.5
        const starProgress = Math.max(0, Math.min(1, (starsEnter - starDelay) / 0.5))
        const twinkle = isHolding && i % 4 === 0 ? Math.sin(holdProgress * Math.PI * 8 + i) * 0.15 : 0
        return (
          <React.Fragment key={i}>
            <div
              style={{
                position: 'absolute',
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: star.size,
                height: star.size,
                borderRadius: '50%',
                background: i < 5 ? accentColor : '#FFFFFF',
                opacity: (star.brightness + twinkle) * starProgress,
                transform: `translate(-50%, -50%) scale(${starProgress})`,
                boxShadow: i < 5 ? `0 0 4px ${accentColor}60` : 'none',
              }}
            />
            {star.label && starProgress > 0.5 && (
              <div
                style={{
                  position: 'absolute',
                  left: `${star.x + 1.5}%`,
                  top: `${star.y - 2}%`,
                  fontSize: 'clamp(7px, 1.3vw, 10px)',
                  color: `${accentColor}80`,
                  fontStyle: 'italic',
                  opacity: starProgress,
                }}
              >
                {star.label}
              </div>
            )}
          </React.Fragment>
        )
      })}

      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: '4%',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          opacity: titleEnter,
        }}
      >
        <div style={{ fontSize: 'clamp(18px, 4.5vw, 32px)', fontWeight: 900, color: accentColor, textTransform: 'uppercase', letterSpacing: 'clamp(2px, 0.5vw, 5px)' }}>
          {title}
        </div>
        <div style={{ fontSize: 'clamp(9px, 1.8vw, 13px)', color: `${textColor}50`, marginTop: 2 }}>
          {region}
        </div>
      </div>

      {/* Navigation data */}
      <div
        style={{
          position: 'absolute',
          bottom: '6%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '85%',
          maxWidth: 440,
          display: 'flex',
          justifyContent: 'space-around',
          opacity: dataEnter,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'clamp(7px, 1.3vw, 9px)', color: `${textColor}40`, textTransform: 'uppercase', letterSpacing: 1 }}>RA</div>
          <div style={{ fontSize: 'clamp(12px, 2.5vw, 18px)', color: accentColor, fontWeight: 700, fontFamily: "'Courier New', monospace" }}>{rightAscension}</div>
        </div>
        <div style={{ width: 1, background: `${textColor}15` }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'clamp(7px, 1.3vw, 9px)', color: `${textColor}40`, textTransform: 'uppercase', letterSpacing: 1 }}>DEC</div>
          <div style={{ fontSize: 'clamp(12px, 2.5vw, 18px)', color: accentColor, fontWeight: 700, fontFamily: "'Courier New', monospace" }}>{declination}</div>
        </div>
        <div style={{ width: 1, background: `${textColor}15` }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'clamp(7px, 1.3vw, 9px)', color: `${textColor}40`, textTransform: 'uppercase', letterSpacing: 1 }}>MAG</div>
          <div style={{ fontSize: 'clamp(12px, 2.5vw, 18px)', color: textColor, fontWeight: 700, fontFamily: "'Courier New', monospace" }}>{magnitude}</div>
        </div>
        <div style={{ width: 1, background: `${textColor}15` }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'clamp(7px, 1.3vw, 9px)', color: `${textColor}40`, textTransform: 'uppercase', letterSpacing: 1 }}>Epoch</div>
          <div style={{ fontSize: 'clamp(12px, 2.5vw, 18px)', color: `${textColor}80`, fontWeight: 700, fontFamily: "'Courier New', monospace" }}>{epoch}</div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-star-chart',
  title: 'Star Chart',
  description: 'Navigational star chart with coordinate grid, plotted stars, constellation lines, RA/Dec coordinates, and magnitude data',
  tags: ['scene', 'space', 'star-chart', 'navigation', 'astronomy', 'coordinates', 'celestial'],
  category: 'scene-layout',
  component: SceneStarChartComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'title', label: 'Chart Title', type: 'text', defaultValue: 'Ursa Major', group: 'Content' },
    { key: 'region', label: 'Sky Region', type: 'text', defaultValue: 'Northern Circumpolar', group: 'Content' },
    { key: 'rightAscension', label: 'Right Ascension', type: 'text', defaultValue: '11h 03m', group: 'Content' },
    { key: 'declination', label: 'Declination', type: 'text', defaultValue: '+61° 45\'', group: 'Content' },
    { key: 'magnitude', label: 'Magnitude Range', type: 'text', defaultValue: '1.8 - 5.5', group: 'Content' },
    { key: 'epoch', label: 'Epoch', type: 'text', defaultValue: 'J2000', group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#60A5FA', group: 'Style' },
    { key: 'gridColor', label: 'Grid Color', type: 'color', defaultValue: '#A78BFA', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060818', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E2E8F0', group: 'Style' },
  ],
  defaultConfig: {
    title: 'Ursa Major',
    region: 'Northern Circumpolar',
    rightAscension: '11h 03m',
    declination: '+61° 45\'',
    magnitude: '1.8 - 5.5',
    epoch: 'J2000',
    accentColor: '#60A5FA',
    gridColor: '#A78BFA',
    bgColor: '#060818',
    textColor: '#E2E8F0',
  },
})
