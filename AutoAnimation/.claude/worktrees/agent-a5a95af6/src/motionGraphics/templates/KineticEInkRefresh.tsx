import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface EInkRefreshConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => {
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* E-paper surface texture - very faint grain */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(0,0,0,0.008) 0px, transparent 1px, transparent 3px), ' +
              'repeating-linear-gradient(90deg, rgba(0,0,0,0.008) 0px, transparent 1px, transparent 3px)',
            pointerEvents: 'none',
          }}
        />
        {/* Slight warm tint from backlight-free display */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(245,240,230,0.03) 0%, rgba(220,215,200,0.05) 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Edge shadow (bezel) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.06)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    if (phase === 'enter') {
      // E-ink refresh sequence:
      // 0-30%: black flash (full screen inversion)
      // 30-60%: ghosting from "previous" word visible as grey
      // 60-100%: electrophoretic particles settle into final position
      const ghostPhase = enterProgress >= 0.15 && enterProgress < 0.55
      const settlePhase = enterProgress >= 0.4

      const blackFlashOpacity =
        enterProgress < 0.15 ? enterProgress / 0.15 : enterProgress < 0.3 ? 1 - (enterProgress - 0.15) / 0.15 : 0

      const ghostOpacity = ghostPhase
        ? enterProgress < 0.35
          ? ((enterProgress - 0.15) / 0.2) * 0.3
          : Math.max(0, 0.3 - ((enterProgress - 0.35) / 0.2) * 0.3)
        : 0

      const settleProgress = settlePhase ? Math.min(1, (enterProgress - 0.4) / 0.6) : 0
      // Particles settle with slight overshoot
      const settleEase =
        settleProgress < 0.7 ? settleProgress / 0.7 : 1 - Math.sin(((settleProgress - 0.7) / 0.3) * Math.PI) * 0.05
      const textOpacity = settlePhase ? settleEase : 0
      const blur = settlePhase ? (1 - settleEase) * 2 : 0

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            textAlign: 'center',
          }}
        >
          {/* Black flash overlay */}
          {blackFlashOpacity > 0 && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: '#1a1a1a',
                opacity: blackFlashOpacity * 0.85,
                pointerEvents: 'none',
              }}
            />
          )}
          {/* Previous word ghost (grey, offset slightly) */}
          {ghostOpacity > 0 && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontSize: 'clamp(38px, 10vw, 140px)',
                fontWeight: 700,
                color: '#999999',
                whiteSpace: 'nowrap',
                opacity: ghostOpacity,
                letterSpacing: 2,
                filter: 'blur(0.5px)',
              }}
            >
              {word}
            </div>
          )}
          {/* Final settled text */}
          <div
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: 'clamp(38px, 10vw, 140px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              opacity: textOpacity,
              letterSpacing: 2,
              filter: `blur(${blur}px)`,
            }}
          >
            {word}
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // Static e-ink display - perfectly still, no animation
      // Very slight contrast variation typical of e-ink
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(38px, 10vw, 140px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 2,
          }}
        >
          {word}
        </div>
      )
    } else {
      // Exit: quick fade with a micro black flash hint
      const flashHint =
        exitProgress < 0.2 ? (exitProgress / 0.2) * 0.3 : Math.max(0, 0.3 - ((exitProgress - 0.2) / 0.3) * 0.3)
      const textFade = Math.max(0, 1 - exitProgress * 1.2)

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            textAlign: 'center',
          }}
        >
          {flashHint > 0 && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: '#1a1a1a',
                opacity: flashHint * 0.5,
                pointerEvents: 'none',
              }}
            />
          )}
          <div
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: 'clamp(38px, 10vw, 140px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              opacity: textFade,
              letterSpacing: 2,
              filter: `blur(${exitProgress * 1.5}px)`,
            }}
          >
            {word}
          </div>
        </div>
      )
    }
  },
}

function EInkRefreshComponent(props: MotionGraphicProps<EInkRefreshConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-e-ink-refresh',
  title: 'Kinetic E-Ink Refresh',
  description:
    'E-ink e-paper refresh with characteristic black flash, ghosting artifacts, electrophoretic particle settling, and paper texture',
  tags: ['kinetic', 'typography', 'e-ink', 'e-paper', 'kindle', 'refresh', 'minimal', 'paper'],
  category: 'captions',
  component: EInkRefreshComponent as any,
  defaultConfig: {
    words: ['READ', 'TURN', 'PAGE', 'NEXT'],
    colors: ['#1a1a1a', '#1a1a1a', '#1a1a1a', '#1a1a1a'],
    bgColor: '#e8e4d8',
    cycleDuration: 1.4,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['READ', 'TURN', 'PAGE', 'NEXT'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#1a1a1a', '#1a1a1a', '#1a1a1a', '#1a1a1a'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#e8e4d8', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.4,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
