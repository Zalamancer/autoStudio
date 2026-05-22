import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ThoughtCloudConfig extends KineticBaseConfig {}

// Thought cloud: dreamy cloud shape with bubble trail leading upward
// Bubbles rise first, then cloud materializes — classic cartoon thought convention
const BUBBLE_TRAIL = [
  { x: 35, y: 80, r: 9 },
  { x: 50, y: 62, r: 13 },
  { x: 62, y: 46, r: 17 },
]

const CLOUD_BUMPS = [
  { cx: 50, cy: 50, rx: 90, ry: 52 },
  { cx: 10, cy: 48, rx: 42, ry: 38 },
  { cx: 28, cy: 28, rx: 50, ry: 42 },
  { cx: 70, cy: 26, rx: 55, ry: 43 },
  { cx: 90, cy: 46, rx: 40, ry: 36 },
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)',
          backgroundSize: '14px 14px',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 41 + 7

    let cloudOpacity = 0
    let cloudScale = 0.6
    let bubbleProgress = 0
    let opacity = 1

    if (phase === 'enter') {
      // Bubbles rise first (0..0.5), cloud materialises (0.4..1)
      bubbleProgress = Math.min(1, enterProgress / 0.5)
      const cloudT = Math.max(0, (enterProgress - 0.4) / 0.6)
      cloudOpacity = cloudT
      cloudScale = 0.6 + cloudT * 0.4 + Math.sin(cloudT * Math.PI) * 0.08
    } else if (phase === 'hold') {
      cloudOpacity = 1
      cloudScale = 1 + Math.sin((seed + 0) * 0.05) * 0.012
      bubbleProgress = 1
    } else {
      cloudOpacity = 1 - exitProgress * 1.5
      cloudScale = 1 + exitProgress * 0.15
      bubbleProgress = 1 - exitProgress
      opacity = Math.max(0, 1 - exitProgress * 1.5)
    }

    const tilt = ((seed % 5) - 2) * 2.5

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) rotate(${tilt}deg)`,
          opacity,
        }}
      >
        {/* Bubble trail */}
        <svg
          style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', overflow: 'visible' }}
          width="340"
          height="200"
          viewBox="-20 -10 340 200"
        >
          {BUBBLE_TRAIL.map((b, i) => {
            const delay = i / BUBBLE_TRAIL.length
            const bOpacity = Math.max(0, Math.min(1, (bubbleProgress - delay * 0.5) / 0.4))
            const bY = b.y + (1 - bubbleProgress) * 20
            return (
              <circle
                key={i}
                cx={b.x * 3}
                cy={bY}
                r={b.r}
                fill="white"
                stroke="black"
                strokeWidth="2.5"
                opacity={bOpacity}
              />
            )
          })}

          {/* Cloud shape via overlapping ellipses */}
          <g
            transform={`translate(150, 75) scale(${cloudScale}) translate(-150, -75)`}
            opacity={cloudOpacity}
          >
            {/* Shadow */}
            {CLOUD_BUMPS.map((b, i) => (
              <ellipse
                key={`s${i}`}
                cx={b.cx * 3 + 4}
                cy={b.cy + 4}
                rx={b.rx}
                ry={b.ry}
                fill="rgba(0,0,0,0.18)"
              />
            ))}
            {/* White fill */}
            {CLOUD_BUMPS.map((b, i) => (
              <ellipse
                key={`f${i}`}
                cx={b.cx * 3}
                cy={b.cy}
                rx={b.rx}
                ry={b.ry}
                fill="white"
              />
            ))}
            {/* Black outline (stroke only) */}
            {CLOUD_BUMPS.map((b, i) => (
              <ellipse
                key={`o${i}`}
                cx={b.cx * 3}
                cy={b.cy}
                rx={b.rx}
                ry={b.ry}
                fill="none"
                stroke="black"
                strokeWidth="3"
              />
            ))}
          </g>
        </svg>

        {/* Text inside cloud */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -56%) scale(${cloudScale})`,
            opacity: cloudOpacity,
            fontFamily: "Impact, 'Arial Black', sans-serif",
            fontSize: 'clamp(22px, 5vw, 68px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color: color,
            WebkitTextStroke: '1.5px #000',
            textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function ThoughtCloudComponent(props: MotionGraphicProps<ThoughtCloudConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-thought-cloud',
  title: 'Kinetic Thought Cloud',
  description: 'Cartoon thought cloud with rising bubble trail — bubbles float up first then the cloud materialises with text inside, dreamy comic book convention',
  tags: ['kinetic', 'typography', 'comic', 'thought-bubble', 'cloud', 'dream', 'cartoon', 'speech'],
  category: 'captions',
  component: ThoughtCloudComponent as any,
  defaultConfig: {
    words: ['HMMMM', 'IDEA!', 'THINK', 'MAYBE'],
    colors: ['#0066FF', '#9900CC', '#FF0066', '#006633'],
    bgColor: '#87CEEB',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['HMMMM', 'IDEA!', 'THINK', 'MAYBE'], group: 'Content' },
    { key: 'colors', label: 'Text Colors', type: 'text-array', defaultValue: ['#0066FF', '#9900CC', '#FF0066', '#006633'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#87CEEB', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
  ],
})
