import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneCreepyPastaConfig {
  storyTitle: string
  storyExcerpt: string
  author: string
  warningLevel: string
  readTime: string
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function SceneCreepyPastaComponent({ config, progress, frame }: MotionGraphicProps<SceneCreepyPastaConfig>) {
  const { storyTitle, storyExcerpt, author, warningLevel, readTime, bgColor, textColor, accentColor } = config
  const f = frame ?? 0

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Glitch text effect during hold
  const isGlitchMoment = rand(Math.floor(f / 6)) > 0.88
  const glitchOffsetX = isGlitchMoment ? (rand(f * 3) - 0.5) * 6 : 0

  // Creepy text scroll for excerpt
  const excerptReveal = easeOutCubic(Math.min(1, holdProgress * 1.8))
  const charsToShow = Math.floor(storyExcerpt.length * excerptReveal)

  // Red eye blink
  const eyeBlink = f % 120 > 115 ? 0.08 : 0.03 + Math.sin(f * 0.04) * 0.01

  const cardEnter = easeOutCubic(enterProgress)
  const titleEnter = easeOutCubic(Math.min(1, enterProgress * 1.5))
  const warningEnter = easeOutCubic(Math.max(0, (enterProgress - 0.5) / 0.5))

  // Static noise bars
  const noiseBars = Array.from({ length: 3 }, (_, i) => {
    const y = rand(f * 7 + i * 41) * 100
    const width = 20 + rand(f * 3 + i * 17) * 60
    const x = rand(f * 5 + i * 23) * 80
    return (
      <div
        key={`noise-${i}`}
        style={{
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          width: `${width}%`,
          height: 1,
          background: `rgba(${accentColor === '#CC0000' ? '200, 0, 0' : '180, 0, 0'}, 0.04)`,
        }}
      />
    )
  })

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
      {/* Red ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          width: '80%',
          height: '60%',
          transform: 'translateX(-50%)',
          background: `radial-gradient(ellipse, ${accentColor}06, transparent 60%)`,
        }}
      />
      {/* Noise bars */}
      {noiseBars}
      {/* Red eyes in darkness */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          right: '12%',
          display: 'flex',
          gap: 8,
          opacity: eyeBlink,
        }}
      >
        <div style={{ width: 4, height: 2, borderRadius: '50%', background: '#FF0000', boxShadow: '0 0 6px #FF0000' }} />
        <div style={{ width: 4, height: 2, borderRadius: '50%', background: '#FF0000', boxShadow: '0 0 6px #FF0000' }} />
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '7%',
          opacity: exitOpacity,
          transform: `translateX(${glitchOffsetX}px)`,
        }}
      >
        {/* Warning badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(4px, 1vw, 8px)',
            marginBottom: 'clamp(10px, 2.5vw, 18px)',
            opacity: warningEnter,
          }}
        >
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(8px, 1.4vw, 10px)',
              fontWeight: 800,
              color: '#111',
              background: accentColor,
              padding: '2px 8px',
              borderRadius: 2,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            {warningLevel}
          </div>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(8px, 1.4vw, 10px)', color: `${textColor}44` }}>
            {readTime} read
          </span>
        </div>

        {/* Story card */}
        <div
          style={{
            width: 'clamp(280px, 75vw, 460px)',
            background: 'rgba(8, 5, 5, 0.85)',
            borderRadius: 'clamp(6px, 1.5vw, 12px)',
            borderLeft: `3px solid ${accentColor}66`,
            padding: 'clamp(20px, 5vw, 36px)',
            opacity: cardEnter,
            boxShadow: `0 0 30px rgba(0,0,0,0.4), inset 0 0 20px rgba(0,0,0,0.3)`,
          }}
        >
          {/* Title */}
          <div
            style={{
              fontFamily: "Impact, 'Arial Black', sans-serif",
              fontSize: 'clamp(20px, 5vw, 36px)',
              fontWeight: 900,
              color: textColor,
              textTransform: 'uppercase',
              lineHeight: 1.1,
              marginBottom: 'clamp(4px, 1vw, 8px)',
              opacity: titleEnter,
              transform: `translateX(${(1 - titleEnter) * -15}px)`,
              textShadow: `0 0 15px ${accentColor}22`,
            }}
          >
            {storyTitle}
          </div>

          {/* Author */}
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(9px, 1.8vw, 13px)',
              color: `${textColor}55`,
              marginBottom: 'clamp(14px, 3.5vw, 22px)',
              opacity: titleEnter,
            }}
          >
            by {author}
          </div>

          {/* Excerpt with progressive reveal */}
          <div
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: 'clamp(12px, 2.5vw, 18px)',
              color: `${textColor}cc`,
              lineHeight: 1.7,
              borderTop: `1px solid ${textColor}11`,
              paddingTop: 'clamp(12px, 3vw, 20px)',
            }}
          >
            {storyExcerpt.slice(0, charsToShow)}
            {charsToShow < storyExcerpt.length && (
              <span style={{ color: accentColor, opacity: f % 18 < 10 ? 0.6 : 0 }}>|</span>
            )}
          </div>
        </div>

        {/* Bottom creepy text */}
        <div
          style={{
            marginTop: 'clamp(12px, 3vw, 20px)',
            fontFamily: "'Georgia', serif",
            fontSize: 'clamp(9px, 1.6vw, 12px)',
            color: `${textColor}33`,
            fontStyle: 'italic',
            opacity: warningEnter * (0.4 + Math.sin(f * 0.05) * 0.1),
          }}
        >
          You should not have read this...
        </div>
      </div>

      {/* Vignette */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse, transparent 30%, rgba(0,0,0,0.6) 100%)', pointerEvents: 'none' }} />
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-creepypasta',
  title: 'Creepypasta Story Card',
  description: 'Creepypasta story card with progressive text reveal, glitch effects, red eyes in darkness, and warning badge',
  tags: ['scene', 'horror', 'creepypasta', 'story', 'dark', 'creepy', 'narrative', 'text'],
  category: 'scene-layout',
  component: SceneCreepyPastaComponent as any,
  defaultConfig: {
    storyTitle: 'The Smiling Man',
    storyExcerpt: 'I was walking home at 2 AM when I noticed him across the street. He was dancing, but not like a normal person dances. His movements were too wide, too exaggerated, and his smile was impossibly wide...',
    author: 'Anonymous',
    warningLevel: 'DISTURBING',
    readTime: '4 min',
    bgColor: '#080404',
    textColor: '#d8d0d0',
    accentColor: '#CC0000',
  },
  configSchema: [
    { key: 'storyTitle', label: 'Story Title', type: 'text', defaultValue: 'The Smiling Man', group: 'Content' },
    { key: 'storyExcerpt', label: 'Story Excerpt', type: 'text', defaultValue: 'I was walking home at 2 AM when I noticed him...', group: 'Content' },
    { key: 'author', label: 'Author', type: 'text', defaultValue: 'Anonymous', group: 'Content' },
    { key: 'warningLevel', label: 'Warning Level', type: 'text', defaultValue: 'DISTURBING', group: 'Content' },
    { key: 'readTime', label: 'Read Time', type: 'text', defaultValue: '4 min', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080404', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#d8d0d0', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#CC0000', group: 'Style' },
  ],
})
