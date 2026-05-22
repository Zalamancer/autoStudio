import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AlphabetRevealConfig extends KineticBaseConfig {}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInQuad(t: number): number {
  return t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    width,
    height,
  }: WordRenderProps) => {
    // Identify which alphabet letters are IN the word
    const wordSet = new Set(word.toUpperCase().split(''))

    // Layout: 26 letters spread across two rows (13 × 2)
    const charsPerRow = 13
    const rows = 2
    const letterFontSize = Math.min(width / (charsPerRow + 1), height / 6, 48)
    const rowH = height / (rows + 2)
    const totalRowW = charsPerRow * (letterFontSize * 1.4)
    const startX = (width - totalRowW) / 2

    const letterEls: React.ReactNode[] = []

    for (let i = 0; i < 26; i++) {
      const letter = ALPHABET[i]
      const isInWord = wordSet.has(letter)
      const row = Math.floor(i / charsPerRow)
      const col = i % charsPerRow
      const x = startX + col * (letterFontSize * 1.4) + letterFontSize * 0.7
      const y = rowH * (row + 1) + rowH / 2

      let opacity = 1
      let scale = 1
      let letterColor = ''
      let fontWeight: number | string = 400

      if (phase === 'enter') {
        if (isInWord) {
          // Word letters fade in to full brightness
          const t = easeOutCubic(enterProgress)
          opacity = t
          scale = 0.8 + t * 0.2
          letterColor = color
          fontWeight = 800
        } else {
          // Non-word letters start visible, dim slowly
          opacity = 0.7 - easeInQuad(enterProgress) * 0.5
          letterColor = 'rgba(200,200,200,1)'
          fontWeight = 300
        }
      } else if (phase === 'hold') {
        if (isInWord) {
          opacity = 1
          letterColor = color
          fontWeight = 800
          // Gentle beat pulse
          scale = 1 + Math.sin(holdProgress * Math.PI * 2) * 0.05
        } else {
          // Non-word letters fade away during hold
          opacity = Math.max(0, 0.2 - easeOutCubic(holdProgress) * 0.2)
          letterColor = 'rgba(200,200,200,1)'
          fontWeight = 300
        }
      } else {
        if (isInWord) {
          opacity = 1 - easeInQuad(exitProgress)
          scale = 1 + easeInQuad(exitProgress) * 0.4
          letterColor = color
          fontWeight = 800
        } else {
          opacity = 0
          letterColor = 'rgba(200,200,200,1)'
        }
      }

      letterEls.push(
        <div
          key={letter}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            transform: `translate(-50%, -50%) scale(${scale})`,
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontSize: letterFontSize,
            fontWeight,
            color: letterColor,
            opacity,
            lineHeight: 1,
            userSelect: 'none',
            letterSpacing: 0,
          }}
        >
          {letter}
        </div>
      )
    }

    // Render the spelled-out word large below during hold
    let wordOpacity = 0
    let wordScale = 0.6
    if (phase === 'hold') {
      wordOpacity = easeOutCubic(Math.min(1, holdProgress * 3))
      wordScale = 0.8 + easeOutCubic(Math.min(1, holdProgress * 3)) * 0.2
    } else if (phase === 'exit') {
      wordOpacity = 1 - exitProgress
      wordScale = 1
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {letterEls}
        <div
          style={{
            position: 'absolute',
            bottom: '14%',
            left: '50%',
            transform: `translateX(-50%) scale(${wordScale})`,
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontSize: 'clamp(32px, 10vw, 120px)',
            fontWeight: 900,
            color,
            opacity: wordOpacity,
            letterSpacing: '0.08em',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function AlphabetRevealComponent(props: MotionGraphicProps<AlphabetRevealConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-alphabet-reveal',
  title: 'Alphabet Reveal',
  description:
    'All 26 letters of the alphabet displayed at once. Irrelevant letters fade away leaving only the letters that form the word, which then snaps into reading order.',
  tags: ['kinetic', 'typography', 'alphabet', 'reveal', 'grid', 'letters', 'fade', 'isolate'],
  category: 'captions',
  component: AlphabetRevealComponent as any,
  defaultConfig: {
    words: ['TYPE', 'PLAY', 'FLEX', 'WORD'],
    colors: ['#F472B6', '#A78BFA', '#34D399', '#FBBF24'],
    bgColor: '#111118',
    cycleDuration: 2.2,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['TYPE', 'PLAY', 'FLEX', 'WORD'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#F472B6', '#A78BFA', '#34D399', '#FBBF24'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111118', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.2,
      min: 1.0,
      max: 6,
      group: 'Timing',
    },
  ],
})
