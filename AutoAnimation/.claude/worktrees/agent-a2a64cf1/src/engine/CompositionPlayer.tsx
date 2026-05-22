import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from 'react'
import { CompositionProvider, type CompositionContextValue } from './CompositionContext'

export interface CompositionPlayerRef {
  play(): void
  pause(): void
  toggle(): void
  seekTo(frame: number): void
  getCurrentFrame(): number
  isPlaying(): boolean
}

interface CompositionPlayerProps {
  /** React component to render as the composition */
  component: React.ComponentType<any>
  /** Props forwarded to the component */
  inputProps: Record<string, unknown>
  /** Composition dimensions */
  compositionWidth: number
  compositionHeight: number
  /** Frames per second */
  fps: number
  /** Total frames */
  durationInFrames: number
  /** Player container styling */
  style?: React.CSSProperties
  /** Show native controls bar */
  controls?: boolean
  /** Auto-play on mount */
  autoPlay?: boolean
  /** Loop playback */
  loop?: boolean
  /** Initial frame */
  initialFrame?: number
  /** Click canvas to toggle play/pause */
  clickToPlay?: boolean
  /** Allow fullscreen (not implemented yet, reserved) */
  allowFullscreen?: boolean
  /** Ignored — Remotion compat stub */
  acknowledgeRemotionLicense?: boolean
}

export const CompositionPlayer = forwardRef<CompositionPlayerRef, CompositionPlayerProps>(
  (
    {
      component: Component,
      inputProps,
      compositionWidth,
      compositionHeight,
      fps,
      durationInFrames,
      style,
      controls = false,
      autoPlay = false,
      loop = false,
      initialFrame = 0,
      clickToPlay = false,
    },
    ref,
  ) => {
    const [frame, setFrame] = useState(initialFrame)
    const [playing, setPlaying] = useState(false)
    const rafRef = useRef<number>(0)
    const lastTimeRef = useRef<number>(0)
    const accumulatorRef = useRef<number>(0)

    const frameRef = useRef(frame)
    frameRef.current = frame

    const playingRef = useRef(playing)
    playingRef.current = playing

    // RAF-based playback loop
    const tick = useCallback(
      (now: number) => {
        if (!playingRef.current) return

        const delta = lastTimeRef.current ? now - lastTimeRef.current : 0
        lastTimeRef.current = now
        accumulatorRef.current += delta

        const frameDuration = 1000 / fps
        if (accumulatorRef.current >= frameDuration) {
          const steps = Math.floor(accumulatorRef.current / frameDuration)
          accumulatorRef.current -= steps * frameDuration

          setFrame((prev) => {
            let next = prev + steps
            if (next >= durationInFrames) {
              if (loop) {
                next = next % durationInFrames
              } else {
                setPlaying(false)
                return durationInFrames - 1
              }
            }
            return next
          })
        }

        rafRef.current = requestAnimationFrame(tick)
      },
      [fps, durationInFrames, loop],
    )

    useEffect(() => {
      if (playing) {
        lastTimeRef.current = 0
        accumulatorRef.current = 0
        rafRef.current = requestAnimationFrame(tick)
      }
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
      }
    }, [playing, tick])

    // Auto-play
    useEffect(() => {
      if (autoPlay) setPlaying(true)
    }, [autoPlay])

    const play = useCallback(() => setPlaying(true), [])
    const pause = useCallback(() => setPlaying(false), [])
    const toggle = useCallback(() => setPlaying((p) => !p), [])
    const seekTo = useCallback(
      (f: number) => {
        setFrame(Math.max(0, Math.min(f, durationInFrames - 1)))
      },
      [durationInFrames],
    )

    useImperativeHandle(ref, () => ({
      play,
      pause,
      toggle,
      seekTo,
      getCurrentFrame: () => frameRef.current,
      isPlaying: () => playingRef.current,
    }))

    const ctxValue: CompositionContextValue = {
      frame,
      fps,
      durationInFrames,
      width: compositionWidth,
      height: compositionHeight,
    }

    return (
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: '#000',
          ...style,
        }}
        onClick={clickToPlay ? toggle : undefined}
      >
        {/* Aspect-ratio container */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: `${compositionWidth}/${compositionHeight}`,
            overflow: 'hidden',
          }}
        >
          <CompositionProvider value={ctxValue}>
            <Component {...inputProps} />
          </CompositionProvider>
        </div>

        {/* Simple controls bar */}
        {controls && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 8px',
              zIndex: 100,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={toggle}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 14,
                padding: '2px 4px',
              }}
            >
              {playing ? '⏸' : '▶'}
            </button>
            <input
              type="range"
              min={0}
              max={Math.max(durationInFrames - 1, 0)}
              value={frame}
              onChange={(e) => seekTo(Number(e.target.value))}
              style={{ flex: 1, cursor: 'pointer' }}
            />
            <span
              style={{
                color: '#fff',
                fontSize: 11,
                fontFamily: 'monospace',
                minWidth: 60,
                textAlign: 'right',
              }}
            >
              {frame} / {durationInFrames}
            </span>
          </div>
        )}
      </div>
    )
  },
)
CompositionPlayer.displayName = 'CompositionPlayer'
