import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NotionPageConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

// Simulated Notion page blocks that type in
const NOTION_BLOCKS = [
  { type: 'h1', text: '📝 My Workspace', indent: 0 },
  { type: 'text', text: 'Created today · 2 min read', indent: 0 },
  { type: 'divider', text: '', indent: 0 },
  { type: 'bullet', text: 'Key insight #1', indent: 0 },
  { type: 'bullet', text: 'Key insight #2', indent: 0 },
  { type: 'toggle', text: 'Show more details...', indent: 0 },
  { type: 'callout', text: '💡 Important note here', indent: 0 },
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Notion sidebar hint */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: 'clamp(30px, 6vw, 50px)',
          background: 'rgba(247,246,243,0.04)',
          borderRight: '1px solid rgba(55,53,47,0.2)',
        }}
      />
      {/* Top bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 'clamp(22px, 4.5vw, 36px)',
          background: 'rgba(247,246,243,0.03)',
          borderBottom: '1px solid rgba(55,53,47,0.1)',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 'clamp(10px, 2.5vw, 20px)',
          gap: 'clamp(4px, 1vw, 8px)',
        }}
      >
        {['◀', '▶', '...'].map((ctrl, i) => (
          <span
            key={i}
            style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: 'clamp(7px, 1.2vw, 10px)',
              color: 'rgba(55,53,47,0.4)',
              opacity: 0.6,
            }}
          >
            {ctrl}
          </span>
        ))}
        <span
          style={{
            fontFamily: 'system-ui, sans-serif',
            fontSize: 'clamp(6px, 1vw, 8px)',
            color: 'rgba(55,53,47,0.5)',
            marginLeft: 'auto',
            marginRight: 'clamp(8px, 2vw, 16px)',
          }}
        >
          Share · Publish
        </span>
      </div>
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const contentW = Math.min(width * 0.65, 320)
    const startX = (width - contentW) / 2
    const startY = height * 0.12

    const nodes: React.ReactNode[] = []

    // Blocks type in one by one
    NOTION_BLOCKS.forEach((block, i) => {
      const delay = i * 0.1
      const blockP = easeOutExpo(Math.min(1, Math.max(0, (enterProgress - delay) / 0.2)))
      if (blockP <= 0) return

      const blockOpacity = phase === 'exit' ? Math.max(0, 1 - exitProgress * 3) : blockP
      const slideY = (1 - blockP) * 8

      let blockContent: React.ReactNode
      const blockFontSize = block.type === 'h1' ? 'clamp(9px, 1.8vw, 14px)' : 'clamp(6px, 1.1vw, 9px)'
      const blockColor = block.type === 'h1' ? 'rgba(55,53,47,0.9)' : 'rgba(55,53,47,0.6)'

      if (block.type === 'divider') {
        blockContent = (
          <div style={{ width: '100%', height: 1, background: 'rgba(55,53,47,0.15)', marginTop: 2, marginBottom: 2 }} />
        )
      } else if (block.type === 'callout') {
        blockContent = (
          <div
            style={{
              background: 'rgba(162,89,255,0.08)',
              borderRadius: 4,
              padding: 'clamp(3px, 0.6vw, 5px) clamp(6px, 1.2vw, 10px)',
              fontFamily: 'system-ui, sans-serif',
              fontSize: 'clamp(6px, 1.1vw, 9px)',
              color: 'rgba(55,53,47,0.8)',
              borderLeft: `3px solid ${color}`,
            }}
          >
            {block.text}
          </div>
        )
      } else {
        const prefix = block.type === 'bullet' ? '•  ' : block.type === 'toggle' ? '▸  ' : ''
        blockContent = (
          <div
            style={{
              fontFamily: block.type === 'h1' ? '"Georgia", serif' : 'system-ui, sans-serif',
              fontSize: blockFontSize,
              fontWeight: block.type === 'h1' ? 700 : 400,
              color: blockColor,
              paddingLeft: block.indent * 16,
            }}
          >
            {prefix}{block.text}
          </div>
        )
      }

      nodes.push(
        <div
          key={`block-${i}`}
          style={{
            position: 'absolute',
            left: startX,
            top: startY + i * (Math.min(height * 0.09, 24) + 2) + slideY,
            width: contentW,
            opacity: blockOpacity,
            transition: 'none',
          }}
        >
          {blockContent}
        </div>,
      )
    })

    // Big word appears as a featured callout/heading
    const wordP = easeOutBack(Math.min(1, Math.max(0, (enterProgress - 0.55) / 0.45)))
    const wordOpacity = phase === 'exit' ? Math.max(0, 1 - exitProgress * 1.5) : Math.min(1, Math.max(0, (enterProgress - 0.5) * 5))
    // Gentle pulse during hold
    const pulse = phase === 'hold' ? 1 + Math.sin(f * 0.09) * 0.015 : 1

    nodes.push(
      <div
        key="word"
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '50%',
          transform: `translateX(-50%) scale(${wordP * pulse})`,
          opacity: wordOpacity,
          whiteSpace: 'nowrap',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: '"Georgia", "Times New Roman", serif',
            fontSize: 'clamp(34px, 8.5vw, 118px)',
            fontWeight: 700,
            color,
            letterSpacing: -1,
            textShadow: `0 2px 20px ${color}44`,
          }}
        >
          {word}
        </div>
        {/* Notion-style text cursor blinking */}
        {phase === 'enter' && enterProgress > 0.55 && enterProgress < 0.85 && (
          <div
            style={{
              display: 'inline-block',
              width: 'clamp(2px, 0.4vw, 3px)',
              height: 'clamp(30px, 7.5vw, 104px)',
              background: color,
              marginLeft: 3,
              verticalAlign: 'middle',
              opacity: Math.sin(f * 0.3) > 0 ? 1 : 0,
            }}
          />
        )}
      </div>,
    )

    return <>{nodes}</>
  },
}

function NotionPageComponent(props: MotionGraphicProps<NotionPageConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-notion-page',
  title: 'Kinetic Notion Page',
  description:
    'Notion document blocks type in sequentially like a real page loading — bullet points, callouts and a divider appear before the word bursts as a serif heading',
  tags: ['kinetic', 'typography', 'notion', 'document', 'productivity', 'creator', 'tool', 'digital-native', 'typing'],
  category: 'captions',
  component: NotionPageComponent as any,
  defaultConfig: {
    words: ['FOCUS', 'CLARITY', 'FLOW', 'SYSTEMS'],
    colors: ['#A259FF', '#E77E55', '#4D9DE0', '#3BB273'],
    bgColor: '#FFFFFF',
    cycleDuration: 2.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FOCUS', 'CLARITY', 'FLOW', 'SYSTEMS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#A259FF', '#E77E55', '#4D9DE0', '#3BB273'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.5, min: 0.5, max: 5, group: 'Timing' },
  ],
})
