import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneMembershipCardConfig {
  gymName: string
  memberName: string
  memberId: string
  plan: string
  validUntil: string
  memberSince: string
  bgColor: string
  textColor: string
  accentColor: string
  cardGradientStart: string
  cardGradientEnd: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneMembershipCardComponent({ config, progress }: MotionGraphicProps<SceneMembershipCardConfig>) {
  const { gymName, memberName, memberId, plan, validUntil, memberSince, bgColor, textColor, accentColor, cardGradientStart, cardGradientEnd } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1
  const exitScale = exitProgress > 0 ? 1 - exitEased * 0.15 : 1

  // Card flip/slide in
  const cardEnter = easeOutBack(Math.min(1, enterProgress / 0.7))
  const cardRotateY = (1 - cardEnter) * 15
  const cardX = (1 - cardEnter) * 80

  // Staggered content
  const nameEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.5)))
  const detailsEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.5)))
  const badgeEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.4)))

  // Holographic sheen during hold
  const isHolding = progress >= 0.25 && progress < 0.8
  const sheenX = isHolding ? -30 + holdProgress * 160 : enterProgress * 100 - 30

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6%',
          opacity: exitOpacity,
          transform: `scale(${exitScale})`,
        }}
      >
        {/* Card */}
        <div
          style={{
            width: '100%',
            maxWidth: '520px',
            aspectRatio: '1.6 / 1',
            background: `linear-gradient(135deg, ${cardGradientStart}, ${cardGradientEnd})`,
            borderRadius: 'clamp(12px, 2.5vw, 24px)',
            padding: 'clamp(20px, 4vw, 40px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            transform: `translateX(${cardX}px) perspective(800px) rotateY(${cardRotateY}deg)`,
            boxShadow: `0 20px 60px rgba(0,0,0,0.4), 0 0 30px ${accentColor}15`,
          }}
        >
          {/* Holographic sheen */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: `${sheenX}%`,
              width: '30%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), rgba(255,255,255,0.03), transparent)',
              transform: 'skewX(-20deg)',
              pointerEvents: 'none',
            }}
          />

          {/* Diamond pattern overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.015) 20px, rgba(255,255,255,0.015) 21px)`,
              pointerEvents: 'none',
            }}
          />

          {/* Top row: gym name + plan badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
            <div
              style={{
                fontSize: 'clamp(14px, 2.5vw, 22px)',
                fontWeight: 900,
                color: '#ffffff',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                opacity: cardEnter,
              }}
            >
              {gymName}
            </div>
            <div
              style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(4px)',
                color: '#ffffff',
                fontSize: 'clamp(8px, 1.4vw, 12px)',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                padding: 'clamp(3px, 0.5vw, 6px) clamp(10px, 2vw, 18px)',
                borderRadius: '100px',
                opacity: badgeEnter,
                transform: `scale(${badgeEnter})`,
              }}
            >
              {plan}
            </div>
          </div>

          {/* Middle: member name */}
          <div
            style={{
              position: 'relative',
              opacity: nameEnter,
              transform: `translateY(${(1 - nameEnter) * 10}px)`,
            }}
          >
            <div
              style={{
                fontSize: 'clamp(9px, 1.4vw, 12px)',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: 'clamp(2px, 0.4vw, 4px)',
              }}
            >
              Member
            </div>
            <div
              style={{
                fontSize: 'clamp(22px, 5.5vw, 42px)',
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '-0.01em',
              }}
            >
              {memberName}
            </div>
          </div>

          {/* Bottom row: ID, dates */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              position: 'relative',
              opacity: detailsEnter,
              transform: `translateY(${(1 - detailsEnter) * 10}px)`,
            }}
          >
            <div>
              <div style={{ fontSize: 'clamp(8px, 1.2vw, 10px)', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                ID
              </div>
              <div style={{ fontSize: 'clamp(12px, 2vw, 16px)', fontWeight: 700, color: 'rgba(255,255,255,0.8)', fontVariantNumeric: 'tabular-nums', letterSpacing: '0.1em' }}>
                {memberId}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(8px, 1.2vw, 10px)', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Since
              </div>
              <div style={{ fontSize: 'clamp(11px, 1.8vw, 14px)', fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>
                {memberSince}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 'clamp(8px, 1.2vw, 10px)', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Valid Until
              </div>
              <div style={{ fontSize: 'clamp(11px, 1.8vw, 14px)', fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>
                {validUntil}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-membership-card',
  title: 'Membership Card',
  description: 'Premium gym membership card with gradient background, holographic sheen, member details, plan badge, and 3D perspective entry.',
  tags: ['scene', 'membership', 'card', 'gym', 'fitness', 'member', 'premium', 'VIP'],
  category: 'scene-layout',
  component: SceneMembershipCardComponent as any,
  defaultConfig: {
    gymName: 'Iron Forge',
    memberName: 'Alex Johnson',
    memberId: 'IF-2026-4821',
    plan: 'Premium',
    validUntil: 'Dec 2026',
    memberSince: 'Jan 2024',
    bgColor: '#0a0a0a',
    textColor: '#ffffff',
    accentColor: '#FF4433',
    cardGradientStart: '#1a1a2e',
    cardGradientEnd: '#16213e',
  },
  configSchema: [
    { key: 'gymName', label: 'Gym Name', type: 'text', defaultValue: 'Iron Forge', group: 'Content' },
    { key: 'memberName', label: 'Member Name', type: 'text', defaultValue: 'Alex Johnson', group: 'Content' },
    { key: 'memberId', label: 'Member ID', type: 'text', defaultValue: 'IF-2026-4821', group: 'Content' },
    { key: 'plan', label: 'Plan', type: 'text', defaultValue: 'Premium', group: 'Content' },
    { key: 'validUntil', label: 'Valid Until', type: 'text', defaultValue: 'Dec 2026', group: 'Content' },
    { key: 'memberSince', label: 'Member Since', type: 'text', defaultValue: 'Jan 2024', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#FF4433', group: 'Style' },
    { key: 'cardGradientStart', label: 'Card Gradient Start', type: 'color', defaultValue: '#1a1a2e', group: 'Style' },
    { key: 'cardGradientEnd', label: 'Card Gradient End', type: 'color', defaultValue: '#16213e', group: 'Style' },
  ],
})
