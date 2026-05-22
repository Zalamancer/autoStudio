import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DeadPixelConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Generate dead/stuck pixel positions deterministically
function getPixelPositions(count: number, seed: number): { x: number; y: number; size: number; mode: 'dead' | 'stuck'; color: string }[] {
  const pixels = []
  for (let i = 0; i < count; i++) {
    const s = i * 17 + seed
    const x = rand(s) * 100
    const y = rand(s + 1) * 100
    const size = 1 + Math.floor(rand(s + 2) * 2) // 1-2px
    const mode = rand(s + 3) > 0.4 ? 'stuck' : 'dead'
    let color = '#000000'
    if (mode === 'stuck') {
      const colorSeed = rand(s + 4)
      if (colorSeed < 0.33) color = '#ff0000'
      else if (colorSeed < 0.66) color = '#00ff00'
      else color = '#0000ff'
    }
    pixels.push({ x, y, size, mode, color })
  }
  return pixels
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Persistent dead/stuck pixels on the background (small cluster, always present)
    const bgPixels = getPixelPositions(40, 999)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Slight noise texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle at ${50 + Math.sin(time * 0.5) * 10}% ${50 + Math.cos(time * 0.3) * 10}%, rgba(20,20,30,0.4) 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Persistent dead/stuck pixels */}
        {bgPixels.map((p, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              background: p.mode === 'dead' ? '#000000' : p.color,
              opacity: p.mode === 'dead' ? 0 : 0.7, // dead pixels blend into dark bg
              pointerEvents: 'none',
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 53 + 73

    const w = width ?? 400
    const h = height ?? 300

    // Spreading dead pixel cluster that reveals/obscures text
    let pixelCount = 0
    let spreadRadius = 0
    let opacity = 1

    if (phase === 'enter') {
      // Pixels spread FROM center outward — then clear to reveal text
      // 0..0.6: pixels spread + overlap text, 0.6..1: pixels recede, text emerges
      if (enterProgress < 0.6) {
        const spreadPhase = enterProgress / 0.6
        pixelCount = Math.floor(spreadPhase * spreadPhase * 300)
        spreadRadius = spreadPhase * Math.max(w, h) * 0.6
        opacity = Math.max(0, enterProgress * 0.8)
      } else {
        const clearPhase = (enterProgress - 0.6) / 0.4
        pixelCount = Math.floor((1 - clearPhase) * (1 - clearPhase) * 300)
        spreadRadius = (1 - clearPhase) * Math.max(w, h) * 0.6
        opacity = 0.6 + clearPhase * 0.4
      }
    } else if (phase === 'hold') {
      opacity = 1
      // Just a few residual stuck pixels during hold
      pixelCount = 8
      spreadRadius = Math.max(w, h) * 0.7
    } else {
      // Exit: pixels re-spread and consume the text
      pixelCount = Math.floor(exitProgress * exitProgress * 280)
      spreadRadius = exitProgress * Math.max(w, h) * 0.65
      opacity = 1 - exitProgress * 0.7
    }

    // Generate pixel positions relative to center
    const cx = w / 2
    const cy = h / 2
    const pixels: { x: number; y: number; size: number; color: string; opacity: number }[] = []
    for (let i = 0; i < pixelCount; i++) {
      const s = i * 23 + seed + Math.floor(f * 0.5)
      const angle = rand(s) * Math.PI * 2
      const dist = rand(s + 1) * spreadRadius
      const px = cx + Math.cos(angle) * dist
      const py = cy + Math.sin(angle) * dist
      const sz = 1 + Math.floor(rand(s + 2) * 3)
      const stuck = rand(s + 3) > 0.3
      let pcolor = '#000000'
      if (stuck) {
        const cr = rand(s + 4)
        if (cr < 0.33) pcolor = '#ff2020'
        else if (cr < 0.66) pcolor = '#20ff20'
        else pcolor = '#2060ff'
      }
      const pop = 0.5 + rand(s + 5) * 0.5
      pixels.push({ x: px, y: py, size: sz, color: pcolor, opacity: pop })
    }

    return (
      <>
        {/* Dead/stuck pixel swarm */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {pixels.map((p, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: p.x,
                top: p.y,
                width: p.size,
                height: p.size,
                background: p.color,
                opacity: p.opacity,
              }}
            />
          ))}
        </div>
        {/* Main text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity,
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(40px, 11vw, 160px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: 2,
            textShadow: `0 0 8px ${color}60`,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function DeadPixelComponent(props: MotionGraphicProps<DeadPixelConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-dead-pixel',
  title: 'Kinetic Dead Pixel',
  description: 'Dead and stuck pixels spread from center to obscure text then clear to reveal it — hardware LCD failure simulation',
  tags: ['kinetic', 'typography', 'dead pixel', 'stuck pixel', 'lcd', 'hardware', 'glitch', 'screen'],
  category: 'captions',
  component: DeadPixelComponent as any,
  defaultConfig: {
    words: ['DEFECT', 'PIXEL', 'STUCK', 'DEAD'],
    colors: ['#ffffff', '#ff4040', '#00ff80', '#4080ff'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DEFECT', 'PIXEL', 'STUCK', 'DEAD'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ffffff', '#ff4040', '#00ff80', '#4080ff'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
