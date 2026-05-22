import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TokenDropoutConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Token dropout: attention dropout in transformer models
// Random tokens are "dropped" (masked) during inference — like BERT [MASK]
// Text appears with random chars replaced by [■] mask tokens, then resolves

const MASK_TOKEN = '■'

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Attention matrix visualization — dim grid of attention weights
    const heads = 6
    const seqLen = 8

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Attention weight heatmap */}
        {Array.from({ length: heads * seqLen }, (_, i) => {
          const head = Math.floor(i / seqLen)
          const pos = i % seqLen
          const attn = rand(head * 37 + pos * 13 + Math.floor(time * 2))
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                right: 10 + pos * 9,
                top: 10 + head * 9,
                width: 7,
                height: 7,
                background: `rgba(255,160,40,${attn * 0.25})`,
              }}
            />
          )
        })}
        {/* Labels */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 86,
            fontFamily: "'Courier New', monospace",
            fontSize: 6,
            color: 'rgba(255,160,40,0.2)',
            transform: 'rotate(-90deg)',
            transformOrigin: 'right top',
            whiteSpace: 'nowrap',
          }}
        >
          attn heads
        </div>
        {/* Dropout rate */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(255,160,40,0.25)',
            letterSpacing: 1,
          }}
        >
          dropout: {(0.1 + Math.abs(Math.sin(time * 0.5)) * 0.4).toFixed(2)} [MASK] ×{' '}
          {Math.floor(Math.abs(Math.sin(time * 0.8)) * 8) + 1}
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 18,
            left: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 7,
            color: 'rgba(255,160,40,0.15)',
          }}
        >
          MLM: masked language modeling
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 163 + 71
    const chars = word.split('')

    // Dropout: some chars are masked, then un-masked as model predicts them
    const getDropout = (ci: number, dropoutRate: number, frameSeed: number) => {
      return rand(seed + ci * 31 + frameSeed) < dropoutRate
    }

    if (phase === 'enter') {
      // High dropout → chars un-mask one by one as predictions resolve
      const frameSeed = Math.floor(f / 4) // change every 4 frames
      const dropoutRate = 1 - enterProgress

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(36px, 10vw, 150px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            display: 'flex',
            opacity: 0.2 + enterProgress * 0.8,
          }}
        >
          {chars.map((ch, ci) => {
            const masked = getDropout(ci, dropoutRate, frameSeed)
            return (
              <span
                key={ci}
                style={{
                  display: 'inline-block',
                  color: masked ? 'rgba(255,160,40,0.7)' : color,
                  background: masked ? 'rgba(255,160,40,0.12)' : 'transparent',
                  textShadow: masked ? '0 0 8px rgba(255,160,40,0.8)' : `0 0 6px ${color}40`,
                  // Masked chars use monospace slot to maintain width
                  minWidth: '0.6em',
                  textAlign: 'center',
                }}
              >
                {masked ? MASK_TOKEN : ch}
              </span>
            )
          })}
        </div>
      )
    }

    if (phase === 'hold') {
      // Low dropout on hold — occasional single mask token flicker
      const frameSeed = Math.floor(f / 6)
      const dropoutRate = 0.05

      // Attention spike: one char briefly gets high attention
      const attentionSpike = holdProgress > 0.45 && holdProgress < 0.52
      const spikeChar = Math.floor(rand(seed + Math.floor(holdProgress * 20)) * chars.length)

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(36px, 10vw, 150px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            display: 'flex',
          }}
        >
          {chars.map((ch, ci) => {
            const masked = getDropout(ci, dropoutRate, frameSeed)
            const spiking = attentionSpike && ci === spikeChar
            return (
              <span
                key={ci}
                style={{
                  display: 'inline-block',
                  color: masked ? 'rgba(255,160,40,0.7)' : color,
                  textShadow: spiking
                    ? `0 0 20px ${color}, 0 0 40px ${color}`
                    : masked
                      ? '0 0 8px rgba(255,160,40,0.6)'
                      : `0 0 6px ${color}40`,
                  transform: spiking ? 'scale(1.15)' : 'none',
                  minWidth: '0.6em',
                  textAlign: 'center',
                }}
              >
                {masked ? MASK_TOKEN : ch}
              </span>
            )
          })}
        </div>
      )
    }

    // Exit: dropout rate climbs back to 1.0 — all chars re-masked
    const frameSeed = Math.floor(f / 4)
    const dropoutRate = exitProgress

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Courier New', monospace",
          fontSize: 'clamp(36px, 10vw, 150px)',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          letterSpacing: 3,
          display: 'flex',
          opacity: 1 - exitProgress * 0.8,
        }}
      >
        {chars.map((ch, ci) => {
          const masked = getDropout(ci, dropoutRate, frameSeed)
          return (
            <span
              key={ci}
              style={{
                display: 'inline-block',
                color: masked ? 'rgba(255,160,40,0.6)' : color,
                minWidth: '0.6em',
                textAlign: 'center',
              }}
            >
              {masked ? MASK_TOKEN : ch}
            </span>
          )
        })}
      </div>
    )
  },
}

function TokenDropoutComponent(props: MotionGraphicProps<TokenDropoutConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-token-dropout',
  title: 'Kinetic Token Dropout',
  description:
    'Transformer attention dropout — chars replaced by [■] mask tokens that resolve as model predictions complete, with attention heatmap and dropout rate readout',
  tags: ['kinetic', 'typography', 'ai', 'dropout', 'transformer', 'bert', 'llm', 'mask', 'digital', 'ml'],
  category: 'captions',
  component: TokenDropoutComponent as any,
  defaultConfig: {
    words: ['PREDICT', 'MASK', 'ATTEND', 'INFER'],
    colors: ['#FFAA44', '#FF9922', '#FFBB55', '#FFAA44'],
    bgColor: '#0a0600',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['PREDICT', 'MASK', 'ATTEND', 'INFER'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFAA44', '#FF9922', '#FFBB55', '#FFAA44'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0600', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
