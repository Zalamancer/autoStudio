import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneAuthorProfileConfig {
  authorName: string
  birthYear: string
  nationality: string
  genre: string
  notableWorks: string
  quote: string
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}
function easeInCubic(t: number): number {
  return t * t * t
}

function SceneAuthorProfileComponent({ config, progress }: MotionGraphicProps<SceneAuthorProfileConfig>) {
  const { authorName, birthYear, nationality, genre, notableWorks, quote, bgColor, textColor, accentColor } = config

  const works = notableWorks.split(',').map((w) => w.trim())
  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const avatarReveal = easeOutCubic(Math.min(1, enterProgress / 0.4))
  const nameReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.4)))
  const infoReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.4)))
  const worksReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.4)))
  const quoteReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.65) / 0.3)))

  // Hold: quill writing animation
  const quillAngle = holdProgress > 0 ? Math.sin(holdProgress * Math.PI * 6) * 8 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

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
      {/* Warm vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 50% 30%, transparent 40%, ${bgColor} 100%)`,
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: 480,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(10px, 2vw, 18px)',
          opacity: exitOpacity,
          transform: `scale(${1 - exitEased * 0.1})`,
        }}
      >
        {/* Author avatar circle */}
        <div
          style={{
            width: 'clamp(60px, 16vw, 100px)',
            height: 'clamp(60px, 16vw, 100px)',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}10)`,
            border: `2px solid ${accentColor}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(24px, 6vw, 42px)',
            opacity: avatarReveal,
            transform: `scale(${avatarReveal})`,
          }}
        >
          <span style={{ transform: `rotate(${quillAngle}deg)` }}>{'\u270D'}</span>
        </div>

        {/* Author name */}
        <div
          style={{
            fontSize: 'clamp(22px, 5.5vw, 40px)',
            fontWeight: 700,
            color: textColor,
            textAlign: 'center',
            lineHeight: 1.1,
            opacity: nameReveal,
            transform: `translateY(${(1 - nameReveal) * 15}px)`,
          }}
        >
          {authorName}
        </div>

        {/* Info badges */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'clamp(4px, 0.8vw, 8px)',
            justifyContent: 'center',
            opacity: infoReveal,
            transform: `translateY(${(1 - infoReveal) * 10}px)`,
          }}
        >
          {[nationality, birthYear, genre].map((info, i) => (
            <div
              key={i}
              style={{
                background: `${textColor}08`,
                border: `1px solid ${textColor}12`,
                borderRadius: 100,
                padding: 'clamp(3px, 0.5vw, 5px) clamp(10px, 1.8vw, 16px)',
                fontSize: 'clamp(9px, 1.5vw, 12px)',
                fontFamily: "'Inter', sans-serif",
                color: `${textColor}80`,
              }}
            >
              {info}
            </div>
          ))}
        </div>

        {/* Notable works */}
        <div
          style={{
            width: '100%',
            opacity: worksReveal,
            transform: `translateY(${(1 - worksReveal) * 12}px)`,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(9px, 1.4vw, 11px)',
              fontFamily: "'Inter', sans-serif",
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: accentColor,
              marginBottom: 'clamp(6px, 1vw, 10px)',
              textAlign: 'center',
            }}
          >
            Notable Works
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(4px, 0.8vw, 8px)' }}>
            {works.slice(0, 4).map((work, i) => {
              const workDelay = 0.55 + i * 0.06
              const workReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - workDelay) / 0.2)))
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'clamp(6px, 1vw, 10px)',
                    padding: 'clamp(6px, 1vw, 10px) clamp(10px, 1.5vw, 14px)',
                    background: `${textColor}05`,
                    borderRadius: 'clamp(4px, 0.8vw, 8px)',
                    borderLeft: `3px solid ${accentColor}40`,
                    opacity: workReveal,
                    transform: `translateX(${(1 - workReveal) * 20}px)`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 'clamp(10px, 1.6vw, 14px)',
                      color: `${textColor}30`,
                      fontWeight: 700,
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div
                    style={{
                      fontSize: 'clamp(11px, 2vw, 16px)',
                      fontStyle: 'italic',
                      color: textColor,
                    }}
                  >
                    {work}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quote */}
        <div
          style={{
            fontSize: 'clamp(10px, 1.8vw, 14px)',
            fontStyle: 'italic',
            color: `${textColor}50`,
            textAlign: 'center',
            lineHeight: 1.5,
            maxWidth: '90%',
            borderTop: `1px solid ${textColor}10`,
            paddingTop: 'clamp(8px, 1.5vw, 14px)',
            opacity: quoteReveal,
            transform: `translateY(${(1 - quoteReveal) * 8}px)`,
          }}
        >
          {'\u201C'}{quote}{'\u201D'}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-author-profile',
  title: 'Author Profile',
  description:
    'Author profile card with avatar, nationality, genre, notable works list with staggered reveals, and signature quote',
  tags: ['scene', 'author', 'writer', 'profile', 'book', 'literary', 'literature', 'biography'],
  category: 'scene-layout',
  component: SceneAuthorProfileComponent as any,
  defaultConfig: {
    authorName: 'Jane Austen',
    birthYear: '1775-1817',
    nationality: 'British',
    genre: 'Romance',
    notableWorks: 'Pride and Prejudice, Sense and Sensibility, Emma, Persuasion',
    quote: 'It is a truth universally acknowledged...',
    bgColor: '#1a150e',
    textColor: '#f5edd6',
    accentColor: '#C9A96E',
  },
  configSchema: [
    { key: 'authorName', label: 'Author Name', type: 'text', defaultValue: 'Jane Austen', group: 'Content' },
    { key: 'birthYear', label: 'Years', type: 'text', defaultValue: '1775-1817', group: 'Content' },
    { key: 'nationality', label: 'Nationality', type: 'text', defaultValue: 'British', group: 'Content' },
    { key: 'genre', label: 'Genre', type: 'text', defaultValue: 'Romance', group: 'Content' },
    { key: 'notableWorks', label: 'Notable Works (comma-separated)', type: 'text', defaultValue: 'Pride and Prejudice, Sense and Sensibility, Emma, Persuasion', group: 'Content' },
    { key: 'quote', label: 'Famous Quote', type: 'text', defaultValue: 'It is a truth universally acknowledged...', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a150e', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#f5edd6', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#C9A96E', group: 'Style' },
  ],
})
