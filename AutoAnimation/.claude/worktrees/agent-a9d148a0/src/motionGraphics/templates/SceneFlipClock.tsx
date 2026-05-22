import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FlipClockConfig {
  hours: number
  minutes: number
  seconds: number
  digitColor: string
  bgColor: string
  cardColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function FlipDigitPair({
  value,
  prevValue,
  flipProgress,
  cardColor,
  digitColor,
  size,
}: {
  value: string
  prevValue: string
  flipProgress: number
  cardColor: string
  digitColor: string
  size: number
}) {
  const gap = 2
  const halfH = size * 0.45
  const cardW = size * 0.7
  const fontSize = size * 0.75
  const radius = size * 0.06

  const topRotation = flipProgress < 0.5 ? flipProgress * 180 : 180
  const bottomRotation = flipProgress >= 0.5 ? (1 - flipProgress) * 180 : 180
  const topOpacity = flipProgress < 0.5 ? 1 : 0
  const bottomOpacity = flipProgress >= 0.5 ? 1 : 0

  return (
    <div style={{ position: 'relative', width: cardW, height: size, perspective: size * 3 }}>
      {/* Static top half - shows new value behind */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          width: cardW,
          height: halfH,
          background: cardColor,
          borderRadius: `${radius}px ${radius}px 0 0`,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize,
            fontWeight: 900,
            fontFamily: "'Arial Black', Impact, monospace",
            color: digitColor,
            lineHeight: 1,
            transform: `translateY(${halfH * 0.55}px)`,
          }}
        >
          {value}
        </span>
      </div>

      {/* Flipping top half - shows old value, flips down */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          width: cardW,
          height: halfH,
          background: `linear-gradient(180deg, ${cardColor}, ${cardColor}E0)`,
          borderRadius: `${radius}px ${radius}px 0 0`,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          transformOrigin: 'bottom center',
          transform: `rotateX(${topRotation}deg)`,
          opacity: topOpacity,
          backfaceVisibility: 'hidden',
          zIndex: 2,
          boxShadow: `0 ${gap}px ${size * 0.1}px rgba(0,0,0,0.3)`,
        }}
      >
        <span
          style={{
            fontSize,
            fontWeight: 900,
            fontFamily: "'Arial Black', Impact, monospace",
            color: digitColor,
            lineHeight: 1,
            transform: `translateY(${halfH * 0.55}px)`,
          }}
        >
          {prevValue}
        </span>
      </div>

      {/* Static bottom half - shows old value */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          width: cardW,
          height: halfH,
          background: `linear-gradient(180deg, ${cardColor}D0, ${cardColor})`,
          borderRadius: `0 0 ${radius}px ${radius}px`,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize,
            fontWeight: 900,
            fontFamily: "'Arial Black', Impact, monospace",
            color: `${digitColor}CC`,
            lineHeight: 1,
            transform: `translateY(-${halfH * 0.55}px)`,
          }}
        >
          {prevValue}
        </span>
      </div>

      {/* Flipping bottom half - shows new value, flips up into place */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          width: cardW,
          height: halfH,
          background: `linear-gradient(180deg, ${cardColor}D0, ${cardColor})`,
          borderRadius: `0 0 ${radius}px ${radius}px`,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          transformOrigin: 'top center',
          transform: `rotateX(${bottomRotation}deg)`,
          opacity: bottomOpacity,
          backfaceVisibility: 'hidden',
          zIndex: 2,
        }}
      >
        <span
          style={{
            fontSize,
            fontWeight: 900,
            fontFamily: "'Arial Black', Impact, monospace",
            color: digitColor,
            lineHeight: 1,
            transform: `translateY(-${halfH * 0.55}px)`,
          }}
        >
          {value}
        </span>
      </div>

      {/* Center divider line */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: gap,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 3,
        }}
      />
    </div>
  )
}

function SceneFlipClockComponent({ config, progress, width, height }: MotionGraphicProps<FlipClockConfig>) {
  const { hours, minutes, seconds, digitColor, bgColor, cardColor } = config

  const enterProgress = progress < 0.15 ? progress / 0.15 : 1
  const exitProgress = progress >= 0.85 ? (progress - 0.85) / 0.15 : 0
  const holdProgress = progress >= 0.15 && progress < 0.85 ? (progress - 0.15) / 0.7 : progress >= 0.85 ? 1 : 0

  const totalStartSeconds = hours * 3600 + minutes * 60 + seconds
  const currentTotalSeconds = Math.max(0, Math.round(totalStartSeconds * (1 - holdProgress)))
  const prevTotalSeconds = Math.min(totalStartSeconds, currentTotalSeconds + 1)

  const h = Math.floor(currentTotalSeconds / 3600)
  const m = Math.floor((currentTotalSeconds % 3600) / 60)
  const s = currentTotalSeconds % 60
  const ph = Math.floor(prevTotalSeconds / 3600)
  const pm = Math.floor((prevTotalSeconds % 3600) / 60)
  const ps = prevTotalSeconds % 60

  const hStr = String(h).padStart(2, '0')
  const mStr = String(m).padStart(2, '0')
  const sStr = String(s).padStart(2, '0')
  const phStr = String(ph).padStart(2, '0')
  const pmStr = String(pm).padStart(2, '0')
  const psStr = String(ps).padStart(2, '0')

  // Flip progress for each digit pair: smooth cycle within each second change
  const fractionalSecond = (totalStartSeconds * (1 - holdProgress)) % 1
  const flipP = easeOutCubic(1 - fractionalSecond)

  const enterY = easeOutBack(enterProgress)
  const containerScale = 1 - exitProgress * 0.2
  const containerOpacity = 1 - easeOutCubic(exitProgress)
  const containerY = -100 * (1 - enterY) + exitProgress * -80

  const digitSize = Math.min(width * 0.12, height * 0.25, 120)
  const colonSize = digitSize * 0.4

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: digitSize * 0.15,
          transform: `translateY(${containerY}px) scale(${containerScale})`,
          opacity: containerOpacity,
        }}
      >
        <FlipDigitPair
          value={hStr}
          prevValue={phStr}
          flipProgress={s !== ps || m !== pm || h !== ph ? flipP : 0}
          cardColor={cardColor}
          digitColor={digitColor}
          size={digitSize}
        />
        <div
          style={{
            fontSize: colonSize,
            fontWeight: 900,
            color: digitColor,
            opacity: 0.6,
            fontFamily: "'Arial Black', Impact, monospace",
          }}
        >
          :
        </div>
        <FlipDigitPair
          value={mStr}
          prevValue={pmStr}
          flipProgress={s !== ps || m !== pm ? flipP : 0}
          cardColor={cardColor}
          digitColor={digitColor}
          size={digitSize}
        />
        <div
          style={{
            fontSize: colonSize,
            fontWeight: 900,
            color: digitColor,
            opacity: 0.6,
            fontFamily: "'Arial Black', Impact, monospace",
          }}
        >
          :
        </div>
        <FlipDigitPair
          value={sStr}
          prevValue={psStr}
          flipProgress={s !== ps ? flipP : 0}
          cardColor={cardColor}
          digitColor={digitColor}
          size={digitSize}
        />
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-flip-clock',
  title: 'Flip Clock Countdown',
  description: 'Classic airport flip-clock countdown with 3 digit pairs (HH:MM:SS) and satisfying flip animations',
  tags: ['scene', 'countdown', 'timer', 'clock', 'flip', 'retro'],
  category: 'scene-layout',
  component: SceneFlipClockComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'hours', label: 'Hours', type: 'number', defaultValue: 0, min: 0, max: 23, group: 'Content' },
    { key: 'minutes', label: 'Minutes', type: 'number', defaultValue: 5, min: 0, max: 59, group: 'Content' },
    { key: 'seconds', label: 'Seconds', type: 'number', defaultValue: 0, min: 0, max: 59, group: 'Content' },
    { key: 'digitColor', label: 'Digit Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A1A2E', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#2D2D44', group: 'Style' },
  ],
  defaultConfig: {
    hours: 0,
    minutes: 5,
    seconds: 0,
    digitColor: '#FFFFFF',
    bgColor: '#1A1A2E',
    cardColor: '#2D2D44',
  },
})
