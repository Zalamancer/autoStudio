import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WalkieConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Static burst characters for squelch noise
const SQUELCH_CHARS = '|||///\\\\---~~~###***'

function squelchChar(seed: number): string {
  return SQUELCH_CHARS[Math.abs(Math.floor(Math.sin(seed * 43.7 + 92.1) * 19283.7)) % SQUELCH_CHARS.length]
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // PTT (Push to Talk) indicator
    const isTransmitting = Math.sin(time * 0.8) > 0.2

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Transmission status bar */}
        <div style={{
          position: 'absolute', top: 10, left: 12, right: 12,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          {/* Channel display */}
          <div style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 9, color: 'rgba(0,220,100,0.3)',
            letterSpacing: 2,
          }}>
            CH 14
          </div>
          {/* TX indicator */}
          <div style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 9,
            color: isTransmitting ? 'rgba(0,220,100,0.6)' : 'rgba(255,255,255,0.1)',
            letterSpacing: 2,
            textShadow: isTransmitting ? '0 0 6px rgba(0,220,100,0.5)' : 'none',
          }}>
            {isTransmitting ? '● TX' : '○ RX'}
          </div>
        </div>
        {/* "OVER" label bottom right — appears periodically */}
        {(time % 2.4 > 1.8) && (
          <div style={{
            position: 'absolute', bottom: 14, right: 12,
            fontFamily: "'Courier New', monospace",
            fontSize: 10, color: 'rgba(0,220,100,0.35)',
            letterSpacing: 2,
          }}>
            OVER
          </div>
        )}
        {/* Waveform lines — squelch visualization */}
        <div style={{
          position: 'absolute', bottom: 12, left: 12,
          display: 'flex', alignItems: 'center', gap: 1,
          height: 16,
        }}>
          {Array.from({ length: 16 }, (_, i) => {
            const h = isTransmitting
              ? 2 + rand(i * 31 + frame * 2) * 14
              : 1 + rand(i * 53 + Math.floor(frame / 4)) * 4
            return (
              <div key={i} style={{
                width: 2,
                height: h,
                background: isTransmitting ? 'rgba(0,220,100,0.35)' : 'rgba(255,255,255,0.08)',
                borderRadius: 1,
              }} />
            )
          })}
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 107 + 53

    if (phase === 'enter') {
      // PTT pressed — squelch burst then text cuts in word by word
      // 0..0.25: pure squelch static (no text)
      // 0.25..0.55: text cuts in through squelch
      // 0.55..1.0: text locked in, squelch fades

      if (enterProgress < 0.25) {
        // Pure squelch — show noise characters
        const noiseCount = 6 + Math.floor(rand(f * 7 + seed) * 6)
        const noiseChars = Array.from({ length: noiseCount }, (_, i) => squelchChar(i * 73 + f))
        return (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(44px, 11vw, 150px)',
            fontWeight: 700,
            color: 'rgba(0,220,100,0.5)',
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            opacity: enterProgress / 0.25,
          }}>
            {noiseChars.join('')}
          </div>
        )
      }

      const cutInProgress = (enterProgress - 0.25) / 0.75
      // Characters cut in left to right
      const chars = word.split('').map((ch, ci) => {
        const charCutAt = ci / word.length * 0.7
        const isCutIn = cutInProgress > charCutAt
        if (!isCutIn) {
          // Still squelch for this position
          return (
            <span key={ci} style={{
              display: 'inline-block',
              color: 'rgba(0,220,100,0.4)',
            }}>
              {squelchChar(ci * 67 + Math.floor(f / 2))}
            </span>
          )
        }
        // Transition flash
        const charProgress = (cutInProgress - charCutAt) / 0.3
        const isFlashing = charProgress < 0.2
        return (
          <span key={ci} style={{
            display: 'inline-block',
            color: isFlashing ? '#FFFFFF' : color,
            textShadow: isFlashing ? `0 0 12px #FFFFFF` : 'none',
          }}>
            {ch}
          </span>
        )
      })

      return (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Courier New', monospace",
          fontSize: 'clamp(44px, 11vw, 150px)',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          letterSpacing: 4,
          textTransform: 'uppercase',
        }}>
          {chars}
        </div>
      )
    } else if (phase === 'hold') {
      // Stable transmission — brief cut-out at 0.35 and "OVER" flash at end
      const cutout = holdProgress > 0.32 && holdProgress < 0.40

      const chars = word.split('').map((ch, ci) => {
        if (cutout && rand(seed + ci * 43 + f) > 0.5) {
          return (
            <span key={ci} style={{
              display: 'inline-block',
              color: 'rgba(0,220,100,0.3)',
            }}>
              {squelchChar(ci * 89 + f)}
            </span>
          )
        }
        return <span key={ci} style={{ color }}>{ch}</span>
      })

      return (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Courier New', monospace",
          fontSize: 'clamp(44px, 11vw, 150px)',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          letterSpacing: 4,
          textTransform: 'uppercase',
          textShadow: cutout ? 'none' : `0 0 6px ${color}30`,
          opacity: cutout ? 0.6 : 1,
        }}>
          {chars}
        </div>
      )
    } else {
      // Exit: PTT released — squelch burst then silence
      const squelchPhase = exitProgress < 0.35
      const fadeOut = !squelchPhase

      if (squelchPhase) {
        const squelchIntensity = exitProgress / 0.35
        const chars = word.split('').map((ch, ci) => {
          const isSqlelched = rand(seed + ci * 59 + f) < squelchIntensity
          return (
            <span key={ci} style={{
              display: 'inline-block',
              color: isSqlelched ? 'rgba(0,220,100,0.5)' : color,
            }}>
              {isSqlelched ? squelchChar(ci * 71 + f) : ch}
            </span>
          )
        })

        return (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(44px, 11vw, 150px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            textTransform: 'uppercase',
          }}>
            {chars}
          </div>
        )
      }

      const fadeProgress = (exitProgress - 0.35) / 0.65
      return (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Courier New', monospace",
          fontSize: 'clamp(44px, 11vw, 150px)',
          fontWeight: 700,
          color,
          whiteSpace: 'nowrap',
          letterSpacing: 4,
          textTransform: 'uppercase',
          opacity: Math.max(0, 1 - fadeProgress * 1.5),
        }}>
          {word}
        </div>
      )
    }
  },
}

function WalkieComponent(props: MotionGraphicProps<WalkieConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-walkie',
  title: 'Kinetic Walkie-Talkie',
  description: 'Walkie-talkie transmission — text cuts in through squelch static, channel indicator, TX/RX status, waveform visualization, brief cut-outs',
  tags: ['kinetic', 'typography', 'glitch', 'walkie-talkie', 'radio', 'static', 'squelch', 'military', 'transmission'],
  category: 'captions',
  component: WalkieComponent as any,
  defaultConfig: {
    words: ['COPY THAT', 'ROGER', 'OVER', 'OUT'],
    colors: ['#00DC64', '#FFFFFF', '#00DC64', '#FFFFFF'],
    bgColor: '#050805',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['COPY THAT', 'ROGER', 'OVER', 'OUT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00DC64', '#FFFFFF', '#00DC64', '#FFFFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050805', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
  ],
})
