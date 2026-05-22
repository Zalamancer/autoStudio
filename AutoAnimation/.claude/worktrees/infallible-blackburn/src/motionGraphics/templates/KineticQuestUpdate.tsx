import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface QuestUpdateConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Compass / map marker ambient glow */}
        <div
          style={{
            position: 'absolute',
            right: '10%',
            top: '15%',
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,200,50,0.06) 0%, transparent 70%)',
            transform: `scale(${1 + Math.sin(time * 1.5) * 0.1})`,
          }}
        />
        {/* Subtle horizontal rule lines like parchment/map */}
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: '5%',
              right: '5%',
              top: `${20 + i * 15}%`,
              height: 1,
              background: `rgba(255,255,255,${0.02 + (i === 2 ? 0.01 : 0)})`,
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0

    // Notification banner position
    const bannerWidth = width * 0.75
    const bannerX = (width - bannerWidth) / 2

    let opacity = 0
    let bannerY = -60
    let iconPulse = 1
    let textReveal = 0

    if (phase === 'enter') {
      // Slide down + fade in
      const eased = enterProgress * enterProgress * (3 - 2 * enterProgress) // smoothstep
      opacity = Math.min(1, enterProgress * 2.5)
      bannerY = -60 + eased * 100
      textReveal = Math.max(0, (enterProgress - 0.3) / 0.7)
      iconPulse = 1 + Math.sin(enterProgress * Math.PI * 3) * 0.15
    } else if (phase === 'hold') {
      opacity = 1
      bannerY = 40
      textReveal = 1
      iconPulse = 1 + Math.sin(f * 0.08) * 0.05
    } else {
      opacity = 1 - exitProgress * exitProgress
      bannerY = 40 - exitProgress * 50
      textReveal = 1
    }

    // Quest objective text
    const objectiveText = word
    const revealLength = Math.floor(textReveal * objectiveText.length)
    const revealedObjective = objectiveText.substring(0, revealLength)

    return (
      <div style={{ position: 'absolute', inset: 0, opacity }}>
        {/* Quest Updated header with decorative lines */}
        <div
          style={{
            position: 'absolute',
            left: bannerX,
            top: bannerY,
            width: bannerWidth,
          }}
        >
          {/* Decorative horizontal line with diamond */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,200,50,0.4))' }} />
            <div
              style={{
                width: 8,
                height: 8,
                transform: 'rotate(45deg)',
                background: '#FFD700',
                boxShadow: '0 0 8px rgba(255,215,0,0.5)',
              }}
            />
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(255,200,50,0.4), transparent)' }} />
          </div>

          {/* "QUEST UPDATED" title text */}
          <div
            style={{
              textAlign: 'center',
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: 'clamp(12px, 3vw, 20px)',
              fontWeight: 700,
              color: '#FFD700',
              textTransform: 'uppercase',
              letterSpacing: 6,
              textShadow: '0 0 10px rgba(255,215,0,0.3)',
              marginBottom: 16,
            }}
          >
            Quest Updated
          </div>

          {/* Objective card */}
          <div
            style={{
              background: 'rgba(20,20,30,0.8)',
              border: '1px solid rgba(255,200,50,0.2)',
              borderRadius: 6,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14,
            }}
          >
            {/* Map marker icon */}
            <div
              style={{
                flexShrink: 0,
                width: 32,
                height: 40,
                position: 'relative',
                transform: `scale(${iconPulse})`,
              }}
            >
              {/* Pin head */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 24,
                  height: 24,
                  borderRadius: '50% 50% 50% 0',
                  transform: 'translateX(-50%) rotate(-45deg)',
                  background: 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)',
                  boxShadow: '0 0 12px rgba(255,215,0,0.4)',
                }}
              />
              {/* Pin dot */}
              <div
                style={{
                  position: 'absolute',
                  top: 6,
                  left: '50%',
                  transform: 'translateX(-50%) rotate(-45deg)',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#1a1a2e',
                }}
              />
            </div>

            {/* Objective text */}
            <div style={{ flex: 1 }}>
              {/* Checkbox-style marker */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 14,
                    height: 14,
                    border: '2px solid rgba(255,200,50,0.5)',
                    borderRadius: 2,
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif",
                    fontSize: 'clamp(14px, 4vw, 26px)',
                    fontWeight: 500,
                    color,
                    lineHeight: 1.4,
                    letterSpacing: 0.5,
                  }}
                >
                  {revealedObjective}
                  {textReveal < 1 && (
                    <span style={{ opacity: 0.5 }}>|</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom decorative line */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,200,50,0.2))' }} />
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(255,200,50,0.2), transparent)' }} />
          </div>
        </div>
      </div>
    )
  },
}

function QuestUpdateComponent(props: MotionGraphicProps<QuestUpdateConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-quest-update',
  title: 'Kinetic Quest Update',
  description:
    'RPG quest notification with golden header text, map marker icon, objective reveal with typewriter effect, and decorative parchment lines',
  tags: ['kinetic', 'typography', 'quest', 'rpg', 'game', 'notification', 'objective', 'map'],
  category: 'captions',
  component: QuestUpdateComponent as any,
  defaultConfig: {
    words: ['Find the ancient sword', 'Defeat the dragon', 'Return to the village', 'Speak with the elder'],
    colors: ['#e0d8c8', '#d0c8b8', '#e0d8c8', '#d0c8b8'],
    bgColor: '#0c0c18',
    cycleDuration: 2.2,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Quest Objectives',
      type: 'text-array',
      defaultValue: ['Find the ancient sword', 'Defeat the dragon', 'Return to the village'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Text Colors',
      type: 'text-array',
      defaultValue: ['#e0d8c8', '#d0c8b8', '#e0d8c8'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c0c18', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.2,
      min: 1,
      max: 6,
      group: 'Timing',
    },
  ],
})
