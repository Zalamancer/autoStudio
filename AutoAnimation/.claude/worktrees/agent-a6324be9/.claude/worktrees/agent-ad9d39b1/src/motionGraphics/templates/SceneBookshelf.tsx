import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneBookshelfConfig {
  shelfTitle: string
  books: string
  bgColor: string
  textColor: string
  accentColor: string
  shelfColor: string
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

// Deterministic book colors
const BOOK_HUES = [350, 210, 140, 45, 270, 180, 25, 320, 190, 100]
const BOOK_HEIGHTS = [85, 78, 92, 75, 88, 80, 90, 72, 86, 82]

function SceneBookshelfComponent({ config, progress }: MotionGraphicProps<SceneBookshelfConfig>) {
  const { shelfTitle, books, bgColor, textColor, accentColor, shelfColor } = config

  const bookList = books.split(',').map((b) => b.trim())
  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const titleReveal = easeOutCubic(Math.min(1, enterProgress / 0.35))

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  const displayBooks = bookList.slice(0, 8)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Georgia', 'Palatino Linotype', serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6%',
      }}
    >
      {/* Warm library ambiance */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '60%',
          height: '30%',
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(255,200,100,0.06) 0%, transparent 70%)`,
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: 500,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(16px, 3vw, 28px)',
          opacity: exitOpacity,
          transform: `scale(${1 - exitEased * 0.1})`,
        }}
      >
        {/* Title */}
        <div
          style={{
            textAlign: 'center',
            opacity: titleReveal,
            transform: `translateY(${(1 - titleReveal) * 15}px)`,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(9px, 1.4vw, 11px)',
              fontFamily: "'Inter', sans-serif",
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: accentColor,
              marginBottom: 4,
            }}
          >
            My Bookshelf
          </div>
          <div
            style={{
              fontSize: 'clamp(20px, 5vw, 34px)',
              fontWeight: 700,
              color: textColor,
            }}
          >
            {shelfTitle}
          </div>
        </div>

        {/* Bookshelf */}
        <div
          style={{
            width: '100%',
            position: 'relative',
          }}
        >
          {/* Books */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              gap: 'clamp(3px, 0.6vw, 6px)',
              paddingBottom: 'clamp(4px, 0.8vw, 6px)',
              minHeight: 'clamp(120px, 30vw, 200px)',
            }}
          >
            {displayBooks.map((book, i) => {
              const bookDelay = 0.15 + i * 0.07
              const bookReveal = easeOutBack(Math.max(0, Math.min(1, (enterProgress - bookDelay) / 0.3)))
              const hue = BOOK_HUES[i % BOOK_HUES.length]
              const heightPct = BOOK_HEIGHTS[i % BOOK_HEIGHTS.length]
              const bookWidth = 'clamp(36px, 8vw, 54px)'

              // Hold: selected book slides up slightly
              const isSelected = holdProgress > 0 && i === Math.floor(holdProgress * displayBooks.length) % displayBooks.length
              const selectY = isSelected ? -8 : 0

              return (
                <div
                  key={i}
                  style={{
                    width: bookWidth,
                    height: `${heightPct}%`,
                    minHeight: 'clamp(90px, 22vw, 160px)',
                    background: `linear-gradient(90deg, hsl(${hue}, 40%, 28%), hsl(${hue}, 35%, 35%), hsl(${hue}, 40%, 30%))`,
                    borderRadius: '2px 3px 3px 2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: bookReveal,
                    transform: `translateY(${(1 - bookReveal) * 40 + selectY}px) scale(${bookReveal})`,
                    boxShadow: `2px 2px 6px rgba(0,0,0,0.3), inset -1px 0 3px rgba(0,0,0,0.2)`,
                    position: 'relative',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {/* Spine highlight */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 2,
                      background: `rgba(255,255,255,0.1)`,
                    }}
                  />
                  {/* Spine grooves */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '8%',
                      left: '15%',
                      right: '15%',
                      height: 1,
                      background: 'rgba(255,255,255,0.08)',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '8%',
                      left: '15%',
                      right: '15%',
                      height: 1,
                      background: 'rgba(255,255,255,0.08)',
                    }}
                  />
                  {/* Title on spine */}
                  <div
                    style={{
                      writingMode: 'vertical-rl',
                      textOrientation: 'mixed',
                      fontSize: 'clamp(7px, 1.2vw, 10px)',
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.75)',
                      textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                      letterSpacing: '0.03em',
                      maxHeight: '80%',
                      overflow: 'hidden',
                      padding: '0 2px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {book}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Shelf board */}
          <div
            style={{
              width: '110%',
              marginLeft: '-5%',
              height: 'clamp(6px, 1.2vw, 10px)',
              background: `linear-gradient(180deg, ${shelfColor}, ${shelfColor}cc)`,
              borderRadius: 2,
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
            }}
          />
          {/* Shelf bracket left */}
          <div
            style={{
              position: 'absolute',
              bottom: '-clamp(4px, 0.8vw, 8px)',
              left: '5%',
              width: 'clamp(3px, 0.6vw, 5px)',
              height: 'clamp(16px, 3vw, 24px)',
              background: `${shelfColor}80`,
              borderRadius: 1,
            }}
          />
          {/* Shelf bracket right */}
          <div
            style={{
              position: 'absolute',
              bottom: '-clamp(4px, 0.8vw, 8px)',
              right: '5%',
              width: 'clamp(3px, 0.6vw, 5px)',
              height: 'clamp(16px, 3vw, 24px)',
              background: `${shelfColor}80`,
              borderRadius: 1,
            }}
          />
        </div>

        {/* Book count */}
        <div
          style={{
            fontSize: 'clamp(10px, 1.6vw, 13px)',
            fontFamily: "'Inter', sans-serif",
            color: `${textColor}50`,
            opacity: titleReveal,
          }}
        >
          {displayBooks.length} titles on shelf
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-bookshelf',
  title: 'Bookshelf',
  description:
    'Bookshelf display with colorful book spines on a wooden shelf, staggered bounce-in animation, and vertical spine titles',
  tags: ['scene', 'bookshelf', 'shelf', 'books', 'reading', 'library', 'literary', 'literature'],
  category: 'scene-layout',
  component: SceneBookshelfComponent as any,
  defaultConfig: {
    shelfTitle: 'Favorites',
    books: 'Dune, 1984, Hobbit, Gatsby, Hamlet, Jane Eyre, Dracula, Moby Dick',
    bgColor: '#1a150e',
    textColor: '#f5edd6',
    accentColor: '#C9A96E',
    shelfColor: '#5c422e',
  },
  configSchema: [
    { key: 'shelfTitle', label: 'Shelf Title', type: 'text', defaultValue: 'Favorites', group: 'Content' },
    { key: 'books', label: 'Books (comma-separated)', type: 'text', defaultValue: 'Dune, 1984, Hobbit, Gatsby, Hamlet, Jane Eyre, Dracula, Moby Dick', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a150e', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#f5edd6', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#C9A96E', group: 'Style' },
    { key: 'shelfColor', label: 'Shelf Color', type: 'color', defaultValue: '#5c422e', group: 'Style' },
  ],
})
