import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FlickerGateConfig extends KineticBaseConfig {}

// Deterministic projector gate flicker table — simulates shutter at 24fps
// Each frame has a brightness value: light, dark, partial based on shutter angle
function getGateBrightness(frame: number): number {
  // 24fps projector, 180-degree shutter: half open, half closed
  // Each frame: open phase (bright) then closed phase (dark)
  // We simulate within a frame as sub-frame timing
  const framePhase = frame % 2  // alternating on/off for strobe
  // Additional flicker from film weave
  const weave = 0.95 + 0.03 * Math.sin(frame * 7.13) + 0.02 * Math.sin(frame * 17.3)
  // Intermittent lamp surge
  const surge = frame % 23 === 0 ? 1.2 : frame % 37 === 0 ? 0.6 : 1.0
  return framePhase === 0 ? weave * surge : 0
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Gate flicker: alternate bright/dark at 24fps strobe cadence
    // For smooth animation at higher fps, use fractional flicker
    const gatePhase = (frame / fps * 24) % 1  // 0..1 per "projected frame"
    // Shutter: open for 0..0.5, closed for 0.5..1 (180° shutter)
    const shutterOpen = gatePhase < 0.5
    const shutterBrightness = shutterOpen
      ? 0.85 + 0.1 * Math.sin(time * 31.7) + 0.05 * Math.sin(time * 73.1)
      : 0.0

    // Film weave — slight horizontal and vertical shift
    const weaveX = Math.sin(time * 8.3) * 1.5 + Math.sin(time * 23.7) * 0.5
    const weaveY = Math.sin(time * 11.1) * 1 + Math.sin(time * 31.3) * 0.3

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Projection screen — slightly off-white */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(240,235,220,${0.05 + shutterBrightness * 0.12})`,
          }}
        />
        {/* Gate brightness flicker — main light pulse */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(255,250,235,${shutterBrightness * 0.15})`,
            transform: `translate(${weaveX}px, ${weaveY}px)`,
          }}
        />
        {/* Scan lines from projector optics */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.04) 1px, rgba(0,0,0,0.04) 2px)',
            transform: `translateY(${weaveY}px)`,
          }}
        />
        {/* Film gate mask — the aperture frame */}
        {/* Top gate edge */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4%',
            background: 'rgba(0,0,0,0.9)',
            transform: `translateY(${weaveY * 2}px)`,
          }}
        />
        {/* Bottom gate edge */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '4%',
            background: 'rgba(0,0,0,0.9)',
            transform: `translateY(${-weaveY * 2}px)`,
          }}
        />
        {/* Left gate edge */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: '3%',
            background: 'rgba(0,0,0,0.9)',
          }}
        />
        {/* Right gate edge */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            width: '3%',
            background: 'rgba(0,0,0,0.9)',
          }}
        />
        {/* Film grain — coarse */}
        <div
          style={{
            position: 'absolute',
            inset: '4% 3%',
            backgroundImage: `radial-gradient(circle, rgba(0,0,0,${0.04 + 0.02 * Math.sin(frame * 7.3)}) 1px, transparent 1px)`,
            backgroundSize: '4px 4px',
            transform: `translate(${weaveX * 0.5}px, ${weaveY * 0.5}px)`,
          }}
        />
        {/* Vertical scratch — intermittent */}
        {frame % 47 < 12 && (
          <div
            style={{
              position: 'absolute',
              left: `${42 + weaveX}%`,
              top: 0,
              bottom: 0,
              width: 1,
              background: `rgba(255,240,200,${0.15 + shutterBrightness * 0.1})`,
            }}
          />
        )}
        {/* Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.65) 100%)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 24

    // Strobing appearance — text builds up through rapid light/dark cycling
    // Calculate per-frame gate state
    const gatePhase = (f / 1 * (24 / 30)) % 1  // normalized
    const shutterOpen = (f % 2) === 0

    let opacity = 0
    let brightness = 1
    let weaveX = Math.sin(time * 8.3) * 1.5
    let weaveY = Math.sin(time * 11.1) * 1

    if (phase === 'enter') {
      if (enterProgress < 0.6) {
        // Strobing buildup — alternates between visible and dark
        const strobeCount = Math.floor(enterProgress * 12)  // 12 strobes over enter
        const isOn = strobeCount % 2 === 0
        const strobeIntensity = enterProgress / 0.6
        opacity = isOn ? strobeIntensity * (0.5 + strobeIntensity * 0.5) : strobeIntensity * 0.1
        brightness = 1.2 + (1 - strobeIntensity) * 0.5
      } else {
        // Stabilize: strobe fades, text holds
        const p = (enterProgress - 0.6) / 0.4
        opacity = 0.5 + p * 0.5
        brightness = 1.2 - p * 0.2
      }
    } else if (phase === 'hold') {
      // Steady with gate flicker
      const flicker = shutterOpen
        ? 0.92 + 0.06 * Math.sin(time * 43.7) + 0.02 * Math.sin(time * 97.3)
        : 0.75 + 0.05 * Math.sin(time * 43.7)
      opacity = flicker
      brightness = 1
    } else {
      // Exit: strobe out — reverse of enter
      const strobeCount = Math.floor((1 - exitProgress) * 8)
      const isOn = strobeCount % 2 === 0
      opacity = isOn ? (1 - exitProgress) : (1 - exitProgress) * 0.1
      brightness = 1
    }

    return (
      <>
        {/* Overexposed gate flash halo */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${weaveX}px), calc(-50% + ${weaveY}px))`,
            fontFamily: "'Impact', 'Arial Narrow', 'Arial Black', sans-serif",
            fontSize: 'clamp(42px, 10.5vw, 145px)',
            fontWeight: 900,
            color: 'rgba(255,250,230,0.6)',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: 4,
            filter: 'blur(10px)',
            opacity: opacity * brightness * 0.5,
          }}
        >
          {word}
        </div>
        {/* Main text with weave */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${weaveX}px), calc(-50% + ${weaveY}px))`,
            opacity,
            fontFamily: "'Impact', 'Arial Narrow', 'Arial Black', sans-serif",
            fontSize: 'clamp(42px, 10.5vw, 145px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: 4,
            filter: `brightness(${brightness})`,
            textShadow: `0 0 6px rgba(255,245,210,${opacity * 0.4 * brightness})`,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function FlickerGateComponent(props: MotionGraphicProps<FlickerGateConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-flicker-gate',
  title: 'Kinetic Flicker Gate',
  description: 'Projector gate flicker: 180-degree shutter strobing with film weave, gate mask, scratch lines, and text appearing through rapid light/dark cycles',
  tags: ['kinetic', 'typography', 'flicker', 'projector', 'gate', 'cinema', 'strobe', 'film', 'vintage'],
  category: 'captions',
  component: FlickerGateComponent as any,
  defaultConfig: {
    words: ['LIGHTS', 'CAMERA', 'ACTION'],
    colors: ['#f5eed8', '#e8dfc0', '#f5eed8'],
    bgColor: '#0c0a06',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LIGHTS', 'CAMERA', 'ACTION'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#f5eed8', '#e8dfc0', '#f5eed8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c0a06', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.4, max: 5, group: 'Timing' },
  ],
})
