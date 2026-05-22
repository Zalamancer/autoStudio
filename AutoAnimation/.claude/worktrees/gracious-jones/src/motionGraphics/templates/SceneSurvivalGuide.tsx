import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneSurvivalGuideConfig {
  ruleNumber: number
  ruleTitle: string
  ruleDescription: string
  scenario: string
  importance: string
  bgColor: string
  textColor: string
  accentColor: string
  dangerColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneSurvivalGuideComponent({ config, progress, frame }: MotionGraphicProps<SceneSurvivalGuideConfig>) {
  const { ruleNumber, ruleTitle, ruleDescription, scenario, importance, bgColor, textColor, accentColor, dangerColor } = config
  const f = frame ?? 0

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Warning flash on enter
  const warningFlash = enterProgress > 0.1 && enterProgress < 0.2 ? 0.08 : 0

  // Heartbeat pulse for danger
  const heartbeat = Math.sin(f * 0.12) > 0.8 ? 1.02 : 1

  const badgeEnter = easeOutBack(Math.min(1, enterProgress * 1.5))
  const cardEnter = easeOutCubic(enterProgress)
  const ruleEnter = easeOutCubic(Math.max(0, (enterProgress - 0.3) / 0.7))
  const detailEnter = easeOutCubic(Math.max(0, (enterProgress - 0.5) / 0.5))
  const scenarioEnter = easeOutCubic(Math.max(0, (enterProgress - 0.7) / 0.3))

  // Warning stripes at borders
  const stripeOffset = -(f * 0.5) % 40

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
      {/* Warning flash */}
      <div style={{ position: 'absolute', inset: 0, background: dangerColor, opacity: warningFlash }} />

      {/* Warning stripe top */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 'clamp(4px, 1vw, 6px)',
          background: `repeating-linear-gradient(45deg, ${dangerColor} 0px, ${dangerColor} 8px, transparent 8px, transparent 16px)`,
          backgroundPosition: `${stripeOffset}px 0`,
          opacity: cardEnter * 0.6,
        }}
      />

      {/* Warning stripe bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 'clamp(4px, 1vw, 6px)',
          background: `repeating-linear-gradient(45deg, ${dangerColor} 0px, ${dangerColor} 8px, transparent 8px, transparent 16px)`,
          backgroundPosition: `${-stripeOffset}px 0`,
          opacity: cardEnter * 0.6,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '7%',
          opacity: exitOpacity,
          transform: `scale(${heartbeat})`,
        }}
      >
        {/* Rule number shield */}
        <div
          style={{
            position: 'relative',
            marginBottom: 'clamp(10px, 2.5vw, 18px)',
            opacity: badgeEnter,
            transform: `scale(${badgeEnter})`,
          }}
        >
          <div
            style={{
              width: 'clamp(50px, 13vw, 80px)',
              height: 'clamp(56px, 14vw, 90px)',
              background: `linear-gradient(160deg, ${dangerColor}, ${dangerColor}cc)`,
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 20px ${dangerColor}33`,
            }}
          >
            <div
              style={{
                fontFamily: "Impact, sans-serif",
                fontSize: 'clamp(20px, 5vw, 34px)',
                fontWeight: 900,
                color: '#fff',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}
            >
              #{ruleNumber}
            </div>
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            width: 'clamp(280px, 75vw, 460px)',
            background: 'rgba(10, 8, 8, 0.88)',
            borderRadius: 'clamp(8px, 2vw, 14px)',
            border: `1px solid ${dangerColor}22`,
            padding: 'clamp(20px, 5vw, 36px)',
            opacity: cardEnter,
            boxShadow: `0 0 25px rgba(0,0,0,0.4)`,
          }}
        >
          {/* Survival Guide header */}
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(8px, 1.4vw, 10px)',
              fontWeight: 800,
              color: dangerColor,
              textTransform: 'uppercase',
              letterSpacing: '0.25em',
              marginBottom: 'clamp(8px, 2vw, 14px)',
              opacity: ruleEnter,
            }}
          >
            {'\u26a0'} Horror Survival Guide
          </div>

          {/* Rule title */}
          <div
            style={{
              fontFamily: "Impact, 'Arial Black', sans-serif",
              fontSize: 'clamp(18px, 4.5vw, 32px)',
              fontWeight: 900,
              color: textColor,
              textTransform: 'uppercase',
              lineHeight: 1.15,
              marginBottom: 'clamp(10px, 2.5vw, 16px)',
              opacity: ruleEnter,
              transform: `translateX(${(1 - ruleEnter) * -20}px)`,
            }}
          >
            {ruleTitle}
          </div>

          {/* Description */}
          <div
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: 'clamp(11px, 2.3vw, 17px)',
              color: `${textColor}99`,
              lineHeight: 1.6,
              marginBottom: 'clamp(16px, 4vw, 26px)',
              opacity: detailEnter,
              transform: `translateY(${(1 - detailEnter) * 10}px)`,
            }}
          >
            {ruleDescription}
          </div>

          {/* Scenario box */}
          <div
            style={{
              background: `${dangerColor}08`,
              borderRadius: 'clamp(6px, 1.5vw, 10px)',
              padding: 'clamp(12px, 3vw, 20px)',
              borderLeft: `3px solid ${dangerColor}44`,
              marginBottom: 'clamp(12px, 3vw, 18px)',
              opacity: scenarioEnter,
              transform: `translateY(${(1 - scenarioEnter) * 8}px)`,
            }}
          >
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(8px, 1.4vw, 10px)', color: `${textColor}55`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
              Scenario
            </div>
            <div style={{ fontFamily: "'Georgia', serif", fontSize: 'clamp(11px, 2.2vw, 16px)', color: `${textColor}cc`, lineHeight: 1.5, fontStyle: 'italic' }}>
              {scenario}
            </div>
          </div>

          {/* Importance badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1.5vw, 10px)', opacity: scenarioEnter }}>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(8px, 1.4vw, 10px)', color: `${textColor}55`, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Importance</span>
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 'clamp(9px, 1.6vw, 12px)',
                fontWeight: 800,
                color: '#fff',
                background: importance === 'LIFE OR DEATH' ? dangerColor : accentColor,
                padding: '2px 8px',
                borderRadius: 3,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {importance}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-survival-guide',
  title: 'Horror Survival Guide',
  description: 'Horror survival guide card with numbered rule shield, warning stripes, heartbeat pulse, scenario box, and importance badge',
  tags: ['scene', 'horror', 'survival', 'guide', 'rules', 'dark', 'warning', 'tips'],
  category: 'scene-layout',
  component: SceneSurvivalGuideComponent as any,
  defaultConfig: {
    ruleNumber: 1,
    ruleTitle: 'Never Split Up',
    ruleDescription: 'The moment you separate from the group, you become an easy target. Strength is in numbers, even when every instinct tells you to run.',
    scenario: 'The lights go out and someone suggests checking the basement alone.',
    importance: 'LIFE OR DEATH',
    bgColor: '#080606',
    textColor: '#d8d0d0',
    accentColor: '#DD8800',
    dangerColor: '#CC0000',
  },
  configSchema: [
    { key: 'ruleNumber', label: 'Rule Number', type: 'number', defaultValue: 1, min: 1, max: 99, group: 'Content' },
    { key: 'ruleTitle', label: 'Rule Title', type: 'text', defaultValue: 'Never Split Up', group: 'Content' },
    { key: 'ruleDescription', label: 'Description', type: 'text', defaultValue: 'The moment you separate from the group...', group: 'Content' },
    { key: 'scenario', label: 'Scenario', type: 'text', defaultValue: 'The lights go out and someone suggests checking the basement alone.', group: 'Content' },
    { key: 'importance', label: 'Importance', type: 'text', defaultValue: 'LIFE OR DEATH', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080606', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#d8d0d0', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#DD8800', group: 'Style' },
    { key: 'dangerColor', label: 'Danger Color', type: 'color', defaultValue: '#CC0000', group: 'Style' },
  ],
})
