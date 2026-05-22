import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneFutureCityConfig {
  cityName: string
  population: string
  airQuality: number
  energyOutput: string
  crimeRate: number
  connectivity: number
  district: string
  bgColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneFutureCityComponent({ config, progress }: MotionGraphicProps<SceneFutureCityConfig>) {
  const { cityName, population, airQuality, energyOutput, crimeRate, connectivity, district, bgColor, accentColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1
  const cardScale = 0.9 + easeOutCubic(enterProgress) * 0.1
  const cardOpacity = easeOutCubic(Math.min(1, enterProgress / 0.3))

  const frame = Math.floor(progress * 300)
  const pulseGlow = 0.5 + Math.sin(frame * 0.05) * 0.3

  // Skyline buildings
  const buildings = Array.from({ length: 8 }, (_, i) => {
    const h = 20 + ((i * 37 + 11) % 40)
    const w = 6 + ((i * 13) % 5)
    const x = 8 + i * 11
    const buildOpacity = easeOutCubic(Math.max(0, (enterProgress - i * 0.05) / 0.6)) * 0.15

    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          bottom: 0,
          left: `${x}%`,
          width: `${w}%`,
          height: `${h}%`,
          background: `linear-gradient(0deg, ${accentColor}${Math.round(buildOpacity * 100).toString(16).padStart(2, '0')}, transparent)`,
          borderTop: `1px solid ${accentColor}15`,
          pointerEvents: 'none',
        }}
      />
    )
  })

  const stats = [
    { label: 'AIR QUALITY', value: `${Math.round(airQuality * easeOutCubic(Math.max(0, (enterProgress - 0.3) / 0.7)))}%`, barWidth: airQuality, color: airQuality > 70 ? '#00FF88' : '#FFAA00' },
    { label: 'CONNECTIVITY', value: `${Math.round(connectivity * easeOutCubic(Math.max(0, (enterProgress - 0.4) / 0.6)))}%`, barWidth: connectivity, color: '#00FFFF' },
    { label: 'CRIME RATE', value: `${Math.round(crimeRate * easeOutCubic(Math.max(0, (enterProgress - 0.5) / 0.5)))}%`, barWidth: crimeRate, color: crimeRate < 20 ? '#00FF88' : '#FF4466' },
  ]

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Background skyline silhouette */}
      {buildings}

      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 40px, ${accentColor}05 40px, ${accentColor}05 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, ${accentColor}05 40px, ${accentColor}05 41px)`,
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: '6%',
        opacity: exitOpacity,
      }}>
        <div style={{
          width: 'clamp(280px, 75vw, 480px)',
          background: 'linear-gradient(145deg, rgba(8,12,25,0.95), rgba(4,6,16,0.98))',
          border: `1px solid ${accentColor}20`,
          borderRadius: 'clamp(8px, 2vw, 16px)',
          padding: 'clamp(16px, 4vw, 32px)',
          transform: `scale(${cardScale})`,
          opacity: cardOpacity,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: `0 0 40px ${accentColor}08`,
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            marginBottom: 'clamp(12px, 3vw, 20px)',
            opacity: easeOutCubic(Math.max(0, (enterProgress - 0.1) / 0.9)),
          }}>
            <div>
              <div style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(18px, 4.5vw, 30px)',
                fontWeight: 700,
                color: accentColor,
                textTransform: 'uppercase',
                letterSpacing: 4,
                textShadow: `0 0 10px ${accentColor}${Math.round(pulseGlow * 60).toString(16).padStart(2, '0')}`,
              }}>
                {cityName}
              </div>
              <div style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(8px, 1.5vw, 10px)',
                color: `${textColor}40`,
                letterSpacing: 2,
                marginTop: 2,
              }}>
                DISTRICT: {district}
              </div>
            </div>
            <div style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(8px, 1.4vw, 10px)',
              color: '#00FF88',
              background: 'rgba(0,255,136,0.08)',
              padding: '3px 8px',
              borderRadius: 4,
              border: '1px solid rgba(0,255,136,0.2)',
              letterSpacing: 1,
            }}>
              ACTIVE
            </div>
          </div>

          {/* Population + Energy row */}
          <div style={{
            display: 'flex', gap: 'clamp(8px, 2vw, 16px)',
            marginBottom: 'clamp(12px, 3vw, 20px)',
            opacity: easeOutCubic(Math.max(0, (enterProgress - 0.2) / 0.8)),
          }}>
            <div style={{
              flex: 1,
              background: `${accentColor}08`,
              borderRadius: 8,
              padding: 'clamp(8px, 2vw, 14px)',
              border: `1px solid ${accentColor}15`,
            }}>
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(7px, 1.2vw, 9px)', color: `${textColor}40`, letterSpacing: 2, marginBottom: 4 }}>
                POPULATION
              </div>
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(14px, 3vw, 22px)', fontWeight: 700, color: textColor }}>
                {population}
              </div>
            </div>
            <div style={{
              flex: 1,
              background: `${accentColor}08`,
              borderRadius: 8,
              padding: 'clamp(8px, 2vw, 14px)',
              border: `1px solid ${accentColor}15`,
            }}>
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(7px, 1.2vw, 9px)', color: `${textColor}40`, letterSpacing: 2, marginBottom: 4 }}>
                ENERGY OUTPUT
              </div>
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(14px, 3vw, 22px)', fontWeight: 700, color: textColor }}>
                {energyOutput}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${accentColor}20, transparent)`, marginBottom: 'clamp(12px, 3vw, 18px)' }} />

          {/* Stat bars */}
          {stats.map((stat, i) => {
            const stagger = easeOutCubic(Math.max(0, (enterProgress - 0.4 - i * 0.08) / 0.5))
            return (
              <div key={i} style={{ marginBottom: 'clamp(8px, 1.5vw, 12px)', opacity: stagger, transform: `translateX(${(1 - stagger) * 20}px)` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(8px, 1.3vw, 10px)', color: `${textColor}50`, letterSpacing: 2 }}>{stat.label}</span>
                  <span style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(10px, 1.8vw, 14px)', fontWeight: 700, color: stat.color }}>{stat.value}</span>
                </div>
                <div style={{ height: 'clamp(3px, 0.6vw, 5px)', background: `${textColor}08`, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${stat.barWidth * stagger}%`,
                    background: `linear-gradient(90deg, ${stat.color}80, ${stat.color})`,
                    borderRadius: 3,
                    boxShadow: `0 0 6px ${stat.color}30`,
                  }} />
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
  id: 'tpl-scene-future-city',
  title: 'Future City Stats',
  description: 'Futuristic city statistics display with population, energy, air quality bars, skyline silhouette, and cyberpunk grid overlay',
  tags: ['scene', 'cyberpunk', 'city', 'futuristic', 'stats', 'neon', 'sci-fi'],
  category: 'scene-layout',
  component: SceneFutureCityComponent as any,
  defaultConfig: {
    cityName: 'NEO TOKYO',
    population: '42.8M',
    airQuality: 72,
    energyOutput: '8.4 TW',
    crimeRate: 14,
    connectivity: 96,
    district: 'SECTOR-7G',
    bgColor: '#060a14',
    accentColor: '#00FFFF',
    textColor: '#e0e4ea',
  },
  configSchema: [
    { key: 'cityName', label: 'City Name', type: 'text', defaultValue: 'NEO TOKYO', group: 'Content' },
    { key: 'population', label: 'Population', type: 'text', defaultValue: '42.8M', group: 'Content' },
    { key: 'airQuality', label: 'Air Quality %', type: 'number', defaultValue: 72, min: 0, max: 100, group: 'Stats' },
    { key: 'energyOutput', label: 'Energy Output', type: 'text', defaultValue: '8.4 TW', group: 'Content' },
    { key: 'crimeRate', label: 'Crime Rate %', type: 'number', defaultValue: 14, min: 0, max: 100, group: 'Stats' },
    { key: 'connectivity', label: 'Connectivity %', type: 'number', defaultValue: 96, min: 0, max: 100, group: 'Stats' },
    { key: 'district', label: 'District', type: 'text', defaultValue: 'SECTOR-7G', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060a14', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#00FFFF', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e0e4ea', group: 'Style' },
  ],
})
