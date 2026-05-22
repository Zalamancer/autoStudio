import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneTierListConfig {
  tierS: string
  tierA: string
  tierB: string
  tierC: string
  tierD: string
  tierF: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

const TIER_COLORS: Record<string, string> = {
  S: '#FF7F7F',
  A: '#FFBF7F',
  B: '#FFDF7F',
  C: '#FFFF7F',
  D: '#BFFF7F',
  F: '#808080',
}

function SceneTierListComponent({ config, progress, frame, fps }: MotionGraphicProps<SceneTierListConfig>) {
  const { tierS, tierA, tierB, tierC, tierD, tierF, bgColor, textColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const tiers = [
    { label: 'S', text: tierS, color: TIER_COLORS.S },
    { label: 'A', text: tierA, color: TIER_COLORS.A },
    { label: 'B', text: tierB, color: TIER_COLORS.B },
    { label: 'C', text: tierC, color: TIER_COLORS.C },
    { label: 'D', text: tierD, color: TIER_COLORS.D },
    { label: 'F', text: tierF, color: TIER_COLORS.F },
  ]

  const tierHeight = 100 / tiers.length

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor }}>
      {tiers.map((tier, i) => {
        // Stagger slide-in from left
        const delay = i * 0.12
        const tierEnter = enterProgress < 1
          ? Math.max(0, Math.min(1, (enterProgress - delay) / 0.3))
          : 1
        const slideX = (1 - easeOutQuart(tierEnter)) * -110
        const exitX = easeOutCubic(exitProgress) * -110
        const opacity = tierEnter * (exitProgress > 0 ? 1 - easeOutCubic(exitProgress) : 1)

        // S-tier gold glow during hold
        const isSTier = tier.label === 'S'
        const glowPulse = isSTier && holdProgress > 0
          ? Math.sin(holdProgress * Math.PI * 5) * 0.4 + 0.6
          : 0

        return (
          <div
            key={tier.label}
            style={{
              position: 'absolute',
              top: `${i * tierHeight}%`,
              left: 0,
              width: '100%',
              height: `${tierHeight}%`,
              display: 'flex',
              alignItems: 'center',
              transform: `translateX(${slideX + exitX}%)`,
              opacity,
            }}
          >
            {/* Tier label */}
            <div
              style={{
                width: '12%',
                height: '100%',
                background: tier.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Impact', 'Arial Black', sans-serif",
                fontSize: 'clamp(20px, 5vw, 48px)',
                fontWeight: 900,
                color: '#000000',
                borderRight: '2px solid rgba(0,0,0,0.3)',
                boxShadow: isSTier && glowPulse > 0
                  ? `0 0 ${20 * glowPulse}px #FFD700, inset 0 0 ${10 * glowPulse}px #FFD70060`
                  : 'none',
              }}
            >
              {tier.label}
            </div>

            {/* Tier content */}
            <div
              style={{
                flex: 1,
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                padding: '0 4%',
                background: `${tier.color}18`,
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(11px, 2.5vw, 22px)',
                fontWeight: 500,
                color: textColor,
              }}
            >
              {tier.text}
            </div>
          </div>
        )
      })}
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-tier-list',
  title: 'Tier List',
  description: 'Classic tier list ranking with S/A/B/C/D/F colored rows, staggered slide-in, and gold S-tier glow',
  tags: ['scene', 'meme', 'tier', 'ranking', 'viral', 'list', 'gaming'],
  category: 'scene-layout',
  component: SceneTierListComponent as any,
  defaultConfig: {
    tierS: 'TypeScript, Rust',
    tierA: 'Python, Go',
    tierB: 'Java, C#',
    tierC: 'Ruby, PHP',
    tierD: 'Perl',
    tierF: 'COBOL',
    bgColor: '#1a1a2e',
    textColor: '#e0e0e0',
  },
  configSchema: [
    { key: 'tierS', label: 'S Tier', type: 'text', defaultValue: 'TypeScript, Rust', group: 'Content' },
    { key: 'tierA', label: 'A Tier', type: 'text', defaultValue: 'Python, Go', group: 'Content' },
    { key: 'tierB', label: 'B Tier', type: 'text', defaultValue: 'Java, C#', group: 'Content' },
    { key: 'tierC', label: 'C Tier', type: 'text', defaultValue: 'Ruby, PHP', group: 'Content' },
    { key: 'tierD', label: 'D Tier', type: 'text', defaultValue: 'Perl', group: 'Content' },
    { key: 'tierF', label: 'F Tier', type: 'text', defaultValue: 'COBOL', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a2e', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e0e0e0', group: 'Style' },
  ],
})
