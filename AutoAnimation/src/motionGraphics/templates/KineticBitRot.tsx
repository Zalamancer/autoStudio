import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BitRotConfig extends KineticBaseConfig {
  rotIntensity: number
}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Characters that represent "decayed" versions — one bit flip away from real ASCII
// e.g. 'A' (65) with a flipped bit might become '@' (64), 'C' (67), 'Q' (81)...
const BIT_FLIP_MAP: Record<string, string[]> = {
  A: ['@', 'C', 'Q', 'a', 'I'],
  B: ['C', 'R', 'b', 'J', 'F'],
  C: ['B', 'G', 'S', 'c', 'K'],
  D: ['E', 'T', 'L', 'd', 'F'],
  E: ['D', 'U', 'M', 'e', 'G'],
  F: ['G', 'V', 'N', 'f', 'D'],
  G: ['F', 'W', 'O', 'g', 'E'],
  H: ['I', 'X', 'P', 'h', '@'],
  I: ['H', 'Y', 'Q', 'i', 'A'],
  J: ['K', 'Z', 'R', 'j', 'B'],
  K: ['J', '[', 'S', 'k', 'C'],
  L: ['M', '\\', 'T', 'l', 'D'],
  M: ['L', ']', 'U', 'm', 'E'],
  N: ['O', '^', 'V', 'n', 'F'],
  O: ['N', '_', 'W', 'o', 'G'],
  P: ['Q', '`', 'X', 'p', 'H'],
  Q: ['P', 'a', 'Y', 'q', 'I'],
  R: ['S', 'b', 'Z', 'r', 'J'],
  S: ['R', 'c', '[', 's', 'K'],
  T: ['U', 'd', '\\', 't', 'L'],
  U: ['T', 'e', ']', 'u', 'M'],
  V: ['W', 'f', '^', 'v', 'N'],
  W: ['V', 'g', '_', 'w', 'O'],
  X: ['Y', 'h', '`', 'x', 'P'],
  Y: ['X', 'i', 'a', 'y', 'Q'],
  Z: ['[', 'j', 'b', 'z', 'R'],
}

function bitRotChar(ch: string, seed: number, intensity: number): string {
  if (rand(seed) > intensity) return ch
  const alternatives = BIT_FLIP_MAP[ch.toUpperCase()] ?? ['?', '!', '#', '%']
  return alternatives[Math.abs(Math.floor(rand(seed + 1) * alternatives.length)) % alternatives.length]
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Bit error rate indicator — decaying storage medium
    const berLog = (0.1 + Math.sin(time * 0.4) * 0.08).toFixed(4)
    const yearsOld = Math.floor(3 + time * 0.5)
    const sectorsAffected = Math.floor(12 + rand(Math.floor(time * 2)) * 40)

    // Scattered bit corruption indicators — small dots
    const bitDots: { x: number; y: number; bad: boolean }[] = []
    const dotCount = 40
    for (let i = 0; i < dotCount; i++) {
      bitDots.push({
        x: rand(i * 71) * width,
        y: rand(i * 113) * height,
        bad: rand(i * 53 + Math.floor(time * 1.5) * 11) < 0.35,
      })
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {bitDots.map((dot, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: dot.x,
              top: dot.y,
              width: 2,
              height: 2,
              borderRadius: '50%',
              background: dot.bad
                ? `rgba(255, 60, 60, ${0.06 + rand(i) * 0.06})`
                : `rgba(120, 120, 120, ${0.03 + rand(i) * 0.02})`,
            }}
          />
        ))}
        {/* Storage diagnostics */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 7,
            color: 'rgba(200, 100, 100, 0.12)',
            lineHeight: '11px',
          }}
        >
          <div>STORAGE AGE: {yearsOld} YRS</div>
          <div>BIT ERROR RATE: {berLog}</div>
          <div>SECTORS AFFECTED: {sectorsAffected}</div>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 7,
            color: 'rgba(200, 100, 100, 0.10)',
          }}
        >
          BIT ROT DETECTED
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 157 + 71
    const chars = word.split('')

    if (phase === 'enter') {
      // Text starts heavily rotted (high intensity), bit errors clear gradually
      const rotIntensity = Math.max(0, 1 - enterProgress * 1.2)

      const rendered = chars.map((realCh, ci) => {
        // Each character repairs at a slightly different rate
        const charRepairBonus = rand(seed + ci * 7) * 0.3
        const charIntensity = Math.max(0, rotIntensity - charRepairBonus * (1 - enterProgress))

        // At this frame, is the char in a decayed state?
        const slowCycle = Math.floor(f / Math.max(1, Math.floor((1 - enterProgress) * 6)))
        const decayed = rand(ci * 41 + seed + slowCycle) < charIntensity
        const displayCh = decayed ? bitRotChar(realCh, ci * 53 + seed + slowCycle, charIntensity) : realCh

        const isDecayed = displayCh !== realCh
        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              color: isDecayed ? '#FF4040' : color,
              opacity: 0.4 + enterProgress * 0.6,
              textDecoration: isDecayed ? 'underline' : 'none',
              textDecorationColor: '#FF404060',
            }}
          >
            {displayCh}
          </span>
        )
      })

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(38px, 11vw, 150px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
          }}
        >
          {rendered}
        </div>
      )
    } else if (phase === 'hold') {
      // Mostly repaired — random bit flips still occur, then self-repair
      // Low baseline intensity, occasional spike
      const spike1 = holdProgress > 0.2 && holdProgress < 0.26
      const spike2 = holdProgress > 0.55 && holdProgress < 0.6
      const isSpiking = spike1 || spike2
      const baseIntensity = isSpiking ? 0.5 : 0.08

      const rendered = chars.map((ch, ci) => {
        const slowCycle = Math.floor(f / 4)
        const decayed = rand(ci * 41 + seed + slowCycle) < baseIntensity
        const displayCh = decayed ? bitRotChar(ch, ci * 53 + seed + slowCycle, baseIntensity) : ch
        const isDecayed = displayCh !== ch

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              color: isDecayed ? '#FF4040' : color,
            }}
          >
            {displayCh}
          </span>
        )
      })

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(38px, 11vw, 150px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            textShadow: isSpiking ? `2px 0 #FF4040, -2px 0 #FF8080, 0 0 15px #FF404040` : `0 0 8px ${color}20`,
          }}
        >
          {rendered}
        </div>
      )
    } else {
      // Exit: bit rot accelerates and consumes the text
      const rotIntensity = Math.min(1, exitProgress * 1.8)
      const rendered = chars.map((realCh, ci) => {
        const slowCycle = Math.floor(f / 3)
        const decayed = rand(ci * 41 + seed + slowCycle) < rotIntensity
        const displayCh = decayed ? bitRotChar(realCh, ci * 53 + seed + slowCycle, rotIntensity) : realCh
        const alpha = Math.max(0, 1 - exitProgress * 1.3)

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              color: decayed ? '#FF4040' : color,
              opacity: alpha,
            }}
          >
            {displayCh}
          </span>
        )
      })

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(38px, 11vw, 150px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
          }}
        >
          {rendered}
        </div>
      )
    }
  },
}

function BitRotComponent(props: MotionGraphicProps<BitRotConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-bit-rot',
  title: 'Kinetic Bit Rot',
  description:
    'Bit rot storage decay: individual characters flip to adjacent ASCII values (single bit errors), gradually repairing to correct text. BER indicator, bit corruption dots background.',
  tags: ['kinetic', 'typography', 'glitch', 'bit-rot', 'decay', 'storage', 'corruption', 'ascii'],
  category: 'captions',
  component: BitRotComponent as any,
  defaultConfig: {
    words: ['DECAY', 'REPAIR', 'BITROT', 'RESTORE'],
    colors: ['#FF8080', '#FF6060', '#FFA0A0', '#FF4040'],
    bgColor: '#080202',
    cycleDuration: 1.8,
    rotIntensity: 0.7,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['DECAY', 'REPAIR', 'BITROT', 'RESTORE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF8080', '#FF6060', '#FFA0A0', '#FF4040'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080202', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.8,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'rotIntensity',
      label: 'Rot Intensity',
      type: 'number',
      defaultValue: 0.7,
      min: 0.1,
      max: 1.0,
      group: 'Animation',
    },
  ],
})
