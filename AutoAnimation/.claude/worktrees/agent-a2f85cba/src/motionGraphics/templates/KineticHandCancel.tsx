import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface HandCancelConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const counterW = Math.min(width * 0.8, height * 0.6)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Post office counter surface — worn wood grain */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '65%',
            background: 'linear-gradient(180deg, #6b5440 0%, #5a4535 40%, #4e3c2e 100%)',
          }}
        >
          {/* Wood grain lines */}
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: `${i * 8.5}%`,
                left: 0,
                right: 0,
                height: 1,
                background: `rgba(0,0,0,${0.05 + (i % 3) * 0.02})`,
                transform: `translateY(${Math.sin(i * 1.8) * 2}px)`,
              }}
            />
          ))}
        </div>
        {/* Envelope on counter */}
        <div
          style={{
            position: 'absolute',
            top: '42%',
            left: '50%',
            width: counterW,
            height: counterW * 0.6,
            transform: 'translate(-50%, -50%) rotate(-2deg)',
            background: 'linear-gradient(135deg, #f8f3e8 0%, #f0e8d6 100%)',
            borderRadius: 2,
            boxShadow: '0 3px 12px rgba(0,0,0,0.25)',
          }}
        >
          {/* Envelope flap triangle shadow */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: `${counterW * 0.5}px solid transparent`,
              borderRight: `${counterW * 0.5}px solid transparent`,
              borderTop: `${counterW * 0.18}px solid rgba(0,0,0,0.03)`,
            }}
          />
          {/* Address lines */}
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: `${45 + i * 12}%`,
                left: '30%',
                width: `${45 - i * 6}%`,
                height: 1,
                background: 'rgba(80,60,40,0.08)',
              }}
            />
          ))}
        </div>
        {/* Ink pad — small rectangle near corner */}
        <div
          style={{
            position: 'absolute',
            bottom: '22%',
            right: '12%',
            width: counterW * 0.15,
            height: counterW * 0.1,
            background: 'linear-gradient(135deg, #1a1a2a, #252535)',
            borderRadius: 4,
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          }}
        >
          {/* Ink surface */}
          <div
            style={{
              position: 'absolute',
              inset: 3,
              background: 'linear-gradient(135deg, #2a1a3a, #1a1028)',
              borderRadius: 2,
            }}
          />
        </div>
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    width,
    height,
  }: WordRenderProps) => {
    const stampW = Math.min(width * 0.35, height * 0.2)
    let opacity = 0
    let scale = 1
    // Hand-cancel stamps are slightly rotated — imperfect human placement
    const baseRotation = -4 + (index % 3) * 3
    let rotation = baseRotation
    let inkCoverage = 1

    if (phase === 'enter') {
      if (enterProgress < 0.15) {
        // Hand swings stamp down — fast approach
        const t = enterProgress / 0.15
        opacity = t * 0.4
        scale = 1.8 - t * 0.8
        rotation = baseRotation + (1 - t) * 15
      } else if (enterProgress < 0.35) {
        // Contact — imperfect pressure
        const t = (enterProgress - 0.15) / 0.2
        opacity = 0.4 + t * 0.35
        scale = 1.0 + (1 - t) * 0.04
        rotation = baseRotation + Math.sin(t * Math.PI * 2) * 1.5
        // Ink seeps — coverage grows
        inkCoverage = 0.5 + t * 0.3
      } else if (enterProgress < 0.6) {
        // Press harder — clerk leans in
        const t = (enterProgress - 0.35) / 0.25
        opacity = 0.75 + t * 0.15
        scale = 1
        rotation = baseRotation - t * 0.8
        inkCoverage = 0.8 + t * 0.15
      } else {
        // Lift stamp — ink fully transferred
        const t = (enterProgress - 0.6) / 0.4
        opacity = 0.9 + t * 0.1
        scale = 1
        rotation = baseRotation
        inkCoverage = 0.95 + t * 0.05
      }
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      rotation = baseRotation + Math.sin(holdProgress * Math.PI * 2) * 0.2
      inkCoverage = 1
    } else {
      opacity = 1 - exitProgress
      scale = 1 - exitProgress * 0.1
      rotation = baseRotation - exitProgress * 8
      inkCoverage = 1
    }

    // Imperfect ink — some areas lighter (hand-cancel characteristic)
    const inkOpacity = inkCoverage * 0.85

    return (
      <div
        style={{
          position: 'absolute',
          top: '42%',
          left: '50%',
          transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
          opacity,
        }}
      >
        {/* Stamp rectangle border — hand cancel box */}
        <div
          style={{
            position: 'relative',
            padding: '8px 20px',
            border: `3px solid ${color}`,
            borderRadius: 2,
            opacity: inkOpacity,
          }}
        >
          {/* Uneven ink edges — imperfect coverage */}
          <div
            style={{
              position: 'absolute',
              top: -1,
              left: '10%',
              width: '25%',
              height: 3,
              background: color,
              opacity: inkCoverage * 0.3,
              filter: 'blur(1px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: -1,
              right: '15%',
              width: '20%',
              height: 3,
              background: color,
              opacity: inkCoverage * 0.25,
              filter: 'blur(1px)',
            }}
          />
          {/* Main text — hand cancel stamp */}
          <div
            style={{
              fontFamily: "'Courier New', 'Lucida Console', monospace",
              fontSize: `clamp(24px, ${stampW * 0.18}px, 64px)`,
              fontWeight: 700,
              color,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              letterSpacing: 4,
              textAlign: 'center',
              opacity: inkOpacity,
            }}
          >
            {word}
          </div>
          {/* Date line below */}
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: `clamp(8px, ${stampW * 0.06}px, 16px)`,
              color,
              textAlign: 'center',
              marginTop: 2,
              opacity: inkOpacity * 0.7,
              letterSpacing: 1,
            }}
          >
            MAR 19 2026 PM
          </div>
          {/* Smudge marks — imperfect ink transfer */}
          {[
            { top: '20%', left: '-4%', w: 8, h: 12 },
            { top: '60%', right: '-3%', w: 6, h: 10 },
          ].map((smudge, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                ...smudge,
                width: smudge.w,
                height: smudge.h,
                background: color,
                opacity: 0.12 * inkCoverage,
                filter: 'blur(2px)',
                borderRadius: '50%',
              }}
            />
          ))}
        </div>
      </div>
    )
  },
}

function HandCancelComponent(props: MotionGraphicProps<HandCancelConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-hand-cancel',
  title: 'Kinetic Hand Cancel',
  description:
    'Manual hand-cancel rubber stamp with imperfect ink coverage and slight rotation. Postal office clerk applying cancellation by hand, uneven pressure and ink seep.',
  tags: ['kinetic', 'typography', 'hand-cancel', 'rubber-stamp', 'postal', 'mail', 'ink', 'imperfect', 'analog'],
  category: 'captions',
  component: HandCancelComponent as any,
  defaultConfig: {
    words: ['CANCEL', 'VOIDED', 'POSTED', 'FRANK'],
    colors: ['#3a1a5a', '#3a1a5a', '#3a1a5a', '#3a1a5a'],
    bgColor: '#3d3228',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CANCEL', 'VOIDED', 'POSTED', 'FRANK'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#3a1a5a', '#3a1a5a', '#3a1a5a', '#3a1a5a'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#3d3228', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
  ],
})
