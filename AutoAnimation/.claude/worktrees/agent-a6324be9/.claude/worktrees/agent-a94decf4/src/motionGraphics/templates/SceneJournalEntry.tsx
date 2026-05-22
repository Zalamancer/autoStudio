import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneJournalEntryConfig {
  date: string
  entryText: string
  bgColor: string
  textColor: string
  lineColor: string
  dateColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t)
}

function SceneJournalEntryComponent({ config, progress }: MotionGraphicProps<SceneJournalEntryConfig>) {
  const { date, entryText, bgColor, textColor, lineColor, dateColor } = config

  // Phase calculations
  const enterProgress = progress < 0.3 ? progress / 0.3 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Page fade in
  const pageOpacity = easeOutCubic(Math.min(1, enterProgress * 2))

  // Date stamp appears first
  const dateEnter = Math.min(1, enterProgress * 3)
  const dateOpacity = easeOutCubic(dateEnter)
  const dateX = (1 - easeOutCubic(dateEnter)) * -20

  // Word-by-word reveal with handwriting feel
  const words = entryText.split(/\s+/)
  const totalWords = words.length
  const wordRevealStart = 0.25
  const wordRevealProgress = enterProgress < wordRevealStart
    ? 0
    : (enterProgress - wordRevealStart) / (1 - wordRevealStart)
  const wordsRevealed = Math.floor(easeOutQuad(wordRevealProgress) * totalWords)

  // Lined paper lines
  const lineCount = 12
  const lineSpacing = 100 / (lineCount + 1)

  // Exit
  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1
  const exitY = exitProgress > 0 ? easeInCubic(exitProgress) * -20 : 0

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Paper background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
          opacity: pageOpacity,
        }}
      />

      {/* Paper texture — subtle noise */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.03,
          background: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.1) 1px, rgba(0,0,0,0.1) 2px)',
        }}
      />

      {/* Lined paper lines */}
      {Array.from({ length: lineCount }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: '10%',
            right: '10%',
            top: `${(i + 1) * lineSpacing}%`,
            height: '1px',
            background: lineColor,
            opacity: pageOpacity * 0.3,
          }}
        />
      ))}

      {/* Red margin line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '15%',
          width: '1px',
          background: '#CC4444',
          opacity: pageOpacity * 0.3,
        }}
      />

      {/* Content container */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '8% 18% 8% 20%',
          opacity: exitOpacity,
          transform: `translateY(${exitY}px)`,
        }}
      >
        {/* Date stamp */}
        <div
          style={{
            fontFamily: "'Courier New', 'Courier', monospace",
            fontSize: 'clamp(10px, 2vw, 16px)',
            fontWeight: 600,
            color: dateColor,
            opacity: dateOpacity,
            transform: `translateX(${dateX}px)`,
            marginBottom: '1.5em',
            letterSpacing: '0.05em',
          }}
        >
          {date}
        </div>

        {/* Journal entry text — handwriting style word reveal */}
        <div
          style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(14px, 3.5vw, 32px)',
            fontWeight: 400,
            color: textColor,
            lineHeight: 2.2,
            maxWidth: '100%',
          }}
        >
          {words.map((word, i) => {
            const isRevealed = i < wordsRevealed
            // Slight baseline wobble for handwriting feel
            const seed = i * 31 + 11
            const wobbleY = isRevealed ? Math.sin(seed * 0.7) * 1.5 : 0
            const wobbleRotate = isRevealed ? Math.sin(seed * 1.3) * 0.5 : 0

            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  opacity: isRevealed ? 1 : 0,
                  transform: isRevealed
                    ? `translateY(${wobbleY}px) rotate(${wobbleRotate}deg)`
                    : 'translateY(6px)',
                  marginRight: '0.3em',
                }}
              >
                {word}
              </span>
            )
          })}
        </div>
      </div>

      {/* Paper shadow edge */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '3%',
          background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.08))',
          opacity: pageOpacity,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '3%',
          background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.06))',
          opacity: pageOpacity,
        }}
      />
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-journal-entry',
  title: 'Scene Journal Entry',
  description: 'Handwritten journal style with lined paper, date stamp, and word-by-word text reveal with baseline wobble.',
  tags: ['scene', 'journal', 'handwriting', 'personal', 'diary', 'motivational', 'intimate'],
  category: 'scene-layout',
  component: SceneJournalEntryComponent as any,
  defaultConfig: {
    date: 'March 19, 2026',
    entryText: 'Today I chose to believe in myself. Not because it was easy, but because I deserve to try.',
    bgColor: '#FDF6E3',
    textColor: '#2C3E50',
    lineColor: '#BDC3C7',
    dateColor: '#7F8C8D',
  },
  configSchema: [
    { key: 'date', label: 'Date', type: 'text', defaultValue: 'March 19, 2026', group: 'Content' },
    { key: 'entryText', label: 'Entry Text', type: 'text', defaultValue: 'Today I chose to believe in myself. Not because it was easy, but because I deserve to try.', group: 'Content' },
    { key: 'bgColor', label: 'Paper Color', type: 'color', defaultValue: '#FDF6E3', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#2C3E50', group: 'Style' },
    { key: 'lineColor', label: 'Line Color', type: 'color', defaultValue: '#BDC3C7', group: 'Style' },
    { key: 'dateColor', label: 'Date Color', type: 'color', defaultValue: '#7F8C8D', group: 'Style' },
  ],
})
