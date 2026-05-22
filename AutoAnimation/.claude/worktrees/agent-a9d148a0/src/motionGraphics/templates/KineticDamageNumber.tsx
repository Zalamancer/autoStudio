import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DamageNumberConfig extends KineticBaseConfig {
  critChance: number
}

function pseudoRandom(seed: number): number {
  return Math.abs(Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Subtle dark gradient with game-like atmosphere */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 70%, rgba(60,20,20,0.4) 0%, transparent 60%)',
          }}
        />
        {/* Impact flash ring at bottom center */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '65%',
            transform: 'translate(-50%, -50%)',
            width: 80 + Math.sin(time * 4) * 10,
            height: 30,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(255,100,50,0.15) 0%, transparent 70%)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const isCrit = pseudoRandom(index * 31 + 7) > 0.5

    // Damage number: the word itself is the number
    const damageText = word
    const critColor = '#FFD700'
    const normalColor = color
    const activeColor = isCrit ? critColor : normalColor

    // Position: starts at impact point, floats upward
    let opacity = 0
    let scale = 1
    let translateY = 0
    let translateX = 0
    let rotation = 0

    // Lateral offset for variety
    const xOffset = (pseudoRandom(index * 53) - 0.5) * width * 0.15

    if (phase === 'enter') {
      // Pop in with overshoot scale
      const t = enterProgress
      opacity = Math.min(1, t * 5)
      // Elastic overshoot
      const overshoot = t < 0.5 ? t * 2 : 1 + Math.sin((t - 0.5) * Math.PI * 4) * (1 - t) * 0.3
      scale = isCrit ? 0.2 + overshoot * 1.6 : 0.3 + overshoot * 1.0
      translateY = t * -30
      translateX = xOffset * t
      rotation = isCrit ? Math.sin(t * Math.PI * 6) * 5 * (1 - t) : 0
    } else if (phase === 'hold') {
      opacity = 1
      scale = isCrit ? 1.8 : 1.3
      // Gentle float upward
      translateY = -30 - holdProgress * 60
      translateX = xOffset + Math.sin(holdProgress * Math.PI * 2) * 5
      rotation = isCrit ? Math.sin(f * 0.1) * 2 : 0
    } else {
      // Float up and fade
      opacity = 1 - exitProgress
      scale = (isCrit ? 1.8 : 1.3) * (1 - exitProgress * 0.3)
      translateY = -90 - exitProgress * 80
      translateX = xOffset + Math.sin(exitProgress * Math.PI) * 10
    }

    const fontSize = isCrit ? 'clamp(50px, 16vw, 200px)' : 'clamp(36px, 10vw, 130px)'

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Impact sparks on enter */}
        {phase === 'enter' && enterProgress < 0.4 && (
          <>
            {Array.from({ length: 6 }, (_, i) => {
              const angle = (i / 6) * Math.PI * 2 + index
              const dist = enterProgress * 80
              const sparkX = width / 2 + Math.cos(angle) * dist
              const sparkY = height * 0.6 + Math.sin(angle) * dist * 0.5
              const sparkAlpha = 1 - enterProgress * 2.5
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: sparkX,
                    top: sparkY,
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: `rgba(255,200,50,${Math.max(0, sparkAlpha)})`,
                    boxShadow: `0 0 6px rgba(255,150,50,${Math.max(0, sparkAlpha)})`,
                  }}
                />
              )
            })}
          </>
        )}

        {/* Main damage number */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '55%',
            transform: `translate(-50%, -50%) translate(${translateX}px, ${translateY}px) scale(${scale}) rotate(${rotation}deg)`,
            opacity,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize,
            fontWeight: 900,
            color: activeColor,
            textShadow: isCrit
              ? '0 0 20px rgba(255,215,0,0.6), 0 0 40px rgba(255,150,0,0.3), 2px 2px 0 #8B4513'
              : `0 0 10px ${color}40, 2px 2px 0 rgba(0,0,0,0.5)`,
            whiteSpace: 'nowrap',
            letterSpacing: isCrit ? 4 : 2,
            WebkitTextStroke: isCrit ? '2px #FF8C00' : 'none',
          }}
        >
          {isCrit && (
            <div
              style={{
                position: 'absolute',
                top: -20,
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: 'clamp(10px, 3vw, 22px)',
                color: '#FF4444',
                fontFamily: "'Arial Black', sans-serif",
                fontWeight: 900,
                letterSpacing: 3,
                textShadow: '0 0 8px rgba(255,50,50,0.6)',
              }}
            >
              CRITICAL!
            </div>
          )}
          {damageText}
        </div>
      </div>
    )
  },
}

function DamageNumberComponent(props: MotionGraphicProps<DamageNumberConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-damage-number',
  title: 'Kinetic Damage Number',
  description:
    'Floating damage numbers popping up with critical hit styling, impact sparks, and upward float-fade like RPG/action game combat',
  tags: ['kinetic', 'typography', 'damage', 'rpg', 'game', 'combat', 'critical', 'hit', 'number'],
  category: 'captions',
  component: DamageNumberComponent as any,
  defaultConfig: {
    words: ['9999', '1337', '2048', '5000'],
    colors: ['#FF4444', '#FF6644', '#FF4444', '#FF8844'],
    bgColor: '#0a0a14',
    cycleDuration: 1.4,
    critChance: 50,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Damage Numbers',
      type: 'text-array',
      defaultValue: ['9999', '1337', '2048', '5000'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Normal Hit Colors',
      type: 'text-array',
      defaultValue: ['#FF4444', '#FF6644', '#FF4444', '#FF8844'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.4,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'critChance',
      label: 'Crit Chance (%)',
      type: 'number',
      defaultValue: 50,
      min: 0,
      max: 100,
      group: 'Animation',
    },
  ],
})
