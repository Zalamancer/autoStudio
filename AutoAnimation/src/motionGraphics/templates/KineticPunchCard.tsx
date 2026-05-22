import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PunchCardConfig extends KineticBaseConfig {}

// IBM punch card: 80 columns, 12 rows per card
// Simplified encoding: each character maps to 1-3 hole positions in its column
function getHolePositions(ch: string): number[] {
  const c = ch.toUpperCase().charCodeAt(0)
  // Simplified Hollerith-like encoding for visual effect
  if (c >= 65 && c <= 73) return [12, c - 65 + 1] // A-I: 12 + 1-9
  if (c >= 74 && c <= 82) return [11, c - 74 + 1] // J-R: 11 + 1-9
  if (c >= 83 && c <= 90) return [0, c - 83 + 2]  // S-Z: 0 + 2-9
  if (c >= 48 && c <= 57) return [c - 48]          // 0-9: row 0-9
  if (c === 32) return []                           // space: no holes
  return [12, 11]                                   // special chars
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Card dimensions proportional to real 7-3/8" x 3-1/4" IBM card
    const cardWidth = width * 0.85
    const cardHeight = height * 0.55
    const cardLeft = (width - cardWidth) / 2
    const cardTop = (height - cardHeight) / 2 + 10

    // 80 column markers across top
    const colWidth = cardWidth / 80

    // Card feed animation: subtle vertical oscillation
    const feedBob = Math.sin(time * 6) * 1.5

    // Chad confetti particles
    const chadCount = 20
    const chads: { x: number; y: number; rotation: number; opacity: number }[] = []
    for (let i = 0; i < chadCount; i++) {
      const seed = i * 137.5
      const cx = (Math.sin(seed + time * 1.2) * 0.5 + 0.5) * width
      const fallSpeed = 0.6 + (Math.sin(seed * 3) * 0.5 + 0.5) * 0.8
      const cy = ((time * fallSpeed * 40 + seed * 20) % (height + 40)) - 20
      const rot = (time * 200 + seed * 50) % 360
      const op = Math.max(0, Math.min(0.3, 1 - cy / height))
      chads.push({ x: cx, y: cy, rotation: rot, opacity: op })
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* IBM card body */}
        <div
          style={{
            position: 'absolute',
            left: cardLeft,
            top: cardTop + feedBob,
            width: cardWidth,
            height: cardHeight,
            background: '#F5F0E0',
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(0,0,0,0.1)',
          }}
        >
          {/* Corner cut (top-left corner of IBM card) */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 12,
              height: 12,
              background: bgColor,
              clipPath: 'polygon(0 0, 100% 0, 0 100%)',
            }}
          />

          {/* Column number markings along top */}
          <div
            style={{
              position: 'absolute',
              top: 2,
              left: 10,
              right: 4,
              height: 8,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            {[0, 10, 20, 30, 40, 50, 60, 70, 79].map((col) => (
              <span
                key={col}
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: 6,
                  color: '#999',
                  opacity: 0.5,
                }}
              >
                {col}
              </span>
            ))}
          </div>

          {/* Row labels along left edge (12, 11, 0-9) */}
          {['12', '11', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map((label, i) => (
            <div
              key={label}
              style={{
                position: 'absolute',
                left: 2,
                top: 14 + i * ((cardHeight - 20) / 12),
                fontFamily: "'Courier New', monospace",
                fontSize: 5,
                color: '#AAA',
                opacity: 0.4,
              }}
            >
              {label}
            </div>
          ))}

          {/* Grid lines (subtle) */}
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 10,
              right: 4,
              bottom: 4,
              backgroundImage: `
                repeating-linear-gradient(90deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 1px, transparent 1px, transparent ${colWidth}px),
                repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent ${(cardHeight - 16) / 12}px)
              `,
              pointerEvents: 'none',
            }}
          />

          {/* IBM branding */}
          <div
            style={{
              position: 'absolute',
              bottom: 2,
              right: 8,
              fontFamily: "'Courier New', monospace",
              fontSize: 6,
              color: '#BBB',
              opacity: 0.3,
              letterSpacing: 1,
            }}
          >
            IBM 5081
          </div>
        </div>

        {/* Chad confetti falling */}
        {chads.map((chad, i) => (
          <div
            key={`chad-${i}`}
            style={{
              position: 'absolute',
              left: chad.x,
              top: chad.y,
              width: 4,
              height: 6,
              background: '#F5F0E0',
              opacity: chad.opacity,
              transform: `rotate(${chad.rotation}deg)`,
              borderRadius: 0.5,
              boxShadow: '0 0 1px rgba(0,0,0,0.2)',
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Card reader mechanism at top */}
        <div
          style={{
            position: 'absolute',
            top: cardTop - 8,
            left: cardLeft - 4,
            right: width - cardLeft - cardWidth - 4,
            width: cardWidth + 8,
            height: 8,
            background: '#444',
            borderRadius: '2px 2px 0 0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame, width: w, height: h }: WordRenderProps) => {
    const f = frame ?? 0

    // Card proportions
    const cardWidth = w * 0.85
    const cardHeight = h * 0.55
    const cardLeft = (w - cardWidth) / 2
    const cardTop = (h - cardHeight) / 2 + 10
    const feedBob = Math.sin(f / 30 * 6) * 1.5

    const colWidth = (cardWidth - 14) / 80
    const rowHeight = (cardHeight - 20) / 12
    const punchAreaLeft = cardLeft + 10
    const punchAreaTop = cardTop + 14 + feedBob

    // Center the word in the 80-column space
    const startCol = Math.max(0, Math.floor((80 - word.length) / 2))

    if (phase === 'enter') {
      // Card feed: punch holes appear column by column with a mechanical strike feel
      const charsToShow = Math.floor(enterProgress * (word.length + 1))

      const holes: React.ReactNode[] = []
      for (let ci = 0; ci < Math.min(charsToShow, word.length); ci++) {
        const ch = word[ci]
        const positions = getHolePositions(ch)
        const colX = punchAreaLeft + (startCol + ci) * colWidth

        // Punch strike flash on newest character
        const isNewest = ci === charsToShow - 1
        const flashOpacity = isNewest ? 0.5 : 0

        positions.forEach((row, ri) => {
          const rowY = punchAreaTop + row * rowHeight
          holes.push(
            <div
              key={`hole-${ci}-${ri}`}
              style={{
                position: 'absolute',
                left: colX + colWidth * 0.15,
                top: rowY + rowHeight * 0.15,
                width: colWidth * 0.7,
                height: rowHeight * 0.6,
                background: '#2a2a2a',
                borderRadius: 1,
                boxShadow: isNewest ? `0 0 6px ${color}` : 'inset 0 0 1px rgba(0,0,0,0.5)',
              }}
            />
          )
        })

        // Strike flash
        if (flashOpacity > 0) {
          holes.push(
            <div
              key={`flash-${ci}`}
              style={{
                position: 'absolute',
                left: colX - 2,
                top: punchAreaTop - 2,
                width: colWidth + 4,
                height: 12 * rowHeight + 4,
                background: `rgba(255,255,200,${flashOpacity})`,
                pointerEvents: 'none',
              }}
            />
          )
        }
      }

      // Text printed along top of card
      const printedText = word.substring(0, Math.min(charsToShow, word.length))

      return (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {holes}
          {/* Printed text along card top edge */}
          <div
            style={{
              position: 'absolute',
              left: punchAreaLeft + startCol * colWidth,
              top: cardTop + 3 + feedBob,
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(8px, 1.5vw, 14px)',
              color: '#666',
              letterSpacing: colWidth - 7,
              whiteSpace: 'nowrap',
            }}
          >
            {printedText}
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // All holes visible, text printed, subtle mechanical vibration
      const vibrate = Math.sin(f * 0.3) * 0.3

      const holes: React.ReactNode[] = []
      for (let ci = 0; ci < word.length; ci++) {
        const ch = word[ci]
        const positions = getHolePositions(ch)
        const colX = punchAreaLeft + (startCol + ci) * colWidth

        positions.forEach((row, ri) => {
          const rowY = punchAreaTop + row * rowHeight + vibrate
          holes.push(
            <div
              key={`hole-${ci}-${ri}`}
              style={{
                position: 'absolute',
                left: colX + colWidth * 0.15,
                top: rowY + rowHeight * 0.15,
                width: colWidth * 0.7,
                height: rowHeight * 0.6,
                background: '#2a2a2a',
                borderRadius: 1,
                boxShadow: 'inset 0 0 1px rgba(0,0,0,0.5)',
              }}
            />
          )
        })
      }

      return (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {holes}
          <div
            style={{
              position: 'absolute',
              left: punchAreaLeft + startCol * colWidth,
              top: cardTop + 3 + feedBob + vibrate,
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(8px, 1.5vw, 14px)',
              color: '#666',
              letterSpacing: colWidth - 7,
              whiteSpace: 'nowrap',
            }}
          >
            {word}
          </div>
          {/* Large centered overlay text */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Courier New', 'Lucida Console', monospace",
              fontSize: 'clamp(32px, 8vw, 110px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 6,
              opacity: 0.15,
              textShadow: `0 0 20px ${color}20`,
            }}
          >
            {word}
          </div>
        </div>
      )
    } else {
      // Exit: card feeds out - slides down and away
      const slideY = exitProgress * h * 0.6
      const fadeOut = Math.max(0, 1 - exitProgress * 1.5)

      const holes: React.ReactNode[] = []
      for (let ci = 0; ci < word.length; ci++) {
        const ch = word[ci]
        const positions = getHolePositions(ch)
        const colX = punchAreaLeft + (startCol + ci) * colWidth

        positions.forEach((row, ri) => {
          const rowY = punchAreaTop + row * rowHeight + slideY
          holes.push(
            <div
              key={`hole-${ci}-${ri}`}
              style={{
                position: 'absolute',
                left: colX + colWidth * 0.15,
                top: rowY + rowHeight * 0.15,
                width: colWidth * 0.7,
                height: rowHeight * 0.6,
                background: '#2a2a2a',
                borderRadius: 1,
                opacity: fadeOut,
              }}
            />
          )
        })
      }

      return (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: fadeOut }}>
          {holes}
          <div
            style={{
              position: 'absolute',
              left: punchAreaLeft + startCol * colWidth,
              top: cardTop + 3 + feedBob + slideY,
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(8px, 1.5vw, 14px)',
              color: '#666',
              letterSpacing: colWidth - 7,
              whiteSpace: 'nowrap',
            }}
          >
            {word}
          </div>
        </div>
      )
    }
  },
}

function PunchCardComponent(props: MotionGraphicProps<PunchCardConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-punch-card',
  title: 'Kinetic Punch Card',
  description:
    'IBM punch card reader with Hollerith hole patterns on 80-column cards, card feed animation, punch strike flash, chad confetti, and mechanical aesthetic',
  tags: ['kinetic', 'typography', 'punchcard', 'ibm', 'hollerith', 'mainframe', 'retro', 'computing'],
  category: 'captions',
  component: PunchCardComponent as any,
  defaultConfig: {
    words: ['DATA', 'SORT', 'READ', 'EXEC'],
    colors: ['#FFD700', '#FFD700', '#FFD700', '#FFD700'],
    bgColor: '#2a2a2a',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['DATA', 'SORT', 'READ', 'EXEC'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFD700', '#FFD700', '#FFD700', '#FFD700'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#2a2a2a', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
