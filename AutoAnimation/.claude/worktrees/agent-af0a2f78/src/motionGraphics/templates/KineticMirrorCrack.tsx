import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MirrorCrackConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5)
}

function easeInQuad(t: number): number {
  return t * t
}

// Pre-calculated shard shapes (irregular quadrilaterals radiating from center)
function generateShards(count: number, width: number, height: number, seed: number) {
  const cx = width / 2
  const cy = height / 2
  const shards: { x: number; y: number; w: number; h: number; rotation: number; skewX: number; reflectAngle: number }[] = []

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * 360 + rand(i * 31 + seed) * 30
    const dist = 30 + rand(i * 47 + seed) * 80
    const angleRad = (angle * Math.PI) / 180
    const x = cx + Math.cos(angleRad) * dist - 40
    const y = cy + Math.sin(angleRad) * dist - 25
    const w = 40 + rand(i * 19 + seed) * 60
    const h = 25 + rand(i * 37 + seed) * 40
    const rotation = angle + (rand(i * 53 + seed) - 0.5) * 20
    const skewX = (rand(i * 67 + seed) - 0.5) * 15
    const reflectAngle = (rand(i * 83 + seed) - 0.5) * 30

    shards.push({ x, y, w, h, rotation, skewX, reflectAngle })
  }

  return shards
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    const cx = width / 2
    const cy = height / 2

    // Spiderweb crack pattern emanating from center
    const cracks: React.ReactNode[] = []
    const numMainCracks = 8

    for (let c = 0; c < numMainCracks; c++) {
      const angle = (c / numMainCracks) * 360 + rand(c * 41) * 15
      const angleRad = (angle * Math.PI) / 180
      const length = Math.min(width, height) * (0.3 + rand(c * 31) * 0.15)
      const endX = cx + Math.cos(angleRad) * length
      const endY = cy + Math.sin(angleRad) * length
      const crackAlpha = 0.12 + rand(c * 53) * 0.08

      // Main crack line
      cracks.push(
        <div
          key={`mc${c}`}
          style={{
            position: 'absolute',
            left: cx,
            top: cy,
            width: length,
            height: 1,
            transformOrigin: '0% 50%',
            transform: `rotate(${angle}deg)`,
            background: `linear-gradient(90deg, rgba(200,220,240,${crackAlpha}), rgba(200,220,240,${crackAlpha * 0.3}) 80%, transparent)`,
          }}
        />,
      )

      // Branch cracks
      const numBranches = 2 + Math.floor(rand(c * 67) * 3)
      for (let b = 0; b < numBranches; b++) {
        const branchDist = length * (0.3 + rand(c * 19 + b * 37) * 0.5)
        const branchAngle = angle + (rand(c * 23 + b * 47) - 0.5) * 60
        const branchLen = 15 + rand(c * 29 + b * 53) * 30
        const bx = cx + Math.cos(angleRad) * branchDist
        const by = cy + Math.sin(angleRad) * branchDist

        cracks.push(
          <div
            key={`bc${c}_${b}`}
            style={{
              position: 'absolute',
              left: bx,
              top: by,
              width: branchLen,
              height: 0.5,
              transformOrigin: '0% 50%',
              transform: `rotate(${branchAngle}deg)`,
              background: `linear-gradient(90deg, rgba(200,220,240,${crackAlpha * 0.6}), transparent)`,
            }}
          />,
        )
      }
    }

    // Mirror reflection shimmer
    const shimmerX = (Math.sin(t * 0.5) * 0.5 + 0.5) * 100
    const shimmerAlpha = 0.03 + Math.sin(t * 0.8) * 0.01

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Reflective surface base */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(${160 + Math.sin(t * 0.2) * 10}deg, rgba(30,35,50,0.3), rgba(50,55,70,0.1) 50%, rgba(30,35,50,0.3))`,
          }}
        />
        {/* Shimmer sweep */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(90deg, transparent ${shimmerX - 15}%, rgba(200,220,240,${shimmerAlpha}) ${shimmerX}%, transparent ${shimmerX + 15}%)`,
          }}
        />
        {cracks}
        {/* Impact point */}
        <div
          style={{
            position: 'absolute',
            left: cx - 6,
            top: cy - 6,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(200,220,240,0.15), transparent 70%)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30
    const shards = generateShards(10, width, height, index * 97)

    if (phase === 'enter') {
      const ep = easeOutQuint(enterProgress)

      // Impact: text appears with mirror cracking effect
      // Shards fly inward and assemble
      const shardElements = shards.map((shard, si) => {
        const delay = si / shards.length * 0.3
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.7))
        const sp = easeOutQuint(p)

        // Shard starts scattered, comes together
        const scatterX = (rand(si * 31 + index) - 0.5) * 200 * (1 - sp)
        const scatterY = (rand(si * 47 + index) - 0.5) * 150 * (1 - sp)
        const scatterRotate = (rand(si * 67 + index) - 0.5) * 90 * (1 - sp)

        return (
          <div
            key={si}
            style={{
              position: 'absolute',
              left: shard.x + scatterX,
              top: shard.y + scatterY,
              width: shard.w,
              height: shard.h,
              transform: `rotate(${shard.rotation + scatterRotate}deg) skewX(${shard.skewX}deg)`,
              overflow: 'hidden',
              opacity: sp * 0.5,
            }}
          >
            {/* Reflected text fragment in shard */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) rotate(${shard.reflectAngle}deg) scale(0.35)`,
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(42px, 12vw, 155px)',
                fontWeight: 800,
                color,
                whiteSpace: 'nowrap',
                letterSpacing: 3,
                textTransform: 'uppercase',
                opacity: 0.6,
              }}
            >
              {word}
            </div>
            {/* Shard edge highlight */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                border: `0.5px solid rgba(200,220,240,${sp * 0.3})`,
              }}
            />
          </div>
        )
      })

      // Main text emerging
      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {shardElements}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) scale(${0.8 + ep * 0.2})`,
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(42px, 12vw, 155px)',
              fontWeight: 800,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 3,
              textTransform: 'uppercase',
              opacity: ep,
              textShadow: `0 0 10px rgba(200,220,240,${ep * 0.2})`,
            }}
          >
            {word}
          </div>
        </div>
      )
    }

    if (phase === 'hold') {
      // Stable text with shard reflections showing different angles
      const shardElements = shards.map((shard, si) => {
        const shimmer = Math.sin(t * 2 + si * 0.7) * 0.5 + 0.5

        return (
          <div
            key={si}
            style={{
              position: 'absolute',
              left: shard.x,
              top: shard.y,
              width: shard.w,
              height: shard.h,
              transform: `rotate(${shard.rotation}deg) skewX(${shard.skewX}deg)`,
              overflow: 'hidden',
              opacity: 0.25 + shimmer * 0.15,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) rotate(${shard.reflectAngle + Math.sin(t + si) * 3}deg) scale(0.35)`,
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(42px, 12vw, 155px)',
                fontWeight: 800,
                color: shimmer > 0.7 ? '#E0EEFF' : color,
                whiteSpace: 'nowrap',
                letterSpacing: 3,
                textTransform: 'uppercase',
                opacity: 0.5,
              }}
            >
              {word}
            </div>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                border: `0.5px solid rgba(200,220,240,${0.15 + shimmer * 0.1})`,
              }}
            />
          </div>
        )
      })

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {shardElements}
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
              letterSpacing: 3,
              textTransform: 'uppercase',
              textShadow: `0 0 8px rgba(200,220,240,0.15), 0 0 25px rgba(200,220,240,0.05)`,
            }}
          >
            {word}
          </div>
        </div>
      )
    }

    // Exit: mirror shatters - shards fly apart
    const ep = easeInQuad(exitProgress)

    const shardElements = shards.map((shard, si) => {
      const delay = si / shards.length * 0.2
      const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.8))

      const flyX = (rand(si * 71 + index) - 0.5) * 250 * p
      const flyY = (rand(si * 89 + index) - 0.5) * 200 * p + p * 40
      const flyRotate = (rand(si * 43 + index) - 0.5) * 180 * p

      return (
        <div
          key={si}
          style={{
            position: 'absolute',
            left: shard.x + flyX,
            top: shard.y + flyY,
            width: shard.w,
            height: shard.h,
            transform: `rotate(${shard.rotation + flyRotate}deg) skewX(${shard.skewX}deg)`,
            overflow: 'hidden',
            opacity: (1 - p) * 0.4,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) rotate(${shard.reflectAngle}deg) scale(0.35)`,
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(42px, 12vw, 155px)',
              fontWeight: 800,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 3,
              textTransform: 'uppercase',
              opacity: 0.5,
            }}
          >
            {word}
          </div>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              border: `0.5px solid rgba(200,220,240,${(1 - p) * 0.3})`,
            }}
          />
        </div>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {shardElements}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${1 + ep * 0.1})`,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(42px, 12vw, 155px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            textTransform: 'uppercase',
            opacity: 1 - ep,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function MirrorCrackComponent(props: MotionGraphicProps<MirrorCrackConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-mirror-crack',
  title: 'Kinetic Mirror Crack',
  description: 'Text reflected in broken mirror, each shard shows different angle/fragment, spiderweb crack pattern emanating from impact point',
  tags: ['kinetic', 'typography', 'mirror', 'crack', 'shatter', 'reflection', 'broken', 'optics'],
  category: 'captions',
  component: MirrorCrackComponent as any,
  defaultConfig: {
    words: ['SHATTER', 'BREAK', 'CRACK', 'SPLIT'],
    colors: ['#C8D8F0', '#B0C0E0', '#D0E0F8', '#A8B8D8'],
    bgColor: '#0a0c14',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SHATTER', 'BREAK', 'CRACK', 'SPLIT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C8D8F0', '#B0C0E0', '#D0E0F8', '#A8B8D8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0c14', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
