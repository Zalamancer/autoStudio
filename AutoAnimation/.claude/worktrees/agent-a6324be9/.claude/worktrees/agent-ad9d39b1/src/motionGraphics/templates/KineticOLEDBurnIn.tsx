import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface OLEDBurnInConfig extends KineticBaseConfig {
  ghostWord: string
}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps

    // Faint pixel-level unevenness — OLED panels show slight non-uniformity
    const noiseShift = Math.floor(time * 0.2) // very slow noise

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* OLED pixel unevenness: very faint gradient banding */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(
              180deg,
              rgba(255,255,255,${0.005 + rand(noiseShift) * 0.008}) 0px,
              transparent ${1 + rand(noiseShift + 1) * 2}px,
              transparent ${3 + rand(noiseShift + 2) * 3}px
            )`,
            pointerEvents: 'none',
          }}
        />
        {/* Slight sub-pixel color fringing — OLED characteristic */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(90deg,
              rgba(255,0,0,0.008) 0%,
              rgba(0,255,0,0.006) 33%,
              rgba(0,0,255,0.008) 66%,
              rgba(255,0,0,0.008) 100%
            )`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 79 + 53

    // Ghost image: a faint "burned-in" copy of a previously displayed word
    // It fades OUT as the real text fades IN — OLED burn-in reveals actual content
    let ghostOpacity = 0
    let wordOpacity = 0
    let ghostBlur = 0
    let wordBlur = 0

    if (phase === 'enter') {
      // Ghost starts visible, decays as real word burns through
      ghostOpacity = Math.max(0, 1 - enterProgress * 2.5)
      wordOpacity = enterProgress > 0.3 ? Math.min(1, (enterProgress - 0.3) / 0.7) : 0
      ghostBlur = enterProgress * 2
      wordBlur = (1 - enterProgress) * 4
    } else if (phase === 'hold') {
      // Ghost nearly gone, real text stable
      ghostOpacity = Math.max(0, 0.06 - holdProgress * 0.04)
      wordOpacity = 1
    } else {
      // Exit: real text fades, ghost remnant briefly flares
      wordOpacity = 1 - exitProgress
      ghostOpacity = exitProgress * 0.15
      ghostBlur = exitProgress * 3
    }

    // Ghost word — the burned-in residual image
    // Use a shifted hue: OLED burn typically shows as reduced-saturation warm remnant
    const ghostColors = ['#3a3020', '#202a20', '#1a1a30', '#302020', '#252520']
    const ghostColor = ghostColors[index % ghostColors.length]

    // Ghost text is slightly different content — a previous word remnant
    // We use a char-shifted version of the same word to simulate it
    const ghostChars = word.split('').map((ch, ci) => {
      const shift = (ch.charCodeAt(0) + seed + ci) % 26
      return String.fromCharCode(65 + shift)
    }).join('')

    // Subtle pixel-level jitter on ghost
    const ghostOffX = Math.sin(f * 0.11 + seed) * 0.5
    const ghostOffY = Math.cos(f * 0.09 + seed) * 0.3

    return (
      <>
        {/* OLED burn-in ghost image — faded remnant of previous content */}
        {ghostOpacity > 0.005 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${ghostOffX}px), calc(-50% + ${ghostOffY}px))`,
              opacity: ghostOpacity,
              filter: ghostBlur > 0 ? `blur(${ghostBlur}px)` : undefined,
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontSize: 'clamp(40px, 11vw, 160px)',
              fontWeight: 900,
              color: ghostColor,
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
              letterSpacing: 6,
              // Desaturated, warm tint of burn-in
              textShadow: `0 0 3px rgba(80,60,30,0.3)`,
            }}
          >
            {ghostChars}
          </div>
        )}
        {/* Actual current text — revealed as ghost decays */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: wordOpacity,
            filter: wordBlur > 0 ? `blur(${wordBlur}px)` : undefined,
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(40px, 11vw, 160px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: 6,
            textShadow: `0 0 4px ${color}40`,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function OLEDBurnInComponent(props: MotionGraphicProps<OLEDBurnInConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-oled-burn-in',
  title: 'Kinetic OLED Burn-In',
  description: 'OLED ghost image burn-in: desaturated warm remnant of a previous word fades as new text solidifies through the phosphor decay',
  tags: ['kinetic', 'typography', 'oled', 'burn-in', 'ghost', 'display', 'glitch', 'hardware'],
  category: 'captions',
  component: OLEDBurnInComponent as any,
  defaultConfig: {
    words: ['GHOST', 'BURN', 'FADE', 'PIXEL'],
    colors: ['#e0d0ff', '#c8e0ff', '#ffe0c0', '#d0ffd0'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.6,
    ghostWord: 'PREV',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GHOST', 'BURN', 'FADE', 'PIXEL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#e0d0ff', '#c8e0ff', '#ffe0c0', '#d0ffd0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
    { key: 'ghostWord', label: 'Ghost Word', type: 'text', defaultValue: 'PREV', group: 'Animation' },
  ],
})
