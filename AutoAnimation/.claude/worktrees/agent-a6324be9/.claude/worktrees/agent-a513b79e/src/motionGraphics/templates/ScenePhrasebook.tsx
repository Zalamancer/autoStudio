import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PhrasebookConfig {
  englishPhrase: string
  translatedPhrase: string
  pronunciation: string
  languageFlag: string
  languageName: string
  bgColor: string
  textColor: string
  accentColor: string
  translationColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function ScenePhrasebookComponent({ config, progress }: MotionGraphicProps<PhrasebookConfig>) {
  const { englishPhrase, translatedPhrase, pronunciation, languageFlag, languageName, bgColor, textColor, accentColor, translationColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Language flag / badge enters
  const flagEnter = easeOutBack(Math.max(0, Math.min(1, enterProgress / 0.3)))

  // English phrase fades in
  const englishEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.3)))

  // Translation slides up bold
  const translationEnter = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.35) / 0.35)))
  const translationY = (1 - translationEnter) * 30

  // Pronunciation fades
  const pronEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.3)))

  // Hold: subtle translation glow
  const glowIntensity = progress >= 0.25 && progress < 0.8
    ? 0.2 + Math.sin(holdProgress * Math.PI * 4) * 0.1
    : 0

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      {/* Subtle pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(circle at 20% 80%, ${accentColor}08, transparent 50%), radial-gradient(circle at 80% 20%, ${translationColor}08, transparent 50%)`,
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
          padding: '8%',
          gap: 'clamp(10px, 2.5vh, 22px)',
          opacity: exitOpacity,
          transform: `translateX(${exitEased * -50}px)`,
        }}
      >
        {/* Language badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(6px, 1.2vw, 12px)',
            background: `${accentColor}15`,
            padding: 'clamp(6px, 1vh, 10px) clamp(14px, 2.5vw, 22px)',
            borderRadius: 'clamp(16px, 3vw, 28px)',
            opacity: flagEnter,
            transform: `scale(${flagEnter})`,
          }}
        >
          <span style={{ fontSize: 'clamp(18px, 3.5vw, 28px)' }}>{languageFlag}</span>
          <div
            style={{
              fontSize: 'clamp(11px, 1.8vw, 15px)',
              fontWeight: 700,
              color: accentColor,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {languageName}
          </div>
        </div>

        {/* English phrase */}
        <div
          style={{
            fontSize: 'clamp(14px, 2.5vw, 22px)',
            fontWeight: 500,
            color: `${textColor}80`,
            textAlign: 'center',
            opacity: englishEnter,
            transform: `translateY(${(1 - englishEnter) * 10}px)`,
          }}
        >
          {englishPhrase}
        </div>

        {/* Arrow */}
        <svg
          viewBox="0 0 24 24"
          style={{
            width: 'clamp(16px, 3vw, 24px)',
            height: 'clamp(16px, 3vw, 24px)',
            opacity: englishEnter * 0.5,
          }}
        >
          <path
            d="M12 4v16m0 0l-4-4m4 4l4-4"
            fill="none"
            stroke={`${textColor}60`}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Translated phrase - larger, bold */}
        <div
          style={{
            fontSize: 'clamp(28px, 6vw, 50px)',
            fontWeight: 900,
            color: translationColor,
            textAlign: 'center',
            lineHeight: 1.2,
            opacity: translationEnter,
            transform: `translateY(${translationY}px)`,
            textShadow: `0 0 ${glowIntensity * 40}px ${translationColor}60`,
          }}
        >
          {translatedPhrase}
        </div>

        {/* Pronunciation guide */}
        <div
          style={{
            fontSize: 'clamp(13px, 2.2vw, 19px)',
            fontWeight: 400,
            color: `${textColor}70`,
            fontStyle: 'italic',
            textAlign: 'center',
            opacity: pronEnter,
            transform: `translateY(${(1 - pronEnter) * 8}px)`,
            background: `${textColor}08`,
            padding: 'clamp(6px, 1vh, 10px) clamp(14px, 2.5vw, 22px)',
            borderRadius: 'clamp(6px, 1vw, 10px)',
          }}
        >
          /{pronunciation}/
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-phrasebook',
  title: 'Travel Phrasebook',
  description: 'Travel phrase card with English, bold translation, pronunciation guide, and language flag badge',
  tags: ['scene', 'travel', 'language', 'phrasebook', 'learning', 'adventure'],
  category: 'scene-layout',
  component: ScenePhrasebookComponent as any,
  defaultConfig: {
    englishPhrase: 'Thank you very much',
    translatedPhrase: 'Arigato gozaimasu',
    pronunciation: 'ah-ree-GAH-toh go-zai-MAHS',
    languageFlag: '🇯🇵',
    languageName: 'Japanese',
    bgColor: '#0f1419',
    textColor: '#e8e4f0',
    accentColor: '#60a5fa',
    translationColor: '#fbbf24',
  },
  configSchema: [
    { key: 'englishPhrase', label: 'English Phrase', type: 'text', defaultValue: 'Thank you very much', group: 'Content' },
    { key: 'translatedPhrase', label: 'Translation', type: 'text', defaultValue: 'Arigato gozaimasu', group: 'Content' },
    { key: 'pronunciation', label: 'Pronunciation', type: 'text', defaultValue: 'ah-ree-GAH-toh go-zai-MAHS', group: 'Content' },
    { key: 'languageFlag', label: 'Language Flag', type: 'text', defaultValue: '🇯🇵', group: 'Content' },
    { key: 'languageName', label: 'Language Name', type: 'text', defaultValue: 'Japanese', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f1419', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e8e4f0', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#60a5fa', group: 'Style' },
    { key: 'translationColor', label: 'Translation Color', type: 'color', defaultValue: '#fbbf24', group: 'Style' },
  ],
})
