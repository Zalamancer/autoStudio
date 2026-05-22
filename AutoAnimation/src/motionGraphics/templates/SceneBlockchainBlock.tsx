import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneBlockchainBlockConfig {
  blockNumber: number
  hash: string
  previousHash: string
  transactions: number
  gasUsed: string
  timestamp: string
  miner: string
  bgColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneBlockchainBlockComponent({ config, progress }: MotionGraphicProps<SceneBlockchainBlockConfig>) {
  const { blockNumber, hash, previousHash, transactions, gasUsed, timestamp, miner, bgColor, accentColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1
  const cardSlide = (1 - easeOutCubic(enterProgress)) * 60
  const cardOpacity = easeOutCubic(Math.min(1, enterProgress / 0.35))

  const frame = Math.floor(progress * 300)

  const displayBlock = Math.round(blockNumber * easeOutCubic(Math.max(0, (enterProgress - 0.15) / 0.85)))
  const displayTx = Math.round(transactions * easeOutCubic(Math.max(0, (enterProgress - 0.3) / 0.7)))

  // Chain link animation
  const chainProgress = easeOutCubic(Math.max(0, (enterProgress - 0.05) / 0.5))

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Hash rain background */}
      {Array.from({ length: 8 }, (_, i) => {
        const x = 5 + i * 12
        const speed = 0.8 + (i % 3) * 0.4
        const y = ((frame * speed + i * 40) % 120) - 10
        const opacity = 0.03 + Math.sin(frame * 0.05 + i) * 0.01

        return (
          <div key={i} style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: `rgba(0,255,255,${opacity})`,
            pointerEvents: 'none',
            letterSpacing: 1,
          }}>
            {hash.slice(i * 4, i * 4 + 8)}
          </div>
        )
      })}

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: '6%',
        opacity: exitOpacity,
      }}>
        {/* Chain links visualization above card */}
        <div style={{
          position: 'absolute',
          top: 'clamp(8px, 5vw, 40px)',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          opacity: chainProgress * 0.3,
        }}>
          {Array.from({ length: 5 }, (_, i) => {
            const isCenter = i === 2
            return (
              <React.Fragment key={i}>
                <div style={{
                  width: isCenter ? 'clamp(10px, 2.5vw, 16px)' : 'clamp(8px, 2vw, 12px)',
                  height: isCenter ? 'clamp(10px, 2.5vw, 16px)' : 'clamp(8px, 2vw, 12px)',
                  border: `1px solid ${isCenter ? accentColor : `${accentColor}40`}`,
                  borderRadius: 2,
                  background: isCenter ? `${accentColor}15` : 'transparent',
                }} />
                {i < 4 && (
                  <div style={{ width: 'clamp(8px, 2vw, 16px)', height: 1, background: `${accentColor}30` }} />
                )}
              </React.Fragment>
            )
          })}
        </div>

        <div style={{
          width: 'clamp(280px, 78vw, 480px)',
          background: 'linear-gradient(145deg, rgba(10,14,28,0.96), rgba(4,6,16,0.98))',
          border: `1px solid ${accentColor}20`,
          borderRadius: 'clamp(8px, 2vw, 16px)',
          padding: 'clamp(16px, 4vw, 32px)',
          transform: `translateY(${cardSlide}px)`,
          opacity: cardOpacity,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: `0 0 30px ${accentColor}08`,
        }}>
          {/* Top accent */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${accentColor}00, ${accentColor}, ${accentColor}00)` }} />

          {/* Block number header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 'clamp(10px, 2.5vw, 18px)',
            opacity: easeOutCubic(Math.max(0, (enterProgress - 0.05) / 0.95)),
          }}>
            <div>
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(7px, 1.2vw, 9px)', color: `${textColor}35`, letterSpacing: 2 }}>
                BLOCK
              </div>
              <div style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(22px, 5.5vw, 40px)',
                fontWeight: 900,
                color: accentColor,
                lineHeight: 1,
                textShadow: `0 0 12px ${accentColor}30`,
              }}>
                #{displayBlock.toLocaleString()}
              </div>
            </div>
            <div style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(7px, 1.2vw, 9px)',
              color: '#00FF88',
              background: 'rgba(0,255,136,0.08)',
              padding: '3px 8px',
              borderRadius: 4,
              border: '1px solid rgba(0,255,136,0.2)',
              letterSpacing: 1,
            }}>
              CONFIRMED
            </div>
          </div>

          {/* Hash */}
          <div style={{
            marginBottom: 'clamp(8px, 1.5vw, 12px)',
            opacity: easeOutCubic(Math.max(0, (enterProgress - 0.2) / 0.8)),
          }}>
            <div style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(7px, 1.1vw, 8px)', color: `${textColor}35`, letterSpacing: 2, marginBottom: 2 }}>
              HASH
            </div>
            <div style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(8px, 1.3vw, 10px)',
              color: `${textColor}70`,
              wordBreak: 'break-all',
              lineHeight: 1.4,
            }}>
              {hash}
            </div>
          </div>

          {/* Previous hash */}
          <div style={{
            marginBottom: 'clamp(10px, 2vw, 16px)',
            opacity: easeOutCubic(Math.max(0, (enterProgress - 0.3) / 0.7)),
          }}>
            <div style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(7px, 1.1vw, 8px)', color: `${textColor}35`, letterSpacing: 2, marginBottom: 2 }}>
              PREV HASH
            </div>
            <div style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(8px, 1.3vw, 10px)',
              color: `${textColor}45`,
              wordBreak: 'break-all',
              lineHeight: 1.4,
            }}>
              {previousHash}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${accentColor}20, transparent)`, marginBottom: 'clamp(10px, 2vw, 14px)' }} />

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(6px, 1.2vw, 10px)' }}>
            {[
              { label: 'TRANSACTIONS', value: displayTx.toLocaleString() },
              { label: 'GAS USED', value: gasUsed },
              { label: 'TIMESTAMP', value: timestamp },
              { label: 'MINER', value: miner },
            ].map((item, i) => {
              const stagger = easeOutCubic(Math.max(0, (enterProgress - 0.4 - i * 0.06) / 0.45))
              return (
                <div key={i} style={{
                  background: `${accentColor}05`,
                  borderRadius: 6,
                  padding: 'clamp(6px, 1.2vw, 10px)',
                  border: `1px solid ${accentColor}10`,
                  opacity: stagger,
                  transform: `translateY(${(1 - stagger) * 10}px)`,
                }}>
                  <div style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(6px, 1vw, 8px)', color: `${textColor}30`, letterSpacing: 1, marginBottom: 2 }}>
                    {item.label}
                  </div>
                  <div style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(10px, 1.8vw, 14px)', fontWeight: 700, color: textColor }}>
                    {item.value}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-blockchain-block',
  title: 'Blockchain Block Display',
  description: 'Blockchain transaction block with hash, previous hash, transaction count, gas, and chain link visualization',
  tags: ['scene', 'blockchain', 'crypto', 'block', 'hash', 'web3', 'cyberpunk', 'tech'],
  category: 'scene-layout',
  component: SceneBlockchainBlockComponent as any,
  defaultConfig: {
    blockNumber: 19847263,
    hash: '0x8a3f...d4e2b71c9f0a',
    previousHash: '0x7b2e...c3a8f65d1e09',
    transactions: 184,
    gasUsed: '12.4M',
    timestamp: '12s ago',
    miner: '0x742d...35Cc',
    bgColor: '#060a18',
    accentColor: '#00FFFF',
    textColor: '#e0e4ea',
  },
  configSchema: [
    { key: 'blockNumber', label: 'Block Number', type: 'number', defaultValue: 19847263, min: 0, max: 999999999, group: 'Content' },
    { key: 'hash', label: 'Block Hash', type: 'text', defaultValue: '0x8a3f...d4e2b71c9f0a', group: 'Content' },
    { key: 'previousHash', label: 'Previous Hash', type: 'text', defaultValue: '0x7b2e...c3a8f65d1e09', group: 'Content' },
    { key: 'transactions', label: 'Transactions', type: 'number', defaultValue: 184, min: 0, max: 100000, group: 'Stats' },
    { key: 'gasUsed', label: 'Gas Used', type: 'text', defaultValue: '12.4M', group: 'Stats' },
    { key: 'timestamp', label: 'Timestamp', type: 'text', defaultValue: '12s ago', group: 'Content' },
    { key: 'miner', label: 'Miner', type: 'text', defaultValue: '0x742d...35Cc', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060a18', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#00FFFF', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e0e4ea', group: 'Style' },
  ],
})
