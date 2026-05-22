import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PaperFoldConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    >
      {/* Origami paper fold lines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: [
            'linear-gradient(45deg, transparent 49%, rgba(0,0,0,0.03) 50%, transparent 51%)',
            'linear-gradient(-45deg, transparent 49%, rgba(0,0,0,0.02) 50%, transparent 51%)',
          ].join(', '),
          backgroundSize: '80px 80px',
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 79 + 43

    if (phase === 'enter') {
      // Origami unfold: text appears as if paper is being folded out
      // Simulate with perspective scaleY flip from 0 to 1 (fold around horizontal axis)
      const unfoldProgress = enterProgress
      const perspective = 600
      const rotX = (1 - unfoldProgress) * 90  // 90° flat → 0° facing forward
      const opacity = Math.min(1, enterProgress * 2.5)

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%)`,
            opacity,
            perspective,
          }}
        >
          <div
            style={{
              transform: `rotateX(${rotX}deg)`,
              transformOrigin: '50% 100%',
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: 'clamp(44px, 13vw, 170px)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 6,
              color,
              textShadow: [
                `0 4px 8px rgba(0,0,0,0.2)`,
                `0 1px 0 rgba(255,255,255,0.4)`,
              ].join(', '),
              whiteSpace: 'nowrap',
            }}
          >
            {word}
          </div>
        </div>
      )
    }

    if (phase === 'hold') {
      // Resting flat, slight paper bob
      const bobY = Math.sin(holdProgress * Math.PI * 3 + seed) * 2.5
      const bobRot = Math.sin(holdProgress * Math.PI * 2 + seed * 0.5) * 0.8

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${bobY}px)) rotate(${bobRot}deg)`,
            opacity: 1,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(44px, 13vw, 170px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 6,
            color,
            textShadow: [
              `0 4px 8px rgba(0,0,0,0.2)`,
              `0 1px 0 rgba(255,255,255,0.4)`,
            ].join(', '),
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      )
    }

    // Exit: fold back away — flip over vertical axis
    const foldProgress = exitProgress
    const perspective = 600
    const rotY = foldProgress * 90  // fold shut around vertical axis
    const opacity = 1 - exitProgress

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%)`,
          opacity,
          perspective,
        }}
      >
        <div
          style={{
            transform: `rotateY(${rotY}deg)`,
            transformOrigin: '0% 50%',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(44px, 13vw, 170px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 6,
            color,
            textShadow: [
              `0 4px 8px rgba(0,0,0,0.2)`,
              `0 1px 0 rgba(255,255,255,0.4)`,
            ].join(', '),
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function PaperFoldComponent(props: MotionGraphicProps<PaperFoldConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-paper-fold',
  title: 'Kinetic Paper Fold',
  description: 'Text unfolds from paper with a CSS 3D rotateX perspective flip like origami opening',
  tags: ['kinetic', 'typography', 'paper', 'fold', 'origami', '3d', 'perspective', 'craft'],
  category: 'captions',
  component: PaperFoldComponent as any,
  defaultConfig: {
    words: ['FOLD', 'OPEN', 'REVEAL', 'UNFOLD'],
    colors: ['#2C3E50', '#E74C3C', '#16A085', '#8E44AD'],
    bgColor: '#ECF0F1',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FOLD', 'OPEN', 'REVEAL', 'UNFOLD'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#2C3E50', '#E74C3C', '#16A085', '#8E44AD'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#ECF0F1', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
