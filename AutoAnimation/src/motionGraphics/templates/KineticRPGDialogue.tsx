import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RPGDialogueConfig extends KineticBaseConfig {
  speakerName: string
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Dark RPG parchment-style scene */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 30%, rgba(40,35,50,0.3) 0%, transparent 70%)',
          }}
        />
        {/* Subtle animated particles like dust motes */}
        {Array.from({ length: 8 }, (_, i) => {
          const x = ((i * 137 + time * 12 * (0.5 + (i % 3) * 0.3)) % width)
          const y = ((i * 89 + time * 8 * (0.4 + (i % 2) * 0.2)) % (height * 0.5))
          const size = 2 + (i % 3)
          const alpha = 0.15 + Math.sin(time * 2 + i) * 0.08
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: size,
                height: size,
                borderRadius: '50%',
                background: `rgba(255,255,200,${alpha})`,
              }}
            />
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const chars = word.split('')
    const totalChars = chars.length

    // Dialogue box dimensions
    const boxWidth = width * 0.85
    const boxHeight = height * 0.32
    const boxX = (width - boxWidth) / 2
    const boxY = height * 0.58

    // Box opacity for enter/exit
    let boxOpacity = 1
    let arrowVisible = false

    if (phase === 'enter') {
      boxOpacity = Math.min(1, enterProgress * 3)
    } else if (phase === 'hold') {
      boxOpacity = 1
      arrowVisible = Math.sin(holdProgress * Math.PI * 6) > 0
    } else {
      boxOpacity = 1 - exitProgress
    }

    // Character-by-character typewriter reveal
    let visibleChars = totalChars
    if (phase === 'enter') {
      visibleChars = Math.floor(enterProgress * totalChars * 1.5)
    } else if (phase === 'hold') {
      visibleChars = totalChars
    } else {
      visibleChars = totalChars
    }

    // Speaker name from config — we extract it from the word pattern
    // The "word" IS the displayed text in KineticBase
    const speakerName = word.split(':')[0] || 'Hero'
    const dialogueText = word.includes(':') ? word.substring(word.indexOf(':') + 1).trim() : word

    const revealedText = dialogueText.substring(0, Math.min(visibleChars, dialogueText.length))

    // Blinking cursor at end of typing
    const showCursor = phase === 'enter' || (phase === 'hold' && Math.sin(f * 0.2) > 0)

    return (
      <div style={{ position: 'absolute', inset: 0, opacity: boxOpacity }}>
        {/* Dialogue box frame — classic RPG blue gradient */}
        <div
          style={{
            position: 'absolute',
            left: boxX,
            top: boxY,
            width: boxWidth,
            height: boxHeight,
            background: 'linear-gradient(180deg, #1a1a3e 0%, #0d0d2b 100%)',
            border: '3px solid #6666cc',
            borderRadius: 8,
            boxShadow: '0 0 20px rgba(80,80,180,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          {/* Inner highlight border */}
          <div
            style={{
              position: 'absolute',
              inset: 3,
              border: '1px solid rgba(100,100,200,0.25)',
              borderRadius: 4,
              pointerEvents: 'none',
            }}
          />

          {/* Speaker name plate */}
          <div
            style={{
              position: 'absolute',
              top: -16,
              left: 16,
              background: 'linear-gradient(180deg, #2a2a5e 0%, #1a1a3e 100%)',
              border: '2px solid #6666cc',
              borderRadius: 4,
              padding: '2px 14px',
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(12px, 3vw, 20px)',
              fontWeight: 700,
              color: '#ffcc44',
              textShadow: '0 0 6px rgba(255,200,60,0.4)',
              letterSpacing: 1,
            }}
          >
            {speakerName}
          </div>

          {/* Dialogue text area */}
          <div
            style={{
              position: 'absolute',
              top: 20,
              left: 20,
              right: 20,
              bottom: 20,
              fontFamily: "'Courier New', 'Lucida Console', monospace",
              fontSize: 'clamp(14px, 4vw, 28px)',
              lineHeight: 1.5,
              color,
              letterSpacing: 1,
            }}
          >
            {revealedText}
            {showCursor && (
              <span style={{ color: '#ffffff', opacity: 0.8 }}>|</span>
            )}
          </div>

          {/* Continue arrow — bouncing triangle */}
          {arrowVisible && phase === 'hold' && (
            <div
              style={{
                position: 'absolute',
                bottom: 10,
                right: 16,
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: '10px solid #ffcc44',
                transform: `translateY(${Math.sin(f * 0.15) * 3}px)`,
                filter: 'drop-shadow(0 0 4px rgba(255,200,60,0.5))',
              }}
            />
          )}
        </div>

        {/* Portrait frame silhouette */}
        <div
          style={{
            position: 'absolute',
            left: boxX - 10,
            top: boxY - 45,
            width: 60,
            height: 60,
            background: 'linear-gradient(135deg, #2a2a5e 0%, #1a1a3e 100%)',
            border: '2px solid #6666cc',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            color: '#6666cc',
            boxShadow: '0 0 10px rgba(80,80,180,0.2)',
          }}
        >
          {/* Simple character icon */}
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #8888dd 0%, #6666aa 100%)',
              boxShadow: '0 6px 0 0 #6666aa, 0 8px 0 4px #6666aa',
            }}
          />
        </div>
      </div>
    )
  },
}

function RPGDialogueComponent(props: MotionGraphicProps<RPGDialogueConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-rpg-dialogue',
  title: 'Kinetic RPG Dialogue',
  description:
    'Classic RPG dialogue box with character name plate, typewriter text reveal, blinking cursor, and bouncing continue arrow',
  tags: ['kinetic', 'typography', 'rpg', 'dialogue', 'game', 'jrpg', 'textbox', 'typewriter'],
  category: 'captions',
  component: RPGDialogueComponent as any,
  defaultConfig: {
    words: ['Hero:The journey begins now...', 'Sage:Beware the dark forest', 'Hero:I will not fail', 'Sage:May the light guide you'],
    colors: ['#e8e0d0', '#c8d8e8', '#e8e0d0', '#c8d8e8'],
    bgColor: '#0a0a1a',
    cycleDuration: 2.5,
    speakerName: 'Hero',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Dialogue Lines (Name:Text)',
      type: 'text-array',
      defaultValue: ['Hero:The journey begins now...', 'Sage:Beware the dark forest'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Text Colors',
      type: 'text-array',
      defaultValue: ['#e8e0d0', '#c8d8e8'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a1a', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.5,
      min: 1,
      max: 8,
      group: 'Timing',
    },
    {
      key: 'speakerName',
      label: 'Default Speaker',
      type: 'text',
      defaultValue: 'Hero',
      group: 'Content',
    },
  ],
})
