import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MoleculeModelConfig {
  moleculeName: string
  formula: string
  molecularWeight: string
  bondType: string
  description: string
  centerColor: string
  bondColor: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
function easeInCubic(t: number): number { return t * t * t }

function SceneMoleculeModelComponent({ config, frame, durationInFrames }: MotionGraphicProps<MoleculeModelConfig>) {
  const { moleculeName, formula, molecularWeight, bondType, description, centerColor, bondColor, bgColor, textColor } = config
  const progress = frame / durationInFrames

  // Atom positions for 3D ball-and-stick model
  const atoms = [
    { x: 50, y: 30, size: 32, color: centerColor, label: 'C', delay: 0.05 },
    { x: 35, y: 20, size: 22, color: '#FF4444', label: 'O', delay: 0.1 },
    { x: 65, y: 20, size: 22, color: '#FF4444', label: 'O', delay: 0.12 },
    { x: 38, y: 42, size: 18, color: '#4488FF', label: 'H', delay: 0.15 },
    { x: 62, y: 42, size: 18, color: '#4488FF', label: 'H', delay: 0.18 },
    { x: 50, y: 48, size: 20, color: '#44DD66', label: 'N', delay: 0.2 },
  ]

  // Bonds between atoms
  const bonds = [
    { from: 0, to: 1 }, { from: 0, to: 2 }, { from: 0, to: 3 },
    { from: 0, to: 4 }, { from: 0, to: 5 },
  ]

  // Rotation animation
  const rotateY = progress * 360 * 0.3

  // Staggered atom appearances
  const getAtomProgress = (delay: number) =>
    easeOutBack(Math.max(0, Math.min(1, (progress - delay) / 0.15)))

  // Info panel slide (0.3-0.5)
  const nameFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.3) / 0.12)))
  const formulaFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.36) / 0.1)))
  const weightFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.42) / 0.1)))
  const bondFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.48) / 0.1)))
  const descFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.54) / 0.12)))

  // Exit
  const exitProg = progress >= 0.85 ? easeInCubic((progress - 0.85) / 0.15) : 0
  const exitOpacity = 1 - exitProg

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        overflow: 'hidden',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        opacity: exitOpacity,
        transform: `scale(${1 - exitProg * 0.15})`,
      }}
    >
      {/* Molecule model area - top half */}
      <div
        style={{
          position: 'absolute',
          top: '5%',
          left: '50%',
          width: '70%',
          height: '50%',
          transform: `translateX(-50%) perspective(600px) rotateY(${rotateY}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Bonds (sticks) */}
        {bonds.map((bond, i) => {
          const from = atoms[bond.from]
          const to = atoms[bond.to]
          const dx = to.x - from.x
          const dy = to.y - from.y
          const length = Math.sqrt(dx * dx + dy * dy)
          const angle = Math.atan2(dy, dx) * (180 / Math.PI)
          const bondProg = getAtomProgress(Math.max(from.delay, to.delay))
          return (
            <div
              key={`bond-${i}`}
              style={{
                position: 'absolute',
                left: `${from.x}%`,
                top: `${from.y}%`,
                width: `${length}%`,
                height: 3,
                background: `linear-gradient(90deg, ${bondColor}80, ${bondColor}40)`,
                transform: `rotate(${angle}deg)`,
                transformOrigin: '0 50%',
                opacity: bondProg * 0.7,
                borderRadius: 2,
              }}
            />
          )
        })}

        {/* Atoms (balls) */}
        {atoms.map((atom, i) => {
          const ap = getAtomProgress(atom.delay)
          return (
            <div
              key={`atom-${i}`}
              style={{
                position: 'absolute',
                left: `${atom.x}%`,
                top: `${atom.y}%`,
                width: atom.size,
                height: atom.size,
                borderRadius: '50%',
                background: `radial-gradient(circle at 35% 35%, ${atom.color}FF, ${atom.color}AA, ${atom.color}66)`,
                boxShadow: `0 0 12px ${atom.color}40, inset -3px -3px 8px rgba(0,0,0,0.3)`,
                transform: `translate(-50%, -50%) scale(${ap})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: atom.size * 0.45,
                fontWeight: 800,
                color: '#FFFFFF',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              }}
            >
              {atom.label}
            </div>
          )
        })}
      </div>

      {/* Info panel - bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: '6%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80%',
          maxWidth: 500,
        }}
      >
        {/* Molecule name */}
        <div
          style={{
            fontSize: 'clamp(24px, 6vw, 48px)',
            fontWeight: 900,
            color: centerColor,
            marginBottom: '2%',
            opacity: nameFade,
            transform: `translateX(${(1 - nameFade) * 40}px)`,
          }}
        >
          {moleculeName}
        </div>

        {/* Formula */}
        <div
          style={{
            fontSize: 'clamp(16px, 4vw, 30px)',
            fontWeight: 600,
            color: textColor,
            fontFamily: "'Courier New', monospace",
            marginBottom: '3%',
            opacity: formulaFade,
            transform: `translateX(${(1 - formulaFade) * 30}px)`,
          }}
        >
          {formula}
        </div>

        <div style={{ width: `${formulaFade * 50}%`, height: 1, background: `${centerColor}40`, marginBottom: '3%' }} />

        {/* Weight and bond type */}
        <div
          style={{
            fontSize: 'clamp(12px, 2.5vw, 20px)',
            color: `${textColor}80`,
            marginBottom: '2%',
            opacity: weightFade,
          }}
        >
          <span style={{ color: centerColor, fontWeight: 700, marginRight: 8 }}>WEIGHT</span>
          {molecularWeight} g/mol
        </div>

        <div
          style={{
            fontSize: 'clamp(12px, 2.5vw, 20px)',
            color: `${textColor}80`,
            marginBottom: '3%',
            opacity: bondFade,
          }}
        >
          <span style={{ color: centerColor, fontWeight: 700, marginRight: 8 }}>BONDS</span>
          {bondType}
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: 'clamp(13px, 2.8vw, 22px)',
            color: `${textColor}AA`,
            lineHeight: 1.5,
            fontStyle: 'italic',
            borderLeft: `3px solid ${centerColor}50`,
            paddingLeft: 'clamp(8px, 2vw, 16px)',
            opacity: descFade,
            transform: `translateY(${(1 - descFade) * 15}px)`,
          }}
        >
          {description}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-molecule-model',
  title: 'Molecule Model',
  description: '3D ball-and-stick molecule model with labeled atoms, rotating view, and molecular data info panel',
  tags: ['scene', 'science', 'chemistry', 'molecule', '3d', 'educational'],
  category: 'scene-layout',
  component: SceneMoleculeModelComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'moleculeName', label: 'Molecule Name', type: 'text', defaultValue: 'Methanol', group: 'Content' },
    { key: 'formula', label: 'Formula', type: 'text', defaultValue: 'CH3OH', group: 'Content' },
    { key: 'molecularWeight', label: 'Molecular Weight', type: 'text', defaultValue: '32.04', group: 'Content' },
    { key: 'bondType', label: 'Bond Type', type: 'text', defaultValue: 'Covalent', group: 'Content' },
    { key: 'description', label: 'Description', type: 'text', defaultValue: 'A simple alcohol used as a solvent and fuel source', group: 'Content' },
    { key: 'centerColor', label: 'Center Atom Color', type: 'color', defaultValue: '#44DD66', group: 'Style' },
    { key: 'bondColor', label: 'Bond Color', type: 'color', defaultValue: '#888888', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0e18', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E8E8E8', group: 'Style' },
  ],
  defaultConfig: {
    moleculeName: 'Methanol',
    formula: 'CH3OH',
    molecularWeight: '32.04',
    bondType: 'Covalent',
    description: 'A simple alcohol used as a solvent and fuel source',
    centerColor: '#44DD66',
    bondColor: '#888888',
    bgColor: '#0a0e18',
    textColor: '#E8E8E8',
  },
})
