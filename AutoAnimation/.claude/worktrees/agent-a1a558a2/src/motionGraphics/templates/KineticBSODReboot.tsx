import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BSODRebootConfig extends KineticBaseConfig {}

// Windows Blue Screen of Death → reboot sequence
// Classic blue screen with stop code, then POST/reboot screen
// Text emerges from BSOD context

const STOP_CODES = [
  'IRQL_NOT_LESS_OR_EQUAL',
  'PAGE_FAULT_IN_NONPAGED_AREA',
  'SYSTEM_THREAD_EXCEPTION',
  'CRITICAL_PROCESS_DIED',
  'KERNEL_SECURITY_CHECK_FAILURE',
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const cycleTime = time % 6
    const isBSOD = cycleTime < 4

    const stopCodeIdx = Math.floor(time / 6) % STOP_CODES.length
    const progressPct = Math.min(100, Math.floor((cycleTime / 4) * 100))

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: isBSOD ? '#0040C0' : bgColor,
          transition: 'background 0.1s',
        }}
      >
        {isBSOD ? (
          <>
            {/* Sad face */}
            <div
              style={{
                position: 'absolute',
                top: '10%',
                left: '10%',
                fontSize: 40,
                color: 'rgba(255,255,255,0.7)',
                fontFamily: 'monospace',
              }}
            >
              :(
            </div>
            {/* BSOD text */}
            <div
              style={{
                position: 'absolute',
                top: '22%',
                left: '10%',
                right: '10%',
                fontFamily: '-apple-system, "Segoe UI", sans-serif',
                fontSize: 12,
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.6,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
                Your PC ran into a problem and needs to restart.
              </div>
              <div style={{ fontSize: 9, opacity: 0.6 }}>Stop code: {STOP_CODES[stopCodeIdx]}</div>
            </div>
            {/* Progress bar */}
            <div
              style={{
                position: 'absolute',
                bottom: '15%',
                left: '10%',
                right: '10%',
              }}
            >
              <div
                style={{
                  fontFamily: '-apple-system, "Segoe UI", sans-serif',
                  fontSize: 9,
                  color: 'rgba(255,255,255,0.6)',
                  marginBottom: 4,
                }}
              >
                {progressPct}% complete
              </div>
              <div
                style={{
                  height: 3,
                  background: 'rgba(255,255,255,0.2)',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${progressPct}%`,
                    background: 'rgba(255,255,255,0.8)',
                  }}
                />
              </div>
            </div>
          </>
        ) : (
          /* POST/Boot screen */
          <div
            style={{
              position: 'absolute',
              top: '15%',
              left: '10%',
              fontFamily: "'Courier New', monospace",
              fontSize: 9,
              color: 'rgba(180,180,200,0.4)',
              lineHeight: 1.8,
            }}
          >
            <div>BIOS v2.40 Checking RAM... OK</div>
            <div>CPU: Core i9 @ 3.6GHz</div>
            <div>Boot device: NVMe SSD</div>
            <div style={{ color: 'rgba(100,200,100,0.4)' }}>System resuming...</div>
          </div>
        )}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    if (phase === 'enter') {
      // Boot-up: text loads like POST screen — characters resolve from top
      const lines = word.split('')
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(36px, 10vw, 150px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            display: 'flex',
          }}
        >
          {lines.map((ch, ci) => {
            const charProgress = Math.max(0, Math.min(1, (enterProgress - (ci / lines.length) * 0.5) * 2))
            const isLoading = charProgress < 1 && charProgress > 0
            // Loading chars show cursor
            return (
              <span
                key={ci}
                style={{
                  display: 'inline-block',
                  color: isLoading ? 'rgba(255,255,255,0.6)' : color,
                  opacity: charProgress,
                  fontFamily: isLoading ? "'Courier New', monospace" : undefined,
                }}
              >
                {isLoading ? '_' : ch}
              </span>
            )
          })}
        </div>
      )
    }

    if (phase === 'hold') {
      // BSOD flash: brief blue screen flash on hold
      const bsodFlash = holdProgress > 0.4 && holdProgress < 0.44
      return (
        <>
          {bsodFlash && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,64,192,0.85)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: '-apple-system, sans-serif',
                fontSize: 11,
                color: 'rgba(255,255,255,0.8)',
              }}
            >
              :( STOP_CODE_HERE
            </div>
          )}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(36px, 10vw, 150px)',
              fontWeight: 700,
              color: bsodFlash ? 'rgba(255,255,255,0.1)' : color,
              whiteSpace: 'nowrap',
              letterSpacing: 3,
              textShadow: `0 0 8px ${color}50`,
            }}
          >
            {word}
          </div>
        </>
      )
    }

    // Exit: BSOD crash — screen goes blue then cuts
    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Courier New', monospace",
          fontSize: 'clamp(36px, 10vw, 150px)',
          fontWeight: 700,
          color: exitProgress > 0.6 ? '#ffffff' : color,
          whiteSpace: 'nowrap',
          letterSpacing: 3,
          opacity: 1 - exitProgress,
          filter: exitProgress > 0.4 ? `hue-rotate(${exitProgress * 90}deg)` : 'none',
        }}
      >
        {word}
      </div>
    )
  },
}

function BSODRebootComponent(props: MotionGraphicProps<BSODRebootConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-bsod-reboot',
  title: 'Kinetic BSOD Reboot',
  description:
    'Windows Blue Screen of Death → reboot — text boots up from POST screen with cursor-loading characters, BSOD flash mid-hold, and stop code display',
  tags: ['kinetic', 'typography', 'glitch', 'os', 'windows', 'bsod', 'crash', 'digital', 'software'],
  category: 'captions',
  component: BSODRebootComponent as any,
  defaultConfig: {
    words: ['CRASH', 'REBOOT', 'PANIC', 'RESTORE'],
    colors: ['#55AAFF', '#3399EE', '#66BBFF', '#4499DD'],
    bgColor: '#020410',
    cycleDuration: 1.6,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['CRASH', 'REBOOT', 'PANIC', 'RESTORE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#55AAFF', '#3399EE', '#66BBFF', '#4499DD'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#020410', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.6,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
