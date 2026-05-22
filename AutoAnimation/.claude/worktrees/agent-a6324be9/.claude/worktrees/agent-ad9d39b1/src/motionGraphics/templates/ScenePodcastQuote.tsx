import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ScenePodcastQuoteConfig {
  quoteText: string
  speakerName: string
  episodeRef: string
  accentColor: string
  bgColor: string
  textColor: string
  quoteMarkColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function ScenePodcastQuoteComponent({ config, progress }: MotionGraphicProps<ScenePodcastQuoteConfig>) {
  const { quoteText, speakerName, episodeRef, accentColor, bgColor, textColor, quoteMarkColor } = config

  // Phases: enter 0-0.3, hold 0.3-0.8, exit 0.8-1
  const enterProgress = progress < 0.3 ? progress / 0.3 : 1
  const holdProgress = progress >= 0.3 && progress < 0.8 ? (progress - 0.3) / 0.5 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Quote marks scale up from center
  const quoteMarkScale = easeOutBack(Math.min(1, enterProgress / 0.4))
  const quoteMarkOpacity = easeOutCubic(Math.min(1, enterProgress / 0.3))

  // Quote text types in (character by character simulation via opacity and clip)
  const textReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.6)))

  // Speaker name slides up
  const speakerOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.65) / 0.3)))
  const speakerY = (1 - speakerOpacity) * 15

  // Episode ref fades in
  const refOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.8) / 0.2)))

  // Hold: waveform bar animation
  const wavePhase = holdProgress * Math.PI * 6

  // Exit: fade and scale
  const exitEased = easeInCubic(exitProgress)
  const exitScale = 1 - exitEased * 0.1
  const exitOpacity = 1 - exitEased

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Georgia', 'Times New Roman', serif" }}>
      {/* Background gradient */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(180deg, ${bgColor} 0%, ${accentColor}08 50%, ${bgColor} 100%)`,
        pointerEvents: 'none',
      }} />

      {/* Audiogram-style waveform bars at bottom */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: 'clamp(40px, 8vw, 70px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 'clamp(2px, 0.4vw, 3px)',
        padding: '0 10%',
        opacity: exitOpacity * 0.4,
      }}>
        {Array.from({ length: 40 }).map((_, i) => {
          const barHeight = (Math.sin(wavePhase + i * 0.5) * 0.5 + 0.5) * 0.7 + 0.3
          return (
            <div key={i} style={{
              flex: 1,
              maxWidth: 'clamp(3px, 0.6vw, 5px)',
              height: `${barHeight * 100}%`,
              background: accentColor,
              borderRadius: 2,
              transition: 'height 0.1s ease',
            }} />
          )
        })}
      </div>

      {/* Main content */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '8%',
        opacity: exitOpacity,
        transform: `scale(${exitScale})`,
      }}>
        {/* Opening quote mark */}
        <div style={{
          fontSize: 'clamp(50px, 14vw, 120px)',
          fontWeight: 700,
          color: quoteMarkColor,
          lineHeight: 0.6,
          opacity: quoteMarkOpacity,
          transform: `scale(${quoteMarkScale})`,
          marginBottom: 'clamp(8px, 1.5vw, 16px)',
          userSelect: 'none',
        }}>
          {'\u201C'}
        </div>

        {/* Quote text */}
        <div style={{
          fontSize: 'clamp(16px, 3.8vw, 34px)',
          fontWeight: 400,
          fontStyle: 'italic',
          color: textColor,
          lineHeight: 1.5,
          textAlign: 'center',
          maxWidth: '90%',
          opacity: textReveal,
          clipPath: `inset(0 ${(1 - textReveal) * 100}% 0 0)`,
        }}>
          {quoteText}
        </div>

        {/* Closing quote mark */}
        <div style={{
          fontSize: 'clamp(50px, 14vw, 120px)',
          fontWeight: 700,
          color: quoteMarkColor,
          lineHeight: 0.6,
          opacity: quoteMarkOpacity * textReveal,
          transform: `scale(${quoteMarkScale})`,
          marginTop: 'clamp(4px, 1vw, 10px)',
          userSelect: 'none',
        }}>
          {'\u201D'}
        </div>

        {/* Divider line */}
        <div style={{
          width: 'clamp(30px, 6vw, 50px)',
          height: 2,
          background: accentColor,
          margin: 'clamp(12px, 2.5vw, 24px) 0 clamp(8px, 1.5vw, 16px)',
          opacity: speakerOpacity,
        }} />

        {/* Speaker name */}
        <div style={{
          fontSize: 'clamp(13px, 2.8vw, 22px)',
          fontWeight: 700,
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          color: textColor,
          letterSpacing: '0.05em',
          opacity: speakerOpacity,
          transform: `translateY(${speakerY}px)`,
        }}>
          {speakerName}
        </div>

        {/* Episode reference */}
        <div style={{
          fontSize: 'clamp(9px, 1.6vw, 13px)',
          fontWeight: 500,
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          color: `${textColor}60`,
          marginTop: 'clamp(4px, 0.8vw, 8px)',
          opacity: refOpacity,
        }}>
          {episodeRef}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-podcast-quote',
  title: 'Podcast Pull Quote',
  description: 'Pull quote from podcast with large italic text, animated quote marks, speaker name, episode reference, and audiogram-style waveform bars',
  tags: ['scene', 'podcast', 'quote', 'audio', 'audiogram', 'pull-quote'],
  category: 'scene-layout',
  component: ScenePodcastQuoteComponent as any,
  defaultConfig: {
    quoteText: 'The best ideas come from the intersection of curiosity and persistence.',
    speakerName: 'Alex Rivera',
    episodeRef: 'Episode 28 - The Spark',
    accentColor: '#F59E0B',
    bgColor: '#0F0E13',
    textColor: '#F5F5F0',
    quoteMarkColor: '#F59E0B40',
  },
  configSchema: [
    { key: 'quoteText', label: 'Quote Text', type: 'text', defaultValue: 'The best ideas come from the intersection of curiosity and persistence.', group: 'Content' },
    { key: 'speakerName', label: 'Speaker Name', type: 'text', defaultValue: 'Alex Rivera', group: 'Content' },
    { key: 'episodeRef', label: 'Episode Reference', type: 'text', defaultValue: 'Episode 28 - The Spark', group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#F59E0B', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F0E13', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#F5F5F0', group: 'Style' },
    { key: 'quoteMarkColor', label: 'Quote Mark Color', type: 'color', defaultValue: '#F59E0B40', group: 'Style' },
  ],
})
