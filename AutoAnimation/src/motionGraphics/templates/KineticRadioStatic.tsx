import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RadioStaticConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// AM/FM frequency display constants
const FREQ_MARKS = ['88.1', '92.3', '96.5', '100.7', '104.9', '107.9']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width }: BackgroundRenderProps) => {
    const time = frame / fps

    // Tuning dial position drifts slowly — simulating scanning through stations
    const dialPos = (Math.sin(time * 0.25) * 0.5 + 0.5) * 0.8 + 0.1 // 0.1..0.9

    // Static noise bands — multiple horizontal lines that shift per frame
    const noiseBands = Array.from({ length: 12 }, (_, i) => {
      const bandY = (rand(i * 53 + Math.floor(time * 8) * 7) * 100)
      const bandH = 1 + rand(i * 97 + frame) * 3
      const alpha = rand(i * 41 + frame * 3) * 0.12
      return { bandY, bandH, alpha }
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* AM/FM frequency bar at bottom */}
        <div style={{
          position: 'absolute', bottom: 18, left: '5%', right: '5%',
          height: 24,
        }}>
          {/* Frequency scale */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: 2, background: 'rgba(255,140,0,0.2)',
          }} />
          {/* Frequency marks */}
          {FREQ_MARKS.map((freq, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${(i / (FREQ_MARKS.length - 1)) * 100}%`,
              bottom: 4,
              transform: 'translateX(-50%)',
              fontFamily: "'Courier New', monospace",
              fontSize: 8,
              color: 'rgba(255,140,0,0.25)',
            }}>
              {freq}
            </div>
          ))}
          {/* Tuning needle */}
          <div style={{
            position: 'absolute',
            left: `${dialPos * 100}%`,
            bottom: 0,
            width: 2,
            height: 16,
            background: 'rgba(255,140,0,0.5)',
            transform: 'translateX(-50%)',
            boxShadow: '0 0 4px rgba(255,140,0,0.6)',
          }} />
        </div>
        {/* FM label */}
        <div style={{
          position: 'absolute', bottom: 48, left: '5%',
          fontFamily: "'Courier New', monospace",
          fontSize: 9, color: 'rgba(255,140,0,0.2)',
          letterSpacing: 2,
        }}>
          FM STEREO
        </div>
        {/* Rolling static noise bands */}
        {noiseBands.map((band, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: 0, right: 0,
            top: `${band.bandY}%`,
            height: band.bandH,
            background: `rgba(255,255,255,${band.alpha})`,
          }} />
        ))}
        {/* Static grain overlay — fine repeating pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `repeating-linear-gradient(
            ${rand(frame * 3) * 180}deg,
            transparent 0px,
            transparent ${1 + rand(frame * 3 + 1) * 2}px,
            rgba(200,200,200,${0.02 + rand(frame * 3 + 2) * 0.03}) ${2 + rand(frame * 3 + 3) * 2}px,
            transparent ${3 + rand(frame * 3 + 4) * 2}px
          )`,
          pointerEvents: 'none',
        }} />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 89 + 23

    if (phase === 'enter') {
      // Text fades in through static — carrier wave locks on
      // First 40%: pure static with ghost text. Last 60%: text emerges
      const lockProgress = Math.max(0, (enterProgress - 0.35) / 0.65)
      const mainOpacity = lockProgress
      // Static overlay fades as signal locks
      const staticOpacity = Math.max(0, 1 - enterProgress * 1.4)
      // Horizontal drift from scanning
      const drift = (1 - lockProgress) * (rand(seed + Math.floor(f / 4)) - 0.5) * 30

      return (
        <>
          {/* Static/noise text ghost during lock-in */}
          {staticOpacity > 0 && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: `translate(calc(-50% + ${drift}px), -50%)`,
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(44px, 11vw, 150px)',
              fontWeight: 700,
              color: `rgba(255,255,255,${staticOpacity * 0.3})`,
              whiteSpace: 'nowrap',
              letterSpacing: 4,
              filter: `blur(${(1 - enterProgress) * 4}px)`,
            }}>
              {word}
            </div>
          )}
          {/* Main text emerging */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: `translate(calc(-50% + ${drift * 0.3}px), -50%)`,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(44px, 11vw, 150px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            textTransform: 'uppercase',
            opacity: mainOpacity,
            textShadow: `0 0 8px ${color}60`,
          }}>
            {word}
          </div>
        </>
      )
    } else if (phase === 'hold') {
      // Signal fluctuates — brief drop-outs at set points
      const dropout1 = holdProgress > 0.2 && holdProgress < 0.26
      const dropout2 = holdProgress > 0.55 && holdProgress < 0.59
      const isDropout = dropout1 || dropout2
      const dropSeed = dropout1 ? 11 : 22

      // During dropout: static washes over text
      const dropOpacity = isDropout ? rand(dropSeed + f) * 0.4 : 1
      const dropDrift = isDropout ? (rand(dropSeed + f * 3) - 0.5) * 8 : 0

      return (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: `translate(calc(-50% + ${dropDrift}px), -50%)`,
          fontFamily: "'Courier New', monospace",
          fontSize: 'clamp(44px, 11vw, 150px)',
          fontWeight: 700,
          color,
          whiteSpace: 'nowrap',
          letterSpacing: 4,
          textTransform: 'uppercase',
          opacity: dropOpacity,
          textShadow: isDropout
            ? `${(rand(dropSeed + f) - 0.5) * 6}px 0 rgba(255,140,0,0.5), 0 0 12px rgba(255,255,255,0.2)`
            : `0 0 6px ${color}40`,
        }}>
          {word}
        </div>
      )
    } else {
      // Exit: signal loses carrier — text fades into static drift
      const drift = exitProgress * (rand(seed + 77) - 0.5) * 40
      const opacity = Math.max(0, 1 - exitProgress * 1.3)
      const blur = exitProgress * 5

      return (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: `translate(calc(-50% + ${drift}px), -50%)`,
          fontFamily: "'Courier New', monospace",
          fontSize: 'clamp(44px, 11vw, 150px)',
          fontWeight: 700,
          color,
          whiteSpace: 'nowrap',
          letterSpacing: 4,
          textTransform: 'uppercase',
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
        }}>
          {word}
        </div>
      )
    }
  },
}

function RadioStaticComponent(props: MotionGraphicProps<RadioStaticConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-radio-static',
  title: 'Kinetic Radio Static',
  description: 'AM/FM radio static — text fades in and out through carrier noise with tuning dial, frequency scale, and signal drop-outs',
  tags: ['kinetic', 'typography', 'glitch', 'radio', 'static', 'fm', 'am', 'signal', 'transmission', 'noise'],
  category: 'captions',
  component: RadioStaticComponent as any,
  defaultConfig: {
    words: ['STATIC', 'NOISE', 'TUNE IN', 'SIGNAL'],
    colors: ['#FF8C00', '#FFAA44', '#FF8C00', '#FFFFFF'],
    bgColor: '#080608',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['STATIC', 'NOISE', 'TUNE IN', 'SIGNAL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF8C00', '#FFAA44', '#FF8C00', '#FFFFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080608', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
  ],
})
