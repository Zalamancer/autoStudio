import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ZoomFreezeConfig extends KineticBaseConfig {}

// Deterministic pseudo-random helpers
function dsin(seed: number): number {
  return Math.sin(seed * 127.1 + 311.7)
}

function pixelate(x: number, y: number, blockSize: number, frame: number): string {
  const bx = Math.floor(x / blockSize) * blockSize
  const by = Math.floor(y / blockSize) * blockSize
  const seed = bx * 73 + by * 37 + frame * 7
  const r = Math.abs(Math.floor(dsin(seed) * 128)) + 80
  const g = Math.abs(Math.floor(dsin(seed + 1) * 80)) + 60
  const b = Math.abs(Math.floor(dsin(seed + 2) * 80)) + 60
  return `rgb(${r},${g},${b})`
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    // Simulate a frozen pixelated video call face
    const blockSize = 18
    const cols = Math.ceil(width / blockSize)
    const rows = Math.ceil(height / blockSize)
    const blocks: React.ReactNode[] = []

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const seed = col * 13 + row * 7
        // Some blocks occasionally flicker to simulate partial refresh
        const flicker = Math.abs(dsin(seed + frame * 3)) > 0.97
        const color = flicker
          ? pixelate(col * blockSize, row * blockSize, blockSize, frame + 20)
          : pixelate(col * blockSize, row * blockSize, blockSize, 0)
        blocks.push(
          <div
            key={`${row}-${col}`}
            style={{
              position: 'absolute',
              left: col * blockSize,
              top: row * blockSize,
              width: blockSize,
              height: blockSize,
              background: color,
              border: '0.5px solid rgba(0,0,0,0.12)',
            }}
          />
        )
      }
    }

    // Connection bar at top
    const barVisible = true
    const dotCount = Math.floor((frame / fps) % 4)
    const dots = '.'.repeat(dotCount)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {blocks}
        {/* Dark overlay so text is readable */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
        {/* Top connection bar */}
        {barVisible && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              padding: '8px 16px',
              background: 'rgba(0,0,0,0.6)',
              fontFamily: "'Segoe UI', Arial, sans-serif",
              fontSize: 13,
              color: '#f5a623',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              zIndex: 10,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#f5a623',
                boxShadow: '0 0 6px #f5a623',
              }}
            />
            Connection unstable{dots}
          </div>
        )}
        {/* Bottom Zoom-style participant bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '6px 12px',
            background: 'rgba(0,0,0,0.7)',
            fontFamily: "'Segoe UI', Arial, sans-serif",
            fontSize: 12,
            color: 'rgba(255,255,255,0.7)',
            display: 'flex',
            justifyContent: 'space-between',
            zIndex: 10,
          }}
        >
          <span>You</span>
          <span>HD</span>
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 1
    let scale = 1
    let blockOffset = 0

    if (phase === 'enter') {
      // Freeze in: word assembles from pixel blocks
      opacity = enterProgress
      scale = 0.88 + enterProgress * 0.12
      blockOffset = (1 - enterProgress) * 14
    } else if (phase === 'hold') {
      opacity = 1
      // Occasional subtle pixel-shift during freeze hold
      const jitter = Math.abs(dsin(holdProgress * 47)) > 0.9 ? 2 : 0
      blockOffset = jitter
    } else {
      opacity = 1 - exitProgress
      // Freeze-frame break: split apart
      blockOffset = exitProgress * 20
    }

    // Pixelated text rendering via letter-spacing distortion
    const chars = word.split('').map((ch, ci) => {
      const charShift = phase === 'enter'
        ? (1 - enterProgress) * dsin(ci * 31 + 7) * 8
        : phase === 'exit'
        ? exitProgress * dsin(ci * 31 + 7) * 12
        : 0
      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            transform: `translateY(${charShift}px)`,
            color: ci % 5 === 0 && phase === 'hold' && holdProgress > 0.6 ? '#f5a623' : color,
          }}
        >
          {ch}
        </span>
      )
    })

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${blockOffset}px), -50%) scale(${scale})`,
          opacity,
          fontFamily: "'Segoe UI', Arial, sans-serif",
          fontSize: 'clamp(36px, 10vw, 130px)',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          letterSpacing: 2,
          textShadow: `0 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(245,166,35,0.3)`,
          imageRendering: 'pixelated',
        }}
      >
        {chars}
      </div>
    )
  },
}

function ZoomFreezeComponent(props: MotionGraphicProps<ZoomFreezeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-zoom-freeze',
  title: 'Kinetic Zoom Freeze',
  description: 'Zoom call freeze effect: pixelated frozen video background with "connection unstable" bar, text glitches in through pixel blocks',
  tags: ['kinetic', 'typography', 'glitch', 'zoom', 'video-call', 'pixel', 'freeze', 'cultural'],
  category: 'captions',
  component: ZoomFreezeComponent as any,
  defaultConfig: {
    words: ['FROZEN', 'CAN YOU', 'HEAR ME?', 'HELLO?'],
    colors: ['#ffffff', '#f5a623', '#ffffff', '#f5a623'],
    bgColor: '#1a1a2e',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FROZEN', 'CAN YOU', 'HEAR ME?', 'HELLO?'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ffffff', '#f5a623', '#ffffff', '#f5a623'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a2e', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
  ],
})
