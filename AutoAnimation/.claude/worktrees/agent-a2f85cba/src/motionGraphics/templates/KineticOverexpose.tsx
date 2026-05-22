import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface OverexposeConfig extends KineticBaseConfig {
  peakWhite: number
}

// Overexposure: screen floods to pure white (blown-out exposure) then the
// aperture/ISO corrects and text emerges from the brightening scene.
// On exit, sensor clips to white again before clearing.
// This mimics stepping from a dark interior into blinding outdoor light.

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, enterProgress, holdProgress, exitProgress }: BackgroundRenderProps) => {
    const ep = enterProgress ?? 0
    const xp = exitProgress ?? 0
    const hp = holdProgress ?? 0

    // White flash: starts at 1 (blown out), eases to 0 during enter
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 2.5)
    const easeIn  = (t: number) => Math.pow(t, 2)

    let whiteOverlay: number
    if (hp > 0) {
      whiteOverlay = 0
    } else if (xp > 0) {
      whiteOverlay = easeIn(xp)
    } else {
      whiteOverlay = 1 - easeOut(ep)
    }

    // Colour temperature shifts during exposure correction:
    // blown-out = white, correcting = cool blue-white, normal = warm amber
    const warmth = Math.max(0, 1 - whiteOverlay)  // 0 when blown, 1 when normal

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
        }}
      >
        {/* Warm cinematic colour grade on the base */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(160deg, rgba(255,200,100,${warmth * 0.06}) 0%, transparent 60%)`,
            pointerEvents: 'none',
          }}
        />

        {/* Halation: overexposed frames have a bloom/halo at bright areas */}
        {whiteOverlay < 0.8 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(ellipse at 50% 45%, rgba(255,255,240,${(1 - whiteOverlay) * 0.15}) 0%, transparent 60%)`,
              pointerEvents: 'none',
              mixBlendMode: 'screen',
            }}
          />
        )}

        {/* The overexposure white flood */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(255,252,245,${whiteOverlay})`,
            pointerEvents: 'none',
          }}
        />

        {/* Vignette returns as exposure normalises */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,${warmth * 0.5}) 100%)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
    const easeIn  = (t: number) => Math.pow(t, 2.5)

    let opacity: number
    let brightness: number  // simulates overexposed pixel values
    let scale: number

    if (phase === 'enter') {
      const ep = easeOut(enterProgress)
      // Text starts invisible in the white void, materialises as scene corrects
      opacity = Math.max(0, (enterProgress - 0.35) / 0.65)
      brightness = 2.5 - ep * 1.5  // starts very bright, settles to 1
      scale = 1
    } else if (phase === 'hold') {
      opacity = 1
      brightness = 1
      scale = 1
    } else {
      const ep = easeIn(exitProgress)
      opacity = 1 - ep * 0.9
      brightness = 1 + ep * 2  // text blows out as scene overexposes again
      scale = 1
    }

    // During blow-out, text colour desaturates toward white
    const saturate = phase === 'enter' ? Math.min(1, (enterProgress - 0.3) / 0.4) : phase === 'exit' ? Math.max(0, 1 - exitProgress * 1.5) : 1

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          whiteSpace: 'nowrap',
        }}
      >
        {/* Halation bloom around text */}
        <div
          style={{
            position: 'absolute',
            inset: '-15%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 700,
            color: 'rgba(255,255,240,0.8)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            filter: `blur(20px) brightness(${brightness * 1.5})`,
            opacity: opacity * 0.4,
            mixBlendMode: 'screen',
          }}
        >
          {word}
        </div>
        {/* Main text */}
        <div
          style={{
            position: 'relative',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 700,
            color,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            opacity,
            filter: `brightness(${brightness}) saturate(${saturate})`,
            textShadow: brightness < 1.2 ? `0 2px 16px rgba(255,200,80,0.25)` : 'none',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function OverexposeComponent(props: MotionGraphicProps<OverexposeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-overexpose',
  title: 'Kinetic Overexpose',
  description: 'Screen overexposes to blinding white, then the aperture corrects and text emerges with warm halation bloom — mimics stepping into bright light',
  tags: ['kinetic', 'typography', 'film', 'camera', 'overexpose', 'exposure', 'white flash', 'cinematic', 'blow out'],
  category: 'captions',
  component: OverexposeComponent as any,
  defaultConfig: {
    words: ['EXPOSED', 'BRIGHT', 'BURN', 'LIGHT'],
    colors: ['#F8EED0', '#FFFFFF', '#FFE8A0', '#F0DCA8'],
    bgColor: '#100E08',
    cycleDuration: 1.6,
    peakWhite: 100,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['EXPOSED', 'BRIGHT', 'BURN', 'LIGHT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F8EED0', '#FFFFFF', '#FFE8A0', '#F0DCA8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#100E08', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
    { key: 'peakWhite', label: 'Peak White (%)', type: 'number', defaultValue: 100, min: 60, max: 100, group: 'Animation' },
  ],
})
