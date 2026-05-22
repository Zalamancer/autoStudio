import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneGenreGuideConfig {
  genreName: string
  description: string
  exampleBooks: string
  mood: string
  readingTime: string
  bgColor: string
  textColor: string
  accentColor: string
  genreColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}
function easeInCubic(t: number): number {
  return t * t * t
}
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneGenreGuideComponent({ config, progress }: MotionGraphicProps<SceneGenreGuideConfig>) {
  const { genreName, description, exampleBooks, mood, readingTime, bgColor, textColor, accentColor, genreColor } = config

  const books = exampleBooks.split(',').map((b) => b.trim())
  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const iconReveal = easeOutBack(Math.min(1, enterProgress / 0.35))
  const titleReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.4)))
  const descReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.4)))
  const booksReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.4)))
  const tagsReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.25)))

  // Hold: genre icon gentle rotation
  const iconRotate = holdProgress > 0 ? Math.sin(holdProgress * Math.PI * 3) * 5 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  // Genre icons map
  const genreIcons: Record<string, string> = {
    'Fantasy': '\uD83E\uDDD9',
    'Sci-Fi': '\uD83D\uDE80',
    'Romance': '\u2764\uFE0F',
    'Mystery': '\uD83D\uDD0D',
    'Horror': '\uD83D\uDC7B',
    'Historical': '\uD83C\uDFF0',
    'Thriller': '\uD83D\uDCA3',
    'Biography': '\uD83D\uDCDD',
  }
  const icon = genreIcons[genreName] || '\uD83D\uDCDA'

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Georgia', 'Palatino Linotype', serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6%',
      }}
    >
      {/* Genre accent gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '30%',
          background: `linear-gradient(180deg, ${genreColor}15, transparent)`,
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: 460,
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(10px, 2vw, 18px)',
          opacity: exitOpacity,
          transform: `scale(${1 - exitEased * 0.1})`,
        }}
      >
        {/* Genre icon and title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px, 2vw, 18px)' }}>
          <div
            style={{
              width: 'clamp(48px, 12vw, 72px)',
              height: 'clamp(48px, 12vw, 72px)',
              borderRadius: 'clamp(10px, 1.5vw, 16px)',
              background: `${genreColor}15`,
              border: `2px solid ${genreColor}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(22px, 5vw, 36px)',
              opacity: iconReveal,
              transform: `scale(${iconReveal}) rotate(${iconRotate}deg)`,
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <div>
            <div
              style={{
                fontSize: 'clamp(8px, 1.3vw, 10px)',
                fontFamily: "'Inter', sans-serif",
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: genreColor,
                opacity: titleReveal,
              }}
            >
              Genre Guide
            </div>
            <div
              style={{
                fontSize: 'clamp(22px, 5.5vw, 38px)',
                fontWeight: 700,
                color: textColor,
                lineHeight: 1.1,
                opacity: titleReveal,
                transform: `translateY(${(1 - titleReveal) * 12}px)`,
              }}
            >
              {genreName}
            </div>
          </div>
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: 'clamp(11px, 2vw, 16px)',
            color: `${textColor}80`,
            lineHeight: 1.5,
            opacity: descReveal,
            transform: `translateY(${(1 - descReveal) * 10}px)`,
          }}
        >
          {description}
        </div>

        {/* Example books */}
        <div
          style={{
            opacity: booksReveal,
            transform: `translateY(${(1 - booksReveal) * 10}px)`,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(9px, 1.4vw, 11px)',
              fontFamily: "'Inter', sans-serif",
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: accentColor,
              marginBottom: 'clamp(6px, 1vw, 10px)',
            }}
          >
            Must-Read Titles
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(4px, 0.8vw, 8px)' }}>
            {books.slice(0, 4).map((book, i) => {
              const bookDelay = 0.55 + i * 0.06
              const bookItemReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - bookDelay) / 0.2)))
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'clamp(6px, 1vw, 10px)',
                    opacity: bookItemReveal,
                    transform: `translateX(${(1 - bookItemReveal) * 20}px)`,
                  }}
                >
                  <div
                    style={{
                      width: 'clamp(4px, 0.6vw, 6px)',
                      height: 'clamp(18px, 2.5vw, 24px)',
                      background: genreColor,
                      borderRadius: 1,
                      opacity: 0.6,
                    }}
                  />
                  <div
                    style={{
                      fontSize: 'clamp(11px, 2vw, 16px)',
                      fontStyle: 'italic',
                      color: textColor,
                    }}
                  >
                    {book}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Mood and time tags */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(6px, 1vw, 10px)',
            flexWrap: 'wrap',
            opacity: tagsReveal,
            transform: `translateY(${(1 - tagsReveal) * 6}px)`,
          }}
        >
          {[
            { label: 'Mood', value: mood },
            { label: 'Avg. Read', value: readingTime },
          ].map((tag, i) => (
            <div
              key={i}
              style={{
                background: `${textColor}06`,
                border: `1px solid ${textColor}10`,
                borderRadius: 100,
                padding: 'clamp(3px, 0.5vw, 5px) clamp(10px, 1.5vw, 14px)',
                fontSize: 'clamp(9px, 1.5vw, 12px)',
                fontFamily: "'Inter', sans-serif",
                color: `${textColor}70`,
              }}
            >
              {tag.label}: <span style={{ color: textColor, fontWeight: 600 }}>{tag.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-genre-guide',
  title: 'Genre Guide',
  description:
    'Book genre guide display with genre icon, description, must-read titles with staggered reveals, and mood/time tags',
  tags: ['scene', 'book', 'genre', 'guide', 'reading', 'literary', 'literature'],
  category: 'scene-layout',
  component: SceneGenreGuideComponent as any,
  defaultConfig: {
    genreName: 'Fantasy',
    description: 'Epic worlds, magical systems, and quests that stretch the imagination beyond reality.',
    exampleBooks: 'The Lord of the Rings, A Game of Thrones, The Name of the Wind, The Way of Kings',
    mood: 'Adventurous',
    readingTime: '12-20 hours',
    bgColor: '#1a150e',
    textColor: '#f5edd6',
    accentColor: '#C9A96E',
    genreColor: '#7B68EE',
  },
  configSchema: [
    { key: 'genreName', label: 'Genre', type: 'text', defaultValue: 'Fantasy', group: 'Content' },
    { key: 'description', label: 'Description', type: 'text', defaultValue: 'Epic worlds, magical systems, and quests that stretch the imagination beyond reality.', group: 'Content' },
    { key: 'exampleBooks', label: 'Books (comma-separated)', type: 'text', defaultValue: 'The Lord of the Rings, A Game of Thrones, The Name of the Wind, The Way of Kings', group: 'Content' },
    { key: 'mood', label: 'Mood', type: 'text', defaultValue: 'Adventurous', group: 'Content' },
    { key: 'readingTime', label: 'Avg Reading Time', type: 'text', defaultValue: '12-20 hours', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a150e', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#f5edd6', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#C9A96E', group: 'Style' },
    { key: 'genreColor', label: 'Genre Color', type: 'color', defaultValue: '#7B68EE', group: 'Style' },
  ],
})
