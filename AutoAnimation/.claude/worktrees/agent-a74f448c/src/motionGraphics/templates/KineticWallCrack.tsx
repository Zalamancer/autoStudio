import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WallCrackConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 from integer seed */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(160deg, ${bgColor}, #6b6560, ${bgColor})`,
      }}
    >
      {/* Concrete surface texture — fine horizontal lines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.02) 3px, rgba(0,0,0,0.02) 4px)',
        }}
      />
      {/* Aggregate speckle */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle 1px at 20% 30%, rgba(0,0,0,0.05) 0%, transparent 100%), radial-gradient(circle 1px at 60% 70%, rgba(255,255,255,0.03) 0%, transparent 100%), radial-gradient(circle 1px at 80% 20%, rgba(0,0,0,0.04) 0%, transparent 100%)',
        }}
      />
      {/* Formwork seam line */}
      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: 0,
          right: 0,
          height: 2,
          background: 'rgba(0,0,0,0.06)',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index, width, height }: WordRenderProps) => {
    const seed = index * 59 + 41

    // Fracture propagation — cracks spread outward from center during enter
    let crackProgress = 0
    let textReveal = 0
    let shakeIntensity = 0
    let opacity = 1

    if (phase === 'enter') {
      crackProgress = Math.min(1, enterProgress * 1.5)
      textReveal = enterProgress < 0.4 ? 0 : Math.min(1, (enterProgress - 0.4) / 0.6)
      shakeIntensity = enterProgress < 0.3 ? enterProgress * 8 : (1 - enterProgress) * 2
    } else if (phase === 'hold') {
      crackProgress = 1
      textReveal = 1
      shakeIntensity = Math.sin(holdProgress * Math.PI * 6) * 0.3
    } else {
      crackProgress = 1
      textReveal = 1 - exitProgress
      opacity = 1 - exitProgress * 0.6
      shakeIntensity = 0
    }

    const shakeX = shakeIntensity * (rand(seed + 999) - 0.5) * 2
    const shakeY = shakeIntensity * (rand(seed + 998) - 0.5) * 2

    // Generate fracture lines radiating from center
    const crackCount = 12
    const cracks = Array.from({ length: crackCount }, (_, i) => {
      const cs = seed + i * 31
      const angle = (i / crackCount) * 360 + (rand(cs) - 0.5) * 30
      const length = 60 + rand(cs + 1) * 140
      const thickness = 1 + rand(cs + 2) * 2
      const crackDelay = (i / crackCount) * 0.6
      const currentCrack = Math.max(0, Math.min(1, (crackProgress - crackDelay) / (1 - crackDelay)))

      // Secondary branching cracks
      const hasBranch = rand(cs + 3) > 0.5
      const branchAngle = angle + (rand(cs + 4) > 0.5 ? 30 : -30) + rand(cs + 5) * 20
      const branchLen = length * 0.4 * rand(cs + 6)

      return (
        <div key={i}>
          {/* Main crack */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: length * currentCrack,
              height: thickness,
              background: `linear-gradient(90deg, rgba(30,28,25,0.8), rgba(30,28,25,0.4), transparent)`,
              transform: `rotate(${angle}deg)`,
              transformOrigin: '0 50%',
              boxShadow: '0 0 2px rgba(0,0,0,0.3)',
            }}
          />
          {/* Branch crack */}
          {hasBranch && currentCrack > 0.5 && (
            <div
              style={{
                position: 'absolute',
                left: `calc(50% + ${Math.cos((angle * Math.PI) / 180) * length * 0.5}px)`,
                top: `calc(50% + ${Math.sin((angle * Math.PI) / 180) * length * 0.5}px)`,
                width: branchLen * (currentCrack - 0.5) * 2,
                height: thickness * 0.7,
                background: 'linear-gradient(90deg, rgba(30,28,25,0.5), transparent)',
                transform: `rotate(${branchAngle}deg)`,
                transformOrigin: '0 50%',
              }}
            />
          )}
        </div>
      )
    })

    // Stress lines — subtle spider web around text
    const stressLines = Array.from({ length: 6 }, (_, i) => {
      const ss = seed + i * 47 + 300
      const x = 30 + rand(ss) * 40
      const y = 35 + rand(ss + 1) * 30
      const len = 20 + rand(ss + 2) * 40
      const angle = rand(ss + 3) * 360

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            width: len * crackProgress,
            height: 0.5,
            background: 'rgba(0,0,0,0.1)',
            transform: `rotate(${angle}deg)`,
            transformOrigin: '0 50%',
          }}
        />
      )
    })

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity,
          transform: `translate(${shakeX}px, ${shakeY}px)`,
        }}
      >
        {/* Stress lines */}
        {stressLines}

        {/* Fracture cracks */}
        {cracks}

        {/* Concrete dust / debris around cracks */}
        {crackProgress > 0.3 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 200 * crackProgress,
              height: 100 * crackProgress,
              background: 'radial-gradient(ellipse, rgba(180,170,160,0.15) 0%, transparent 70%)',
              filter: 'blur(4px)',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Main text — appears as if cracked INTO the wall */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(46px, 13vw, 170px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 6,
            color,
            whiteSpace: 'nowrap',
            opacity: textReveal,
            // Inset shadow to look carved/cracked into wall
            textShadow: `1px 1px 0 rgba(0,0,0,0.6), -1px -1px 0 rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.4)`,
            filter: `contrast(${1 + (1 - textReveal) * 0.5})`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function WallCrackComponent(props: MotionGraphicProps<WallCrackConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-wall-crack',
  title: 'Kinetic Wall Crack',
  description: 'Cracked concrete wall text — fractures spread outward from text, branching crack patterns, structural stress lines, brutalist urban aesthetic',
  tags: ['kinetic', 'typography', 'crack', 'concrete', 'brutalist', 'urban', 'destruction', 'wall', 'fracture'],
  category: 'captions',
  component: WallCrackComponent as any,
  defaultConfig: {
    words: ['BREAK', 'CRACK', 'FORCE', 'RUIN'],
    colors: ['#2a2520', '#1a1815', '#2a2520', '#1a1815'],
    bgColor: '#8a8580',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BREAK', 'CRACK', 'FORCE', 'RUIN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#2a2520', '#1a1815', '#2a2520', '#1a1815'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#8a8580', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
