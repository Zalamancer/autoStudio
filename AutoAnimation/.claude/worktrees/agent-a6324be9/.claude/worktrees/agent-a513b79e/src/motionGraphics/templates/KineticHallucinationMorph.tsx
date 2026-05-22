import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface HallucinationMorphConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// AI hallucination: model generates plausible-but-wrong content
// Text morphs through adjacent plausible words before stabilizing
// Each character oscillates through nearby letter values (like beam search uncertainty)

// Words that "almost" look right — phonetically/visually similar substitutions
function hallucinateChar(realChar: string, seed: number, progress: number): string {
  const upper = realChar.toUpperCase()
  // Visually/phonetically adjacent character sets
  const adjacencies: Record<string, string> = {
    'A': 'ΑΛΔΛ4AА', 'B': 'ΒβΡ8BIB', 'C': 'СĆČΓC©',
    'D': 'DΔÐØDD0', 'E': 'EΕÈËE3', 'F': 'FƑϜFF†',
    'G': 'GĞĜGQ6', 'H': 'HНĦHH#', 'I': 'IÍΙI1!',
    'J': 'JĴJJ', 'K': 'KΚK|<', 'L': 'LΛL|1',
    'M': 'MΜМM|W', 'N': 'NΝÑNπ', 'O': 'OΟØO0',
    'P': 'PΡÞP9P', 'Q': 'QQO0Q', 'R': 'RЯŘR',
    'S': 'SŠŚS5$', 'T': 'TТÞTτ', 'U': 'UŮÜUV',
    'V': 'VVŶ∨V', 'W': 'WŴWVV', 'X': 'XΧXЖ×',
    'Y': 'YŸŶYΓ', 'Z': 'ZŽŹZ2',
  }
  const adj = adjacencies[upper] || upper
  if (progress > 0.85) return realChar
  // Pick a character from the adjacency set
  const idx = Math.floor(rand(seed) * adj.length)
  return adj[idx] || realChar
}

const CONFIDENCE_LABELS = [
  'conf: 0.31', 'conf: 0.67', 'conf: 0.89', 'conf: 0.94',
  'beam: 8', 'temp: 0.9', 'top_p: 0.95', 'tokens: ∞',
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Confidence meter — oscillating token probability bars
    const bars = 8
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Token probability visualization */}
        {Array.from({ length: bars }, (_, i) => {
          const prob = Math.abs(Math.sin(time * (0.8 + i * 0.2) + i * 1.1))
          const isTop = prob > 0.7
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${8 + i * 11}%`,
                bottom: 6,
                width: '8%',
                height: `${prob * 20}px`,
                background: isTop
                  ? `rgba(180,100,255,0.35)`
                  : `rgba(100,100,200,0.12)`,
              }}
            />
          )
        })}
        {/* Confidence labels */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(180,100,255,0.25)',
            letterSpacing: 1,
          }}
        >
          {CONFIDENCE_LABELS[Math.floor(time * 0.7) % CONFIDENCE_LABELS.length]}
        </div>
        <div
          style={{
            position: 'absolute',
            top: 18,
            right: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 7,
            color: 'rgba(180,100,255,0.15)',
          }}
        >
          model: hallucinating...
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 149 + 77
    const chars = word.split('')

    // Hallucination: chars cycle through wrong-but-plausible alternatives
    // Settling into correct form as "confidence" increases

    if (phase === 'enter') {
      // High hallucination at start, settles to real text
      const rendered = chars.map((realCh, ci) => {
        const charSeed = seed + ci * 53 + Math.floor(f / 2)
        // Char confidence builds over time
        const charConfidence = Math.max(0, enterProgress - (ci / chars.length) * 0.3)
        const hallChar = hallucinateChar(realCh, charSeed, charConfidence)
        const isHallucinating = hallChar !== realCh

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              color: isHallucinating ? `rgba(180,100,255,0.8)` : color,
              opacity: 0.2 + enterProgress * 0.8,
              transform: isHallucinating
                ? `translateY(${Math.sin(f * 0.3 + ci) * 3}px)`
                : 'none',
            }}
          >
            {hallChar}
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
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(40px, 11vw, 160px)',
            fontWeight: 900,
            whiteSpace: 'nowrap',
            letterSpacing: 2,
          }}
        >
          {rendered}
        </div>
      )
    }

    if (phase === 'hold') {
      // Low-level hallucination bursts — model confidence dips momentarily
      const hallucinationBurst = holdProgress > 0.4 && holdProgress < 0.5
      const rendered = chars.map((realCh, ci) => {
        const charSeed = seed + ci * 53 + Math.floor(f / 3)
        if (hallucinationBurst && rand(seed + ci * 19 + Math.floor(holdProgress * 30)) < 0.4) {
          const hallChar = hallucinateChar(realCh, charSeed, 0.3)
          return (
            <span key={ci} style={{ display: 'inline-block', color: 'rgba(180,100,255,0.8)' }}>
              {hallChar}
            </span>
          )
        }
        return (
          <span key={ci} style={{ display: 'inline-block', color }}>
            {realCh}
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
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(40px, 11vw, 160px)',
            fontWeight: 900,
            whiteSpace: 'nowrap',
            letterSpacing: 2,
            textShadow: `0 0 8px ${color}40`,
          }}
        >
          {rendered}
        </div>
      )
    }

    // Exit: confidence collapses — full hallucination resurfaces
    const rendered = chars.map((realCh, ci) => {
      const charSeed = seed + ci * 53 + Math.floor(f / 2)
      const confidence = 1 - exitProgress
      const hallChar = hallucinateChar(realCh, charSeed, confidence)
      const isHallucinating = hallChar !== realCh

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color: isHallucinating ? 'rgba(180,100,255,0.8)' : color,
            opacity: Math.max(0, 1 - exitProgress),
          }}
        >
          {hallChar}
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
          fontFamily: "'Arial Black', 'Impact', sans-serif",
          fontSize: 'clamp(40px, 11vw, 160px)',
          fontWeight: 900,
          whiteSpace: 'nowrap',
          letterSpacing: 2,
        }}
      >
        {rendered}
      </div>
    )
  },
}

function HallucinationMorphComponent(props: MotionGraphicProps<HallucinationMorphConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-hallucination-morph',
  title: 'Kinetic Hallucination Morph',
  description: 'AI hallucination artifact — chars cycle through plausible Unicode look-alikes before settling to correct text as model confidence grows, with token probability bars',
  tags: ['kinetic', 'typography', 'ai', 'hallucination', 'llm', 'artifact', 'glitch', 'digital', 'machine-learning'],
  category: 'captions',
  component: HallucinationMorphComponent as any,
  defaultConfig: {
    words: ['TRUST', 'VERIFY', 'HALLUCINATE', 'LEARN'],
    colors: ['#CC66FF', '#AA44EE', '#DD77FF', '#BB55FF'],
    bgColor: '#080010',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TRUST', 'VERIFY', 'HALLUCINATE', 'LEARN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#CC66FF', '#AA44EE', '#DD77FF', '#BB55FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080010', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.3, max: 5, group: 'Timing' },
  ],
})
