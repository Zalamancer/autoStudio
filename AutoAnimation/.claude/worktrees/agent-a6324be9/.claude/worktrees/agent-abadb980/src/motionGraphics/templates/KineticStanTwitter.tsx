import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Subculture: Stan Twitter — ALL-CAPS, keyboard smash energy, emoji overload, chaotic excitement
// Mechanic: letters jitter/vibrate chaotically then snap into formation — keyboard smash energy

interface StanTwitterConfig extends KineticBaseConfig {}

const TWITTER_BLUE = '#1d9bf0'

const animation: KineticAnimation = {
  renderBackground: ({ frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Twitter dark mode background with chaotic floating emoji/symbols
    const symbols = ['!!!', '>>>>', '...', 'OMG', '???', '#1', 'WOW', '<<']
    const floaters = Array.from({ length: 12 }, (_, i) => {
      const x = (i * 37 + 10) % 90
      const y = ((time * 15 + i * 40) % 100)
      const sym = symbols[i % symbols.length]
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            fontFamily: 'monospace',
            fontSize: 10,
            color: `rgba(29,155,240,0.15)`,
            transform: 'translate(-50%, -50%)',
            whiteSpace: 'nowrap',
          }}
        >
          {sym}
        </div>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: '#15202b' }}>
        {floaters}
        {/* Twitter-style thin bottom border line */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, background: `linear-gradient(90deg, transparent, ${TWITTER_BLUE}, transparent)`, opacity: 0.3 }} />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame, fps }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / (fps ?? 30)

    // Stan Twitter mechanic: chaotic jitter then snap — keyboard smash energy
    let opacity = 0
    let translateX = 0
    let translateY = 0
    let scale = 1
    let rotate = 0

    if (phase === 'enter') {
      if (enterProgress < 0.6) {
        // Chaos phase: random jitter
        const chaos = 1 - enterProgress / 0.6
        opacity = enterProgress / 0.6
        translateX = Math.sin(time * 50 + 1) * 12 * chaos
        translateY = Math.cos(time * 60 + 2) * 10 * chaos
        rotate = Math.sin(time * 40) * 5 * chaos
        scale = 0.8 + Math.random() * 0.3  // jittery size
      } else {
        // Snap into place
        const snap = (enterProgress - 0.6) / 0.4
        const e = 1 - Math.pow(1 - snap, 3)
        opacity = 1
        translateX = (1 - e) * translateX
        translateY = (1 - e) * translateY
        rotate = (1 - e) * rotate
        scale = 1
      }
    } else if (phase === 'hold') {
      opacity = 1
      // Micro-jitter on hold — stan energy can't stay still
      translateX = Math.sin(time * 8) * 1.5
      translateY = Math.cos(time * 7) * 1
      scale = 1 + Math.abs(Math.sin(time * 6)) * 0.02
      rotate = 0
    } else {
      opacity = 1 - exitProgress * 2
      scale = 1 + exitProgress * 0.3
      rotate = exitProgress * 10
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px)) scale(${scale}) rotate(${rotate}deg)`,
          opacity: Math.max(0, opacity),
          fontFamily: "'Arial Black', 'Impact', sans-serif",
          fontSize: 'clamp(36px, 10vw, 130px)',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: 3,
          color,
          whiteSpace: 'nowrap',
          textShadow: `0 0 20px ${TWITTER_BLUE}44`,
        }}
      >
        {word}
      </div>
    )
  },
}

function StanTwitterComponent(props: MotionGraphicProps<StanTwitterConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-stan-twitter',
  title: 'Kinetic Stan Twitter',
  description: 'Stan Twitter energy: ALL-CAPS letters jitter chaotically then snap into place on Twitter dark mode background',
  tags: ['kinetic', 'typography', 'stan twitter', 'all-caps', 'chaos', 'social media', 'subculture', 'fandom'],
  category: 'captions',
  component: StanTwitterComponent as any,
  defaultConfig: {
    words: ['ICONIC', 'SLAY', 'BESTIE', 'PERIOD'],
    colors: ['#1d9bf0', '#ffffff', '#1d9bf0', '#71d8ff'],
    bgColor: '#15202b',
    cycleDuration: 1.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ICONIC', 'SLAY', 'BESTIE', 'PERIOD'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1d9bf0', '#ffffff', '#1d9bf0', '#71d8ff'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#15202b', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.0, min: 0.3, max: 5, group: 'Timing' },
  ],
})
