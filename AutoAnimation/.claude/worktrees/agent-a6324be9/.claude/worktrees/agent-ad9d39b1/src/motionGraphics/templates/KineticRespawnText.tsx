import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RespawnTextConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Pulsing red vignette — "death screen" feel */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at center, transparent 30%, rgba(180,0,0,${0.12 + Math.sin(time * 3) * 0.05}) 100%)`,
          }}
        />
        {/* Static noise lines */}
        {Array.from({ length: 4 }, (_, i) => {
          const y = ((i * 137 + time * 60) % height)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: y,
                height: 1,
                background: `rgba(255,50,50,${0.06 + Math.sin(time * 8 + i * 3) * 0.03})`,
              }}
            />
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0

    // The word represents each step: "3", "2", "1", "GO!"
    const isGo = word.toUpperCase() === 'GO!' || word.toUpperCase() === 'GO'

    let opacity = 0
    let scale = 1
    let rotation = 0
    let glowIntensity = 0
    let shakeX = 0
    let shakeY = 0

    if (phase === 'enter') {
      if (isGo) {
        // GO! explosive entrance
        const t = enterProgress
        opacity = Math.min(1, t * 4)
        // Massive scale slam
        scale = t < 0.3 ? 3 - (t / 0.3) * 1.5 : 1.5 + Math.sin((t - 0.3) * Math.PI * 4) * 0.1 * (1 - t)
        glowIntensity = t
        shakeX = t < 0.4 ? Math.sin(f * 1.2) * 8 * (1 - t) : 0
        shakeY = t < 0.4 ? Math.cos(f * 1.5) * 6 * (1 - t) : 0
      } else {
        // Countdown number: dramatic slam in
        const t = enterProgress
        opacity = Math.min(1, t * 5)
        // Scale slam from big to normal
        scale = t < 0.25 ? 2.5 - (t / 0.25) * 1 : 1.5 + Math.sin((t - 0.25) * Math.PI * 3) * 0.08 * (1 - t)
        glowIntensity = t * 0.6
        // Slight shake on impact
        shakeX = t < 0.3 ? Math.sin(f * 0.8) * 4 * (1 - t * 2) : 0
        shakeY = t < 0.3 ? Math.cos(f * 1.1) * 3 * (1 - t * 2) : 0
      }
    } else if (phase === 'hold') {
      opacity = 1
      scale = isGo ? 1.5 : 1.5
      glowIntensity = isGo ? 0.8 + Math.sin(f * 0.15) * 0.2 : 0.5 + Math.sin(f * 0.1) * 0.1

      if (isGo) {
        // Pulsing scale on GO
        scale = 1.5 + Math.sin(holdProgress * Math.PI * 4) * 0.08
      } else {
        // Subtle pulse on countdown
        scale = 1.5 + Math.sin(holdProgress * Math.PI * 2) * 0.04
      }
    } else {
      if (isGo) {
        // GO! fades with zoom
        opacity = 1 - exitProgress
        scale = 1.5 + exitProgress * 0.5
        glowIntensity = (1 - exitProgress) * 0.8
      } else {
        // Countdown shrinks away
        opacity = 1 - exitProgress * exitProgress
        scale = 1.5 * (1 - exitProgress * 0.6)
        glowIntensity = (1 - exitProgress) * 0.5
      }
    }

    const mainColor = isGo ? '#00FF88' : color
    const glowColor = isGo ? 'rgba(0,255,136,' : 'rgba(255,60,60,'

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* "RESPAWN IN" subtitle — shown for countdown numbers */}
        {!isGo && (
          <div
            style={{
              position: 'absolute',
              top: '30%',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(12px, 3vw, 22px)',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase',
              letterSpacing: 8,
              opacity: opacity * 0.7,
            }}
          >
            Respawn In
          </div>
        )}

        {/* Radial glow behind number */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${glowColor}${glowIntensity * 0.15}) 0%, transparent 70%)`,
          }}
        />

        {/* Pulsing ring around number */}
        {phase !== 'exit' && (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: `translate(-50%, -50%) scale(${1 + glowIntensity * 0.3})`,
              width: 160,
              height: 160,
              borderRadius: '50%',
              border: `2px solid ${glowColor}${glowIntensity * 0.2})`,
              opacity: opacity * 0.6,
            }}
          />
        )}

        {/* Main countdown / GO text */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: `translate(calc(-50% + ${shakeX}px), calc(-50% + ${shakeY}px)) scale(${scale})`,
            opacity,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: isGo ? 'clamp(60px, 18vw, 220px)' : 'clamp(70px, 20vw, 250px)',
            fontWeight: 900,
            color: mainColor,
            textShadow: isGo
              ? `0 0 30px rgba(0,255,136,${glowIntensity * 0.6}), 0 0 60px rgba(0,255,136,${glowIntensity * 0.3}), 0 4px 0 rgba(0,100,50,0.4)`
              : `0 0 20px ${glowColor}${glowIntensity * 0.5}), 0 0 40px ${glowColor}${glowIntensity * 0.2}), 0 4px 0 rgba(100,0,0,0.4)`,
            letterSpacing: isGo ? 8 : 0,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>

        {/* Impact lines radiating out on enter */}
        {phase === 'enter' && enterProgress < 0.5 && (
          <>
            {Array.from({ length: 8 }, (_, i) => {
              const angle = (i / 8) * Math.PI * 2
              const len = enterProgress * 120
              const x1 = width / 2 + Math.cos(angle) * 60
              const y1 = height / 2 + Math.sin(angle) * 60
              const x2 = width / 2 + Math.cos(angle) * (60 + len)
              const y2 = height / 2 + Math.sin(angle) * (60 + len)
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: Math.min(x1, x2),
                    top: Math.min(y1, y2),
                    width: 2,
                    height: len,
                    background: `rgba(255,255,255,${0.3 * (1 - enterProgress * 2)})`,
                    transform: `rotate(${(angle * 180) / Math.PI + 90}deg)`,
                    transformOrigin: '0 0',
                  }}
                />
              )
            })}
          </>
        )}
      </div>
    )
  },
}

function RespawnTextComponent(props: MotionGraphicProps<RespawnTextConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-respawn-text',
  title: 'Kinetic Respawn Text',
  description:
    'Dramatic respawn countdown with slamming numbers, pulsing red vignette, impact lines, and explosive green GO! finish',
  tags: ['kinetic', 'typography', 'respawn', 'countdown', 'game', 'fps', 'dramatic', 'death'],
  category: 'captions',
  component: RespawnTextComponent as any,
  defaultConfig: {
    words: ['3', '2', '1', 'GO!'],
    colors: ['#FF4444', '#FF6644', '#FF8844', '#00FF88'],
    bgColor: '#0a0808',
    cycleDuration: 1.2,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Countdown Steps',
      type: 'text-array',
      defaultValue: ['3', '2', '1', 'GO!'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Step Colors',
      type: 'text-array',
      defaultValue: ['#FF4444', '#FF6644', '#FF8844', '#00FF88'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0808', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.2,
      min: 0.5,
      max: 4,
      group: 'Timing',
    },
  ],
})
