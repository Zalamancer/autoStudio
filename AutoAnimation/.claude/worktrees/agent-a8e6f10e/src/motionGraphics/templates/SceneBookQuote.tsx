import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneBookQuoteConfig {
  quoteText: string
  authorName: string
  bookTitle: string
  pageRef: string
  bgColor: string
  textColor: string
  accentColor: string
  quoteMarkColor: string
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

function SceneBookQuoteComponent({ config, progress }: MotionGraphicProps<SceneBookQuoteConfig>) {
  const { quoteText, authorName, bookTitle, pageRef, bgColor, textColor, accentColor, quoteMarkColor } = config

  const enterProgress = progress < 0.3 ? progress / 0.3 : 1
  const holdProgress = progress >= 0.3 && progress < 0.8 ? (progress - 0.3) / 0.5 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const quoteMarkScale = easeOutBack(Math.min(1, enterProgress / 0.35))
  const quoteMarkOpacity = easeOutCubic(Math.min(1, enterProgress / 0.25))
  const textReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.55)))
  const authorReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.55) / 0.35)))
  const bookReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.25)))
  const pageReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.8) / 0.2)))

  // Hold: gentle glow pulse on quote marks
  const glowIntensity = holdProgress > 0 ? 6 + Math.sin(holdProgress * Math.PI * 4) * 3 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Georgia', 'Palatino Linotype', 'Book Antiqua', serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8%',
      }}
    >
      {/* Paper texture lines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 30px, rgba(139,109,76,0.03) 30px, rgba(139,109,76,0.03) 31px)',
        }}
      />
      {/* Warm side accent */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: '15%',
          bottom: '15%',
          width: 'clamp(3px, 0.6vw, 5px)',
          background: `linear-gradient(180deg, transparent, ${accentColor}40, transparent)`,
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(8px, 1.5vw, 16px)',
          maxWidth: '90%',
          opacity: exitOpacity,
          transform: `scale(${1 - exitEased * 0.1})`,
        }}
      >
        {/* Opening quote mark */}
        <div
          style={{
            fontSize: 'clamp(56px, 16vw, 130px)',
            fontWeight: 700,
            color: quoteMarkColor,
            lineHeight: 0.5,
            opacity: quoteMarkOpacity,
            transform: `scale(${quoteMarkScale})`,
            textShadow: glowIntensity > 0 ? `0 0 ${glowIntensity}px ${accentColor}40` : undefined,
            userSelect: 'none',
          }}
        >
          {'\u201C'}
        </div>

        {/* Quote text */}
        <div
          style={{
            fontSize: 'clamp(16px, 3.8vw, 32px)',
            fontWeight: 400,
            fontStyle: 'italic',
            color: textColor,
            lineHeight: 1.6,
            textAlign: 'center',
            opacity: textReveal,
            clipPath: `inset(0 ${(1 - textReveal) * 100}% 0 0)`,
          }}
        >
          {quoteText}
        </div>

        {/* Closing quote mark */}
        <div
          style={{
            fontSize: 'clamp(56px, 16vw, 130px)',
            fontWeight: 700,
            color: quoteMarkColor,
            lineHeight: 0.5,
            opacity: quoteMarkOpacity * textReveal,
            transform: `scale(${quoteMarkScale})`,
            textShadow: glowIntensity > 0 ? `0 0 ${glowIntensity}px ${accentColor}40` : undefined,
            userSelect: 'none',
          }}
        >
          {'\u201D'}
        </div>

        {/* Ornamental divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(8px, 1.5vw, 14px)',
            opacity: authorReveal,
          }}
        >
          <div style={{ width: 'clamp(24px, 5vw, 50px)', height: 1, background: `${accentColor}30` }} />
          <div style={{ fontSize: 'clamp(6px, 1vw, 10px)', color: `${accentColor}50` }}>{'\u2726'}</div>
          <div style={{ width: 'clamp(24px, 5vw, 50px)', height: 1, background: `${accentColor}30` }} />
        </div>

        {/* Author name */}
        <div
          style={{
            fontSize: 'clamp(14px, 2.8vw, 22px)',
            fontWeight: 700,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            color: textColor,
            letterSpacing: '0.03em',
            opacity: authorReveal,
            transform: `translateY(${(1 - authorReveal) * 10}px)`,
          }}
        >
          {authorName}
        </div>

        {/* Book title */}
        <div
          style={{
            fontSize: 'clamp(11px, 2vw, 16px)',
            fontStyle: 'italic',
            color: accentColor,
            opacity: bookReveal,
            transform: `translateY(${(1 - bookReveal) * 8}px)`,
          }}
        >
          {bookTitle}
        </div>

        {/* Page reference */}
        {pageRef && (
          <div
            style={{
              fontSize: 'clamp(9px, 1.4vw, 12px)',
              fontFamily: "'Inter', sans-serif",
              color: `${textColor}40`,
              opacity: pageReveal,
            }}
          >
            {pageRef}
          </div>
        )}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-book-quote',
  title: 'Book Quote',
  description:
    'Literary quote card with animated quote marks, text reveal, ornamental dividers, author name, book title, and page reference',
  tags: ['scene', 'book', 'quote', 'literary', 'literature', 'reading', 'author'],
  category: 'scene-layout',
  component: SceneBookQuoteComponent as any,
  defaultConfig: {
    quoteText: 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.',
    authorName: 'Jane Austen',
    bookTitle: 'Pride and Prejudice',
    pageRef: 'Chapter 1, Page 1',
    bgColor: '#1a150e',
    textColor: '#f5edd6',
    accentColor: '#C9A96E',
    quoteMarkColor: '#C9A96E30',
  },
  configSchema: [
    { key: 'quoteText', label: 'Quote', type: 'text', defaultValue: 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.', group: 'Content' },
    { key: 'authorName', label: 'Author', type: 'text', defaultValue: 'Jane Austen', group: 'Content' },
    { key: 'bookTitle', label: 'Book Title', type: 'text', defaultValue: 'Pride and Prejudice', group: 'Content' },
    { key: 'pageRef', label: 'Page Reference', type: 'text', defaultValue: 'Chapter 1, Page 1', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a150e', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#f5edd6', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#C9A96E', group: 'Style' },
    { key: 'quoteMarkColor', label: 'Quote Mark Color', type: 'color', defaultValue: '#C9A96E30', group: 'Style' },
  ],
})
