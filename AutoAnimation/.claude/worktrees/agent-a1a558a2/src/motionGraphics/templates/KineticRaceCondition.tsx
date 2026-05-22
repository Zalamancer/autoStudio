import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RaceConditionConfig extends KineticBaseConfig {
  raceOffset: number
}

function dRand(seed: number): number {
  return Math.abs(Math.sin(seed * 167.3 + 55.77) * 43758.5453) % 1
}

// Alternate version of the word (Thread B sees a stale/wrong value)
function staleVersion(word: string, seed: number): string {
  const chars = word.split('')
  // Flip ~half the characters to adjacent chars — deterministic
  return chars.map((ch, i) => {
    if (dRand(seed + i * 31) > 0.5) {
      const code = ch.charCodeAt(0)
      // Shift by ±1 in ASCII
      return String.fromCharCode(code + (dRand(seed + i * 71) > 0.5 ? 1 : -1))
    }
    return ch
  }).join('')
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Thread indicators */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 9,
            color: 'rgba(0,200,255,0.45)',
            letterSpacing: 1,
          }}
        >
          Thread-A [running]
        </div>
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 9,
            color: 'rgba(255,140,0,0.45)',
            letterSpacing: 1,
            textAlign: 'right',
          }}
        >
          Thread-B [running]
        </div>
        {/* Race visualization: two progress bars competing */}
        <div
          style={{
            position: 'absolute',
            bottom: 18,
            left: 10,
            right: 10,
          }}
        >
          <div style={{ display: 'flex', gap: 4, marginBottom: 3, alignItems: 'center' }}>
            <span style={{ fontFamily: "'Courier New', monospace", fontSize: 8, color: 'rgba(0,200,255,0.4)', width: 60 }}>T-A:</span>
            <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 1, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, ((time * 1.1) % 1) * 100)}%`, height: '100%', background: 'rgba(0,200,255,0.6)' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontFamily: "'Courier New', monospace", fontSize: 8, color: 'rgba(255,140,0,0.4)', width: 60 }}>T-B:</span>
            <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 1, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, ((time * 0.9 + 0.15) % 1) * 100)}%`, height: '100%', background: 'rgba(255,140,0,0.6)' }} />
            </div>
          </div>
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 251 + 103
    const altWord = staleVersion(word, seed)

    if (phase === 'enter') {
      // Both threads compete: they slide in from opposite sides
      // Thread A comes from left, Thread B from right
      const threadAX = (1 - enterProgress) * -80
      const threadBX = (1 - enterProgress) * 80

      // They overlap and fight for position
      const overlap = enterProgress > 0.5
      const aOpacity = overlap ? 0.4 + enterProgress * 0.3 : enterProgress
      const bOpacity = overlap ? (1 - enterProgress) * 0.8 : enterProgress * 0.6

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Thread B (loser — stale value) */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${threadBX}px), -50%)`,
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(36px, 9vw, 140px)',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              letterSpacing: 3,
              color: '#FF8C00',
              opacity: bOpacity,
              mixBlendMode: 'screen',
            }}
          >
            {altWord}
          </div>
          {/* Thread A (winner — correct value) */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${threadAX}px), -50%)`,
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(36px, 9vw, 140px)',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              letterSpacing: 3,
              color,
              opacity: aOpacity,
              mixBlendMode: 'screen',
            }}
          >
            {word}
          </div>
        </div>
      )
    }

    if (phase === 'hold') {
      // Thread A won — show correct word cleanly
      // But Thread B occasionally flickers in (race hazard moment)
      const hazardWindow = holdProgress > 0.35 && holdProgress < 0.42

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {hazardWindow && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-52%, -50%)',
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(36px, 9vw, 140px)',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                letterSpacing: 3,
                color: '#FF8C00',
                opacity: 0.4,
                mixBlendMode: 'screen',
              }}
            >
              {altWord}
            </div>
          )}
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
              textShadow: `0 0 8px ${color}60`,
            }}
          >
            {word}
          </div>
        </div>
      )
    }

    // Exit: Thread B reasserts its stale value, overwriting Thread A — then both fade
    const bReassert = Math.min(exitProgress * 3, 1)
    const totalFade = Math.max(0, exitProgress * 2 - 0.7)

    return (
      <div style={{ position: 'absolute', inset: 0, opacity: 1 - totalFade }}>
        {/* Thread B comes back */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${bReassert * 3}px), -50%)`,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(36px, 9vw, 140px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            color: '#FF8C00',
            opacity: bReassert * 0.7,
            mixBlendMode: 'screen',
          }}
        >
          {altWord}
        </div>
        {/* Thread A fades out */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% - ${bReassert * 2}px), -50%)`,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(36px, 9vw, 140px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            color,
            opacity: 1 - bReassert * 0.6,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function RaceConditionComponent(props: MotionGraphicProps<RaceConditionConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-race-condition',
  title: 'Kinetic Race Condition',
  description: 'Race condition: two thread versions of text compete from opposite sides, one wins and the stale version fades — then the loser reasserts on exit',
  tags: ['kinetic', 'typography', 'glitch', 'race', 'condition', 'thread', 'concurrent', 'software', 'digital'],
  category: 'captions',
  component: RaceConditionComponent as any,
  defaultConfig: {
    words: ['MUTEX', 'LOCK', 'RACE', 'SYNC'],
    colors: ['#00C8FF', '#00AADD', '#00C8FF', '#44DDFF'],
    bgColor: '#00080a',
    cycleDuration: 2.0,
    raceOffset: 80,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['MUTEX', 'LOCK', 'RACE', 'SYNC'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00C8FF', '#00AADD', '#00C8FF', '#44DDFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#00080a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.5, max: 5, group: 'Timing' },
    { key: 'raceOffset', label: 'Race Offset (px)', type: 'number', defaultValue: 80, min: 20, max: 200, group: 'Animation' },
  ],
})
