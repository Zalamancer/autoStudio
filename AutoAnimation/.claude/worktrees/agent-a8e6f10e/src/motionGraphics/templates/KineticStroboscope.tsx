import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface StroboscopeConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

// Stroboscope: rapid flashing light freezes motion — produces multiple ghost images
// as the strobe fires at different points in the word's animation
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Strobe flash — periodic white flash on background
    const strobeHz = 6
    const strobePhase = (time * strobeHz) % 1
    const isStrobe = strobePhase < 0.15
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
          transition: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(255,255,255,${isStrobe ? 0.08 : 0})`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const time = (frame ?? 0) / 30

    const eased = easeOutExpo(Math.min(enterProgress, 1))

    // Strobe rate varies — fast at entry, settling to syncopated hold, fast again on exit
    const strobeHz =
      phase === 'enter'
        ? 8 + (1 - eased) * 12 // fast flash at entry
        : phase === 'hold'
          ? 5 // rhythmic hold strobe
          : 10 + exitProgress * 15 // frantic exit

    const strobePhase = (time * strobeHz) % 1
    const isFlash = strobePhase < 0.25

    // Ghost trail — previous "frozen" positions at earlier strobe moments
    const GHOST_COUNT = 4
    const ghosts = Array.from({ length: GHOST_COUNT }, (_, g) => {
      const ghostTime = time - (g + 1) * (1 / strobeHz) * 0.8
      const ghostStrobePhase = (ghostTime * strobeHz) % 1
      const wasFlash = ghostStrobePhase < 0.25

      // Ghost translateX — word was moving during entry, strobe froze it
      const ghostProgress = phase === 'enter' ? Math.max(0, Math.min(1, enterProgress - (g + 1) * 0.08)) : enterProgress
      const ghostX = phase === 'enter' ? -(1 - easeOutExpo(ghostProgress)) * 40 : 0
      const ghostOpacity = wasFlash ? 0.15 * (1 - g / GHOST_COUNT) : 0

      return { ghostX, ghostOpacity }
    })

    const mainX = phase === 'enter' ? -(1 - eased) * 40 : 0
    const mainOpacity =
      phase === 'enter' ? Math.min(1, enterProgress * 3) : phase === 'exit' ? 1 - exitProgress : isFlash ? 1 : 0.7 // strobe flicker on hold

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Ghost strobe trails */}
        {ghosts.map((ghost, g) => (
          <div
            key={g}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${ghost.ghostX}px), -50%)`,
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              fontSize: 'clamp(44px, 13vw, 170px)',
              fontWeight: 900,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              opacity: ghost.ghostOpacity,
              mixBlendMode: 'screen',
            }}
          >
            {word}
          </div>
        ))}

        {/* Main text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${mainX}px), -50%)`,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(44px, 13vw, 170px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            opacity: mainOpacity,
            textShadow: isFlash ? `0 0 20px rgba(255,255,255,0.5)` : 'none',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function StroboscopeComponent(props: MotionGraphicProps<StroboscopeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-stroboscope',
  title: 'Kinetic Stroboscope',
  description:
    "Stroboscopic freeze — flashing light creates multiple ghosted exposures of the moving text, with ghost trails that freeze the word's motion at each flash interval",
  tags: ['kinetic', 'typography', 'strobe', 'stroboscope', 'projection', 'flash', 'ghost', 'freeze'],
  category: 'captions',
  component: StroboscopeComponent as any,
  defaultConfig: {
    words: ['STROBE', 'FLASH', 'FREEZE', 'PULSE'],
    colors: ['#FFFFFF', '#E8F0FF', '#FFE8FF', '#E8FFE8'],
    bgColor: '#050505',
    cycleDuration: 1.4,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['STROBE', 'FLASH', 'FREEZE', 'PULSE'],
      group: 'Content',
    },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#E8F0FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050505', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.4,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
