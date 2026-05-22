import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface JumpCutConfig extends KineticBaseConfig {
  jumpCount: number
}

// Jump positions — deterministic grid of offset slots
const JUMP_POSITIONS = [
  { x: -30, y: -20, scale: 1.0 },
  { x: 25, y: 15, scale: 0.85 },
  { x: -15, y: 25, scale: 1.15 },
  { x: 20, y: -25, scale: 0.9 },
  { x: 0, y: 0, scale: 1.05 },
  { x: -25, y: 10, scale: 1.2 },
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const jumpCount = 4
    // During enter: abruptly jump between positions each frame-slice
    // No easing — hard discrete jumps like a jump-cut edit
    const jumpInterval = 1 / jumpCount

    let posSlot = 0
    let opacity = 1
    let scale = 1

    if (phase === 'enter') {
      // Hard-cut between positions — each jump interval snaps immediately
      posSlot = Math.floor(enterProgress / jumpInterval) % JUMP_POSITIONS.length
      opacity = enterProgress > 0.75 ? 1 : 0.7 + posSlot * 0.08
      scale = JUMP_POSITIONS[posSlot].scale
    } else if (phase === 'hold') {
      // Stable final position with a single micro-jump at midpoint
      const midJump = holdProgress > 0.45 && holdProgress < 0.52
      posSlot = midJump ? (index % 2 === 0 ? 1 : 3) : 4
      opacity = 1
      scale = midJump ? 0.95 : 1
    } else {
      // Exit: jump away then vanish abruptly
      const jumpAway = exitProgress > 0.5
      posSlot = jumpAway ? (index % 3) : 4
      opacity = jumpAway ? 0 : 1
      scale = 1
    }

    const pos = JUMP_POSITIONS[posSlot % JUMP_POSITIONS.length]
    const xPct = (pos.x / 100) * width
    const yPct = (pos.y / 100) * height

    // Film grain overlay — subtle per-frame noise intensity
    const grainOpacity = 0.04 + (((f * 17 + index * 31) % 10) / 10) * 0.04

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Film grain */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
            opacity: grainOpacity,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${xPct}px), calc(-50% + ${yPct}px)) scale(${scale})`,
            opacity,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(36px, 11vw, 148px)',
            fontWeight: 900,
            color,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            letterSpacing: 2,
            textShadow: `2px 2px 0 rgba(0,0,0,0.6)`,
            // No transition — abrupt snap like a real jump cut
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function JumpCutComponent(props: MotionGraphicProps<JumpCutConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-jump-cut',
  title: 'Kinetic Jump Cut',
  description: 'Text abruptly repositions between frames with no easing — mimics the disorienting jump-cut editing technique from film',
  tags: ['kinetic', 'typography', 'jump-cut', 'film', 'edit', 'abrupt', 'cinematic'],
  category: 'captions',
  component: JumpCutComponent as any,
  defaultConfig: {
    words: ['CUT', 'JUMP', 'SNAP', 'AGAIN'],
    colors: ['#FFFFFF', '#FFD700', '#FF4444', '#FFFFFF'],
    bgColor: '#111111',
    cycleDuration: 1.2,
    jumpCount: 4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CUT', 'JUMP', 'SNAP', 'AGAIN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#FFD700', '#FF4444', '#FFFFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111111', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
    { key: 'jumpCount', label: 'Jump Count', type: 'number', defaultValue: 4, min: 2, max: 8, group: 'Animation' },
  ],
})
