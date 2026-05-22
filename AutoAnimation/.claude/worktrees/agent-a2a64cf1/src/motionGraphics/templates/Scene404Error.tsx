import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface Error404Config {
  errorCode: string
  message: string
  subMessage: string
  bgColor: string
  textColor: string
  accentColor: string
  glitchColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function pseudoRandom(seed: number): number {
  return Math.abs(Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1
}

function Scene404ErrorComponent({ config, progress, frame, fps }: MotionGraphicProps<Error404Config>) {
  const { errorCode, message, subMessage, bgColor, textColor, accentColor, glitchColor } = config
  const f = frame ?? 0

  // Phases: glitch-in (0-0.2), stabilize (0.2-0.35), hold (0.35-0.75), glitch-out (0.75-1)
  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const stabilizeProgress = progress >= 0.2 && progress < 0.35 ? (progress - 0.2) / 0.15 : progress >= 0.35 ? 1 : 0
  const holdProgress = progress >= 0.35 && progress < 0.75 ? (progress - 0.35) / 0.4 : progress >= 0.75 ? 1 : 0
  const exitProgress = progress >= 0.75 ? (progress - 0.75) / 0.25 : 0

  // Glitch intensity
  const glitchIntensity = enterProgress < 1
    ? (1 - enterProgress) * 1.5
    : exitProgress > 0
      ? exitProgress * 1.2
      : holdProgress > 0 ? (Math.sin(f * 0.2) > 0.92 ? 0.3 : 0) : 0

  // Number distortion
  const digits = errorCode.split('')
  const digitElements = digits.map((d, i) => {
    const offset = glitchIntensity * (pseudoRandom(i * 47 + f * 0.3) - 0.5) * 30
    const skew = glitchIntensity * (pseudoRandom(i * 83 + f * 0.2) - 0.5) * 15
    const clipTop = glitchIntensity > 0.3 ? pseudoRandom(i * 31 + f * 0.5) * 40 : 0
    const clipBottom = 100 - (glitchIntensity > 0.3 ? pseudoRandom(i * 67 + f * 0.4) * 40 : 0)
    const charSwap = glitchIntensity > 0.5 && pseudoRandom(i * 53 + f * 0.8) > 0.6
    const displayChar = charSwap ? String(Math.floor(pseudoRandom(i * 97 + f) * 10)) : d

    return (
      <span
        key={i}
        style={{
          display: 'inline-block',
          transform: `translateY(${offset}px) skewX(${skew}deg)`,
          clipPath: glitchIntensity > 0.3
            ? `polygon(0 ${clipTop}%, 100% ${clipTop}%, 100% ${clipBottom}%, 0 ${clipBottom}%)`
            : 'none',
          color: glitchIntensity > 0.4 && pseudoRandom(i * 19 + f * 0.6) > 0.5
            ? glitchColor
            : textColor,
        }}
      >
        {displayChar}
      </span>
    )
  })

  // Message fade-in
  const messageOpacity = stabilizeProgress
  const messageY = (1 - easeOutCubic(stabilizeProgress)) * 20

  // Sub-message
  const subOpacity = Math.max(0, Math.min(1, (stabilizeProgress - 0.5) / 0.5))

  // Exit shrink
  const exitScale = exitProgress > 0 ? 1 - easeInCubic(exitProgress) * 0.3 : 1
  const exitOpacity = exitProgress > 0.5 ? 1 - easeInCubic((exitProgress - 0.5) / 0.5) : 1

  // Glitch scan lines across the whole scene
  const scanOffset = (f * 2.5) % 100

  // RGB split on the big numbers
  const rgbSplit = glitchIntensity * 4

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
        fontFamily: "'Inter', '-apple-system', sans-serif",
      }}
    >
      {/* Background static noise during glitch */}
      {glitchIntensity > 0.2 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent ${2 + Math.floor(pseudoRandom(f * 0.1) * 3)}px,
              rgba(${glitchColor},0.03) ${2 + Math.floor(pseudoRandom(f * 0.1) * 3)}px,
              rgba(${glitchColor},0.03) ${4 + Math.floor(pseudoRandom(f * 0.1) * 3)}px
            )`,
            opacity: glitchIntensity,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Horizontal glitch bar */}
      {glitchIntensity > 0.3 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${scanOffset}%`,
            height: `${2 + glitchIntensity * 8}%`,
            background: `${glitchColor}08`,
            transform: `translateX(${(pseudoRandom(f * 0.7) - 0.5) * 20}px)`,
            pointerEvents: 'none',
          }}
        />
      )}

      <div
        style={{
          transform: `scale(${exitScale})`,
          opacity: exitOpacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(8px, 2vh, 20px)',
        }}
      >
        {/* Big error number with RGB split */}
        <div style={{ position: 'relative' }}>
          {/* Red channel offset */}
          {rgbSplit > 0 && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                fontSize: 'clamp(80px, 22vw, 240px)',
                fontWeight: 900,
                letterSpacing: 'clamp(4px, 1.5vw, 16px)',
                color: 'rgba(255,0,0,0.3)',
                transform: `translate(${rgbSplit}px, -${rgbSplit * 0.5}px)`,
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
              }}
            >
              {errorCode}
            </div>
          )}
          {/* Blue channel offset */}
          {rgbSplit > 0 && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                fontSize: 'clamp(80px, 22vw, 240px)',
                fontWeight: 900,
                letterSpacing: 'clamp(4px, 1.5vw, 16px)',
                color: 'rgba(0,100,255,0.3)',
                transform: `translate(-${rgbSplit}px, ${rgbSplit * 0.5}px)`,
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
              }}
            >
              {errorCode}
            </div>
          )}
          {/* Main number */}
          <div
            style={{
              position: 'relative',
              fontSize: 'clamp(80px, 22vw, 240px)',
              fontWeight: 900,
              letterSpacing: 'clamp(4px, 1.5vw, 16px)',
              lineHeight: 1,
              whiteSpace: 'nowrap',
            }}
          >
            {digitElements}
          </div>
        </div>

        {/* Divider line */}
        <div
          style={{
            width: 'clamp(40px, 10vw, 80px)',
            height: 3,
            background: accentColor,
            opacity: messageOpacity,
            borderRadius: 2,
          }}
        />

        {/* Error message */}
        <div
          style={{
            fontSize: 'clamp(18px, 4.5vw, 40px)',
            fontWeight: 700,
            color: textColor,
            textTransform: 'uppercase',
            letterSpacing: 'clamp(2px, 0.8vw, 6px)',
            opacity: messageOpacity,
            transform: `translateY(${messageY}px)`,
          }}
        >
          {message}
        </div>

        {/* Sub-message */}
        <div
          style={{
            fontSize: 'clamp(12px, 2.5vw, 20px)',
            fontWeight: 400,
            color: `${textColor}88`,
            opacity: subOpacity,
            textAlign: 'center',
            maxWidth: '70%',
            lineHeight: 1.5,
          }}
        >
          {subMessage}
        </div>

        {/* Go back button */}
        <div
          style={{
            marginTop: 'clamp(8px, 1.5vh, 16px)',
            padding: 'clamp(8px, 1.5vw, 14px) clamp(20px, 4vw, 36px)',
            borderRadius: 'clamp(4px, 0.8vw, 8px)',
            border: `2px solid ${accentColor}`,
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(11px, 2vw, 16px)',
            fontWeight: 600,
            color: accentColor,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            opacity: subOpacity,
          }}
        >
          Go Back Home
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-404-error',
  title: 'Scene 404 Error',
  description: 'Glitchy 404 error page with large distorted numbers, RGB split effect, scan lines, and page not found message',
  tags: ['scene', 'error', '404', 'glitch', 'internet', 'web', 'digital', 'broken'],
  category: 'scene-layout',
  component: Scene404ErrorComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    errorCode: '404',
    message: 'Page Not Found',
    subMessage: 'The page you are looking for might have been removed or is temporarily unavailable.',
    bgColor: '#0D0D0D',
    textColor: '#EDEDED',
    accentColor: '#FF4757',
    glitchColor: '#00FFFF',
  },
  configSchema: [
    { key: 'errorCode', label: 'Error Code', type: 'text', defaultValue: '404', group: 'Content' },
    { key: 'message', label: 'Message', type: 'text', defaultValue: 'Page Not Found', group: 'Content' },
    { key: 'subMessage', label: 'Sub Message', type: 'text', defaultValue: 'The page you are looking for might have been removed or is temporarily unavailable.', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D0D0D', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#EDEDED', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#FF4757', group: 'Style' },
    { key: 'glitchColor', label: 'Glitch Color', type: 'color', defaultValue: '#00FFFF', group: 'Style' },
  ],
})
