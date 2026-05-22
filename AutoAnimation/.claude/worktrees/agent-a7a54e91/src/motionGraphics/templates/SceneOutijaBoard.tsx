import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneOutijaBoardConfig {
  message: string
  question: string
  spiritName: string
  bgColor: string
  textColor: string
  boardColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneOutijaBoardComponent({ config, progress, frame }: MotionGraphicProps<SceneOutijaBoardConfig>) {
  const { message, question, spiritName, bgColor, textColor, boardColor, accentColor } = config
  const f = frame ?? 0

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.85 ? (progress - 0.2) / 0.65 : progress >= 0.85 ? 1 : 0
  const exitProgress = progress >= 0.85 ? (progress - 0.85) / 0.15 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Planchette movement: spell out the message letter by letter
  const messageUpper = message.toUpperCase()
  const totalChars = messageUpper.length
  const charsRevealed = Math.floor(holdProgress * (totalChars + 1))

  // Current letter position on "board"
  const currentChar = charsRevealed < totalChars ? messageUpper[charsRevealed] : ''
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const charIndex = alphabet.indexOf(currentChar)

  // Planchette position (maps alphabet to a semi-circle)
  const planchetteX = charIndex >= 0 ? -40 + (charIndex / 25) * 80 : 0
  const planchetteY = charIndex >= 0 ? -10 + Math.sin((charIndex / 25) * Math.PI) * -15 : 20

  // Candle flicker
  const candleFlicker1 = 0.6 + Math.sin(f * 0.13) * 0.15 + Math.sin(f * 0.31) * 0.08
  const candleFlicker2 = 0.6 + Math.sin(f * 0.17 + 2) * 0.15 + Math.sin(f * 0.29 + 1) * 0.08

  const boardEnter = easeOutCubic(enterProgress)
  const questionEnter = easeOutCubic(Math.max(0, (enterProgress - 0.4) / 0.6))

  // Eerie ambient glow
  const ambientPulse = 0.3 + Math.sin(f * 0.04) * 0.1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 50%, #1a1510, ${bgColor})` }} />

      {/* Candle glow left */}
      <div
        style={{
          position: 'absolute',
          left: '8%',
          top: '30%',
          width: 100,
          height: 100,
          background: `radial-gradient(circle, rgba(200, 150, 50, ${candleFlicker1 * 0.08}), transparent 70%)`,
        }}
      />
      {/* Candle glow right */}
      <div
        style={{
          position: 'absolute',
          right: '8%',
          top: '30%',
          width: 100,
          height: 100,
          background: `radial-gradient(circle, rgba(200, 150, 50, ${candleFlicker2 * 0.08}), transparent 70%)`,
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
          padding: '6%',
          opacity: exitOpacity,
        }}
      >
        {/* Question */}
        <div
          style={{
            fontFamily: "'Georgia', serif",
            fontSize: 'clamp(11px, 2.5vw, 18px)',
            fontStyle: 'italic',
            color: `${textColor}77`,
            marginBottom: 'clamp(10px, 2.5vw, 18px)',
            opacity: questionEnter,
            textAlign: 'center',
          }}
        >
          &ldquo;{question}&rdquo;
        </div>

        {/* Ouija board */}
        <div
          style={{
            width: 'clamp(280px, 75vw, 460px)',
            background: boardColor,
            borderRadius: 'clamp(12px, 3vw, 20px)',
            border: `2px solid ${accentColor}44`,
            padding: 'clamp(16px, 4vw, 32px)',
            opacity: boardEnter,
            boxShadow: `inset 0 0 40px rgba(0,0,0,0.5), 0 0 20px ${accentColor}08`,
            position: 'relative',
          }}
        >
          {/* Board title */}
          <div
            style={{
              textAlign: 'center',
              fontFamily: "'Georgia', serif",
              fontSize: 'clamp(16px, 3.5vw, 26px)',
              fontWeight: 700,
              color: accentColor,
              letterSpacing: '0.15em',
              marginBottom: 'clamp(10px, 2.5vw, 18px)',
              textShadow: `0 0 10px ${accentColor}33`,
            }}
          >
            OUIJA
          </div>

          {/* Alphabet arc */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 'clamp(2px, 0.5vw, 4px)',
              marginBottom: 'clamp(10px, 2.5vw, 18px)',
            }}
          >
            {alphabet.split('').map((letter, i) => {
              const isActive = letter === currentChar && holdProgress < 1
              return (
                <div
                  key={letter}
                  style={{
                    fontFamily: "'Georgia', serif",
                    fontSize: 'clamp(10px, 2.2vw, 16px)',
                    fontWeight: 600,
                    color: isActive ? accentColor : `${textColor}55`,
                    width: 'clamp(14px, 3.2vw, 22px)',
                    height: 'clamp(14px, 3.2vw, 22px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textShadow: isActive ? `0 0 8px ${accentColor}` : 'none',
                    transition: 'color 0.1s',
                  }}
                >
                  {letter}
                </div>
              )
            })}
          </div>

          {/* YES / NO row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'clamp(8px, 2vw, 14px)', padding: '0 10%' }}>
            <div style={{ fontFamily: "'Georgia', serif", fontSize: 'clamp(10px, 2vw, 14px)', color: `${textColor}44` }}>YES</div>
            <div style={{ fontFamily: "'Georgia', serif", fontSize: 'clamp(10px, 2vw, 14px)', color: `${textColor}44` }}>NO</div>
          </div>

          {/* Planchette indicator */}
          <div
            style={{
              position: 'absolute',
              left: `calc(50% + ${planchetteX}%)`,
              top: `calc(40% + ${planchetteY}%)`,
              width: 'clamp(20px, 5vw, 36px)',
              height: 'clamp(26px, 6.5vw, 44px)',
              border: `2px solid ${accentColor}88`,
              borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
              transform: 'translate(-50%, -50%)',
              background: `${boardColor}cc`,
              boxShadow: `0 0 10px ${accentColor}22`,
              opacity: holdProgress > 0 ? 0.8 : 0,
            }}
          >
            <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)', width: 6, height: 6, borderRadius: '50%', background: 'rgba(200, 200, 200, 0.15)' }} />
          </div>

          {/* GOODBYE at bottom */}
          <div
            style={{
              textAlign: 'center',
              fontFamily: "'Georgia', serif",
              fontSize: 'clamp(10px, 2vw, 14px)',
              color: `${textColor}33`,
              letterSpacing: '0.2em',
            }}
          >
            GOODBYE
          </div>
        </div>

        {/* Revealed message */}
        <div
          style={{
            marginTop: 'clamp(14px, 3.5vw, 24px)',
            fontFamily: "'Georgia', serif",
            fontSize: 'clamp(16px, 4vw, 28px)',
            fontWeight: 700,
            color: accentColor,
            letterSpacing: '0.2em',
            textShadow: `0 0 15px ${accentColor}44`,
            opacity: ambientPulse + 0.5,
          }}
        >
          {messageUpper.slice(0, charsRevealed)}
          {charsRevealed < totalChars && (
            <span style={{ opacity: f % 16 < 10 ? 0.4 : 0 }}>_</span>
          )}
        </div>

        {/* Spirit name */}
        {holdProgress > 0.8 && (
          <div
            style={{
              marginTop: 'clamp(6px, 1.5vw, 10px)',
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(9px, 1.6vw, 12px)',
              color: `${textColor}44`,
              letterSpacing: '0.1em',
              opacity: easeOutCubic((holdProgress - 0.8) / 0.2),
            }}
          >
            Spirit: {spiritName}
          </div>
        )}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-ouija-board',
  title: 'Ouija Board Message',
  description: 'Ouija board with animated planchette spelling out a message letter by letter, candlelight, eerie supernatural atmosphere',
  tags: ['scene', 'horror', 'ouija', 'spirit', 'supernatural', 'creepy', 'board', 'seance'],
  category: 'scene-layout',
  component: SceneOutijaBoardComponent as any,
  defaultConfig: {
    message: 'GET OUT',
    question: 'Is there anyone here with us?',
    spiritName: 'Unknown Entity',
    bgColor: '#080604',
    textColor: '#d8d0c0',
    boardColor: '#1a1510',
    accentColor: '#c8a050',
  },
  configSchema: [
    { key: 'message', label: 'Spirit Message', type: 'text', defaultValue: 'GET OUT', group: 'Content' },
    { key: 'question', label: 'Question Asked', type: 'text', defaultValue: 'Is there anyone here with us?', group: 'Content' },
    { key: 'spiritName', label: 'Spirit Name', type: 'text', defaultValue: 'Unknown Entity', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080604', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#d8d0c0', group: 'Style' },
    { key: 'boardColor', label: 'Board Color', type: 'color', defaultValue: '#1a1510', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#c8a050', group: 'Style' },
  ],
})
