import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PanelWipeConfig extends KineticBaseConfig {}

// Comic panel border wipe: a thick black border sweeps across the frame
// like a panel edge slicing through, revealing the text on the other side.
// The border IS the transition — solid black panel gutter as a wipe effect.

const BORDER_THICKNESS = 18  // thick comic panel gutter

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Very subtle dot grid — represents the comic page paper
    const dot = (time * 1.5) % 12
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Comic page paper texture — fine dots */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)`,
            backgroundSize: `${10 + dot * 0.08}px ${10 + dot * 0.08}px`,
          }}
        />
        {/* Panel registration marks — corner ticks like a print trim */}
        {[
          { top: 0, left: 0 },
          { top: 0, right: 0 },
          { bottom: 0, left: 0 },
          { bottom: 0, right: 0 },
        ].map((pos, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              ...pos,
              width: 16,
              height: 16,
              borderTop: i < 2 ? '3px solid rgba(0,0,0,0.2)' : undefined,
              borderBottom: i >= 2 ? '3px solid rgba(0,0,0,0.2)' : undefined,
              borderLeft: i % 2 === 0 ? '3px solid rgba(0,0,0,0.2)' : undefined,
              borderRight: i % 2 === 1 ? '3px solid rgba(0,0,0,0.2)' : undefined,
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, width, height }: WordRenderProps) => {
    const seed = index * 37 + 29
    // Each word gets a different wipe direction: left, right, top, bottom
    const directions = ['left', 'right', 'top', 'bottom'] as const
    const dir = directions[seed % directions.length]

    // The wipe: a thick black bar sweeps across the full frame.
    // Behind the bar = old panel (nothing). After the bar = new panel (text revealed).
    // The black bar itself is the border between panels.

    let wipePos = 0         // 0..1 normalized position of wipe leading edge
    let textOpacity = 0
    let textTranslateX = 0
    let textTranslateY = 0

    if (phase === 'enter') {
      // Bar sweeps in from one edge; text appears after it passes
      const eased = enterProgress < 0.5
        ? 2 * enterProgress * enterProgress
        : 1 - Math.pow(-2 * enterProgress + 2, 2) / 2
      wipePos = eased
      // Text is hidden until wipe bar passes over center (~0.5 of width/height)
      textOpacity = Math.max(0, (enterProgress - 0.45) / 0.55)
    } else if (phase === 'hold') {
      wipePos = 1.2   // bar has fully passed — off screen
      textOpacity = 1
    } else {
      // Bar sweeps back across, hiding text again
      wipePos = 1.2 + exitProgress * 1.4
      textOpacity = Math.max(0, 1 - exitProgress * 2)
    }

    // Calculate bar position in pixels
    const barW = dir === 'left' || dir === 'right' ? BORDER_THICKNESS : width
    const barH = dir === 'top' || dir === 'bottom' ? BORDER_THICKNESS : height

    let barX = 0
    let barY = 0

    if (dir === 'left') {
      barX = wipePos * (width + BORDER_THICKNESS) - BORDER_THICKNESS
      barY = 0
    } else if (dir === 'right') {
      barX = width - wipePos * (width + BORDER_THICKNESS)
      barY = 0
    } else if (dir === 'top') {
      barX = 0
      barY = wipePos * (height + BORDER_THICKNESS) - BORDER_THICKNESS
    } else {
      barX = 0
      barY = height - wipePos * (height + BORDER_THICKNESS)
    }

    // Text gets a subtle slide in the same direction as wipe, landing at center
    const slideAmount = 24
    if (phase === 'enter') {
      const slideT = Math.max(0, (enterProgress - 0.45) / 0.55)
      const eased = 1 - Math.pow(1 - slideT, 2)
      if (dir === 'left') textTranslateX = -(1 - eased) * slideAmount
      if (dir === 'right') textTranslateX = (1 - eased) * slideAmount
      if (dir === 'top') textTranslateY = -(1 - eased) * slideAmount
      if (dir === 'bottom') textTranslateY = (1 - eased) * slideAmount
    }

    const tilt = ((seed % 5) - 2) * 1.5

    return (
      <>
        {/* Panel wipe bar — the thick black border */}
        <div
          style={{
            position: 'absolute',
            left: barX,
            top: barY,
            width: barW,
            height: barH,
            background: '#000000',
            // Drop shadow on leading edge for depth
            boxShadow: dir === 'left' ? '4px 0 8px rgba(0,0,0,0.5)'
              : dir === 'right' ? '-4px 0 8px rgba(0,0,0,0.5)'
              : dir === 'top' ? '0 4px 8px rgba(0,0,0,0.5)'
              : '0 -4px 8px rgba(0,0,0,0.5)',
          }}
        />

        {/* Text — revealed after bar passes */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${textTranslateX}px), calc(-50% + ${textTranslateY}px)) rotate(${tilt}deg)`,
            opacity: Math.max(0, textOpacity),
          }}
        >
          <div
            style={{
              fontFamily: "Impact, 'Arial Black', sans-serif",
              fontSize: 'clamp(52px, 13vw, 175px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: color,
              WebkitTextStroke: '3px #000000',
              textShadow: '4px 4px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000',
              whiteSpace: 'nowrap',
              letterSpacing: 2,
              userSelect: 'none',
            }}
          >
            {word}
          </div>
        </div>
      </>
    )
  },
}

function PanelWipeComponent(props: MotionGraphicProps<PanelWipeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-panel-wipe',
  title: 'Kinetic Panel Wipe',
  description: 'Comic panel border wipe — thick black gutter sweeps across frame like turning a comic page, revealing text on the far side with direction varying per word',
  tags: ['kinetic', 'typography', 'comic', 'panel', 'wipe', 'transition', 'border', 'gutter', 'sweep'],
  category: 'captions',
  component: PanelWipeComponent as any,
  defaultConfig: {
    words: ['NEXT!', 'MEANWHILE', 'CUT TO', 'FLASH!'],
    colors: ['#FF0000', '#0000FF', '#FF8800', '#009900'],
    bgColor: '#FFFDE7',
    cycleDuration: 1.1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['NEXT!', 'MEANWHILE', 'CUT TO', 'FLASH!'], group: 'Content' },
    { key: 'colors', label: 'Text Colors', type: 'text-array', defaultValue: ['#FF0000', '#0000FF', '#FF8800', '#009900'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFDE7', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.1, min: 0.4, max: 5, group: 'Timing' },
  ],
})
