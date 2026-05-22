import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface EspressoCremaConfig extends KineticBaseConfig {}

/* --- physics-matched easings --- */

/** Viscous pour: slow start, heavy acceleration (espresso through portafilter) */
function easeInQuart(t: number): number {
  return t * t * t * t
}

/** Crema bloom: fast expansion then gentle settle */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/** Symmetric ease for crema swirl drift */
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

/** Deterministic pseudo-random */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Layer 1: Crema swirl marbling — tiger-stripe patterns that drift
    const swirlLayers = Array.from({ length: 6 }, (_, i) => {
      const angle = (i * 60 + t * 8 + Math.sin(t * 0.5 + i) * 15) % 360
      const cx = width * (0.3 + 0.4 * rand(i * 31 + 5)) + Math.sin(t * 0.4 + i * 1.2) * 40
      const cy = height * (0.3 + 0.4 * rand(i * 47 + 9)) + Math.cos(t * 0.35 + i * 0.8) * 30
      const swirlW = 120 + rand(i * 19) * 160
      const swirlH = 30 + rand(i * 37) * 40
      const alpha = 0.12 + Math.sin(t * 0.7 + i * 1.1) * 0.04

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: cx - swirlW / 2,
            top: cy - swirlH / 2,
            width: swirlW,
            height: swirlH,
            borderRadius: '50%',
            background: `radial-gradient(ellipse, rgba(210, 170, 110, ${alpha + 0.08}), rgba(180, 130, 70, ${alpha}) 50%, transparent 80%)`,
            transform: `rotate(${angle}deg)`,
            filter: 'blur(14px)',
            mixBlendMode: 'screen' as const,
          }}
        />
      )
    })

    // Layer 2: Espresso dark body beneath the crema
    const darkStreams = Array.from({ length: 3 }, (_, i) => {
      const baseY = height * (0.6 + 0.12 * i)
      const drift = Math.sin(t * 0.3 + i * 2) * 20
      return (
        <div
          key={`d${i}`}
          style={{
            position: 'absolute',
            left: -20,
            top: baseY + drift,
            width: width + 40,
            height: 50 + rand(i * 23) * 40,
            background: `linear-gradient(90deg, transparent, rgba(40, 22, 10, 0.2) 20%, rgba(40, 22, 10, 0.25) 80%, transparent)`,
            filter: 'blur(18px)',
            borderRadius: '50%',
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {darkStreams}
        {swirlLayers}
        {/* Layer 3: Cup rim vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(30, 15, 5, 0.35) 100%)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    const chars = word.split('').map((ch, ci) => {
      let charOpacity = 1
      let yOff = 0
      let scaleX = 1
      let scaleY = 1
      let blur = 0

      if (phase === 'enter') {
        // Pour phase: thick espresso stream flowing down from portafilter
        const delay = ci / (word.length + 1) * 0.35
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.65))
        const ep = easeInQuart(p) // slow start, heavy pour acceleration

        charOpacity = Math.min(1, ep * 1.4)
        // Letters descend from above like espresso stream
        yOff = -(1 - ep) * 90
        // Stretched vertically while pouring (stream shape), widens as it pools
        scaleX = 0.6 + ep * 0.4
        scaleY = 1.4 - ep * 0.4
        blur = (1 - ep) * 3
      } else if (phase === 'hold') {
        // Crema bloom: letters settled, gentle swirl movement + crema foam float
        const swirlT = t * 1.2 + ci * 0.55
        yOff = Math.sin(swirlT) * 3
        const xDrift = Math.cos(swirlT * 0.7) * 2
        scaleX = 1 + Math.sin(t * 1.8 + ci * 0.4) * 0.02
        scaleY = 1 - Math.sin(t * 1.8 + ci * 0.4) * 0.015
        // micro steam shimmer
        blur = Math.sin(t * 4 + ci * 0.6) * 0.3

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              color,
              opacity: charOpacity,
              transform: `translate(${xDrift}px, ${yOff}px) scaleX(${scaleX}) scaleY(${scaleY})`,
              filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
              textShadow: `0 2px 8px rgba(80, 45, 15, 0.5), 0 0 20px rgba(210, 170, 110, 0.25)`,
            }}
          >
            {ch}
          </span>
        )
      } else {
        // Exit: espresso drains — letters sink and spread like liquid pooling out
        const delay = (word.length - 1 - ci) / (word.length + 1) * 0.35
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.65))
        const ep = easeInQuart(p)

        charOpacity = 1 - ep
        yOff = ep * 60
        scaleX = 1 + ep * 0.5 // spreads wide as it pools
        scaleY = 1 - ep * 0.6 // flattens as liquid settles
        blur = ep * 4
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity: charOpacity,
            transform: `translateY(${yOff}px) scaleX(${scaleX}) scaleY(${scaleY})`,
            transformOrigin: 'center bottom',
            filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
            textShadow: `0 2px 8px rgba(80, 45, 15, 0.5), 0 0 20px rgba(210, 170, 110, 0.25)`,
          }}
        >
          {ch}
        </span>
      )
    })

    // Steam wisps rising above the text
    const steamWisps: React.ReactNode[] = []
    if (phase !== 'exit') {
      const steamAlpha = phase === 'enter' ? enterProgress * 0.15 : 0.15 - holdProgress * 0.03
      for (let s = 0; s < 4; s++) {
        const sx = width * (0.3 + 0.1 * s) + Math.sin(t * 1.5 + s * 2) * 30
        const sy = height * 0.28 - Math.abs(Math.sin(t * 0.8 + s * 1.5)) * 40
        const sSize = 20 + rand(s * 29 + index) * 30
        steamWisps.push(
          <div
            key={`st${s}`}
            style={{
              position: 'absolute',
              left: sx,
              top: sy,
              width: sSize,
              height: sSize * 0.5,
              borderRadius: '50%',
              background: `radial-gradient(ellipse, rgba(220, 200, 170, ${steamAlpha}), transparent 70%)`,
              filter: 'blur(8px)',
              transform: `rotate(${Math.sin(t + s) * 20}deg)`,
            }}
          />,
        )
      }
    }

    // Crema foam ring around text during hold
    let cremaRing: React.ReactNode = null
    if (phase === 'hold') {
      const ringAlpha = 0.15 + Math.sin(t * 1.5) * 0.05
      cremaRing = (
        <div
          style={{
            position: 'absolute',
            top: '42%',
            left: '50%',
            width: '80%',
            height: 40,
            transform: 'translateX(-50%)',
            borderRadius: '50%',
            background: `radial-gradient(ellipse, rgba(210, 170, 110, ${ringAlpha}), rgba(180, 130, 70, ${ringAlpha * 0.5}) 50%, transparent 80%)`,
            filter: 'blur(10px)',
            mixBlendMode: 'screen' as const,
          }}
        />
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {steamWisps}
        {cremaRing}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Palatino', serif",
            fontSize: 'clamp(44px, 12vw, 155px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function EspressoCremaComponent(props: MotionGraphicProps<EspressoCremaConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-espresso-crema',
  title: 'Kinetic Espresso Crema',
  description: 'Espresso pour with crema bloom. Letters stream down like thick espresso from a portafilter, settle with crema swirl marbling, and drain away on exit. Steam wisps rise above.',
  tags: ['kinetic', 'typography', 'food', 'espresso', 'coffee', 'crema', 'pour', 'organic'],
  category: 'captions',
  component: EspressoCremaComponent as any,
  defaultConfig: {
    words: ['BREW', 'CREMA', 'ROAST', 'AROMA'],
    colors: ['#D4A86A', '#C49155', '#B87A3D', '#DEB887'],
    bgColor: '#1C0F05',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BREW', 'CREMA', 'ROAST', 'AROMA'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#D4A86A', '#C49155', '#B87A3D', '#DEB887'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1C0F05', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
