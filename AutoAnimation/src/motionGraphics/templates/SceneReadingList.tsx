import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneReadingListConfig {
  listTitle: string
  books: string
  booksRead: number
  totalBooks: number
  bgColor: string
  textColor: string
  accentColor: string
  progressColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}
function easeInCubic(t: number): number {
  return t * t * t
}

function SceneReadingListComponent({ config, progress }: MotionGraphicProps<SceneReadingListConfig>) {
  const { listTitle, books, booksRead, totalBooks, bgColor, textColor, accentColor, progressColor } = config

  const bookList = books.split(',').map((b) => b.trim())
  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const headerReveal = easeOutCubic(Math.min(1, enterProgress / 0.4))
  const progressBarFill = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.5)))
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  const completionPct = totalBooks > 0 ? (booksRead / totalBooks) * 100 : 0

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
      {/* Paper texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(139,109,76,0.04) 28px, rgba(139,109,76,0.04) 29px)',
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: 480,
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(12px, 2.5vw, 22px)',
          opacity: exitOpacity,
          transform: `scale(${1 - exitEased * 0.1})`,
        }}
      >
        {/* Header with book icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(8px, 1.5vw, 14px)',
            opacity: headerReveal,
            transform: `translateY(${(1 - headerReveal) * 20}px)`,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(22px, 5vw, 38px)',
              lineHeight: 1,
            }}
          >
            {'\uD83D\uDCDA'}
          </div>
          <div>
            <div
              style={{
                fontSize: 'clamp(18px, 4vw, 30px)',
                fontWeight: 700,
                color: textColor,
                lineHeight: 1.1,
              }}
            >
              {listTitle}
            </div>
            <div
              style={{
                fontSize: 'clamp(10px, 1.8vw, 14px)',
                color: `${textColor}60`,
                fontFamily: "'Inter', sans-serif",
                marginTop: 2,
              }}
            >
              {booksRead} of {totalBooks} completed
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div
          style={{
            width: '100%',
            height: 'clamp(6px, 1.2vw, 10px)',
            background: `${textColor}12`,
            borderRadius: 100,
            overflow: 'hidden',
            opacity: headerReveal,
          }}
        >
          <div
            style={{
              width: `${completionPct * progressBarFill}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${progressColor}, ${accentColor})`,
              borderRadius: 100,
              boxShadow: `0 0 8px ${progressColor}40`,
            }}
          />
        </div>

        {/* Book list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(6px, 1.2vw, 10px)' }}>
          {bookList.slice(0, 6).map((book, i) => {
            const itemDelay = 0.3 + i * 0.08
            const itemReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - itemDelay) / 0.3)))
            const isRead = i < booksRead
            const checkScale = holdProgress > 0 && isRead ? 1 + Math.sin(holdProgress * Math.PI * 6 + i * 0.5) * 0.05 : 1

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(8px, 1.5vw, 14px)',
                  background: `${textColor}06`,
                  borderRadius: 'clamp(6px, 1vw, 10px)',
                  padding: 'clamp(8px, 1.5vw, 14px) clamp(10px, 2vw, 18px)',
                  border: `1px solid ${textColor}08`,
                  opacity: itemReveal,
                  transform: `translateX(${(1 - itemReveal) * 30}px)`,
                }}
              >
                {/* Checkbox */}
                <div
                  style={{
                    width: 'clamp(16px, 2.5vw, 22px)',
                    height: 'clamp(16px, 2.5vw, 22px)',
                    borderRadius: 4,
                    border: `2px solid ${isRead ? accentColor : textColor + '30'}`,
                    background: isRead ? `${accentColor}20` : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'clamp(9px, 1.4vw, 13px)',
                    color: accentColor,
                    fontWeight: 700,
                    transform: `scale(${checkScale})`,
                    flexShrink: 0,
                  }}
                >
                  {isRead ? '\u2713' : ''}
                </div>
                {/* Book title */}
                <div
                  style={{
                    fontSize: 'clamp(11px, 2vw, 16px)',
                    fontWeight: 500,
                    color: isRead ? `${textColor}60` : textColor,
                    textDecoration: isRead ? 'line-through' : 'none',
                    fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                    lineHeight: 1.3,
                  }}
                >
                  {book}
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
  id: 'tpl-scene-reading-list',
  title: 'Reading List',
  description:
    'Reading list tracker with animated progress bar, book checklist with staggered reveals, and completion counter',
  tags: ['scene', 'book', 'reading', 'list', 'tracker', 'progress', 'literary', 'literature'],
  category: 'scene-layout',
  component: SceneReadingListComponent as any,
  defaultConfig: {
    listTitle: '2024 Reading List',
    books: 'Dune, 1984, Pride & Prejudice, The Hobbit, Sapiens, Atomic Habits',
    booksRead: 4,
    totalBooks: 6,
    bgColor: '#1a150e',
    textColor: '#f5edd6',
    accentColor: '#C9A96E',
    progressColor: '#8B6D4C',
  },
  configSchema: [
    { key: 'listTitle', label: 'List Title', type: 'text', defaultValue: '2024 Reading List', group: 'Content' },
    { key: 'books', label: 'Books (comma-separated)', type: 'text', defaultValue: 'Dune, 1984, Pride & Prejudice, The Hobbit, Sapiens, Atomic Habits', group: 'Content' },
    { key: 'booksRead', label: 'Books Read', type: 'number', defaultValue: 4, min: 0, max: 100, group: 'Content' },
    { key: 'totalBooks', label: 'Total Books', type: 'number', defaultValue: 6, min: 1, max: 100, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a150e', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#f5edd6', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#C9A96E', group: 'Style' },
    { key: 'progressColor', label: 'Progress Color', type: 'color', defaultValue: '#8B6D4C', group: 'Style' },
  ],
})
