import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface QuestLogConfig {
  title: string
  questName: string
  objectives: string[]
  completedCount: number
  reward: string
  bgColor: string
  panelColor: string
  accentColor: string
  completeColor: string
  textColor: string
  frameColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function SceneQuestLogComponent({ config, frame, fps, progress }: MotionGraphicProps<QuestLogConfig>) {
  const { title, questName, objectives, completedCount, reward, bgColor, panelColor, accentColor, completeColor, textColor, frameColor } = config
  const time = frame / fps

  const enterProgress = progress < 0.12 ? progress / 0.12 : 1
  const exitProgress = progress > 0.88 ? (progress - 0.88) / 0.12 : 0
  const mainOpacity = easeOutCubic(enterProgress) * (1 - easeOutCubic(exitProgress))

  // Objectives check-off animation
  // Each objective gets checked at staggered progress points
  const getObjectiveChecked = (idx: number): boolean => {
    if (idx >= completedCount) return false
    const checkTime = 0.2 + (idx / objectives.length) * 0.5
    return progress > checkTime
  }

  // Checkbox animation progress for recently checked
  const getCheckProgress = (idx: number): number => {
    if (idx >= completedCount) return 0
    const checkTime = 0.2 + (idx / objectives.length) * 0.5
    if (progress <= checkTime) return 0
    return Math.min(1, (progress - checkTime) / 0.08)
  }

  // Progress fraction
  const checkedNow = objectives.filter((_, i) => getObjectiveChecked(i)).length
  const progressFraction = checkedNow / objectives.length

  // New objective flash
  const recentlyCheckedIdx = objectives.findIndex((_, i) => {
    const cp = getCheckProgress(i)
    return cp > 0 && cp < 1
  })

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: "'Courier New', 'Lucida Console', monospace",
        opacity: mainOpacity,
      }}
    >
      {/* CRT lines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />

      {/* Quest log panel */}
      <div
        style={{
          width: 'clamp(260px, 65vw, 480px)',
          background: panelColor,
          border: `3px solid ${frameColor}`,
          position: 'relative',
          imageRendering: 'pixelated' as any,
          transform: `scale(${0.92 + easeOutCubic(enterProgress) * 0.08})`,
        }}
      >
        {/* Title bar */}
        <div
          style={{
            background: `${frameColor}30`,
            padding: 'clamp(6px, 1.2vw, 12px) clamp(10px, 2vw, 18px)',
            borderBottom: `2px solid ${frameColor}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(6px, 1vw, 10px)',
            }}
          >
            {/* Quest scroll icon pixel art */}
            <div
              style={{
                width: 12,
                height: 16,
                background: accentColor,
                borderRadius: '2px 2px 0 0',
                position: 'relative',
                opacity: 0.7,
              }}
            >
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: `${accentColor}80` }} />
            </div>
            <div
              style={{
                fontSize: 'clamp(13px, 2.5vw, 20px)',
                fontWeight: 700,
                color: accentColor,
                textTransform: 'uppercase',
                letterSpacing: 3,
              }}
            >
              {title}
            </div>
          </div>
          {/* Progress counter */}
          <div
            style={{
              fontSize: 'clamp(10px, 1.8vw, 14px)',
              color: `${textColor}88`,
              fontWeight: 700,
            }}
          >
            {`${checkedNow}/${objectives.length}`}
          </div>
        </div>

        {/* Quest name */}
        <div
          style={{
            padding: 'clamp(8px, 1.5vw, 14px) clamp(10px, 2vw, 18px)',
            borderBottom: `1px solid ${frameColor}20`,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(9px, 1.5vw, 12px)',
              color: `${textColor}60`,
              textTransform: 'uppercase',
              letterSpacing: 2,
              marginBottom: 4,
            }}
          >
            {'ACTIVE QUEST'}
          </div>
          <div
            style={{
              fontSize: 'clamp(16px, 3.2vw, 26px)',
              fontWeight: 700,
              color: textColor,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            {questName}
          </div>
        </div>

        {/* Objectives list */}
        <div
          style={{
            padding: 'clamp(8px, 1.5vw, 14px) clamp(10px, 2vw, 18px)',
          }}
        >
          <div
            style={{
              fontSize: 'clamp(9px, 1.5vw, 12px)',
              color: accentColor,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 2,
              marginBottom: 'clamp(6px, 1vw, 10px)',
            }}
          >
            {'OBJECTIVES'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(4px, 0.8vw, 8px)' }}>
            {objectives.map((obj, i) => {
              const isChecked = getObjectiveChecked(i)
              const checkAnim = getCheckProgress(i)
              const isRecent = i === recentlyCheckedIdx
              const itemDelay = 0.1 + i * 0.04
              const itemVisible = progress > itemDelay ? Math.min(1, (progress - itemDelay) / 0.08) : 0

              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'clamp(6px, 1.2vw, 10px)',
                    opacity: easeOutCubic(itemVisible),
                    transform: `translateX(${(1 - easeOutCubic(itemVisible)) * 20}px)`,
                    padding: 'clamp(3px, 0.5vw, 5px) 0',
                    background: isRecent && checkAnim < 1 ? `${completeColor}10` : 'transparent',
                  }}
                >
                  {/* Checkbox */}
                  <div
                    style={{
                      width: 'clamp(14px, 2.5vw, 20px)',
                      height: 'clamp(14px, 2.5vw, 20px)',
                      border: `2px solid ${isChecked ? completeColor : frameColor}`,
                      background: isChecked ? `${completeColor}20` : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      imageRendering: 'pixelated' as any,
                      boxShadow: isRecent && checkAnim < 1 ? `0 0 6px ${completeColor}60` : 'none',
                    }}
                  >
                    {isChecked && (
                      <div
                        style={{
                          fontSize: 'clamp(10px, 1.8vw, 14px)',
                          fontWeight: 700,
                          color: completeColor,
                          transform: `scale(${easeOutCubic(checkAnim)})`,
                          lineHeight: 1,
                        }}
                      >
                        {'\u{2713}'}
                      </div>
                    )}
                  </div>

                  {/* Objective text */}
                  <div
                    style={{
                      fontSize: 'clamp(11px, 2vw, 16px)',
                      color: isChecked ? `${textColor}50` : textColor,
                      textDecoration: isChecked ? 'line-through' : 'none',
                      letterSpacing: 0.5,
                    }}
                  >
                    {obj}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Progress bar */}
        <div
          style={{
            padding: '0 clamp(10px, 2vw, 18px) clamp(4px, 0.8vw, 6px)',
          }}
        >
          <div
            style={{
              width: '100%',
              height: 'clamp(6px, 1vw, 10px)',
              background: `${frameColor}20`,
              border: `1px solid ${frameColor}30`,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progressFraction * 100}%`,
                height: '100%',
                background: completeColor,
                backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(0,0,0,0.15) 4px, rgba(0,0,0,0.15) 6px)`,
              }}
            />
          </div>
        </div>

        {/* Reward section */}
        <div
          style={{
            padding: 'clamp(6px, 1.2vw, 10px) clamp(10px, 2vw, 18px)',
            borderTop: `1px solid ${frameColor}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              fontSize: 'clamp(9px, 1.5vw, 12px)',
              color: `${textColor}60`,
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}
          >
            {'REWARD:'}
          </div>
          <div
            style={{
              fontSize: 'clamp(10px, 1.8vw, 14px)',
              fontWeight: 700,
              color: '#FFD700',
              letterSpacing: 1,
              opacity: Math.floor(time * 2) % 3 === 0 ? 1 : 0.7,
            }}
          >
            {reward}
          </div>
        </div>

        {/* Corner brackets */}
        {[0, 1, 2, 3].map((c) => (
          <div
            key={c}
            style={{
              position: 'absolute',
              [c < 2 ? 'top' : 'bottom']: -3,
              [c % 2 === 0 ? 'left' : 'right']: -3,
              width: 8,
              height: 8,
              background: frameColor,
              imageRendering: 'pixelated' as any,
            }}
          />
        ))}
      </div>

      {/* Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.4) 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-quest-log',
  title: 'Scene Quest Log',
  description: 'RPG quest tracker with animated checkbox completion, progress bar, reward display, and pixel art styling',
  tags: ['scene', 'quest', 'log', 'RPG', 'retro', 'gaming', 'pixel', 'objectives', 'checklist'],
  category: 'scene-layout',
  component: SceneQuestLogComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    title: 'QUEST LOG',
    questName: 'THE LOST CRYSTALS',
    objectives: ['Find the Forest Crystal', 'Defeat the Cave Guardian', 'Collect 10 Moon Shards', 'Return to the Elder'],
    completedCount: 3,
    reward: '500 GOLD + MAGIC SWORD',
    bgColor: '#0a0a14',
    panelColor: '#0d0d1e',
    accentColor: '#FFD700',
    completeColor: '#00CC00',
    textColor: '#CCCCCC',
    frameColor: '#555555',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'QUEST LOG', group: 'Content' },
    { key: 'questName', label: 'Quest Name', type: 'text', defaultValue: 'THE LOST CRYSTALS', group: 'Content' },
    { key: 'objectives', label: 'Objectives', type: 'text-array', defaultValue: ['Find the Forest Crystal', 'Defeat the Cave Guardian', 'Collect 10 Moon Shards', 'Return to the Elder'], group: 'Content' },
    { key: 'completedCount', label: 'Completed', type: 'number', defaultValue: 3, min: 0, max: 10, group: 'Content' },
    { key: 'reward', label: 'Reward', type: 'text', defaultValue: '500 GOLD + MAGIC SWORD', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
    { key: 'panelColor', label: 'Panel', type: 'color', defaultValue: '#0d0d1e', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#FFD700', group: 'Style' },
    { key: 'completeColor', label: 'Complete', type: 'color', defaultValue: '#00CC00', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#CCCCCC', group: 'Style' },
    { key: 'frameColor', label: 'Frame', type: 'color', defaultValue: '#555555', group: 'Style' },
  ],
})
