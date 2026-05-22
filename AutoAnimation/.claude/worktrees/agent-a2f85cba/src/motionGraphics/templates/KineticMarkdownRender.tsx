import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MarkdownRenderConfig extends KineticBaseConfig {}

// Markdown syntax decorators that cycle per word
const MD_DECORATORS = [
  { prefix: '# ', suffix: '', type: 'h1', description: 'Heading 1' },
  { prefix: '**', suffix: '**', type: 'bold', description: 'Bold' },
  { prefix: '> ', suffix: '', type: 'blockquote', description: 'Blockquote' },
  { prefix: '`', suffix: '`', type: 'code', description: 'Inline code' },
  { prefix: '## ', suffix: '', type: 'h2', description: 'Heading 2' },
  { prefix: '- [ ] ', suffix: '', type: 'task', description: 'Task item' },
  { prefix: '==', suffix: '==', type: 'highlight', description: 'Highlight' },
  { prefix: '***', suffix: '***', type: 'bolditalic', description: 'Bold italic' },
]

// Background: faint raw markdown text
const BG_MARKDOWN = [
  '# Getting Started',
  '',
  '> **Note:** This is a sample README',
  '',
  '## Installation',
  '',
  '```bash',
  'npm install my-package',
  '```',
  '',
  '- [x] Build the feature',
  '- [ ] Write tests',
  '- [ ] Deploy to prod',
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => {
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Obsidian/Typora editor top bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 30,
            background: 'rgba(255,255,255,0.02)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 12,
            gap: 8,
          }}
        >
          <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 11, color: 'rgba(255,255,255,0.18)' }}>
            README.md
          </span>
          <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: 10, fontFamily: 'monospace', marginLeft: 6 }}>
            Source · Preview
          </span>
        </div>

        {/* Background markdown text */}
        {BG_MARKDOWN.map((line, i) => {
          // Color by markdown token type
          let lineColor = 'rgba(255,255,255,0.05)'
          if (line.startsWith('# ')) lineColor = 'rgba(121,192,255,0.09)'
          else if (line.startsWith('## ')) lineColor = 'rgba(121,192,255,0.07)'
          else if (line.startsWith('> ')) lineColor = 'rgba(255,204,0,0.06)'
          else if (line.startsWith('```')) lineColor = 'rgba(150,150,150,0.08)'
          else if (line.startsWith('- [')) lineColor = 'rgba(86,211,100,0.07)'
          else if (line.startsWith('npm')) lineColor = 'rgba(86,211,100,0.07)'

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: 38 + i * 16,
                left: 16,
                fontFamily: "'Fira Code', monospace",
                fontSize: 10,
                color: lineColor,
                whiteSpace: 'pre',
              }}
            >
              {line || ' '}
            </div>
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const decorator = MD_DECORATORS[index % MD_DECORATORS.length]

    if (phase === 'enter') {
      // Show raw markdown first (with syntax chars), then render/parse to styled version
      const rawToRenderProgress = Math.min(1, enterProgress * 1.6)
      const rawOpacity = Math.max(0, 1 - rawToRenderProgress * 2)
      const renderedOpacity = Math.max(0, rawToRenderProgress * 2 - 1)

      const fullRaw = `${decorator.prefix}${word}${decorator.suffix}`

      // During first half: show raw markdown
      if (rawToRenderProgress < 0.5) {
        // Type in the raw markdown chars
        const charsVisible = Math.floor((rawToRenderProgress / 0.5) * (fullRaw.length + 1))
        const displayRaw = fullRaw.substring(0, charsVisible)
        const showCursor = Math.floor(f * 0.15) % 2 === 0

        return (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {/* Raw source label */}
            <div style={{ fontFamily: 'monospace', fontSize: 'clamp(9px, 2vw, 18px)', color: 'rgba(255,255,255,0.25)', letterSpacing: 2 }}>
              RAW MARKDOWN
            </div>
            {/* Raw text */}
            <div
              style={{
                fontFamily: "'Fira Code', monospace",
                fontSize: 'clamp(22px, 6vw, 80px)',
                fontWeight: 500,
                color: 'rgba(255,255,255,0.6)',
                whiteSpace: 'nowrap',
              }}
            >
              {displayRaw}
              {showCursor && <span style={{ opacity: 0.8 }}>|</span>}
            </div>
          </div>
        )
      }

      // Second half: transition — raw fades, rendered fades in
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {/* Raw fading */}
          <div
            style={{
              opacity: rawOpacity,
              fontFamily: "'Fira Code', monospace",
              fontSize: 'clamp(22px, 6vw, 80px)',
              color: 'rgba(255,255,255,0.5)',
              whiteSpace: 'nowrap',
              position: 'absolute',
            }}
          >
            {fullRaw}
          </div>
          {/* Rendered coming in */}
          <div style={{ opacity: renderedOpacity }}>
            {renderMarkdownWord(word, color, decorator, 1)}
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // Fully rendered: styled markdown output, pulsing glow
      const pulse = 0.9 + Math.sin(f * 0.1) * 0.1

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {renderMarkdownWord(word, color, decorator, pulse)}
        </div>
      )
    } else {
      // Exit: revert back to raw markdown, then fade
      const revertProgress = Math.min(1, exitProgress * 2)
      const rawOpacity = Math.min(1, exitProgress * 2)
      const fadeOpacity = 1 - Math.max(0, exitProgress * 2 - 1)

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: fadeOpacity,
            fontFamily: "'Fira Code', monospace",
            fontSize: 'clamp(22px, 6vw, 80px)',
            color: 'rgba(255,255,255,0.5)',
            whiteSpace: 'nowrap',
          }}
        >
          {`${decorator.prefix}${word}${decorator.suffix}`}
        </div>
      )
    }
  },
}

function renderMarkdownWord(
  word: string,
  color: string,
  decorator: typeof MD_DECORATORS[0],
  pulse: number
): React.ReactNode {
  const type = decorator.type

  if (type === 'h1') {
    return (
      <div
        style={{
          fontFamily: "'Fira Code', 'JetBrains Mono', sans-serif",
          fontSize: 'clamp(32px, 9vw, 120px)',
          fontWeight: 900,
          color,
          textShadow: `0 0 ${14 * pulse}px ${color}40`,
          borderBottom: `3px solid ${color}50`,
          paddingBottom: 4,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  }

  if (type === 'h2') {
    return (
      <div
        style={{
          fontFamily: "'Fira Code', sans-serif",
          fontSize: 'clamp(28px, 8vw, 100px)',
          fontWeight: 800,
          color,
          textShadow: `0 0 ${12 * pulse}px ${color}40`,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  }

  if (type === 'bold') {
    return (
      <div
        style={{
          fontFamily: "'Fira Code', sans-serif",
          fontSize: 'clamp(28px, 8vw, 105px)',
          fontWeight: 900,
          color,
          textShadow: `0 0 ${12 * pulse}px ${color}50`,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  }

  if (type === 'bolditalic') {
    return (
      <div
        style={{
          fontFamily: "'Fira Code', sans-serif",
          fontSize: 'clamp(28px, 8vw, 105px)',
          fontWeight: 900,
          fontStyle: 'italic',
          color,
          textShadow: `0 0 ${12 * pulse}px ${color}50`,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  }

  if (type === 'blockquote') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          whiteSpace: 'nowrap',
        }}
      >
        <div
          style={{
            width: 'clamp(4px, 1vw, 8px)',
            height: 'clamp(40px, 10vw, 120px)',
            background: color,
            opacity: 0.7,
            borderRadius: 2,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: "'Fira Code', sans-serif",
            fontSize: 'clamp(26px, 7vw, 92px)',
            fontStyle: 'italic',
            color,
            opacity: 0.9,
            textShadow: `0 0 ${10 * pulse}px ${color}40`,
          }}
        >
          {word}
        </span>
      </div>
    )
  }

  if (type === 'code') {
    return (
      <div
        style={{
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 6,
          padding: '4px 16px',
          fontFamily: "'Fira Code', 'Courier New', monospace",
          fontSize: 'clamp(24px, 7vw, 90px)',
          fontWeight: 700,
          color,
          textShadow: `0 0 ${10 * pulse}px ${color}40`,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  }

  if (type === 'task') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          whiteSpace: 'nowrap',
        }}
      >
        <div
          style={{
            width: 'clamp(20px, 5vw, 56px)',
            height: 'clamp(20px, 5vw, 56px)',
            border: `3px solid ${color}`,
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `${color}20`,
            flexShrink: 0,
          }}
        >
          <span style={{ color, fontSize: 'clamp(14px, 3.5vw, 40px)', fontWeight: 900 }}>✓</span>
        </div>
        <span
          style={{
            fontFamily: "'Fira Code', sans-serif",
            fontSize: 'clamp(24px, 7vw, 90px)',
            fontWeight: 700,
            color,
            textShadow: `0 0 ${10 * pulse}px ${color}40`,
          }}
        >
          {word}
        </span>
      </div>
    )
  }

  if (type === 'highlight') {
    return (
      <div
        style={{
          background: `${color}30`,
          padding: '2px 12px',
          borderRadius: 2,
          whiteSpace: 'nowrap',
        }}
      >
        <span
          style={{
            fontFamily: "'Fira Code', sans-serif",
            fontSize: 'clamp(28px, 8vw, 105px)',
            fontWeight: 700,
            color,
            textShadow: `0 0 ${14 * pulse}px ${color}60`,
          }}
        >
          {word}
        </span>
      </div>
    )
  }

  // Fallback
  return (
    <div
      style={{
        fontFamily: "'Fira Code', sans-serif",
        fontSize: 'clamp(28px, 8vw, 105px)',
        fontWeight: 700,
        color,
        whiteSpace: 'nowrap',
      }}
    >
      {word}
    </div>
  )
}

import React from 'react'

function MarkdownRenderComponent(props: MotionGraphicProps<MarkdownRenderConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-markdown-render',
  title: 'Kinetic Markdown Render',
  description:
    'Raw markdown syntax (# ** ` >) types in then transforms/renders to formatted output: heading, bold, blockquote, code, task, highlight styles',
  tags: ['kinetic', 'typography', 'markdown', 'code', 'developer', 'obsidian', 'typora', 'tech'],
  category: 'captions',
  component: MarkdownRenderComponent as any,
  defaultConfig: {
    words: ['AWESOME', 'SHIPPED', 'DONE', 'LIVE'],
    colors: ['#79c0ff', '#56d364', '#ffcc00', '#bc8cff'],
    bgColor: '#1e1e2e',
    cycleDuration: 2.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['AWESOME', 'SHIPPED', 'DONE', 'LIVE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#79c0ff', '#56d364', '#ffcc00', '#bc8cff'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1e1e2e', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.6, min: 0.8, max: 7, group: 'Timing' },
  ],
})
