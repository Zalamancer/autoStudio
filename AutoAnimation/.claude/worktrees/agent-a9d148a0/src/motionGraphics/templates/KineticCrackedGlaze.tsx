import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CrackedGlazeConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Craquelure network on canvas/ceramic surface
    const crackNetwork: React.ReactNode[] = []
    const numCracks = 30

    for (let i = 0; i < numCracks; i++) {
      const cx = width * rand(i * 31 + 7)
      const cy = height * rand(i * 47 + 13)
      const length = 10 + rand(i * 19) * 50
      const angle = rand(i * 37) * 180
      const thickness = 0.3 + rand(i * 23) * 0.8
      const alpha = 0.04 + rand(i * 29) * 0.05

      // Main crack line
      crackNetwork.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: cx,
            top: cy,
            width: length,
            height: thickness,
            transform: `rotate(${angle}deg)`,
            background: `linear-gradient(90deg, transparent, rgba(80, 60, 30, ${alpha}), rgba(80, 60, 30, ${alpha}), transparent)`,
          }}
        />,
      )

      // Branch crack
      if (rand(i * 41) > 0.4) {
        const branchAngle = angle + (rand(i * 43) > 0.5 ? 40 + rand(i * 53) * 30 : -(40 + rand(i * 59) * 30))
        const branchLen = length * (0.3 + rand(i * 61) * 0.4)
        crackNetwork.push(
          <div
            key={`b${i}`}
            style={{
              position: 'absolute',
              left: cx + Math.cos(angle * Math.PI / 180) * length * 0.6,
              top: cy + Math.sin(angle * Math.PI / 180) * length * 0.6,
              width: branchLen,
              height: thickness * 0.7,
              transform: `rotate(${branchAngle}deg)`,
              background: `linear-gradient(90deg, rgba(80, 60, 30, ${alpha * 0.7}), transparent)`,
            }}
          />,
        )
      }
    }

    // Aged varnish yellowing
    const varnishAlpha = 0.03 + Math.sin(t * 0.1) * 0.01

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Canvas/ceramic base */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, rgba(160, 140, 100, 0.04), rgba(120, 100, 60, 0.06) 100%)`,
          }}
        />
        {/* Varnish layer */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(180, 160, 100, ${varnishAlpha})`,
          }}
        />
        {crackNetwork}
        {/* Canvas weave texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(100,80,40,0.012) 3px, rgba(100,80,40,0.012) 4px), repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(100,80,40,0.012) 3px, rgba(100,80,40,0.012) 4px)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    // Crack lines developing across/around the text
    const textCracks: React.ReactNode[] = []
    if (phase === 'hold' || phase === 'exit') {
      const progress = phase === 'hold' ? holdProgress : 1
      const numCracks = 16
      for (let c = 0; c < numCracks; c++) {
        const cP = Math.max(0, Math.min(1, progress * 1.4 - rand(c * 31 + index) * 0.6))
        if (cP <= 0) continue
        // Cracks radiate from center of text
        const cx = (rand(c * 37 + index) - 0.5) * 180
        const cy = (rand(c * 41 + index) - 0.5) * 80
        const cLen = (10 + rand(c * 43) * 30) * cP
        const cAngle = rand(c * 47 + index) * 360
        const cThick = 0.5 + rand(c * 29) * 1

        textCracks.push(
          <div
            key={`tc${c}`}
            style={{
              position: 'absolute',
              top: `calc(50% + ${cy}px)`,
              left: `calc(50% + ${cx}px)`,
              width: cLen,
              height: cThick,
              transform: `translate(-50%, -50%) rotate(${cAngle}deg)`,
              background: `linear-gradient(90deg, transparent, rgba(60, 45, 20, ${cP * 0.2}), transparent)`,
            }}
          />,
        )

        // Branch from some cracks
        if (rand(c * 53) > 0.5 && cP > 0.3) {
          const brAngle = cAngle + (rand(c * 59) > 0.5 ? 45 : -45) + rand(c * 61) * 20
          textCracks.push(
            <div
              key={`tb${c}`}
              style={{
                position: 'absolute',
                top: `calc(50% + ${cy + Math.sin(cAngle * Math.PI / 180) * cLen * 0.4}px)`,
                left: `calc(50% + ${cx + Math.cos(cAngle * Math.PI / 180) * cLen * 0.4}px)`,
                width: cLen * 0.5,
                height: cThick * 0.7,
                transform: `translate(-50%, -50%) rotate(${brAngle}deg)`,
                background: `linear-gradient(90deg, rgba(60, 45, 20, ${cP * 0.15}), transparent)`,
              }}
            />,
          )
        }
      }
    }

    const chars = word.split('').map((ch, ci) => {
      let charOpacity = 0
      let crazeAmount = 0 // 0 = smooth glaze, 1 = fully crazed
      let charScale = 1

      if (phase === 'enter') {
        // Smooth, pristine glaze surface appearing
        const delay = ci / (word.length + 1) * 0.35
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.65))
        const ep = easeOutQuart(p)

        charOpacity = ep
        charScale = 0.92 + ep * 0.08
      } else if (phase === 'hold') {
        charOpacity = 1
        // Crazing develops: fine crack network across glaze surface
        const crazeDelay = ci / (word.length + 1) * 0.2
        const crazeP = Math.max(0, Math.min(1, (holdProgress - crazeDelay) / 0.8))
        crazeAmount = easeOutQuart(crazeP) * 0.65
      } else {
        // Deep cracking, glaze fragments begin to separate
        const delay = ci / (word.length + 1) * 0.25
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.75))
        const ep = easeInCubic(p)

        charOpacity = 1 - ep * 0.6
        crazeAmount = 0.65 + ep * 0.35
        // Slight fragment separation
        charScale = 1 + ep * 0.02
      }

      // Per-character craquelure lines overlaid on the letter
      const charCracks: React.ReactNode[] = []
      if (crazeAmount > 0.1) {
        const numCharCracks = Math.floor(crazeAmount * 5) + 1
        for (let cc = 0; cc < numCharCracks; cc++) {
          const ccAngle = rand(ci * 19 + cc * 31 + index) * 180
          const ccLen = crazeAmount * (8 + rand(ci * 23 + cc * 37) * 15)
          const ccAlpha = crazeAmount * 0.35

          charCracks.push(
            <span
              key={`cc${cc}`}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: ccLen,
                height: 0.5 + crazeAmount * 0.5,
                transform: `translate(-50%, -50%) rotate(${ccAngle}deg)`,
                background: `linear-gradient(90deg, transparent, rgba(50, 35, 15, ${ccAlpha}), transparent)`,
                pointerEvents: 'none',
              }}
            />,
          )
        }
      }

      // Glaze sheen: smooth when fresh, matte when crazed
      const sheenAlpha = Math.max(0, (1 - crazeAmount * 1.5) * 0.15)

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            position: 'relative',
            color,
            opacity: charOpacity,
            transform: `scale(${charScale})`,
            textShadow: [
              sheenAlpha > 0.01 ? `0 -1px ${3 + sheenAlpha * 10}px rgba(255, 250, 230, ${sheenAlpha})` : '',
              crazeAmount > 0.2 ? `0 0 ${crazeAmount * 3}px rgba(80, 60, 25, ${crazeAmount * 0.15})` : '',
              `0 1px 2px rgba(0, 0, 0, 0.2)`,
            ].filter(Boolean).join(', '),
          }}
        >
          <span style={{ position: 'relative', zIndex: 1 }}>{ch}</span>
          {charCracks}
        </span>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {textCracks}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Palatino Linotype', serif",
            fontSize: 'clamp(44px, 12vw, 155px)',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            letterSpacing: 5,
            textTransform: 'uppercase',
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function CrackedGlazeComponent(props: MotionGraphicProps<CrackedGlazeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-cracked-glaze',
  title: 'Kinetic Cracked Glaze',
  description: 'Text surface develops fine network of aging cracks like old oil painting craquelure or ceramic glaze crazing. Pristine glaze enters, crack network spreads during hold, deep fractures form on exit.',
  tags: ['kinetic', 'typography', 'decay', 'craquelure', 'cracked', 'glaze', 'ceramic', 'painting'],
  category: 'captions',
  component: CrackedGlazeComponent as any,
  defaultConfig: {
    words: ['CRAZE', 'CRACK', 'GLAZE', 'AGED'],
    colors: ['#D4C8A0', '#C8B888', '#E0D4B0', '#BCA878'],
    bgColor: '#181510',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CRAZE', 'CRACK', 'GLAZE', 'AGED'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#D4C8A0', '#C8B888', '#E0D4B0', '#BCA878'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#181510', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
