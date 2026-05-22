import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneLibraryCardConfig {
  cardholderName: string
  libraryName: string
  cardNumber: string
  issueDate: string
  booksCheckedOut: number
  bgColor: string
  textColor: string
  accentColor: string
  cardColor: string
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

function SceneLibraryCardComponent({ config, progress }: MotionGraphicProps<SceneLibraryCardConfig>) {
  const { cardholderName, libraryName, cardNumber, issueDate, booksCheckedOut, bgColor, textColor, accentColor, cardColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Card slides in from below with rotation
  const cardEnter = easeOutBack(Math.min(1, enterProgress / 0.6))
  const cardY = (1 - cardEnter) * 100
  const cardRotate = (1 - cardEnter) * -8

  const headerReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.4)))
  const fieldsReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.35) / 0.4)))
  const numberReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.55) / 0.35)))
  const stampReveal = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.25)))

  // Hold: gentle card hover
  const hoverY = holdProgress > 0 ? Math.sin(holdProgress * Math.PI * 3) * 4 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  // Vintage barcode lines
  const barcodeLines = Array.from({ length: 30 }).map((_, i) => ({
    width: i % 3 === 0 ? 2 : 1,
    gap: i % 5 === 0 ? 3 : 1,
  }))

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
      {/* Warm ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          height: '60%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}08, transparent 70%)`,
        }}
      />

      {/* Library card */}
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: cardColor,
          borderRadius: 'clamp(10px, 2vw, 18px)',
          padding: 'clamp(20px, 4vw, 36px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(10px, 2vw, 18px)',
          transform: `translateY(${cardY + hoverY}px) rotate(${cardRotate}deg)`,
          opacity: exitOpacity,
          boxShadow: '0 12px 40px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
          border: `1px solid ${accentColor}15`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Aged paper stain effect */}
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            right: '-5%',
            width: '40%',
            height: '40%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(160,132,92,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Library name header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${accentColor}20`,
            paddingBottom: 'clamp(8px, 1.5vw, 14px)',
            opacity: headerReveal,
            transform: `translateY(${(1 - headerReveal) * 10}px)`,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 'clamp(14px, 3vw, 22px)',
                fontWeight: 700,
                color: textColor,
                letterSpacing: '0.02em',
              }}
            >
              {libraryName}
            </div>
            <div
              style={{
                fontSize: 'clamp(8px, 1.3vw, 10px)',
                fontFamily: "'Inter', sans-serif",
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: accentColor,
                marginTop: 2,
              }}
            >
              Library Card
            </div>
          </div>
          <div
            style={{
              fontSize: 'clamp(20px, 4vw, 30px)',
              opacity: 0.3,
            }}
          >
            {'\uD83C\uDFDB'}
          </div>
        </div>

        {/* Card fields */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(8px, 1.5vw, 14px)',
            opacity: fieldsReveal,
            transform: `translateY(${(1 - fieldsReveal) * 10}px)`,
          }}
        >
          {/* Name field */}
          <div>
            <div
              style={{
                fontSize: 'clamp(7px, 1.1vw, 9px)',
                fontFamily: "'Inter', sans-serif",
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: `${textColor}50`,
                marginBottom: 2,
              }}
            >
              Cardholder
            </div>
            <div
              style={{
                fontSize: 'clamp(16px, 3.5vw, 26px)',
                fontWeight: 700,
                color: textColor,
              }}
            >
              {cardholderName}
            </div>
          </div>

          {/* Details row */}
          <div style={{ display: 'flex', gap: 'clamp(12px, 2.5vw, 24px)' }}>
            <div>
              <div
                style={{
                  fontSize: 'clamp(7px, 1.1vw, 9px)',
                  fontFamily: "'Inter', sans-serif",
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: `${textColor}50`,
                  marginBottom: 2,
                }}
              >
                Issued
              </div>
              <div
                style={{
                  fontSize: 'clamp(11px, 2vw, 16px)',
                  fontWeight: 600,
                  color: textColor,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {issueDate}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 'clamp(7px, 1.1vw, 9px)',
                  fontFamily: "'Inter', sans-serif",
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: `${textColor}50`,
                  marginBottom: 2,
                }}
              >
                Checked Out
              </div>
              <div
                style={{
                  fontSize: 'clamp(11px, 2vw, 16px)',
                  fontWeight: 600,
                  color: accentColor,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {booksCheckedOut} books
              </div>
            </div>
          </div>
        </div>

        {/* Card number with barcode */}
        <div
          style={{
            borderTop: `1px solid ${accentColor}15`,
            paddingTop: 'clamp(8px, 1.5vw, 14px)',
            opacity: numberReveal,
          }}
        >
          {/* Barcode */}
          <div
            style={{
              display: 'flex',
              gap: 1,
              marginBottom: 'clamp(4px, 0.8vw, 8px)',
              height: 'clamp(20px, 3.5vw, 32px)',
              justifyContent: 'center',
            }}
          >
            {barcodeLines.map((line, i) => (
              <div
                key={i}
                style={{
                  width: line.width,
                  height: '100%',
                  background: `${textColor}20`,
                  marginRight: line.gap,
                }}
              />
            ))}
          </div>
          <div
            style={{
              fontSize: 'clamp(10px, 1.8vw, 14px)',
              fontFamily: "'Courier New', monospace",
              letterSpacing: '0.15em',
              color: `${textColor}50`,
              textAlign: 'center',
            }}
          >
            {cardNumber}
          </div>
        </div>

        {/* Library stamp */}
        <div
          style={{
            position: 'absolute',
            bottom: 'clamp(12px, 2.5vw, 22px)',
            right: 'clamp(12px, 2.5vw, 22px)',
            width: 'clamp(40px, 8vw, 60px)',
            height: 'clamp(40px, 8vw, 60px)',
            borderRadius: '50%',
            border: `2px solid ${accentColor}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(7px, 1.2vw, 10px)',
            fontFamily: "'Inter', sans-serif",
            textTransform: 'uppercase',
            color: `${accentColor}40`,
            letterSpacing: '0.05em',
            fontWeight: 700,
            opacity: stampReveal,
            transform: `scale(${stampReveal}) rotate(${(1 - stampReveal) * 30}deg)`,
          }}
        >
          VALID
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-library-card',
  title: 'Library Card',
  description:
    'Vintage library card design with cardholder name, barcode, issue date, checked-out count, and library stamp. Slides in with rotation.',
  tags: ['scene', 'library', 'card', 'vintage', 'book', 'reading', 'literary', 'literature'],
  category: 'scene-layout',
  component: SceneLibraryCardComponent as any,
  defaultConfig: {
    cardholderName: 'Eleanor Dashwood',
    libraryName: 'Pemberly Public Library',
    cardNumber: 'LIB-2024-08172',
    issueDate: 'Jan 2024',
    booksCheckedOut: 3,
    bgColor: '#1a150e',
    textColor: '#f5edd6',
    accentColor: '#C9A96E',
    cardColor: '#2a2218',
  },
  configSchema: [
    { key: 'cardholderName', label: 'Cardholder', type: 'text', defaultValue: 'Eleanor Dashwood', group: 'Content' },
    { key: 'libraryName', label: 'Library Name', type: 'text', defaultValue: 'Pemberly Public Library', group: 'Content' },
    { key: 'cardNumber', label: 'Card Number', type: 'text', defaultValue: 'LIB-2024-08172', group: 'Content' },
    { key: 'issueDate', label: 'Issue Date', type: 'text', defaultValue: 'Jan 2024', group: 'Content' },
    { key: 'booksCheckedOut', label: 'Books Checked Out', type: 'number', defaultValue: 3, min: 0, max: 50, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a150e', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#f5edd6', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#C9A96E', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#2a2218', group: 'Style' },
  ],
})
