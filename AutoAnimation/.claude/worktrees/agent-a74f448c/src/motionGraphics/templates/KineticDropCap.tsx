import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DropCapConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Parchment texture — faint noise overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(circle at 20% 30%, rgba(160,120,60,0.04) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(160,120,60,0.03) 0%, transparent 50%)`,
        }}
      />
      {/* Faint margin line, like a manuscript */}
      <div
        style={{
          position: 'absolute',
          top: '8%',
          bottom: '8%',
          left: '20%',
          width: 0.5,
          background: 'rgba(180,140,100,0.12)',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const firstLetter = word.charAt(0)
    const restOfWord = word.slice(1)

    // Drop cap animation state
    let capOpacity = 0
    let capScale = 0
    let capRotate = 0
    let restOpacity = 0
    let restX = 0
    let ornamentOpacity = 0

    if (phase === 'enter') {
      // Drop cap fades and scales in with a slight rotation flourish
      const capPhase = Math.min(1, enterProgress * 2)
      const eased = 1 - Math.pow(1 - capPhase, 3)
      capOpacity = eased
      capScale = 0.2 + eased * 0.8
      capRotate = (1 - eased) * -12

      // Ornamental border blooms around the cap
      ornamentOpacity = Math.max(0, (capPhase - 0.4) / 0.6)

      // Rest of word flows in from the right
      const restPhase = Math.max(0, (enterProgress - 0.4) / 0.6)
      const restEased = 1 - Math.pow(1 - restPhase, 2)
      restOpacity = restEased
      restX = (1 - restEased) * 40
    } else if (phase === 'hold') {
      capOpacity = 1
      capScale = 1
      restOpacity = 1
      ornamentOpacity = 1
      // Subtle glow pulse on the drop cap
      capScale = 1 + Math.sin(holdProgress * Math.PI * 2) * 0.015
    } else {
      const fade = 1 - exitProgress
      capOpacity = fade
      capScale = 1 - exitProgress * 0.2
      restOpacity = fade
      ornamentOpacity = fade
    }

    return (
      <>
        {/* Drop cap with ornamental border */}
        <div
          style={{
            position: 'absolute',
            top: '28%',
            left: '14%',
            transform: `scale(${capScale}) rotate(${capRotate}deg)`,
            transformOrigin: 'center center',
            opacity: capOpacity,
          }}
        >
          {/* Ornamental border box around the cap */}
          <div
            style={{
              position: 'absolute',
              inset: -12,
              border: `2px solid ${color}`,
              opacity: ornamentOpacity * 0.4,
              borderRadius: 3,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: -6,
              border: `0.5px solid ${color}`,
              opacity: ornamentOpacity * 0.2,
              borderRadius: 2,
            }}
          />
          {/* Corner ornaments */}
          {ornamentOpacity > 0 && ['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((corner) => {
            const isTop = corner.includes('top')
            const isLeft = corner.includes('left')
            return (
              <div
                key={corner}
                style={{
                  position: 'absolute',
                  [isTop ? 'top' : 'bottom']: -16,
                  [isLeft ? 'left' : 'right']: -16,
                  width: 8,
                  height: 8,
                  borderTop: isTop ? `1.5px solid ${color}` : 'none',
                  borderBottom: !isTop ? `1.5px solid ${color}` : 'none',
                  borderLeft: isLeft ? `1.5px solid ${color}` : 'none',
                  borderRight: !isLeft ? `1.5px solid ${color}` : 'none',
                  opacity: ornamentOpacity * 0.5,
                }}
              />
            )
          })}
          {/* The large drop cap letter */}
          <div
            style={{
              fontFamily: "'Georgia', 'Playfair Display', 'Palatino', serif",
              fontSize: 'clamp(80px, 22vw, 260px)',
              fontWeight: 700,
              color,
              lineHeight: 0.85,
              textShadow: `1px 1px 0 rgba(0,0,0,0.06)`,
            }}
          >
            {firstLetter}
          </div>
        </div>

        {/* Rest of the word, flowing beside the drop cap */}
        <div
          style={{
            position: 'absolute',
            top: '32%',
            left: '42%',
            transform: `translateX(${restX}px)`,
            opacity: restOpacity,
            fontFamily: "'Georgia', 'Palatino', serif",
            fontSize: 'clamp(28px, 7vw, 90px)',
            fontWeight: 400,
            fontStyle: 'italic',
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
          }}
        >
          {restOfWord}
        </div>

        {/* Decorative separator below */}
        <div
          style={{
            position: 'absolute',
            bottom: '28%',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            opacity: ornamentOpacity * 0.35,
          }}
        >
          <div style={{ width: 40, height: 0.5, background: color }} />
          <div
            style={{
              width: 6,
              height: 6,
              border: `0.5px solid ${color}`,
              transform: 'rotate(45deg)',
            }}
          />
          <div style={{ width: 40, height: 0.5, background: color }} />
        </div>
      </>
    )
  },
}

function DropCapComponent(props: MotionGraphicProps<DropCapConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-drop-cap',
  title: 'Drop Cap',
  description: 'Illuminated manuscript drop cap with ornate first letter that scales in with a flourish, rest of word flows beside it. Classical book typography.',
  tags: ['kinetic', 'typography', 'drop-cap', 'manuscript', 'editorial', 'print', 'book', 'ornate'],
  category: 'captions',
  component: DropCapComponent as any,
  defaultConfig: {
    words: ['CHAPTER', 'DIVINE', 'ANCIENT', 'PROSE'],
    colors: ['#4A3728', '#4A3728', '#4A3728', '#4A3728'],
    bgColor: '#F5EFE0',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CHAPTER', 'DIVINE', 'ANCIENT', 'PROSE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#4A3728', '#4A3728', '#4A3728', '#4A3728'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F5EFE0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
  ],
})
