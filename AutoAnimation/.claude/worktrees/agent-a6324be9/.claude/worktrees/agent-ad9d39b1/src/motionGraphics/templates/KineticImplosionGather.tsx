import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ImplosionGatherConfig extends KineticBaseConfig {}

function pseudoRandom(seed: number): number {
  return Math.abs(Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1
}

function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Inward-flowing energy lines */}
        {Array.from({ length: 16 }, (_, i) => {
          const angle = (i / 16) * Math.PI * 2
          const speed = 1.5 + pseudoRandom(i * 41) * 2
          const phase = (time * speed + pseudoRandom(i * 67)) % 1
          // Lines converge toward center
          const startDist = width * 0.6
          const dist = startDist * (1 - phase)
          const x1 = width / 2 + Math.cos(angle) * startDist
          const y1 = height / 2 + Math.sin(angle) * startDist * 0.8
          const x2 = width / 2 + Math.cos(angle) * dist
          const y2 = height / 2 + Math.sin(angle) * dist * 0.8
          const alpha = phase * 0.4
          const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
          const lineAngle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x1,
                top: y1,
                width: len,
                height: 1.5,
                background: `rgba(100,180,255,${alpha})`,
                transformOrigin: '0 50%',
                transform: `rotate(${lineAngle}deg)`,
              }}
            />
          )
        })}
        {/* Central vortex glow */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) scale(${1 + Math.sin(time * 5) * 0.15})`,
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: `radial-gradient(ellipse, rgba(100,200,255,${0.15 + Math.sin(time * 4) * 0.05}) 0%, transparent 70%)`,
          }}
        />
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
    width,
    height,
  }: WordRenderProps) => {
    const chars = word.split('')
    const numChars = chars.length

    // Per-character: start scattered around the screen, implode inward
    const charData = chars.map((ch, ci) => {
      const angle = (ci / numChars) * Math.PI * 2 + pseudoRandom(index * 53 + ci * 31) * 1.2
      const startDistance = width * (0.5 + pseudoRandom(index * 71 + ci * 47) * 0.35)
      const startY = height * (-0.3 + pseudoRandom(index * 97 + ci * 13) * 0.6)
      const spinStart = (pseudoRandom(ci * 43 + index * 17) - 0.5) * 540
      return { ch, angle, startDistance, startY, spinStart }
    })

    const charElements = charData.map(({ ch, angle, startDistance, startY, spinStart }, ci) => {
      let charX = 0
      let charY = 0
      let charRotate = 0
      let charOpacity = 1
      let charScale = 1

      if (phase === 'enter') {
        if (enterProgress < 0.75) {
          // Gathering phase: letters fly in from all directions, accelerating
          const t = easeInExpo(enterProgress / 0.75)
          const dist = startDistance * (1 - t)
          charX = Math.cos(angle) * dist
          charY = startY * (1 - t)
          charRotate = spinStart * (1 - t)
          charOpacity = 0.3 + t * 0.7
          charScale = 0.6 + t * 0.6
        } else {
          // Impact: overshoot then snap back (implosion crunch)
          const t = easeOutBack((enterProgress - 0.75) / 0.25)
          charX = 0
          charY = 0
          charRotate = 0
          charOpacity = 1
          charScale = t * 1.0
        }
      } else if (phase === 'hold') {
        // Stable with gentle pulse
        charX = 0
        charY = 0
        charRotate = 0
        charOpacity = 1
        charScale = 1 + Math.sin(holdProgress * Math.PI * 4) * 0.03
      } else {
        // Exit: implodes again — letters fly inward past center, disappear
        const t = exitProgress * exitProgress
        charX = Math.cos(angle + Math.PI) * t * startDistance * 0.4
        charY = -t * height * 0.3
        charRotate = -spinStart * t * 0.3
        charOpacity = 1 - exitProgress
        charScale = 1 - t * 0.5
      }

      return (
        <div
          key={ci}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${charX}px), calc(-50% + ${charY}px)) rotate(${charRotate}deg) scale(${charScale})`,
            opacity: charOpacity,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(48px, 13vw, 180px)',
            fontWeight: 900,
            color,
            textShadow: `2px 2px 0 rgba(0,0,0,0.7), 0 0 25px ${color}60`,
            userSelect: 'none',
          }}
        >
          {ch}
        </div>
      )
    })

    // Implosion flash on gather completion
    const impactOpacity = phase === 'enter' && enterProgress > 0.72 && enterProgress < 0.85
      ? (1 - Math.abs(enterProgress - 0.785) / 0.065) * 0.6
      : 0

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {charElements}
        {impactOpacity > 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(ellipse at 50% 50%, rgba(150,220,255,${impactOpacity}) 0%, transparent 40%)`,
            }}
          />
        )}
      </div>
    )
  },
}

function ImplosionGatherComponent(props: MotionGraphicProps<ImplosionGatherConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-implosion-gather',
  title: 'Kinetic Implosion Gather',
  description:
    'Letters fly in from all directions, accelerating toward center to implode and form the word. Energy lines converge inward in background.',
  tags: ['kinetic', 'typography', 'implosion', 'gather', 'letters', 'vortex', 'energy', 'physics'],
  category: 'captions',
  component: ImplosionGatherComponent as any,
  defaultConfig: {
    words: ['FOCUS', 'UNITE', 'CORE', 'MERGE'],
    colors: ['#44AAFF', '#00FFCC', '#AA44FF', '#FF44AA'],
    bgColor: '#050510',
    cycleDuration: 1.8,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['FOCUS', 'UNITE', 'CORE', 'MERGE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#44AAFF', '#00FFCC', '#AA44FF', '#FF44AA'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050510', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.8,
      min: 0.8,
      max: 5,
      group: 'Timing',
    },
  ],
})
