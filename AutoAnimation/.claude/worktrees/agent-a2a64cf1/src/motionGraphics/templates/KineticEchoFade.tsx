import React from 'react'
import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface EchoFadeConfig extends KineticBaseConfig {
  echoCount: number
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInQuad(t: number): number {
  return t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const echoCount = 5
    const echoes: React.ReactNode[] = []

    let mainOpacity = 1
    let mainScale = 1
    let echoSpread = 0

    if (phase === 'enter') {
      const eased = easeOutCubic(enterProgress)
      mainOpacity = eased
      mainScale = 0.8 + eased * 0.2
      echoSpread = 0 // No echoes during enter
    } else if (phase === 'hold') {
      mainOpacity = 1
      mainScale = 1
      // Echoes spread outward during hold
      echoSpread = holdProgress
    } else {
      const eased = easeInQuad(exitProgress)
      mainOpacity = 1 - eased
      mainScale = 1 + eased * 0.1
      // Echoes continue spreading and fading
      echoSpread = 1 + exitProgress * 0.5
    }

    // Create echo layers — ripples outward at decreasing opacity and increasing scale
    if (echoSpread > 0) {
      for (let i = echoCount; i >= 1; i--) {
        const echoRatio = i / echoCount
        const echoDelay = echoRatio * 0.4
        const echoProgress = Math.max(0, Math.min(1, (echoSpread - echoDelay) / (1 - echoDelay)))

        if (echoProgress <= 0) continue

        const echoScale = 1 + echoProgress * echoRatio * 0.6
        const echoOpacity = (1 - echoProgress * 0.7) * (1 - echoRatio * 0.6) * mainOpacity
        const echoBlur = echoProgress * echoRatio * 4

        // Spread direction based on echo index — radial spread
        const angle = (i * 2.4 + index * 1.7) // deterministic angle per echo
        const spreadDistance = echoProgress * echoRatio * 15
        const offsetX = Math.cos(angle) * spreadDistance
        const offsetY = Math.sin(angle) * spreadDistance

        echoes.push(
          <div
            key={`echo-${i}`}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) scale(${echoScale})`,
              opacity: Math.max(0, echoOpacity),
              filter: echoBlur > 0 ? `blur(${echoBlur}px)` : undefined,
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(44px, 12vw, 160px)',
              fontWeight: 700,
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
              color,
              userSelect: 'none',
            }}
          >
            {word}
          </div>,
        )
      }
    }

    return (
      <>
        {/* Echo layers (behind main word) */}
        {echoes}
        {/* Main word */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${mainScale})`,
            opacity: mainOpacity,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(44px, 12vw, 160px)',
            fontWeight: 700,
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
            color,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function EchoFadeComponent(props: MotionGraphicProps<EchoFadeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-echo-fade',
  title: 'Kinetic Echo Fade',
  description: 'Word appears and leaves behind fading echoes — copies at decreasing opacity spreading outward. Ripple/echo effect.',
  tags: ['kinetic', 'typography', 'echo', 'fade', 'ripple', 'meditative', 'motivational'],
  category: 'captions',
  component: EchoFadeComponent as any,
  defaultConfig: {
    words: ['PEACE', 'POWER', 'PURPOSE'],
    colors: ['#94A3B8', '#CBD5E1', '#E2E8F0'],
    bgColor: '#0F172A',
    cycleDuration: 2,
    echoCount: 5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PEACE', 'POWER', 'PURPOSE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#94A3B8', '#CBD5E1', '#E2E8F0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F172A', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2, min: 0.5, max: 6, group: 'Timing' },
    { key: 'echoCount', label: 'Echo Count', type: 'number', defaultValue: 5, min: 2, max: 10, group: 'Style' },
  ],
})
