import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RaindropLensConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInQuad(t: number): number {
  return t * t
}

interface Droplet {
  x: number
  y: number
  size: number
  seed: number
}

function generateDroplets(count: number, width: number, height: number, seed: number): Droplet[] {
  const droplets: Droplet[] = []
  for (let i = 0; i < count; i++) {
    droplets.push({
      x: rand(i * 41 + seed * 7 + 11) * width,
      y: rand(i * 67 + seed * 13 + 23) * height,
      size: 8 + rand(i * 29 + seed * 3) * 25,
      seed: i * 97 + seed * 31,
    })
  }
  return droplets
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Rain streaks on window pane
    const streaks: React.ReactNode[] = []
    const numStreaks = 14

    for (let i = 0; i < numStreaks; i++) {
      const sx = width * rand(i * 41 + 7)
      // Streaks slide down continuously
      const speed = 15 + rand(i * 31) * 25
      const streakLen = 30 + rand(i * 53) * 60
      const sy = ((t * speed + rand(i * 67) * 400) % (height + streakLen * 2)) - streakLen
      const alpha = 0.04 + rand(i * 19) * 0.06
      // Slight wobble in x
      const wobbleX = Math.sin(t * 2 + i * 1.3) * 1.5

      streaks.push(
        <div
          key={`st${i}`}
          style={{
            position: 'absolute',
            left: sx + wobbleX,
            top: sy,
            width: 1.2,
            height: streakLen,
            background: `linear-gradient(180deg, transparent, rgba(180,200,220,${alpha}) 15%, rgba(180,200,220,${alpha * 1.2}) 50%, rgba(180,200,220,${alpha * 0.5}) 85%, transparent)`,
            borderRadius: 1,
          }}
        />,
      )
    }

    // Ambient blurred city lights behind rain
    const lights: React.ReactNode[] = []
    for (let i = 0; i < 5; i++) {
      const lx = width * (0.1 + rand(i * 73) * 0.8)
      const ly = height * (0.3 + rand(i * 89) * 0.4)
      const lSize = 30 + rand(i * 43) * 50
      const hue = rand(i * 37) * 360
      const lAlpha = 0.04 + Math.sin(t * 0.5 + i) * 0.01

      lights.push(
        <div
          key={`lt${i}`}
          style={{
            position: 'absolute',
            left: lx,
            top: ly,
            width: lSize,
            height: lSize,
            borderRadius: '50%',
            background: `radial-gradient(circle, hsla(${hue}, 50%, 60%, ${lAlpha}), transparent 70%)`,
            filter: 'blur(12px)',
          }}
        />,
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {lights}
        {/* Window pane glass tint */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, rgba(30,40,60,0.2), rgba(20,30,50,0.1) 50%, rgba(30,40,60,0.2))`,
          }}
        />
        {streaks}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30
    const droplets = generateDroplets(16, width, height, index)

    // Base text (blurred as if seen through rain-covered glass)
    let textBlur = 3
    let textOpacity = 0

    if (phase === 'enter') {
      const ep = easeOutCubic(enterProgress)
      textOpacity = 0.3 + ep * 0.5
      textBlur = 4 - ep * 1.5
    } else if (phase === 'hold') {
      textOpacity = 0.8
      textBlur = 2.5 + Math.sin(t * 1.5) * 0.3
    } else {
      const ep = easeInQuad(exitProgress)
      textOpacity = 0.8 - ep * 0.6
      textBlur = 2.5 + ep * 3
    }

    // Droplets on glass, each one magnifying/inverting text beneath
    const dropletElements = droplets.map((drop, di) => {
      let dropOpacity = 0
      let dropScale = 1

      if (phase === 'enter') {
        const delay = di / droplets.length * 0.4
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.6))
        dropOpacity = easeOutCubic(p)
        dropScale = 0.3 + easeOutCubic(p) * 0.7
      } else if (phase === 'hold') {
        dropOpacity = 0.85 + Math.sin(t * 1.2 + di * 0.5) * 0.1
        dropScale = 1
      } else {
        const delay = di / droplets.length * 0.2
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.8))
        dropOpacity = 1 - easeInQuad(p)
        // Droplets slide down as they fade
        drop.y += p * 30
        dropScale = 1 - p * 0.3
      }

      // Rain drops gravity — slowly sliding down
      const slideY = ((t * 3 + rand(drop.seed) * 10) % 8) * (drop.size / 20)

      // Droplet lens: shows inverted/magnified text fragment
      const lensScale = 0.7 + (drop.size / 35) * 0.5
      const invertX = di % 2 === 0 ? -1 : 1 // water droplets invert image

      return (
        <div
          key={di}
          style={{
            position: 'absolute',
            left: drop.x - drop.size / 2,
            top: drop.y + slideY - drop.size / 2,
            width: drop.size,
            height: drop.size * (1.1 + rand(drop.seed + 1) * 0.3),
            borderRadius: '45% 45% 50% 50% / 40% 40% 60% 60%',
            overflow: 'hidden',
            opacity: dropOpacity,
            transform: `scale(${dropScale})`,
          }}
        >
          {/* Water droplet body */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              background: `radial-gradient(ellipse at 35% 30%, rgba(255,255,255,0.18), rgba(180,200,220,0.08) 50%, rgba(140,160,180,0.04))`,
              border: '0.5px solid rgba(200,220,240,0.15)',
            }}
          />
          {/* Inverted text seen through droplet */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) scaleX(${invertX}) scale(${lensScale})`,
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(10px, 3vw, 28px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 1,
              textTransform: 'uppercase',
              opacity: 0.7,
              filter: 'blur(0.3px)',
            }}
          >
            {word}
          </div>
          {/* Specular highlight */}
          <div
            style={{
              position: 'absolute',
              top: '18%',
              left: '25%',
              width: '35%',
              height: '22%',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              filter: 'blur(2px)',
              transform: 'rotate(-15deg)',
            }}
          />
        </div>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Base blurred text behind glass */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(42px, 12vw, 155px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            textTransform: 'uppercase',
            opacity: textOpacity,
            filter: `blur(${textBlur}px)`,
          }}
        >
          {word}
        </div>

        {/* Rain droplets with lens effect */}
        {dropletElements}
      </div>
    )
  },
}

function RaindropLensComponent(props: MotionGraphicProps<RaindropLensConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-raindrop-lens',
  title: 'Kinetic Raindrop Lens',
  description: 'Text visible through water droplets on glass, each drop inverts/magnifies the word, rain streaks, window pane with blurred city lights',
  tags: ['kinetic', 'typography', 'rain', 'water', 'droplet', 'lens', 'glass', 'optics'],
  category: 'captions',
  component: RaindropLensComponent as any,
  defaultConfig: {
    words: ['RAIN', 'DROPS', 'GLASS', 'TEARS'],
    colors: ['#C0D8F0', '#A8C8E8', '#D0E0F8', '#B0D0F0'],
    bgColor: '#0c1420',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['RAIN', 'DROPS', 'GLASS', 'TEARS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C0D8F0', '#A8C8E8', '#D0E0F8', '#B0D0F0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c1420', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
