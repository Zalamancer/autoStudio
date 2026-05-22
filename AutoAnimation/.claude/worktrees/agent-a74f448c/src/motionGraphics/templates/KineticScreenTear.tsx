import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ScreenTearConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // VSync tear lines — horizontal seams where frame buffer swapped mid-draw
    const numTears = 3
    const tears: { y: number; offset: number; thickness: number }[] = []
    for (let i = 0; i < numTears; i++) {
      const phase = (time * (1.5 + i * 0.7) + i * 0.4) % 1
      const y = phase * 110 - 5
      const offset = (rand(i * 11 + Math.floor(time * 6)) - 0.5) * 30
      const thickness = 1 + rand(i * 7 + Math.floor(time * 4)) * 2
      tears.push({ y, offset, thickness })
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Faint horizontal scan grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.018) 3px, rgba(255,255,255,0.018) 4px)',
            pointerEvents: 'none',
          }}
        />
        {/* Vertical color fringe along tear seam */}
        {tears.map((t, i) => (
          <div key={i}>
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${t.y}%`,
                height: t.thickness,
                background: 'rgba(255,30,80,0.7)',
                transform: `translateX(${t.offset * 0.5}px)`,
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${t.y + 0.3}%`,
                height: 1,
                background: 'rgba(0,200,255,0.5)',
                transform: `translateX(${-t.offset * 0.3}px)`,
                pointerEvents: 'none',
              }}
            />
          </div>
        ))}
        {/* Sub-pixel shimmer at bottom */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 3,
            background: `rgba(255,50,50,${0.1 + Math.sin(time * 7) * 0.05})`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 67 + 19

    // Screen tear: split the text into upper and lower halves with horizontal offset
    // The tear position sweeps through the text
    let tearY = 50 // percentage split point
    let topOffset = 0
    let bottomOffset = 0
    let opacity = 1

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 1.5)
      // Tear starts wide and converges to zero offset
      const tearIntensity = (1 - enterProgress) * 40
      tearY = 30 + enterProgress * 20
      topOffset = -tearIntensity
      bottomOffset = tearIntensity
    } else if (phase === 'hold') {
      opacity = 1
      // Periodic tearing events during hold
      const tearEvent1 = holdProgress > 0.3 && holdProgress < 0.36
      const tearEvent2 = holdProgress > 0.7 && holdProgress < 0.74
      if (tearEvent1 || tearEvent2) {
        const intensity = 8
        tearY = 35 + rand(seed + Math.floor(holdProgress * 30)) * 30
        topOffset = (rand(seed + 1 + Math.floor(holdProgress * 20)) - 0.5) * intensity * 2
        bottomOffset = (rand(seed + 2 + Math.floor(holdProgress * 20)) - 0.5) * intensity * 2
      }
    } else {
      opacity = 1 - exitProgress
      const tearIntensity = exitProgress * 35
      tearY = 50 - exitProgress * 15
      topOffset = tearIntensity
      bottomOffset = -tearIntensity
    }

    const fontSize = 'clamp(40px, 11vw, 160px)'
    const fontBase: React.CSSProperties = {
      position: 'absolute',
      top: '50%',
      left: '50%',
      fontFamily: "'Arial Black', 'Impact', sans-serif",
      fontSize,
      fontWeight: 900,
      color,
      whiteSpace: 'nowrap',
      textTransform: 'uppercase',
      letterSpacing: 2,
    }

    return (
      <>
        {/* Top half — above tear line */}
        <div
          style={{
            ...fontBase,
            transform: `translate(calc(-50% + ${topOffset}px), -50%)`,
            clipPath: `inset(0 0 ${100 - tearY}% 0)`,
            opacity,
            textShadow: topOffset !== 0 ? `${topOffset * 0.1}px 0 rgba(255,0,80,0.8)` : `0 0 6px ${color}40`,
          }}
        >
          {word}
        </div>
        {/* Bottom half — below tear line */}
        <div
          style={{
            ...fontBase,
            transform: `translate(calc(-50% + ${bottomOffset}px), -50%)`,
            clipPath: `inset(${tearY}% 0 0 0)`,
            opacity,
            textShadow: bottomOffset !== 0 ? `${bottomOffset * 0.1}px 0 rgba(0,200,255,0.8)` : `0 0 6px ${color}40`,
          }}
        >
          {word}
        </div>
        {/* Tear seam color fringe */}
        {(Math.abs(topOffset) > 1 || Math.abs(bottomOffset) > 1) && (
          <>
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(calc(-50% + ${topOffset + 2}px), -50%)`,
                clipPath: `inset(${tearY - 1}% 0 ${100 - tearY - 1}% 0)`,
                opacity: opacity * 0.5,
                color: 'rgba(255,0,80,1)',
                mixBlendMode: 'screen',
                fontFamily: "'Arial Black', 'Impact', sans-serif",
                fontSize,
                fontWeight: 900,
                whiteSpace: 'nowrap',
                textTransform: 'uppercase',
                letterSpacing: 2,
              }}
            >
              {word}
            </div>
          </>
        )}
      </>
    )
  },
}

function ScreenTearComponent(props: MotionGraphicProps<ScreenTearConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-screen-tear',
  title: 'Kinetic Screen Tear',
  description: 'Horizontal screen tearing from VSync failure — text splits at a tear line with red/cyan fringe offsets and periodic tearing events',
  tags: ['kinetic', 'typography', 'screen', 'tear', 'vsync', 'glitch', 'hardware', 'monitor'],
  category: 'captions',
  component: ScreenTearComponent as any,
  defaultConfig: {
    words: ['TEAR', 'SPLIT', 'BREAK', 'SYNC'],
    colors: ['#ff4466', '#ffffff', '#00ddff', '#ff4466'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TEAR', 'SPLIT', 'BREAK', 'SYNC'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ff4466', '#ffffff', '#00ddff', '#ff4466'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
