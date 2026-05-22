import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SlamCrackConfig extends KineticBaseConfig {}

// Text SLAMS DOWN from above with squash-stretch on landing + crack lines from baseline.

const CRACK_COUNT = 10

function buildCracks(seed: number): Array<{ angle: number; length: number; thickness: number }> {
  const cracks = []
  for (let i = 0; i < CRACK_COUNT; i++) {
    const s = seed + i * 43 + 7
    const side = i < CRACK_COUNT / 2 ? 'left' : 'right'
    const baseAngle = side === 'left'
      ? 150 + (i / (CRACK_COUNT / 2)) * 60
      : 330 - ((i - CRACK_COUNT / 2) / (CRACK_COUNT / 2)) * 60
    const angle = baseAngle + ((s * 31) % 14) - 7
    const isMajor = i % 3 !== 2
    const length = isMajor ? 0.35 + (s % 20) / 100 : 0.18 + (s % 12) / 100
    const thickness = isMajor ? 3 : 1.5
    cracks.push({ angle, length, thickness })
  }
  return cracks
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 50%, rgba(0,0,0,0.08) 100%)' }} />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, width, height, frame = 0 }: WordRenderProps) => {
    const seed = index * 61 + 29
    const cracks = buildCracks(seed)
    const maxRadius = Math.max(width, height) * 0.6
    const tilt = ((seed % 5) - 2) * 1.5

    let translateY = 0, scaleX = 1, scaleY = 1
    let textOpacity = 0, crackProgress = 0, crackOpacity = 0
    let containerOpacity = 1, shakeX = 0, shakeY = 0

    if (phase === 'enter') {
      const t = enterProgress
      if (t < 0.45) {
        const dropT = t / 0.45
        const eased = dropT * dropT * dropT
        translateY = -(height * 1.5) * (1 - eased)
        textOpacity = Math.min(1, dropT * 2)
      } else if (t < 0.55) {
        const impactT = (t - 0.45) / 0.10
        scaleY = 1 - impactT * 0.35
        scaleX = 1 + impactT * 0.18
        textOpacity = 1
        crackProgress = impactT
        crackOpacity = impactT
        shakeX = (1 - impactT) * ((seed % 5) - 2) * 6
        shakeY = (1 - impactT) * 4
      } else {
        const snapT = (t - 0.55) / 0.45
        const spring = 1 + Math.sin(snapT * Math.PI * 1.8) * (1 - snapT) * 0.12
        scaleY = (0.65 + snapT * 0.35) * spring
        scaleX = 1.18 - snapT * 0.18
        textOpacity = 1
        crackProgress = 1
        crackOpacity = 1
      }
      containerOpacity = Math.min(1, enterProgress * 3)
    } else if (phase === 'hold') {
      scaleY = 1 + Math.sin((frame / 30) * 1.8 + seed) * 0.018
      textOpacity = 1; crackProgress = 1; crackOpacity = 0.65
    } else {
      const eased = exitProgress * exitProgress
      translateY = height * 0.6 * eased
      scaleY = 1 - exitProgress * 0.4
      textOpacity = Math.max(0, 1 - exitProgress * 2)
      crackOpacity = Math.max(0, 1 - exitProgress * 2)
      containerOpacity = Math.max(0, 1 - exitProgress * 1.5)
    }

    return (
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: `translate(calc(-50% + ${shakeX}px), calc(-50% + ${shakeY}px))`, opacity: Math.max(0, containerOpacity) }}>
        <div style={{ position: 'absolute', top: '60%', left: '50%', width: 0, height: 0 }}>
          {cracks.map((crack, i) => {
            const p = Math.min(1, crackProgress * 1.4)
            const len = maxRadius * crack.length * (1 - Math.pow(1 - p, 3))
            return <div key={i} style={{ position: 'absolute', top: 0, left: 0, width: `${len}px`, height: `${crack.thickness}px`, background: '#000', transformOrigin: '0 50%', transform: `rotate(${crack.angle}deg)`, opacity: crackOpacity * 0.85, borderRadius: `0 ${crack.thickness}px ${crack.thickness}px 0` }} />
          })}
          {cracks.filter((_, i) => i % 3 === 0).map((crack, i) => {
            const p = Math.min(1, crackProgress * 1.2)
            const len = maxRadius * crack.length * 0.6 * (1 - Math.pow(1 - p, 3))
            return <div key={`a${i}`} style={{ position: 'absolute', top: 0, left: 0, width: `${len}px`, height: `${crack.thickness + 1}px`, background: color, transformOrigin: '0 50%', transform: `rotate(${crack.angle - 4}deg)`, opacity: crackOpacity * 0.9, borderRadius: `0 ${crack.thickness}px ${crack.thickness}px 0` }} />
          })}
        </div>
        <div style={{ position: 'relative', transform: `translateY(${translateY}px) rotate(${tilt}deg) scaleX(${scaleX}) scaleY(${scaleY})`, transformOrigin: 'center bottom', opacity: Math.max(0, textOpacity) }}>
          <div style={{ fontFamily: "Impact, 'Arial Black', sans-serif", fontSize: 'clamp(56px, 15vw, 200px)', fontWeight: 900, textTransform: 'uppercase', color, WebkitTextStroke: '4px #000', textShadow: '5px 5px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 0 6px 0 #000', whiteSpace: 'nowrap', letterSpacing: 4, userSelect: 'none' }}>
            {word}
          </div>
        </div>
      </div>
    )
  },
}

function SlamCrackComponent(props: MotionGraphicProps<SlamCrackConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-slam-crack',
  title: 'Kinetic Slam Crack',
  description: 'Text drops from above and slams down with squash-stretch on impact — cracks radiate from the baseline, screen shakes on hit',
  tags: ['kinetic', 'typography', 'slam', 'drop', 'squash', 'stretch', 'crack', 'impact', 'gravity', 'comic'],
  category: 'captions',
  component: SlamCrackComponent as any,
  defaultConfig: {
    words: ['SLAM!', 'WHOA!', 'NOPE!', 'WAIT!'],
    colors: ['#FF2200', '#FFD700', '#00BB44', '#FF6600'],
    bgColor: '#00CCFF',
    cycleDuration: 1.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SLAM!', 'WHOA!', 'NOPE!', 'WAIT!'], group: 'Content' },
    { key: 'colors', label: 'Text Colors', type: 'text-array', defaultValue: ['#FF2200', '#FFD700', '#00BB44', '#FF6600'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#00CCFF', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.0, min: 0.4, max: 5, group: 'Timing' },
  ],
})
