import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneGenreMeterConfig {
  genre1: string
  genre1Value: number
  genre2: string
  genre2Value: number
  genre3: string
  genre3Value: number
  genre4: string
  genre4Value: number
  genre5: string
  genre5Value: number
  title: string
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneGenreMeterComponent({ config, progress }: MotionGraphicProps<SceneGenreMeterConfig>) {
  const { genre1, genre1Value, genre2, genre2Value, genre3, genre3Value, genre4, genre4Value, genre5, genre5Value, title, bgColor, cardColor, accentColor, textColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const cardScale = easeOutBack(Math.min(1, enterProgress / 0.5))
  const cardOpacity = easeOutCubic(Math.min(1, enterProgress / 0.3))

  const titleOp = easeOutCubic(Math.max(0, Math.min(1, enterProgress / 0.4)))

  const genres = [
    { name: genre1, value: genre1Value, color: '#FF6B6B' },
    { name: genre2, value: genre2Value, color: '#4ECDC4' },
    { name: genre3, value: genre3Value, color: '#FFE66D' },
    { name: genre4, value: genre4Value, color: '#A78BFA' },
    { name: genre5, value: genre5Value, color: '#FB923C' },
  ]

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.15

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Inter', 'Helvetica Neue', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 50%, ${accentColor}08 0%, transparent 60%)` }} />

      <div style={{
        width: 'clamp(280px, 70vw, 460px)',
        background: cardColor,
        borderRadius: 'clamp(14px, 3vw, 22px)',
        padding: 'clamp(20px, 4vw, 36px)',
        transform: `scale(${cardScale * exitScale})`,
        opacity: cardOpacity * exitOpacity,
        boxShadow: `0 16px 50px rgba(0,0,0,0.4)`,
      }}>
        {/* Title */}
        <div style={{
          fontSize: 'clamp(10px, 1.8vw, 14px)', fontWeight: 700, color: accentColor,
          textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 'clamp(4px, 0.8vw, 8px)',
          opacity: titleOp,
        }}>
          GENRE METER
        </div>
        <div style={{
          fontSize: 'clamp(18px, 3.5vw, 28px)', fontWeight: 800, color: textColor,
          marginBottom: 'clamp(16px, 3vw, 28px)', opacity: titleOp, lineHeight: 1.2,
        }}>
          {title}
        </div>

        {/* Genre bars */}
        {genres.map((genre, i) => {
          const barOp = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3 - i * 0.08) / 0.35)))
          const barWidth = barOp * genre.value

          return (
            <div key={i} style={{ marginBottom: 'clamp(10px, 2vw, 16px)', opacity: barOp, transform: `translateX(${(1 - barOp) * 20}px)` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'clamp(3px, 0.6vw, 5px)' }}>
                <div style={{ fontSize: 'clamp(11px, 2vw, 15px)', fontWeight: 600, color: textColor }}>
                  {genre.name}
                </div>
                <div style={{ fontSize: 'clamp(11px, 2vw, 15px)', fontWeight: 700, color: genre.color }}>
                  {Math.round(barWidth)}%
                </div>
              </div>
              <div style={{ height: 'clamp(8px, 1.5vw, 12px)', background: `${textColor}10`, borderRadius: 6, overflow: 'hidden' }}>
                <div style={{
                  width: `${barWidth}%`, height: '100%',
                  background: `linear-gradient(90deg, ${genre.color}, ${genre.color}CC)`,
                  borderRadius: 6,
                  boxShadow: `0 0 10px ${genre.color}40`,
                }} />
              </div>
            </div>
          )
        })}

        {/* Mood indicator */}
        <div style={{
          marginTop: 'clamp(12px, 2.5vw, 20px)', padding: 'clamp(8px, 1.5vw, 12px)',
          background: `${accentColor}10`, borderRadius: 8, textAlign: 'center',
          opacity: easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.3))),
        }}>
          <div style={{ fontSize: 'clamp(9px, 1.4vw, 11px)', fontWeight: 500, color: `${textColor}60`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
            Mood
          </div>
          <div style={{ fontSize: 'clamp(13px, 2.4vw, 18px)', fontWeight: 700, color: accentColor }}>
            Energetic & Upbeat
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-genre-meter',
  title: 'Scene Genre Meter',
  description: 'Genre/mood meter visualization with colored progress bars, percentage values, and mood indicator. Music analytics aesthetic.',
  tags: ['scene', 'music', 'genre', 'meter', 'mood', 'analytics', 'visualization', 'festival'],
  category: 'scene-layout',
  component: SceneGenreMeterComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    genre1: 'Electronic',
    genre1Value: 85,
    genre2: 'Pop',
    genre2Value: 72,
    genre3: 'Hip Hop',
    genre3Value: 58,
    genre4: 'Indie',
    genre4Value: 45,
    genre5: 'Jazz',
    genre5Value: 30,
    title: 'Your Music DNA',
    bgColor: '#0A0A10',
    cardColor: '#161622',
    accentColor: '#8B5CF6',
    textColor: '#F0F0F5',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Your Music DNA', group: 'Content' },
    { key: 'genre1', label: 'Genre 1', type: 'text', defaultValue: 'Electronic', group: 'Genres' },
    { key: 'genre1Value', label: 'Genre 1 %', type: 'number', defaultValue: 85, min: 0, max: 100, group: 'Genres' },
    { key: 'genre2', label: 'Genre 2', type: 'text', defaultValue: 'Pop', group: 'Genres' },
    { key: 'genre2Value', label: 'Genre 2 %', type: 'number', defaultValue: 72, min: 0, max: 100, group: 'Genres' },
    { key: 'genre3', label: 'Genre 3', type: 'text', defaultValue: 'Hip Hop', group: 'Genres' },
    { key: 'genre3Value', label: 'Genre 3 %', type: 'number', defaultValue: 58, min: 0, max: 100, group: 'Genres' },
    { key: 'genre4', label: 'Genre 4', type: 'text', defaultValue: 'Indie', group: 'Genres' },
    { key: 'genre4Value', label: 'Genre 4 %', type: 'number', defaultValue: 45, min: 0, max: 100, group: 'Genres' },
    { key: 'genre5', label: 'Genre 5', type: 'text', defaultValue: 'Jazz', group: 'Genres' },
    { key: 'genre5Value', label: 'Genre 5 %', type: 'number', defaultValue: 30, min: 0, max: 100, group: 'Genres' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A10', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#161622', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#8B5CF6', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#F0F0F5', group: 'Style' },
  ],
})
