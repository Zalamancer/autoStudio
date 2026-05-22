import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AugmentedRealityConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // AR tracking markers (corner brackets)
    const markers = Array.from({ length: 4 }, (_, i) => {
      const positions = [
        { top: '12%', left: '12%' },
        { top: '12%', right: '12%' },
        { bottom: '12%', left: '12%' },
        { bottom: '12%', right: '12%' },
      ]
      const rotations = [0, 90, 270, 180]
      const pulse = 0.5 + Math.sin(time * 2 + i * 1.5) * 0.3

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            ...positions[i],
            width: 'clamp(20px, 5vw, 40px)',
            height: 'clamp(20px, 5vw, 40px)',
            borderTop: `2px solid rgba(0,255,255,${pulse})`,
            borderLeft: `2px solid rgba(0,255,255,${pulse})`,
            transform: `rotate(${rotations[i]}deg)`,
            pointerEvents: 'none',
          }}
        />
      )
    })

    // Scanning grid dots
    const dots = Array.from({ length: 16 }, (_, i) => {
      const row = Math.floor(i / 4)
      const col = i % 4
      const x = 25 + col * 18
      const y = 25 + row * 18
      const active = Math.sin(time * 3 + i * 0.7) > 0.2
      const opacity = active ? 0.15 + Math.sin(time * 2 + i) * 0.1 : 0.04

      return (
        <div
          key={`dot-${i}`}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            width: 3,
            height: 3,
            borderRadius: '50%',
            background: `rgba(0,255,255,${opacity})`,
            pointerEvents: 'none',
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {markers}
        {dots}
        {/* AR overlay tint */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,255,255,0.02), transparent 30%, transparent 70%, rgba(255,0,255,0.02))',
            pointerEvents: 'none',
          }}
        />
        {/* Horizontal reference line */}
        <div
          style={{
            position: 'absolute',
            left: '8%',
            right: '8%',
            top: '50%',
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(0,255,255,0.06), transparent)',
            pointerEvents: 'none',
          }}
        />
        {/* AR status text */}
        <div
          style={{
            position: 'absolute',
            top: 'clamp(8px, 2vw, 16px)',
            right: 'clamp(12px, 3vw, 24px)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(8px, 1.5vw, 11px)',
            color: 'rgba(0,255,255,0.3)',
            letterSpacing: 2,
            pointerEvents: 'none',
          }}
        >
          AR OVERLAY v2.4
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 'clamp(8px, 2vw, 16px)',
            left: 'clamp(12px, 3vw, 24px)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(8px, 1.5vw, 11px)',
            color: 'rgba(0,255,255,0.25)',
            letterSpacing: 2,
            pointerEvents: 'none',
          }}
        >
          TRACKING: ACTIVE
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0

    // AR bounding box around text
    const renderBox = (opacity: number, content: React.ReactNode) => (
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
        {/* AR tracking box */}
        <div
          style={{
            position: 'absolute',
            top: -15,
            left: -20,
            right: -20,
            bottom: -15,
            border: `1px solid rgba(0,255,255,${opacity * 0.3})`,
            pointerEvents: 'none',
          }}
        >
          {/* Corner markers */}
          <div style={{ position: 'absolute', top: -1, left: -1, width: 10, height: 10, borderTop: `2px solid rgba(0,255,255,${opacity * 0.7})`, borderLeft: `2px solid rgba(0,255,255,${opacity * 0.7})` }} />
          <div style={{ position: 'absolute', top: -1, right: -1, width: 10, height: 10, borderTop: `2px solid rgba(0,255,255,${opacity * 0.7})`, borderRight: `2px solid rgba(0,255,255,${opacity * 0.7})` }} />
          <div style={{ position: 'absolute', bottom: -1, left: -1, width: 10, height: 10, borderBottom: `2px solid rgba(0,255,255,${opacity * 0.7})`, borderLeft: `2px solid rgba(0,255,255,${opacity * 0.7})` }} />
          <div style={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderBottom: `2px solid rgba(0,255,255,${opacity * 0.7})`, borderRight: `2px solid rgba(0,255,255,${opacity * 0.7})` }} />
        </div>
        {/* Label above */}
        <div
          style={{
            position: 'absolute',
            top: -28,
            left: 0,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(8px, 1.5vw, 10px)',
            color: `rgba(0,255,255,${opacity * 0.5})`,
            letterSpacing: 2,
          }}
        >
          ID:{String(index).padStart(3, '0')} TARGET
        </div>
        {content}
      </div>
    )

    if (phase === 'enter') {
      // AR lock-on: box appears first, then text fills in
      const boxProgress = Math.min(1, enterProgress * 2)
      const textProgress = Math.max(0, (enterProgress - 0.3) / 0.7)
      const scale = 0.9 + boxProgress * 0.1
      const textOpacity = Math.min(1, textProgress * 1.5)

      return renderBox(boxProgress, (
        <div
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 11vw, 150px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
            textShadow: `0 0 8px ${color}60`,
            opacity: textOpacity,
            transform: `scale(${scale})`,
          }}
        >
          {word}
        </div>
      ))
    } else if (phase === 'hold') {
      // Stable AR display with subtle tracking jitter
      const jitterX = Math.sin(f * 0.2) * 0.5
      const jitterY = Math.cos(f * 0.15) * 0.3

      return renderBox(1, (
        <div
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 11vw, 150px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
            textShadow: `0 0 10px ${color}, 0 0 25px ${color}20`,
            transform: `translate(${jitterX}px, ${jitterY}px)`,
          }}
        >
          {word}
        </div>
      ))
    } else {
      // Exit: AR loses tracking, box glitches and fades
      const boxFlicker = Math.sin(f * 0.5 + exitProgress * 10) > 0.3 ? 1 : 0.3
      const opacity = (1 - exitProgress) * boxFlicker

      return renderBox(opacity, (
        <div
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 11vw, 150px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
            textShadow: `0 0 8px ${color}`,
            opacity: 1 - exitProgress,
            transform: `translateX(${exitProgress * 10}px)`,
          }}
        >
          {word}
        </div>
      ))
    }
  },
}

function AugmentedRealityComponent(props: MotionGraphicProps<AugmentedRealityConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-augmented-reality',
  title: 'Kinetic Augmented Reality',
  description: 'AR overlay style text with tracking markers, bounding boxes, corner brackets, and scan-lock animation',
  tags: ['kinetic', 'typography', 'ar', 'augmented-reality', 'tracking', 'hud', 'cyberpunk', 'futuristic'],
  category: 'captions',
  component: AugmentedRealityComponent as any,
  defaultConfig: {
    words: ['TARGET', 'LOCK', 'SCAN', 'FOUND'],
    colors: ['#00FFFF', '#FF00FF', '#00FFFF', '#B400FF'],
    bgColor: '#06090e',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TARGET', 'LOCK', 'SCAN', 'FOUND'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FFFF', '#FF00FF', '#00FFFF', '#B400FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#06090e', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
