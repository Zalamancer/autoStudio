import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PostItNoteConfig extends KineticBaseConfig {}

const noteColors = ['#FFEB3B', '#FF9800', '#4FC3F7', '#AED581', '#F48FB1']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    >
      {/* Cork board texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: [
            'radial-gradient(circle at 15% 25%, rgba(160,120,60,0.08) 0%, transparent 8%)',
            'radial-gradient(circle at 55% 45%, rgba(140,100,50,0.06) 0%, transparent 12%)',
            'radial-gradient(circle at 75% 15%, rgba(180,140,70,0.07) 0%, transparent 6%)',
            'radial-gradient(circle at 35% 75%, rgba(150,110,55,0.05) 0%, transparent 10%)',
            'radial-gradient(circle at 85% 65%, rgba(170,130,65,0.06) 0%, transparent 9%)',
          ].join(', '),
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 47 + 19
    const noteColor = noteColors[index % noteColors.length]
    const baseRotation = Math.sin(seed * 1.3) * 4 // slight tilt per note

    if (phase === 'enter') {
      // Note flies in from top and sticks with bounce
      const easeOut = 1 - Math.pow(1 - enterProgress, 3)
      const bounce = enterProgress < 0.7
        ? easeOut
        : 1 + Math.sin((enterProgress - 0.7) / 0.3 * Math.PI * 2) * 0.04 * (1 - enterProgress)
      const yOffset = (1 - easeOut) * -300
      const rotationEntry = baseRotation + (1 - easeOut) * 15
      const scale = 0.8 + easeOut * 0.2

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${yOffset}px)) rotate(${rotationEntry}deg) scale(${scale * bounce})`,
            opacity: Math.min(1, enterProgress * 3),
          }}
        >
          {/* Post-it note */}
          <div
            style={{
              position: 'relative',
              background: noteColor,
              padding: 'clamp(16px, 4vw, 40px) clamp(24px, 6vw, 60px)',
              boxShadow: `3px 5px 12px rgba(0,0,0,0.2), inset 0 -2px 4px rgba(0,0,0,0.05)`,
            }}
          >
            {/* Tape strip at top */}
            <div
              style={{
                position: 'absolute',
                top: -8,
                left: '50%',
                transform: 'translateX(-50%) rotate(-2deg)',
                width: 60,
                height: 18,
                background: 'rgba(255,255,255,0.5)',
                borderRadius: 1,
              }}
            />
            <div
              style={{
                fontFamily: "'Segoe Print', 'Comic Sans MS', 'Permanent Marker', cursive",
                fontSize: 'clamp(32px, 8vw, 100px)',
                fontWeight: 700,
                color,
                whiteSpace: 'nowrap',
                textAlign: 'center',
              }}
            >
              {word}
            </div>
          </div>
        </div>
      )
    }

    if (phase === 'hold') {
      // Subtle curl shadow effect
      const curlAmount = Math.sin(holdProgress * Math.PI * 2 + seed) * 2
      const shadowSpread = 12 + Math.sin(holdProgress * Math.PI * 3) * 3

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) rotate(${baseRotation + curlAmount * 0.3}deg)`,
          }}
        >
          <div
            style={{
              position: 'relative',
              background: noteColor,
              padding: 'clamp(16px, 4vw, 40px) clamp(24px, 6vw, 60px)',
              boxShadow: `3px 5px ${shadowSpread}px rgba(0,0,0,0.2), inset 0 -2px 4px rgba(0,0,0,0.05)`,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -8,
                left: '50%',
                transform: 'translateX(-50%) rotate(-2deg)',
                width: 60,
                height: 18,
                background: 'rgba(255,255,255,0.5)',
                borderRadius: 1,
              }}
            />
            {/* Bottom curl effect */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 30,
                height: 30,
                background: `linear-gradient(135deg, ${noteColor} 50%, rgba(0,0,0,0.08) 50%)`,
                transform: `scaleY(${0.3 + Math.abs(Math.sin(holdProgress * Math.PI * 2)) * 0.3})`,
                transformOrigin: 'bottom right',
              }}
            />
            <div
              style={{
                fontFamily: "'Segoe Print', 'Comic Sans MS', 'Permanent Marker', cursive",
                fontSize: 'clamp(32px, 8vw, 100px)',
                fontWeight: 700,
                color,
                whiteSpace: 'nowrap',
                textAlign: 'center',
              }}
            >
              {word}
            </div>
          </div>
        </div>
      )
    }

    // Exit: peels away with rotation
    const peelRotation = baseRotation + exitProgress * 25
    const peelX = exitProgress * 200
    const peelY = exitProgress * exitProgress * 150

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${peelX}px), calc(-50% + ${peelY}px)) rotate(${peelRotation}deg)`,
          opacity: 1 - exitProgress,
        }}
      >
        <div
          style={{
            position: 'relative',
            background: noteColor,
            padding: 'clamp(16px, 4vw, 40px) clamp(24px, 6vw, 60px)',
            boxShadow: `3px 5px 12px rgba(0,0,0,0.2)`,
          }}
        >
          <div
            style={{
              fontFamily: "'Segoe Print', 'Comic Sans MS', 'Permanent Marker', cursive",
              fontSize: 'clamp(32px, 8vw, 100px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              textAlign: 'center',
            }}
          >
            {word}
          </div>
        </div>
      </div>
    )
  },
}

function PostItNoteComponent(props: MotionGraphicProps<PostItNoteConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-post-it-note',
  title: 'Kinetic Post-It Note',
  description: 'Post-it note sticks onto screen with bounce, slight rotation, curl shadow, and peel-away exit',
  tags: ['kinetic', 'typography', 'postit', 'note', 'sticky', 'paper', 'organic', 'office'],
  category: 'captions',
  component: PostItNoteComponent as any,
  defaultConfig: {
    words: ['IDEA', 'NOTE', 'MEMO', 'TODO'],
    colors: ['#333333', '#2C3E50', '#1B2631', '#4A235A'],
    bgColor: '#C4A882',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['IDEA', 'NOTE', 'MEMO', 'TODO'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#333333', '#2C3E50', '#1B2631', '#4A235A'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#C4A882', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
