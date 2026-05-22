import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface VenetianBlindConfig extends KineticBaseConfig {
  slats: number
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const config = (globalThis as any).__venetianConfig ?? { slats: 8 }
    const slats = config.slats ?? 8
    const slatHeight = height / slats

    // Each slat opens with a stagger delay
    const slatElements = []
    for (let i = 0; i < slats; i++) {
      const stagger = i / slats
      let openAmount = 0

      if (phase === 'enter') {
        const delayed = Math.max(0, Math.min(1, (enterProgress - stagger * 0.4) / 0.6))
        openAmount = easeOutCubic(delayed)
      } else if (phase === 'hold') {
        openAmount = 1
      } else {
        const delayed = Math.max(0, Math.min(1, (exitProgress - (1 - stagger) * 0.3) / 0.7))
        openAmount = 1 - easeOutCubic(delayed)
      }

      // Slat rotates from 0 (closed) to 90 degrees (fully open, invisible)
      // At closed state, the slat covers text. Opening reveals text behind.
      const rotateX = openAmount * 85
      const slatOpacity = 1 - openAmount * 0.95

      slatElements.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            top: i * slatHeight,
            width,
            height: slatHeight + 1,
            perspective: 600,
            overflow: 'hidden',
          }}
        >
          {/* The blind slat that covers the text */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(180deg, rgba(200,200,210,${0.95 * slatOpacity}), rgba(140,140,155,${0.95 * slatOpacity}))`,
              transformOrigin: 'top center',
              transform: `rotateX(${rotateX}deg)`,
              boxShadow: slatOpacity > 0.1 ? `0 2px 6px rgba(0,0,0,${0.3 * slatOpacity})` : 'none',
            }}
          />
        </div>,
      )
    }

    // Text opacity based on average opening
    let textOpacity = 0
    if (phase === 'enter') textOpacity = Math.min(1, enterProgress * 2.5)
    else if (phase === 'hold') textOpacity = 1
    else textOpacity = 1 - exitProgress

    return (
      <>
        {/* Text layer behind the blinds */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            opacity: textOpacity,
          }}
        >
          {word}
        </div>
        {/* Venetian blind slats on top */}
        {slatElements}
      </>
    )
  },
}

function VenetianBlindComponent(props: MotionGraphicProps<VenetianBlindConfig>) {
  ;(globalThis as any).__venetianConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-venetian-blind',
  title: 'Kinetic Venetian Blind',
  description: 'Text revealed through horizontal venetian blind slats that rotate open with staggered timing',
  tags: ['kinetic', 'typography', 'venetian', 'blinds', 'reveal', 'geometric', 'mechanical'],
  category: 'captions',
  component: VenetianBlindComponent as any,
  defaultConfig: {
    words: ['REVEAL', 'OPEN', 'LIGHT', 'SHOW'],
    colors: ['#F0F0F0', '#E8D5B5', '#F0F0F0', '#D5C4A1'],
    bgColor: '#1a1a2e',
    cycleDuration: 1.4,
    slats: 8,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['REVEAL', 'OPEN', 'LIGHT', 'SHOW'],
      group: 'Content',
    },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F0F0F0', '#E8D5B5'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a2e', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.4,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
    { key: 'slats', label: 'Number of Slats', type: 'number', defaultValue: 8, min: 3, max: 20, group: 'Animation' },
  ],
})
