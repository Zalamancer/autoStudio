import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SignalDropConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Generate satellite signal dropout blocks — larger, more rectangular than codec artifacts
function getSatBlocks(
  cols: number,
  rows: number,
  frameSeed: number,
  density: number
): { col: number; row: number; w: number; h: number; color: string }[] {
  const blocks: { col: number; row: number; w: number; h: number; color: string }[] = []
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const s = c * 5 + r * 11 + frameSeed * 3
      if (rand(s) < density) {
        // Satellite dropouts tend to be wider horizontal bands
        const bw = 1 + Math.floor(rand(s + 1) * 4)
        const bh = 1 + Math.floor(rand(s + 2) * 2)
        // Palette: monochrome freeze + occasional color error
        const isColorError = rand(s + 3) < 0.15
        let color = '#888888'
        if (isColorError) {
          const hue = Math.floor(rand(s + 4) * 360)
          color = `hsl(${hue}, 80%, 55%)`
        } else {
          const gray = Math.floor(rand(s + 5) * 255)
          color = `rgb(${gray},${gray},${gray})`
        }
        blocks.push({ col: c, row: r, w: bw, h: bh, color })
      }
    }
  }
  return blocks
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const bw = 24
    const bh = 16
    const cols = Math.ceil(width / bw)
    const rows = Math.ceil(height / bh)

    // Background dropout field (light)
    const bgBlocks = getSatBlocks(cols, rows, Math.floor(time * 5), 0.04)

    // Signal strength meter
    const signalStrength = 0.3 + Math.abs(Math.sin(time * 1.2)) * 0.5
    const numBars = 5
    const filledBars = Math.floor(signalStrength * numBars)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {bgBlocks.map((b, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: b.col * bw,
              top: b.row * bh,
              width: b.w * bw,
              height: b.h * bh,
              background: b.color,
              opacity: 0.12,
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* Signal strength indicator */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 14,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 3,
          }}
        >
          {Array.from({ length: numBars }, (_, i) => (
            <div
              key={i}
              style={{
                width: 5,
                height: 4 + i * 3,
                background: i < filledBars
                  ? (i < 2 ? '#ff3030' : i < 4 ? '#ffaa00' : '#00ff80')
                  : 'rgba(255,255,255,0.15)',
              }}
            />
          ))}
        </div>
        {/* NO SIGNAL text, fades when signal is low */}
        {signalStrength < 0.45 && (
          <div
            style={{
              position: 'absolute',
              bottom: 10,
              right: 14,
              fontFamily: "'Courier New', monospace",
              fontSize: 9,
              color: 'rgba(255,80,80,0.7)',
              letterSpacing: 2,
            }}
          >
            NO SIGNAL
          </div>
        )}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 61 + 37
    const bw = 24
    const bh = 16
    const w = width ?? 400
    const h = height ?? 300
    const cols = Math.ceil(w / bw)
    const rows = Math.ceil(h / bh)

    let dropoutDensity = 0
    let opacity = 1
    let signalShiftX = 0

    if (phase === 'enter') {
      // Signal fades in through heavy dropout — like acquiring satellite lock
      dropoutDensity = (1 - enterProgress) * 0.6
      opacity = enterProgress
      signalShiftX = (1 - enterProgress) * (rand(seed) > 0.5 ? 15 : -15)
    } else if (phase === 'hold') {
      opacity = 1
      // Brief re-acquisition drop mid-hold
      const dropMoment = holdProgress > 0.45 && holdProgress < 0.55
      dropoutDensity = dropMoment ? 0.35 : 0.04
    } else {
      dropoutDensity = exitProgress * 0.65
      opacity = 1 - exitProgress
      signalShiftX = exitProgress * (rand(seed + 3) > 0.5 ? 12 : -12)
    }

    const blocks = getSatBlocks(cols, rows, Math.floor(f * 4) + seed, dropoutDensity)

    return (
      <>
        {/* Satellite dropout block overlay */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {blocks.map((b, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: b.col * bw,
                top: b.row * bh,
                width: b.w * bw,
                height: b.h * bh,
                background: b.color,
                opacity: 0.75,
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
            transform: `translate(calc(-50% + ${signalShiftX}px), -50%)`,
            opacity,
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(40px, 11vw, 160px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: 2,
            textShadow: `0 0 10px ${color}50`,
          }}
        >
          {word}
        </div>
        {/* Monochrome ghost (frozen last good frame) */}
        {dropoutDensity > 0.15 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${signalShiftX + (rand(seed + f) - 0.5) * 8}px), -50%)`,
              opacity: dropoutDensity * 0.35,
              color: '#aaaaaa',
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontSize: 'clamp(40px, 11vw, 160px)',
              fontWeight: 900,
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
              letterSpacing: 2,
              filter: 'blur(1px)',
            }}
          >
            {word}
          </div>
        )}
      </>
    )
  },
}

function SignalDropComponent(props: MotionGraphicProps<SignalDropConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-signal-drop',
  title: 'Kinetic Signal Drop',
  description: 'Digital satellite signal dropout with blocky frozen-frame artifacts, signal strength meter, and NO SIGNAL indicator',
  tags: ['kinetic', 'typography', 'signal', 'dropout', 'satellite', 'digital', 'hardware', 'glitch'],
  category: 'captions',
  component: SignalDropComponent as any,
  defaultConfig: {
    words: ['SIGNAL', 'LOST', 'ACQUIRE', 'LOCK'],
    colors: ['#ffffff', '#ff6600', '#00ff80', '#ffffff'],
    bgColor: '#0d0d14',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SIGNAL', 'LOST', 'ACQUIRE', 'LOCK'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ffffff', '#ff6600', '#00ff80', '#ffffff'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0d14', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
