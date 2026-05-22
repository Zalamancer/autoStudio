import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MemoryLeakConfig extends KineticBaseConfig {
  ghostCount: number
}

function dRand(seed: number): number {
  return Math.abs(Math.sin(seed * 112.9 + 78.233) * 43758.5453) % 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Memory usage bar slowly filling up
    const memPct = Math.min(98, 20 + (time % 8) * 10)
    const memColor = memPct > 80 ? '#FF4444' : memPct > 60 ? '#FF8C00' : '#00FF88'

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Memory usage indicator bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 12,
            right: 12,
            fontFamily: "'Courier New', monospace",
            fontSize: 9,
            color: 'rgba(0,255,136,0.4)',
          }}
        >
          <div style={{ marginBottom: 3 }}>
            MEM: {Math.floor(memPct)}% [{Array.from({ length: 20 }, (_, i) => i < Math.floor(memPct / 5) ? '█' : '░').join('')}]
          </div>
          <div
            style={{
              height: 2,
              background: `linear-gradient(90deg, ${memColor} ${memPct}%, rgba(0,0,0,0.2) ${memPct}%)`,
              borderRadius: 1,
            }}
          />
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 179 + 61
    const GHOST_MAX = 6

    if (phase === 'enter') {
      // Ghosts multiply from 0 to GHOST_MAX, getting more opaque, overlapping
      const ghostsVisible = Math.floor(enterProgress * GHOST_MAX)
      const ghosts = Array.from({ length: ghostsVisible }, (_, gi) => {
        const gSeed = seed + gi * 41
        const xOff = (dRand(gSeed) - 0.5) * 60 * (1 - enterProgress * 0.5)
        const yOff = (dRand(gSeed + 1) - 0.5) * 40 * (1 - enterProgress * 0.5)
        const ghostOpacity = (gi / GHOST_MAX) * 0.35 * (1 - enterProgress * 0.4)

        return (
          <div
            key={gi}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${xOff}px), calc(-50% + ${yOff}px))`,
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(36px, 9vw, 140px)',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              letterSpacing: 3,
              color: color,
              opacity: ghostOpacity,
              filter: 'blur(1px)',
            }}
          >
            {word}
          </div>
        )
      })

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {ghosts}
          {/* Main copy fades in */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(36px, 9vw, 140px)',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              letterSpacing: 3,
              color,
              opacity: enterProgress,
              textShadow: `0 0 10px ${color}60`,
            }}
          >
            {word}
          </div>
        </div>
      )
    }

    if (phase === 'hold') {
      // Ghosts drift slowly, occasionally new ones appear and fade
      const driftGhosts = Array.from({ length: 3 }, (_, gi) => {
        const gSeed = seed + gi * 71 + 200
        const driftPhase = (holdProgress * 2.5 + gi * 0.8) % 3
        if (driftPhase > 1.0) return null
        const xOff = Math.sin(holdProgress * 3 + gi * 1.3) * 15
        const yOff = Math.cos(holdProgress * 2 + gi * 0.9) * 10
        const opacity = Math.sin(driftPhase * Math.PI) * 0.15

        return (
          <div
            key={gi}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${xOff}px), calc(-50% + ${yOff}px))`,
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(36px, 9vw, 140px)',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              letterSpacing: 3,
              color,
              opacity,
              filter: 'blur(0.5px)',
            }}
          >
            {word}
          </div>
        )
      })

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {driftGhosts}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(36px, 9vw, 140px)',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              letterSpacing: 3,
              color,
              textShadow: `0 0 8px ${color}50`,
            }}
          >
            {word}
          </div>
        </div>
      )
    }

    // Exit: ghosts collapse back into single copy then all fade together
    const collapseProgress = Math.min(exitProgress * 2, 1)
    const fadeProgress = Math.max(0, exitProgress * 2 - 1)

    const ghosts = Array.from({ length: GHOST_MAX }, (_, gi) => {
      const gSeed = seed + gi * 41
      const xOff = (dRand(gSeed) - 0.5) * 60 * (1 - collapseProgress)
      const yOff = (dRand(gSeed + 1) - 0.5) * 40 * (1 - collapseProgress)
      const opacity = 0.25 * (1 - collapseProgress) * (1 - fadeProgress)

      return (
        <div
          key={gi}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${xOff}px), calc(-50% + ${yOff}px))`,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(36px, 9vw, 140px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            color,
            opacity,
          }}
        >
          {word}
        </div>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {ghosts}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(36px, 9vw, 140px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            color,
            opacity: 1 - fadeProgress,
            textShadow: `0 0 8px ${color}50`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function MemoryLeakComponent(props: MotionGraphicProps<MemoryLeakConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-memory-leak',
  title: 'Kinetic Memory Leak',
  description: 'Memory leak: text duplicates into ghost copies that multiply and drift, then collapse back to a single clean instance',
  tags: ['kinetic', 'typography', 'glitch', 'memory', 'leak', 'ghost', 'software', 'digital'],
  category: 'captions',
  component: MemoryLeakComponent as any,
  defaultConfig: {
    words: ['ALLOC', 'HEAP', 'LEAK', 'FREE'],
    colors: ['#00FF88', '#00CC66', '#00FF88', '#66FFAA'],
    bgColor: '#020a06',
    cycleDuration: 1.8,
    ghostCount: 6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ALLOC', 'HEAP', 'LEAK', 'FREE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FF88', '#00CC66', '#00FF88', '#66FFAA'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#020a06', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.3, max: 5, group: 'Timing' },
    { key: 'ghostCount', label: 'Ghost Copies', type: 'number', defaultValue: 6, min: 2, max: 12, group: 'Animation' },
  ],
})
