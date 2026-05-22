import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface StackOverflowConfig extends KineticBaseConfig {
  stackDepth: number
}

function dRand(seed: number): number {
  return Math.abs(Math.sin(seed * 133.7 + 420.0) * 43758.5453) % 1
}

const STACK_FRAMES = [
  'at render() [0x7f3a]',
  'at process() [0x7f2b]',
  'at update() [0x7f1c]',
  'at loop() [0x7f0d]',
  'at main() [0x7efe]',
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Stack trace sidebar */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(255,80,80,0.35)',
            lineHeight: 1.4,
          }}
        >
          <div style={{ color: 'rgba(255,80,80,0.6)', marginBottom: 2 }}>
            StackOverflowError: stack depth {Math.floor(time * 120 + 1000)}
          </div>
          {STACK_FRAMES.map((f, i) => (
            <div key={i}>{f}</div>
          ))}
          <div style={{ opacity: 0.4 }}>... {Math.floor(time * 100 + 500)} more</div>
        </div>
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    height,
    frame,
  }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 197 + 53
    const STACK_DEPTH = 8

    if (phase === 'enter') {
      // Layers stack up from below, squishing down; newer ones push older ones up
      const layersVisible = Math.ceil(enterProgress * STACK_DEPTH)
      const stackProgress = enterProgress

      const layers = Array.from({ length: layersVisible }, (_, li) => {
        // Layer 0 is the "top" (most recently pushed), layers go down
        const layerAge = (layersVisible - 1 - li) / (STACK_DEPTH - 1)
        // Older layers get pushed further up and compressed
        const compression = 1 - layerAge * 0.6 * stackProgress
        const yOffset = -li * 8 * stackProgress
        const layerOpacity = 1 - layerAge * 0.75
        const layerScale = compression
        const isTop = li === layersVisible - 1

        return (
          <div
            key={li}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, calc(-50% + ${yOffset}px)) scaleY(${layerScale})`,
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(36px, 9vw, 140px)',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              letterSpacing: 3,
              color: isTop ? color : `${color}`,
              opacity: layerOpacity,
              textShadow: isTop ? `0 0 10px ${color}60` : 'none',
            }}
          >
            {word}
          </div>
        )
      })

      return <div style={{ position: 'absolute', inset: 0 }}>{layers}</div>
    }

    if (phase === 'hold') {
      // Stack is full — slight wobble then stays, small compression artifacts
      const wobble = Math.sin(holdProgress * Math.PI * 6) * 1.5 * (1 - holdProgress)
      const isAboutToCollapse = holdProgress > 0.85

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Ghost stack behind */}
          {Array.from({ length: 3 }, (_, gi) => (
            <div
              key={gi}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, calc(-50% + ${-(gi + 1) * 6}px)) scaleY(${1 - gi * 0.15})`,
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(36px, 9vw, 140px)',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                letterSpacing: 3,
                color,
                opacity: 0.12 - gi * 0.03,
              }}
            >
              {word}
            </div>
          ))}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${wobble}px), -50%)`,
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(36px, 9vw, 140px)',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              letterSpacing: 3,
              color,
              textShadow: isAboutToCollapse ? `0 0 15px ${color}, 2px 0 #FF4444, -2px 0 #FF4444` : `0 0 8px ${color}60`,
            }}
          >
            {word}
          </div>
        </div>
      )
    }

    // Exit: stack collapses — all layers fall to center then fade
    const collapseSpeed = exitProgress * exitProgress
    const fallOffset = collapseSpeed * 20

    const layers = Array.from({ length: 4 }, (_, li) => {
      const yOff = -(li * 6 * (1 - collapseSpeed)) + fallOffset
      const opacity = (1 - li * 0.2) * (1 - exitProgress)

      return (
        <div
          key={li}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${yOff}px))`,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(36px, 9vw, 140px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            color,
            opacity,
          }}
        >
          {word}
        </div>
      )
    })

    return <div style={{ position: 'absolute', inset: 0 }}>{layers}</div>
  },
}

function StackOverflowComponent(props: MotionGraphicProps<StackOverflowConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-stack-overflow',
  title: 'Kinetic Stack Overflow',
  description: 'Stack overflow: text layers stack infinitely deep from below, compress, then collapse in a crash',
  tags: ['kinetic', 'typography', 'glitch', 'stack', 'overflow', 'crash', 'software', 'digital'],
  category: 'captions',
  component: StackOverflowComponent as any,
  defaultConfig: {
    words: ['STACK', 'PUSH', 'DEPTH', 'CRASH'],
    colors: ['#FF4444', '#FF6666', '#FF4444', '#FF8888'],
    bgColor: '#0a0000',
    cycleDuration: 1.8,
    stackDepth: 8,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['STACK', 'PUSH', 'DEPTH', 'CRASH'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF4444', '#FF6666', '#FF4444', '#FF8888'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0000', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.8,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
    { key: 'stackDepth', label: 'Stack Depth', type: 'number', defaultValue: 8, min: 3, max: 16, group: 'Animation' },
  ],
})
