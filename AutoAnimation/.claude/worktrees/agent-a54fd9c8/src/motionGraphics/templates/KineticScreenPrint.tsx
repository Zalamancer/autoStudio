import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ScreenPrintConfig extends KineticBaseConfig {}

function hash(n: number): number {
  return ((Math.sin(n * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    // Canvas/fabric texture beneath the print
    const threads: React.ReactNode[] = []
    for (let i = 0; i < 40; i++) {
      const isHorizontal = i < 20
      const pos = hash(i * 43 + 7) * (isHorizontal ? height : width)
      threads.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: isHorizontal ? 0 : pos,
            top: isHorizontal ? pos : 0,
            width: isHorizontal ? width : 1,
            height: isHorizontal ? 1 : height,
            background: 'rgba(0,0,0,0.02)',
          }}
        />
      )
    }
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {threads}
        {/* Mesh screen pattern overlay (faint) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: [
              'linear-gradient(0deg, rgba(0,0,0,0.015) 1px, transparent 1px)',
              'linear-gradient(90deg, rgba(0,0,0,0.015) 1px, transparent 1px)',
            ].join(', '),
            backgroundSize: '3px 3px',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height }: WordRenderProps) => {
    const seed = index * 89 + 31
    const chars = word.split('')

    // The squeegee wipe reveals text left-to-right
    // After wipe: ink bleed edges, slight texture
    let squeegeeX = 0 // 0..1 how far the squeegee has traveled
    let inkOpacity = 0
    let bleedAmount = 0
    let squeegeeVisible = false
    let exitFade = 0

    if (phase === 'enter') {
      // Squeegee drags across screen, pushing ink through mesh
      const t = enterProgress
      // Smooth acceleration then deceleration (like a real squeegee pull)
      squeegeeX = t < 0.5
        ? 2 * t * t
        : 1 - Math.pow(-2 * t + 2, 2) / 2
      inkOpacity = 1
      bleedAmount = Math.max(0, (t - 0.3) / 0.7) * 1.5
      squeegeeVisible = t < 0.95
    } else if (phase === 'hold') {
      squeegeeX = 1
      inkOpacity = 1
      bleedAmount = 1.5 + holdProgress * 0.5 // ink continues to bleed slightly
      squeegeeVisible = false
    } else {
      squeegeeX = 1
      inkOpacity = 1 - exitProgress
      bleedAmount = 2 * (1 - exitProgress)
      exitFade = exitProgress
      squeegeeVisible = false
    }

    const fontSize = 'clamp(50px, 14vw, 180px)'

    // Each character revealed based on squeegee position
    const renderedChars = chars.map((ch, ci) => {
      const charPosition = ci / chars.length
      const charEnd = (ci + 1) / chars.length
      const charReveal = Math.max(0, Math.min(1, (squeegeeX - charPosition) / (charEnd - charPosition + 0.001)))

      // Ink bleed: slight expansion and edge roughness
      const charBleed = bleedAmount * (0.8 + hash(seed + ci * 31) * 0.4)
      const bleedShadow = charReveal > 0.5
        ? `0 0 ${charBleed}px ${color}, ${charBleed * 0.3}px ${charBleed * 0.2}px ${charBleed * 0.5}px rgba(0,0,0,0.1)`
        : 'none'

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            opacity: charReveal * inkOpacity,
            color,
            textShadow: bleedShadow,
            // Slight ink thickness variation
            filter: charReveal > 0.9 ? `contrast(${1 + charBleed * 0.05})` : undefined,
          }}
        >
          {ch}
        </span>
      )
    })

    // Squeegee bar element
    const squeegeeBar = squeegeeVisible ? (
      <div
        style={{
          position: 'absolute',
          left: `${squeegeeX * 100}%`,
          top: '-10%',
          width: 8,
          height: '120%',
          background: 'linear-gradient(90deg, rgba(60,60,60,0.6) 0%, rgba(80,80,80,0.8) 40%, rgba(120,120,120,0.4) 100%)',
          borderRadius: 2,
          transform: 'translateX(-50%)',
          boxShadow: `4px 0 8px rgba(0,0,0,0.15), -2px 0 6px rgba(0,0,0,0.1)`,
        }}
      />
    ) : null

    // Ink smear trail behind squeegee during enter
    const inkTrail = phase === 'enter' && squeegeeX > 0.05 ? (
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: '45%',
          width: `${squeegeeX * 100}%`,
          height: '10%',
          background: `linear-gradient(90deg, ${color}08, ${color}03)`,
          borderRadius: '0 2px 2px 0',
        }}
      />
    ) : null

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 1 - exitFade * 0.3,
        }}
      >
        {inkTrail}
        <div
          style={{
            position: 'relative',
            fontFamily: "'Impact', 'Arial Black', 'Helvetica Neue', sans-serif",
            fontSize,
            fontWeight: 900,
            letterSpacing: 4,
            lineHeight: 1,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
          }}
        >
          {renderedChars}
          {squeegeeBar}
        </div>
      </div>
    )
  },
}

function ScreenPrintComponent(props: MotionGraphicProps<ScreenPrintConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-screen-print',
  title: 'Kinetic Screen Print',
  description: 'Squeegee screen print reveal where ink bleeds through mesh — each character revealed as the squeegee drags across',
  tags: ['kinetic', 'typography', 'screen-print', 'serigraphy', 'ink', 'squeegee', 'printmaking'],
  category: 'captions',
  component: ScreenPrintComponent as any,
  defaultConfig: {
    words: ['PRINT', 'PULL', 'MESH', 'BOLD'],
    colors: ['#D32F2F', '#1565C0', '#D32F2F', '#2E7D32'],
    bgColor: '#FAF3E0',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PRINT', 'PULL', 'MESH', 'BOLD'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#D32F2F', '#1565C0', '#D32F2F', '#2E7D32'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FAF3E0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
