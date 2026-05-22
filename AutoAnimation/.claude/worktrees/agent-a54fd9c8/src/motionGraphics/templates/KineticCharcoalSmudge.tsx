import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CharcoalSmudgeConfig extends KineticBaseConfig {}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function easeInQuad(t: number): number {
  return t * t
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Newsprint paper texture: fine parallel lines
    const paperLines = Array.from({ length: 20 }, (_, i) => (
      <div
        key={`pl${i}`}
        style={{
          position: 'absolute',
          left: 0,
          top: i * (height / 20),
          width: '100%',
          height: 1,
          background: `rgba(255,255,255,${0.008 + rand(i * 11) * 0.012})`,
        }}
      />
    ))

    // Charcoal dust smudges across paper
    const smudges = Array.from({ length: 6 }, (_, i) => {
      const x = width * rand(i * 43 + 3)
      const y = height * rand(i * 59 + 7)
      const w = 80 + rand(i * 23) * 150
      const h = 30 + rand(i * 37) * 50
      const angle = (rand(i * 31) - 0.5) * 40
      const alpha = 0.03 + rand(i * 47) * 0.04

      return (
        <div
          key={`sm${i}`}
          style={{
            position: 'absolute',
            left: x - w / 2,
            top: y - h / 2,
            width: w,
            height: h,
            background: `radial-gradient(ellipse, rgba(40,40,40,${alpha}), transparent 70%)`,
            transform: `rotate(${angle}deg)`,
            filter: 'blur(12px)',
            borderRadius: '40% 60% 55% 45%',
          }}
        />
      )
    })

    // Finger-drag marks
    const dragMarks = Array.from({ length: 4 }, (_, i) => {
      const x = width * (0.15 + rand(i * 51) * 0.7)
      const y = height * (0.2 + rand(i * 67) * 0.6)
      const w = 50 + rand(i * 29) * 80
      const angle = (rand(i * 41) - 0.5) * 60
      const alpha = 0.02 + rand(i * 19) * 0.03

      return (
        <div
          key={`drag${i}`}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: w,
            height: 6 + rand(i * 13) * 8,
            background: `linear-gradient(90deg, transparent, rgba(60,60,60,${alpha}), rgba(50,50,50,${alpha * 0.6}), transparent)`,
            transform: `rotate(${angle}deg)`,
            borderRadius: 4,
            filter: 'blur(3px)',
          }}
        />
      )
    })

    // Fixative spray speckle
    const speckles = Array.from({ length: 15 }, (_, i) => {
      const x = width * rand(i * 37 + 1)
      const y = height * rand(i * 53 + 5)
      const size = 2 + rand(i * 19) * 4
      const alpha = 0.03 + rand(i * 41) * 0.04
      const show = Math.sin(t * 0.1 + i) > -0.5

      return show ? (
        <div
          key={`sp${i}`}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: size,
            height: size,
            borderRadius: '50%',
            background: `rgba(200, 200, 200, ${alpha})`,
          }}
        />
      ) : null
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {paperLines}
        {smudges}
        {dragMarks}
        {speckles}
        {/* Paper vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.08) 100%)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, _holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    const chars = word.split('').map((ch, ci) => {
      let charOpacity = 1
      let yOff = 0
      let xOff = 0
      let blur = 0
      let scaleX = 1

      if (phase === 'enter') {
        // Charcoal drawn stroke by stroke: horizontal pressure builds up
        const delay = ci / (word.length + 1) * 0.4
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.6))
        const ep = easeOutQuart(p)

        charOpacity = ep
        // Draw pressure: starts faint, builds to full
        blur = (1 - ep) * 3
        // Charcoal dragging motion
        xOff = (1 - ep) * 25
        scaleX = 0.7 + ep * 0.3
      } else if (phase === 'hold') {
        // Subtle tonal vibration of charcoal on paper
        yOff = Math.sin(t * 0.6 + ci * 0.5) * 1.5
        blur = 0.3 + Math.sin(t * 1.2 + ci * 0.8) * 0.3
      } else {
        // Finger-smudge blend: charcoal smears sideways
        const delay = ci / (word.length + 1) * 0.3
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.7))
        const ep = easeInQuad(p)

        charOpacity = 1 - ep * 0.8
        blur = ep * 10
        // Smudge direction: outward from center
        const dir = ci < word.length / 2 ? -1 : 1
        xOff = ep * 30 * dir
        scaleX = 1 + ep * 0.4
      }

      // Charcoal tonal gradation: darker at center, lighter at edges
      const tonalShift = 0.9 + Math.sin(ci * 0.8 + index * 0.3) * 0.1

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity: charOpacity * tonalShift,
            transform: `translate(${xOff}px, ${yOff}px) scaleX(${scaleX})`,
            filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
            textShadow: `0 0 ${2 + blur}px ${color}40, 0 1px 3px rgba(0,0,0,0.2)`,
          }}
        >
          {ch}
        </span>
      )
    })

    // Charcoal dust cloud during drawing
    let dustCloud: React.ReactNode = null
    if (phase === 'enter' && enterProgress > 0.1 && enterProgress < 0.7) {
      const dustAlpha = Math.sin((enterProgress - 0.1) / 0.6 * Math.PI) * 0.1
      dustCloud = (
        <div
          style={{
            position: 'absolute',
            top: '55%',
            left: '50%',
            width: '60%',
            height: 20,
            transform: 'translateX(-50%)',
            borderRadius: '50%',
            background: `radial-gradient(ellipse, rgba(80,80,80,${dustAlpha}), transparent 70%)`,
            filter: 'blur(8px)',
          }}
        />
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {dustCloud}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(44px, 12vw, 155px)',
            fontWeight: 700,
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

function CharcoalSmudgeComponent(props: MotionGraphicProps<CharcoalSmudgeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-charcoal-smudge',
  title: 'Kinetic Charcoal Smudge',
  description: 'Text drawn in charcoal with finger-smudge blending and tonal gradation. Letters build with drawing pressure, sit on newsprint paper, and smear away with charcoal dust.',
  tags: ['kinetic', 'typography', 'paint', 'charcoal', 'smudge', 'drawing', 'tonal', 'paper'],
  category: 'captions',
  component: CharcoalSmudgeComponent as any,
  defaultConfig: {
    words: ['SHADE', 'SMEAR', 'TONE', 'DRAW'],
    colors: ['#4A4A4A', '#3A3A3A', '#5A5A5A', '#2E2E2E'],
    bgColor: '#E8E0D4',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SHADE', 'SMEAR', 'TONE', 'DRAW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#4A4A4A', '#3A3A3A', '#5A5A5A', '#2E2E2E'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#E8E0D4', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
