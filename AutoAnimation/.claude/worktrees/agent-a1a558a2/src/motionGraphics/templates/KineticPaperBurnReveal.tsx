import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PaperBurnRevealConfig extends KineticBaseConfig {
  burnEdges: number
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInQuad(t: number): number {
  return t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    // Ember glow pulsing on background
    const glow = Math.sin(t * 2.1) * 0.5 + 0.5
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 60%, rgba(255,90,20,${0.04 + glow * 0.03}), transparent 55%)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30
    const cfg = (globalThis as any).__paperBurnConfig ?? { burnEdges: 40 }
    const burnEdges = cfg.burnEdges ?? 40

    // Paper burns from the edges inward (multiple burn fronts converge)
    // The burn front is an irregular jagged edge moving inward

    let burnInward = 0  // 0 = no burn, 1 = fully burnt (paper gone)
    let textOpacity = 0
    let textScale = 0.9
    let emberIntensity = 0

    if (phase === 'enter') {
      burnInward = easeOutExpo(enterProgress)
      textOpacity = easeOutExpo(Math.max(0, (enterProgress - 0.2) / 0.8))
      textScale = 0.9 + textOpacity * 0.1
      emberIntensity = Math.max(0, 1 - Math.abs(enterProgress - 0.5) * 3) * 0.8 + 0.2
    } else if (phase === 'hold') {
      burnInward = 1
      textOpacity = 1
      textScale = 1
      emberIntensity = 0.2 + Math.sin(t * 2.5) * 0.1
    } else {
      burnInward = 1 - easeInQuad(exitProgress)
      textOpacity = 1 - easeInQuad(exitProgress)
      textScale = 1
      emberIntensity = exitProgress * 0.6
    }

    // Build burn edge segments along the paper boundary
    // We simulate the paper as a rectangle that burns inward
    // burnInward goes from 0 (full paper visible) to 1 (paper gone, all revealed)
    const paperInset = burnInward * Math.min(width, height) * 0.6

    // The remaining paper (before it's fully burnt)
    const paperVisible = burnInward < 0.98

    // Jagged burn edge points along all four sides
    const burnEdgeElements: React.ReactNode[] = []
    const edgeGlowElements: React.ReactNode[] = []

    if (paperVisible && burnInward > 0.01) {
      // Top burn edge
      for (let i = 0; i < burnEdges; i++) {
        const xNorm = i / burnEdges
        const x = xNorm * width
        const jitter = (rand(i * 41 + index * 7) - 0.5) * 18
        const burnY = paperInset * (0.7 + rand(i * 29 + index) * 0.6) + jitter
        const charSize = 3 + rand(i * 53 + index) * 5

        // Char embers: orange glow dots at burn front
        const charGlow = 0.6 + rand(i * 67 + index) * 0.4
        burnEdgeElements.push(
          <div
            key={`te${i}`}
            style={{
              position: 'absolute',
              left: x - charSize / 2,
              top: burnY - charSize * 0.5,
              width: charSize,
              height: charSize * 0.4,
              borderRadius: '50%',
              background: `rgba(255,${60 + Math.floor(rand(i * 37 + index) * 100)},10,${charGlow * emberIntensity})`,
              filter: 'blur(1.5px)',
            }}
          />,
        )
      }

      // Bottom burn edge
      for (let i = 0; i < burnEdges; i++) {
        const xNorm = i / burnEdges
        const x = xNorm * width
        const jitter = (rand(i * 43 + index * 11) - 0.5) * 18
        const burnY = height - paperInset * (0.7 + rand(i * 31 + index * 3) * 0.6) + jitter
        const charSize = 3 + rand(i * 59 + index) * 5
        const charGlow = 0.6 + rand(i * 71 + index) * 0.4

        burnEdgeElements.push(
          <div
            key={`be${i}`}
            style={{
              position: 'absolute',
              left: x - charSize / 2,
              top: burnY,
              width: charSize,
              height: charSize * 0.4,
              borderRadius: '50%',
              background: `rgba(255,${60 + Math.floor(rand(i * 41 + index) * 100)},10,${charGlow * emberIntensity})`,
              filter: 'blur(1.5px)',
            }}
          />,
        )
      }

      // The remaining paper rectangle
      const paperEdgeL = paperInset * 0.5
      const paperEdgeT = paperInset * 0.8
      const paperEdgeR = width - paperInset * 0.5
      const paperEdgeB = height - paperInset * 0.8
      const paperW = Math.max(0, paperEdgeR - paperEdgeL)
      const paperH = Math.max(0, paperEdgeB - paperEdgeT)

      if (paperW > 0 && paperH > 0) {
        burnEdgeElements.push(
          <div
            key="paper"
            style={{
              position: 'absolute',
              left: paperEdgeL,
              top: paperEdgeT,
              width: paperW,
              height: paperH,
              background: `linear-gradient(160deg, #f5e8d0, #e8d5b0 60%, #d4b88a)`,
              opacity: 1 - burnInward * 0.3,
            }}
          />,
        )

        // Char/scorch zone around the paper edge
        burnEdgeElements.push(
          <div
            key="char"
            style={{
              position: 'absolute',
              left: paperEdgeL - 8,
              top: paperEdgeT - 8,
              width: paperW + 16,
              height: paperH + 16,
              background: `linear-gradient(160deg, rgba(60,20,5,0.7), rgba(80,30,5,0.5))`,
              opacity: 0.7,
              borderRadius: 2,
              zIndex: -1,
            }}
          />,
        )
      }

      // Ember particles floating upward
      for (let e = 0; e < 8; e++) {
        const ex = width * (0.2 + rand(e * 83 + index + Math.floor(t * 3)) * 0.6)
        const eyBase = paperInset + rand(e * 97 + index) * (height - paperInset * 2)
        const ey = eyBase - (t * 15 + rand(e * 61 + index) * 30) % (height * 0.4)
        const eSize = 1.5 + rand(e * 73 + index) * 2.5
        const eAlpha = (0.5 + rand(e * 89) * 0.5) * emberIntensity

        edgeGlowElements.push(
          <div
            key={`em${e}`}
            style={{
              position: 'absolute',
              left: ex,
              top: ey,
              width: eSize,
              height: eSize,
              borderRadius: '50%',
              background: `rgba(255,${100 + Math.floor(rand(e * 47) * 100)},20,${eAlpha})`,
              filter: 'blur(0.5px)',
            }}
          />,
        )
      }
    }

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Text revealed as paper burns away */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${textScale})`,
            fontFamily: "'Impact', 'Arial Narrow', sans-serif",
            fontSize: 'clamp(40px, 12vw, 155px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            opacity: textOpacity,
            textShadow: `0 0 20px ${color}60, 2px 2px 0 rgba(0,0,0,0.5)`,
          }}
        >
          {word}
        </div>

        {/* Burn edges and paper remnant */}
        {burnEdgeElements}

        {/* Floating embers */}
        {edgeGlowElements}

        {/* Heat haze glow at burn zone */}
        {emberIntensity > 0.1 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(ellipse at 50% 50%, rgba(255,80,10,${emberIntensity * 0.06}), transparent 60%)`,
              filter: 'blur(20px)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    )
  },
}

function PaperBurnRevealComponent(props: MotionGraphicProps<PaperBurnRevealConfig>) {
  ;(globalThis as any).__paperBurnConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-paper-burn-reveal',
  title: 'Kinetic Paper Burn Reveal',
  description: 'A paper sheet burns inward from all edges with glowing ember fronts, char zones and floating sparks, revealing text underneath',
  tags: ['kinetic', 'typography', 'burn', 'fire', 'ember', 'paper', 'destruction', 'reveal', 'heat'],
  category: 'captions',
  component: PaperBurnRevealComponent as any,
  defaultConfig: {
    words: ['IGNITE', 'BURN', 'FIRE', 'ASH'],
    colors: ['#FFB040', '#FF8020', '#FFD060', '#FF6010'],
    bgColor: '#0a0400',
    cycleDuration: 1.6,
    burnEdges: 40,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['IGNITE', 'BURN', 'FIRE', 'ASH'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFB040', '#FF8020', '#FFD060', '#FF6010'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0400', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
    { key: 'burnEdges', label: 'Burn Edge Points', type: 'number', defaultValue: 40, min: 15, max: 60, group: 'Animation' },
  ],
})
