import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CMYKSpectrumConfig extends KineticBaseConfig {
  waveSpeed: number
}

// CMYK channels for per-character cycling
const CMYK_CHANNELS = [
  { color: '#00FFFF', label: 'C' },
  { color: '#FF00FF', label: 'M' },
  { color: '#FFFF00', label: 'Y' },
  { color: '#000000', label: 'K' },
]

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function easeInQuart(t: number): number {
  return t * t * t * t
}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    const grainShift = Math.floor(t * 10) * 0.8
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Paper grain */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle 0.5px, rgba(255,255,255,0.03) 100%, transparent 100%)`,
            backgroundSize: '3px 3px',
            backgroundPosition: `${grainShift}px ${grainShift * 0.5}px`,
          }}
        />
        {/* Spectrum band at bottom — cycles through CMYK */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, #00FFFF, #FF00FF, #FFFF00, #000000, #00FFFF)`,
            backgroundSize: '200% 100%',
            backgroundPosition: `${(t * 20) % 200}% 0`,
            opacity: 0.3,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, enterProgress, holdProgress, exitProgress, phase, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30
    const chars = word.split('')

    const sharedFont: React.CSSProperties = {
      fontFamily: "'Arial Black', 'Impact', sans-serif",
      fontSize: 'clamp(44px, 13vw, 170px)',
      fontWeight: 900,
      whiteSpace: 'nowrap',
      lineHeight: 1,
      letterSpacing: '0.02em',
    }

    // Determine global exit lock channel
    const exitLockChannel = 2 // Yellow — everything locks to Y on exit

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
          }}
        >
          {chars.map((ch, ci) => {
            // Each character gets all 4 CMYK layers, but only one is visible at a time
            // which channel is active cycles in a wave pattern

            return (
              <div key={ci} style={{ position: 'relative', display: 'inline-block' }}>
                {CMYK_CHANNELS.map((channel, channelIdx) => {
                  const isKey = channel.label === 'K'
                  let channelVisible = false
                  let channelOpacity = 0

                  if (phase === 'enter') {
                    // Channels activate left-to-right — each char activates its channels sequentially
                    const charP = Math.max(0, Math.min(1, (enterProgress - ci * 0.08) / (1 - ci * 0.08)))
                    const activationP = easeOutQuart(charP)

                    // During enter, cycle through showing one channel at a time
                    // Wave speed increases as activation progresses
                    const cycleSpeed = 8 + activationP * 12
                    const wave = (t * cycleSpeed + ci * 0.7) % CMYK_CHANNELS.length
                    const activeChannel = Math.floor(wave) % CMYK_CHANNELS.length
                    channelVisible = channelIdx === activeChannel
                    channelOpacity = channelVisible ? activationP : 0
                  } else if (phase === 'hold') {
                    // Continuous channel cycling wave
                    const waveSpeed = 6
                    const waveOffset = ci * 0.5
                    const wave = (t * waveSpeed + waveOffset) % CMYK_CHANNELS.length
                    const activeChannel = Math.floor(wave) % CMYK_CHANNELS.length

                    // Smooth crossfade between channels
                    const waveFrac = wave - Math.floor(wave)
                    if (channelIdx === activeChannel) {
                      channelOpacity = isKey ? 1 : 0.85
                      channelVisible = true
                    } else if (channelIdx === (activeChannel + 1) % CMYK_CHANNELS.length) {
                      // Next channel fading in
                      channelOpacity = waveFrac * (isKey ? 1 : 0.85) * 0.3
                      channelVisible = waveFrac > 0.5
                    }
                  } else {
                    // All channels lock to one color then fade
                    const lockP = easeInQuart(Math.min(1, exitProgress * 2))
                    const fadeP = Math.max(0, (exitProgress - 0.5) / 0.5)

                    if (channelIdx === exitLockChannel) {
                      // This is the lock channel — it takes over
                      channelOpacity = (1 - easeInQuart(fadeP)) * 0.85
                      channelVisible = true
                    } else {
                      // Other channels fade out as lock takes over
                      const waveSpeed = 6
                      const wave = (t * waveSpeed + ci * 0.5) % CMYK_CHANNELS.length
                      const activeChannel = Math.floor(wave) % CMYK_CHANNELS.length
                      const wasActive = channelIdx === activeChannel
                      channelOpacity = wasActive ? (isKey ? 1 : 0.85) * (1 - lockP) : 0
                      channelVisible = wasActive && lockP < 0.8
                    }
                  }

                  if (!channelVisible && channelOpacity <= 0) return null

                  return (
                    <span
                      key={channel.label}
                      style={{
                        position: channelIdx === 0 ? 'relative' : 'absolute',
                        top: channelIdx === 0 ? undefined : 0,
                        left: channelIdx === 0 ? undefined : 0,
                        display: 'inline-block',
                        color: channel.color,
                        ...sharedFont,
                        opacity: channelOpacity,
                        mixBlendMode: isKey ? 'normal' : 'multiply',
                        // Invisible chars for non-first layers just to maintain sizing
                        visibility: channelIdx === 0 || channelVisible ? 'visible' : 'hidden',
                      }}
                    >
                      {ch}
                    </span>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Active channel indicator bar */}
        {phase === 'hold' && (
          <div
            style={{
              position: 'absolute',
              bottom: 'clamp(10px, 4vw, 40px)',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 6,
            }}
          >
            {CMYK_CHANNELS.map((ch, idx) => {
              const pulse = Math.sin(t * 6 + idx * 1.5)
              return (
                <div
                  key={ch.label}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: ch.color === '#000000' ? '#555' : ch.color,
                    opacity: 0.3 + pulse * 0.15,
                  }}
                />
              )
            })}
          </div>
        )}
      </div>
    )
  },
}

function CMYKSpectrumComponent(props: MotionGraphicProps<CMYKSpectrumConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-cmyk-spectrum',
  title: 'Kinetic CMYK Spectrum',
  description:
    'Per-character CMYK channel cycling. Each letter rapidly switches which single CMYK channel is visible, creating a wave pattern of color across the word. Enter activates channels left-to-right. Hold runs a continuous cycling wave. Exit locks all characters to one channel then fades.',
  tags: ['kinetic', 'typography', 'cmyk', 'print', 'spectrum', 'wave', 'channel', 'multiply', 'cycling', 'per-character'],
  category: 'captions',
  component: CMYKSpectrumComponent as any,
  defaultConfig: {
    words: ['PRINT', 'CMYK', 'COLOR', 'PRESS'],
    colors: ['#00FFFF', '#FF00FF', '#FFFF00', '#000000'],
    bgColor: '#1a1a1a',
    cycleDuration: 1.2,
    waveSpeed: 6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PRINT', 'CMYK', 'COLOR', 'PRESS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FFFF', '#FF00FF', '#FFFF00', '#000000'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a1a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
    { key: 'waveSpeed', label: 'Wave Speed', type: 'number', defaultValue: 6, min: 1, max: 20, group: 'Animation' },
  ],
})
