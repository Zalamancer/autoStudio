import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneTemperatureMapConfig {
  title: string
  regions: string
  temps: string
  unit: string
  bgColor: string
  textColor: string
  coldColor: string
  hotColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function lerpColor(cold: string, hot: string, t: number): string {
  const parseHex = (hex: string) => {
    const h = hex.replace('#', '')
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
  }
  const [r1, g1, b1] = parseHex(cold)
  const [r2, g2, b2] = parseHex(hot)
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  return `rgb(${r},${g},${b})`
}

function SceneTemperatureMapComponent({ config, progress }: MotionGraphicProps<SceneTemperatureMapConfig>) {
  const { title, regions, temps, unit, bgColor, textColor, coldColor, hotColor } = config

  const regionList = regions.split(',').map(s => s.trim())
  const tempList = temps.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n))

  const minTemp = Math.min(...tempList)
  const maxTemp = Math.max(...tempList)
  const tempRange = maxTemp - minTemp || 1

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1
  const titleEnter = easeOutCubic(Math.min(1, enterProgress / 0.3))

  const getRegionProgress = (index: number): number => {
    const start = 0.15 + index * 0.08
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - start) / 0.6)))
  }

  // Grid layout for heat map cells
  const cols = Math.min(regionList.length, 4)
  const rows = Math.ceil(regionList.length / cols)

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '6% 5%',
        opacity: exitOpacity,
      }}>
        {/* Title */}
        <div style={{
          fontSize: 'clamp(20px, 5vw, 38px)',
          fontWeight: 800,
          color: textColor,
          opacity: titleEnter,
          transform: `translateY(${(1 - titleEnter) * -15}px)`,
          marginBottom: 'clamp(4px, 1vh, 10px)',
          letterSpacing: '-0.02em',
        }}>
          {title}
        </div>

        {/* Color legend */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(6px, 1vw, 12px)',
          marginBottom: 'clamp(14px, 3vh, 28px)',
          opacity: titleEnter,
        }}>
          <span style={{ fontSize: 'clamp(10px, 1.8vw, 14px)', color: coldColor, fontWeight: 600 }}>
            {Math.round(minTemp)}°{unit}
          </span>
          <div style={{
            width: 'clamp(80px, 20vw, 160px)',
            height: 'clamp(6px, 1vw, 10px)',
            borderRadius: 5,
            background: `linear-gradient(90deg, ${coldColor}, ${hotColor})`,
          }} />
          <span style={{ fontSize: 'clamp(10px, 1.8vw, 14px)', color: hotColor, fontWeight: 600 }}>
            {Math.round(maxTemp)}°{unit}
          </span>
        </div>

        {/* Heat map grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 'clamp(4px, 0.8vw, 8px)',
          width: '90%',
          maxWidth: 'clamp(260px, 70vw, 500px)',
        }}>
          {regionList.map((region, i) => {
            const regProg = getRegionProgress(i)
            const temp = tempList[i] ?? minTemp
            const normTemp = (temp - minTemp) / tempRange
            const cellColor = lerpColor(coldColor, hotColor, normTemp)

            // Subtle pulse on hot cells during hold
            const pulseScale = normTemp > 0.7 && progress >= 0.25 && progress < 0.8
              ? 1 + Math.sin(holdProgress * Math.PI * 6 + i) * 0.02
              : 1

            const animatedTemp = Math.round(temp * easeOutCubic(regProg))

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 'clamp(8px, 1.5vw, 16px) clamp(4px, 1vw, 10px)',
                  borderRadius: 'clamp(6px, 1vw, 10px)',
                  background: `${cellColor}25`,
                  border: `2px solid ${cellColor}50`,
                  opacity: regProg,
                  transform: `scale(${(0.85 + regProg * 0.15) * pulseScale})`,
                  boxShadow: `inset 0 0 20px ${cellColor}15, 0 0 10px ${cellColor}10`,
                }}
              >
                <div style={{
                  fontSize: 'clamp(9px, 1.6vw, 13px)',
                  fontWeight: 600,
                  color: `${textColor}99`,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 'clamp(2px, 0.4vh, 6px)',
                  textAlign: 'center',
                }}>
                  {region}
                </div>
                <div style={{
                  fontSize: 'clamp(22px, 5vw, 38px)',
                  fontWeight: 900,
                  color: cellColor,
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1,
                  textShadow: `0 0 12px ${cellColor}40`,
                }}>
                  {animatedTemp}°
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
  id: 'tpl-scene-temperature-map',
  title: 'Temperature Map',
  description: 'Heat map grid showing temperature data across multiple regions with color-coded cells',
  tags: ['scene', 'weather', 'temperature', 'heat-map', 'climate', 'data', 'map'],
  category: 'scene-layout',
  component: SceneTemperatureMapComponent as any,
  defaultConfig: {
    title: 'Temperature Map',
    regions: 'North,South,East,West,Central,Coast',
    temps: '45,78,62,55,68,72',
    unit: 'F',
    bgColor: '#0a0e17',
    textColor: '#e2e8f0',
    coldColor: '#3b82f6',
    hotColor: '#ef4444',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Temperature Map', group: 'Content' },
    { key: 'regions', label: 'Regions (comma-separated)', type: 'text', defaultValue: 'North,South,East,West,Central,Coast', group: 'Content' },
    { key: 'temps', label: 'Temperatures (comma-separated)', type: 'text', defaultValue: '45,78,62,55,68,72', group: 'Content' },
    { key: 'unit', label: 'Unit (F/C)', type: 'text', defaultValue: 'F', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0e17', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
    { key: 'coldColor', label: 'Cold Color', type: 'color', defaultValue: '#3b82f6', group: 'Style' },
    { key: 'hotColor', label: 'Hot Color', type: 'color', defaultValue: '#ef4444', group: 'Style' },
  ],
})
