import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DeckShuffleConfig extends KineticBaseConfig {
  cardCount: number
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const config = (globalThis as any).__deckShuffleConfig ?? { cardCount: 6 }
    const cardCount = config.cardCount ?? 6

    const cardW = Math.min(width * 0.55, 280)
    const cardH = cardW * 1.4
    const cx = width / 2
    const cy = height / 2

    // Fan spread: cards arc from stacked (center) to fanned
    // Top card (index 0) is the "face" card with the text
    const fanAngle = 40 // total fan spread in degrees

    const cardElements = []
    for (let i = cardCount - 1; i >= 0; i--) {
      const isTopCard = i === 0
      const cardRatio = cardCount > 1 ? i / (cardCount - 1) : 0
      const stagger = (cardCount - 1 - i) / cardCount

      let cardX = cx - cardW / 2
      let cardY = cy - cardH / 2
      let rotation = 0
      let cardOpacity = 1
      let zIndex = cardCount - i

      // Target fan position: spread in an arc
      const targetAngle = -fanAngle / 2 + cardRatio * fanAngle
      const fanRadius = cardH * 0.4
      const targetX = cx - cardW / 2 + Math.sin((targetAngle * Math.PI) / 180) * fanRadius * 0.6
      const targetY = cy - cardH / 2 + (1 - Math.cos((targetAngle * Math.PI) / 180)) * fanRadius * 0.3

      if (phase === 'enter') {
        const delayed = Math.max(0, Math.min(1, (enterProgress - stagger * 0.5) / 0.5))
        const eased = easeOutBack(delayed)
        cardX = cx - cardW / 2 + (targetX - (cx - cardW / 2)) * eased
        cardY = cy - cardH / 2 + (targetY - (cy - cardH / 2)) * eased
        rotation = targetAngle * eased
        cardOpacity = Math.min(1, delayed * 2)
      } else if (phase === 'hold') {
        cardX = targetX
        cardY = targetY
        rotation = targetAngle + (isTopCard ? Math.sin(holdProgress * Math.PI * 3) * 1.5 : 0)
        cardOpacity = 1
      } else {
        const reverseStagger = i / cardCount
        const delayed = Math.max(0, Math.min(1, (exitProgress - reverseStagger * 0.4) / 0.6))
        const eased = easeInCubic(delayed)
        // Cards collapse back to stack
        cardX = targetX + (cx - cardW / 2 - targetX) * eased
        cardY = targetY + (cy - cardH / 2 - targetY) * eased
        rotation = targetAngle * (1 - eased)
        cardOpacity = 1 - eased * 0.8
      }

      // Card suit symbol
      const suits = ['♠', '♥', '♦', '♣']
      const suit = suits[i % 4]
      const suitColor = (suit === '♥' || suit === '♦') ? '#e53e3e' : '#1a202c'

      // Corner pips for playing card look
      const pipLabel = ['A', '2', '3', '4', '5', '6', '7'][i % 7]

      cardElements.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: cardX,
            top: cardY,
            width: cardW,
            height: cardH,
            borderRadius: 10,
            background: isTopCard
              ? `linear-gradient(135deg, #fffef8 0%, #f8f4e8 100%)`
              : `linear-gradient(135deg, #f8f4e8 0%, #ede8d8 100%)`,
            border: '1.5px solid rgba(0,0,0,0.15)',
            boxShadow: `0 ${4 + i * 2}px ${12 + i * 4}px rgba(0,0,0,${0.25 + i * 0.04}), 0 1px 3px rgba(0,0,0,0.2)`,
            transform: `rotate(${rotation}deg)`,
            transformOrigin: 'center bottom',
            opacity: cardOpacity,
            zIndex,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Top-left corner */}
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: 10,
              fontSize: cardH * 0.1,
              fontWeight: 700,
              color: suitColor,
              lineHeight: 1.1,
              fontFamily: 'Georgia, serif',
            }}
          >
            <div>{pipLabel}</div>
            <div>{suit}</div>
          </div>

          {/* Bottom-right corner (rotated) */}
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              right: 10,
              fontSize: cardH * 0.1,
              fontWeight: 700,
              color: suitColor,
              lineHeight: 1.1,
              fontFamily: 'Georgia, serif',
              transform: 'rotate(180deg)',
            }}
          >
            <div>{pipLabel}</div>
            <div>{suit}</div>
          </div>

          {/* Center suit */}
          {!isTopCard && (
            <div
              style={{
                fontSize: cardH * 0.25,
                color: suitColor,
                opacity: 0.5,
              }}
            >
              {suit}
            </div>
          )}

          {/* Top card: show the word */}
          {isTopCard && (
            <div
              style={{
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontSize: `clamp(14px, ${Math.min(cardW * 0.12, 36)}px, 36px)`,
                fontWeight: 900,
                color: color,
                whiteSpace: 'nowrap',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                textShadow: `0 1px 4px ${color}44`,
              }}
            >
              {word}
            </div>
          )}

          {/* Card back pattern for non-top cards */}
          {!isTopCard && (
            <div
              style={{
                position: 'absolute',
                inset: 6,
                borderRadius: 6,
                background: `repeating-linear-gradient(45deg, ${color}08 0px, ${color}08 2px, transparent 2px, transparent 8px)`,
                border: `1px solid ${color}22`,
              }}
            />
          )}
        </div>,
      )
    }

    return <>{cardElements}</>
  },
}

function DeckShuffleComponent(props: MotionGraphicProps<DeckShuffleConfig>) {
  ;(globalThis as any).__deckShuffleConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-deck-shuffle',
  title: 'Kinetic Deck Shuffle',
  description: 'A deck of cards fans out like a shuffle deal, with the top card revealing the word',
  tags: ['kinetic', 'typography', 'cards', 'deck', 'shuffle', 'fan', 'reveal', 'mechanical', 'everyday'],
  category: 'captions',
  component: DeckShuffleComponent as any,
  defaultConfig: {
    words: ['DEAL', 'SHUFFLE', 'PLAY', 'WILD'],
    colors: ['#E53E3E', '#2B6CB0', '#276749', '#744210'],
    bgColor: '#1a1208',
    cycleDuration: 1.8,
    cardCount: 6,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['DEAL', 'SHUFFLE', 'PLAY', 'WILD'],
      group: 'Content',
    },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E53E3E', '#2B6CB0', '#276749', '#744210'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1208', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.8,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    { key: 'cardCount', label: 'Cards in Deck', type: 'number', defaultValue: 6, min: 2, max: 10, group: 'Animation' },
  ],
})
