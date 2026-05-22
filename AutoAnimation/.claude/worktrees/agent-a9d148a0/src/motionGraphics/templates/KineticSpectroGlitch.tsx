import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SpectroGlitchConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Audio-to-visual spectrogram glitch: audio codec artifacts visualized
// MP3/AAC pre-echo, smearing, and quantization noise rendered as visual bands
// Text emerges from spectrogram frequency bands

const FREQ_BANDS = 20

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, height }: BackgroundRenderProps) => {
    const time = frame / fps
    const h = height ?? 700
    const bandHeight = h / FREQ_BANDS

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Spectrogram frequency bands */}
        {Array.from({ length: FREQ_BANDS }, (_, bi) => {
          // Audio-like frequency response — more energy in mid-range
          const freq = bi / FREQ_BANDS
          const energy = (Math.sin(time * (1 + bi * 0.3) + bi) * 0.5 + 0.5) * (freq > 0.2 && freq < 0.8 ? 0.8 : 0.2)
          const preEcho = rand(bi * 7 + Math.floor(time * 8)) < 0.06 ? 0.4 : 0

          // Spectral color: low=blue, mid=green, high=red
          const hue = 240 - bi * (240 / FREQ_BANDS)

          return (
            <div
              key={bi}
              style={{
                position: 'absolute',
                top: bi * bandHeight,
                left: 0,
                right: 0,
                height: bandHeight,
                background: `hsl(${hue}, 80%, 40%)`,
                opacity: (energy + preEcho) * 0.08,
              }}
            />
          )
        })}
        {/* Codec info */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(180,100,255,0.25)',
            letterSpacing: 1,
          }}
        >
          CODEC: AAC-LC SR: 44100Hz BR: {Math.floor(64 + Math.sin(frame * 0.1) * 32)}kbps
        </div>
        <div
          style={{
            position: 'absolute',
            top: 18,
            left: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(180,100,255,0.15)',
          }}
        >
          PRE-ECHO ARTIFACT QUANTIZATION NOISE
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, height }: WordRenderProps) => {
    const seed = index * 157 + 79
    const h = height ?? 700
    const bandHeight = h / FREQ_BANDS

    // Text assembled from frequency bands — like reading a spectrogram
    // Each band of the text has its own amplitude

    const getBandVisibility = (bandIdx: number, progress: number) => {
      // Mid-frequency bands resolve first
      const freqDist = Math.abs(bandIdx - FREQ_BANDS * 0.5) / (FREQ_BANDS * 0.5)
      const resolveThreshold = freqDist * 0.7
      return progress > resolveThreshold
    }

    if (phase === 'enter') {
      return (
        <>
          {/* Frequency band mask — reveals text from spectrogram */}
          {Array.from({ length: FREQ_BANDS }, (_, bi) => {
            const visible = getBandVisibility(bi, enterProgress)
            // Pre-echo: brief flash before full resolve
            const preEcho = !visible && rand(seed + bi * 13 + Math.floor(enterProgress * 20)) < 0.05

            return (
              <div
                key={bi}
                style={{
                  position: 'absolute',
                  top: `${(bi / FREQ_BANDS) * 100}%`,
                  left: 0,
                  right: 0,
                  height: bandHeight,
                  background: preEcho ? `${color}30` : 'transparent',
                  opacity: preEcho ? 1 : 0,
                }}
              />
            )
          })}
          {/* Main text with band mask */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(36px, 10vw, 150px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 3,
              opacity: enterProgress,
              // Quantization noise: slight banding
              filter: enterProgress < 0.8 ? `blur(${(1 - enterProgress) * 2}px)` : 'none',
              textShadow: `0 0 ${12 + (1 - enterProgress) * 20}px ${color}80`,
            }}
          >
            {word}
          </div>
        </>
      )
    }

    if (phase === 'hold') {
      // Pre-echo artifact: faint ghost of text appears slightly before it "should"
      const preEchoActive = holdProgress > 0.6 && holdProgress < 0.68
      return (
        <>
          {preEchoActive && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(calc(-50% + 4px), calc(-50% + 2px))`,
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(36px, 10vw, 150px)',
                fontWeight: 700,
                color: '#ffffff',
                whiteSpace: 'nowrap',
                letterSpacing: 3,
                opacity: 0.15,
                filter: 'blur(1px)',
              }}
            >
              {word}
            </div>
          )}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(36px, 10vw, 150px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 3,
              textShadow: `0 0 8px ${color}50`,
            }}
          >
            {word}
          </div>
        </>
      )
    }

    // Exit: de-spectrogram — high freqs vanish first
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
          color,
          whiteSpace: 'nowrap',
          letterSpacing: 3,
          opacity: 1 - exitProgress,
          filter: exitProgress > 0.5 ? `blur(${(exitProgress - 0.5) * 4}px)` : 'none',
          textShadow: `0 0 ${8 + exitProgress * 20}px ${color}60`,
        }}
      >
        {word}
      </div>
    )
  },
}

function SpectroGlitchComponent(props: MotionGraphicProps<SpectroGlitchConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-spectro-glitch',
  title: 'Kinetic Spectro Glitch',
  description:
    'Audio codec artifact visualized as spectrogram — text assembled from frequency bands with pre-echo ghosts, quantization noise, and AAC codec readout',
  tags: ['kinetic', 'typography', 'glitch', 'codec', 'audio', 'spectrogram', 'compression', 'digital', 'artifact'],
  category: 'captions',
  component: SpectroGlitchComponent as any,
  defaultConfig: {
    words: ['FREQUENCY', 'ECHO', 'CODEC', 'NOISE'],
    colors: ['#CC88FF', '#AA66FF', '#DD99FF', '#BB77FF'],
    bgColor: '#060010',
    cycleDuration: 1.6,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['FREQUENCY', 'ECHO', 'CODEC', 'NOISE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#CC88FF', '#AA66FF', '#DD99FF', '#BB77FF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060010', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.6,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
