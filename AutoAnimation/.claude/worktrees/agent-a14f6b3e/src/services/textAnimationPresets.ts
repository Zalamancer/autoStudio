/**
 * Text Animation Presets — Viral Short-Form Content
 *
 * Designed for TikTok / Reels / Shorts style text that GRABS attention.
 * Fast entries, screen takeovers, whip pans, slams, shakes, and 3D flips.
 *
 * Each preset computes CSS style overrides per-frame based on phase progress (0→1).
 * Enter: first enterFraction of duration, Exit: last exitFraction.
 */

export interface TextAnimationStyle {
  opacity?: number
  transform?: string
  filter?: string
  clipPath?: string
  letterSpacing?: string
  textShadow?: string
  WebkitTextStroke?: string
}

export interface TextAnimationPreset {
  id: string
  name: string
  category: TextAnimationCategory
  previewHint?: string
  /** Enter duration as fraction of total (0-1), default 0.2 */
  enterFraction?: number
  /** Exit duration as fraction of total (0-1), default 0.2 */
  exitFraction?: number
  /** Compute styles for enter phase. t goes from 0 (start) to 1 (fully entered) */
  enter: (t: number) => TextAnimationStyle
  /** Compute styles for hold/loop phase. t goes from 0 to 1 over hold duration */
  hold?: (t: number) => TextAnimationStyle
  /** Compute styles for exit phase. t goes from 0 (start exit) to 1 (fully exited) */
  exit: (t: number) => TextAnimationStyle
}

export type TextAnimationCategory =
  | 'impact'
  | 'takeover'
  | 'whip'
  | 'shake'
  | 'glitch'
  | '3d-flip'
  | 'zoom'
  | 'bounce'
  | 'reveal'
  | 'kinetic'
  | 'split'
  | 'pulse'
  | 'exit'

// ── Easing helpers ──────────────────────────────────────────────

const ease = {
  out: (t: number) => 1 - Math.pow(1 - t, 3),
  outHard: (t: number) => 1 - Math.pow(1 - t, 5),
  in: (t: number) => t * t * t,
  inOut: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  outBack: (t: number) => { const c = 2.5; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2) },
  outBackHard: (t: number) => { const c = 4.0; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2) },
  outElastic: (t: number) => t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1,
  outBounce: (t: number) => { const n = 7.5625; const d = 2.75; if (t < 1/d) return n*t*t; if (t < 2/d) return n*(t-=1.5/d)*t+0.75; if (t < 2.5/d) return n*(t-=2.25/d)*t+0.9375; return n*(t-=2.625/d)*t+0.984375 },
  spring: (t: number) => 1 - Math.exp(-8 * t) * Math.cos(5 * Math.PI * t),
  snap: (t: number) => { const p = Math.min(t * 1.4, 1); return 1 - Math.pow(1 - p, 6) },
}

// ── Preset Definitions ─────────────────────────────────────────

export const TEXT_ANIMATION_PRESETS: TextAnimationPreset[] = [

  // ═══════════════════════════════════════════════════════════════
  // IMPACT — Slam in hard, shake on landing
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'slam-down',
    name: 'Slam Down',
    category: 'impact',
    enterFraction: 0.12,
    exitFraction: 0.1,
    enter: (t) => {
      const p = ease.snap(t)
      const shake = t > 0.7 ? Math.sin((t - 0.7) * 80) * 3 * (1 - t) : 0
      return { opacity: Math.min(1, t * 5), transform: `translateY(${(1 - p) * -800}px) scale(${0.5 + p * 0.5 + (t > 0.7 ? 0.15 * (1 - t) : 0)}) translateX(${shake}px)` }
    },
    hold: (t) => {
      const micro = Math.sin(t * 6) * 0.5
      return { transform: `translateY(${micro}px)` }
    },
    exit: (t) => {
      const p = ease.in(t)
      return { opacity: 1 - p, transform: `translateY(${p * 400}px) scale(${1 - p * 0.3})` }
    },
  },
  {
    id: 'slam-up',
    name: 'Slam Up',
    category: 'impact',
    enterFraction: 0.12,
    exitFraction: 0.1,
    enter: (t) => {
      const p = ease.snap(t)
      const shake = t > 0.7 ? Math.sin((t - 0.7) * 80) * 3 * (1 - t) : 0
      return { opacity: Math.min(1, t * 5), transform: `translateY(${(1 - p) * 800}px) scale(${0.5 + p * 0.5}) translateX(${shake}px)` }
    },
    exit: (t) => {
      const p = ease.in(t)
      return { opacity: 1 - p, transform: `translateY(${-p * 400}px)` }
    },
  },
  {
    id: 'smash-in',
    name: 'Smash In',
    category: 'impact',
    enterFraction: 0.08,
    exitFraction: 0.08,
    enter: (t) => {
      const p = ease.snap(t)
      const shake = t > 0.6 ? Math.sin((t - 0.6) * 100) * 5 * (1 - t) : 0
      return {
        opacity: Math.min(1, t * 8),
        transform: `scale(${8 - 7 * p}) rotate(${(1 - p) * -15}deg) translate(${shake}px, ${shake * 0.6}px)`,
        filter: t < 0.3 ? `blur(${(1 - t / 0.3) * 8}px)` : undefined,
      }
    },
    hold: (t) => {
      const pulse = Math.sin(t * 4) * 0.02
      return { transform: `scale(${1 + pulse})` }
    },
    exit: (t) => {
      const p = ease.in(t)
      return { opacity: 1 - p * p, transform: `scale(${1 + p * 3})`, filter: `blur(${p * 12}px)` }
    },
  },
  {
    id: 'drop-stomp',
    name: 'Drop Stomp',
    category: 'impact',
    enterFraction: 0.15,
    exitFraction: 0.1,
    enter: (t) => {
      const p = ease.outBounce(t)
      return {
        opacity: Math.min(1, t * 4),
        transform: `translateY(${(1 - p) * -600}px) scaleY(${t > 0.8 ? 1 + (1 - t) * 0.8 : 1}) scaleX(${t > 0.8 ? 1 - (1 - t) * 0.15 : 1})`,
      }
    },
    exit: (t) => {
      const p = ease.in(t)
      return { opacity: 1 - p, transform: `translateY(${p * 200}px) scaleY(${1 - p * 0.5})` }
    },
  },
  {
    id: 'punch-in',
    name: 'Punch In',
    category: 'impact',
    enterFraction: 0.06,
    exitFraction: 0.06,
    enter: (t) => {
      const p = ease.snap(t)
      return {
        opacity: Math.min(1, t * 10),
        transform: `scale(${15 - 14 * p})`,
        filter: t < 0.5 ? `blur(${(1 - t * 2) * 20}px)` : undefined,
      }
    },
    exit: (t) => {
      return { opacity: 1 - t, transform: `scale(${1 - t * 0.8})` }
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // TAKEOVER — Full screen domination
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'zoom-takeover',
    name: 'Zoom Takeover',
    category: 'takeover',
    enterFraction: 0.1,
    exitFraction: 0.08,
    enter: (t) => {
      const p = ease.outBack(t)
      return {
        opacity: Math.min(1, t * 6),
        transform: `scale(${0.01 + p * 0.99})`,
        filter: t < 0.4 ? `blur(${(1 - t / 0.4) * 15}px)` : undefined,
      }
    },
    hold: (t) => {
      const breathe = Math.sin(t * Math.PI * 2) * 0.015
      return { transform: `scale(${1 + breathe})` }
    },
    exit: (t) => {
      const p = ease.in(t)
      return { opacity: 1 - p, transform: `scale(${1 + p * 5})`, filter: `blur(${p * 20}px)` }
    },
  },
  {
    id: 'screen-fill',
    name: 'Screen Fill',
    category: 'takeover',
    enterFraction: 0.08,
    exitFraction: 0.06,
    enter: (t) => {
      const p = ease.outHard(t)
      return {
        opacity: Math.min(1, t * 8),
        transform: `scale(${20 - 19 * p}) rotate(${(1 - p) * 180}deg)`,
        filter: t < 0.3 ? `blur(${(1 - t / 0.3) * 30}px)` : undefined,
      }
    },
    exit: (t) => {
      const p = ease.in(t)
      return { opacity: 1 - p, transform: `scale(${1 - p}) rotate(${p * -90}deg)` }
    },
  },
  {
    id: 'expand-burst',
    name: 'Expand Burst',
    category: 'takeover',
    enterFraction: 0.1,
    exitFraction: 0.08,
    enter: (t) => {
      const p = ease.outElastic(t)
      return {
        opacity: Math.min(1, t * 5),
        transform: `scale(${p * 1.0})`,
        letterSpacing: `${(1 - p) * 40}px`,
      }
    },
    exit: (t) => {
      const p = ease.in(t)
      return { opacity: 1 - p, letterSpacing: `${p * 60}px`, filter: `blur(${p * 8}px)` }
    },
  },
  {
    id: 'mega-zoom',
    name: 'Mega Zoom',
    category: 'takeover',
    enterFraction: 0.06,
    exitFraction: 0.06,
    enter: (t) => {
      const p = ease.snap(t)
      return {
        opacity: Math.min(1, t * 10),
        transform: `scale(${50 - 49 * p})`,
        filter: t < 0.5 ? `blur(${(1 - t * 2) * 40}px)` : undefined,
      }
    },
    hold: (t) => {
      const shake = Math.sin(t * 20) * 1.5
      return { transform: `translate(${shake}px, ${shake * 0.7}px)` }
    },
    exit: (t) => {
      return { opacity: 1 - t * t, transform: `scale(${1 + t * 8})`, filter: `blur(${t * 15}px)` }
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // WHIP — Fast directional sweeps
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'whip-right',
    name: 'Whip Right',
    category: 'whip',
    enterFraction: 0.08,
    exitFraction: 0.08,
    enter: (t) => {
      const p = ease.outBackHard(t)
      return {
        opacity: Math.min(1, t * 6),
        transform: `translateX(${(1 - p) * -1200}px) rotate(${(1 - p) * -8}deg) skewX(${(1 - p) * -20}deg)`,
      }
    },
    exit: (t) => {
      const p = ease.in(t)
      return { opacity: 1 - p, transform: `translateX(${p * 1200}px) skewX(${p * 20}deg)` }
    },
  },
  {
    id: 'whip-left',
    name: 'Whip Left',
    category: 'whip',
    enterFraction: 0.08,
    exitFraction: 0.08,
    enter: (t) => {
      const p = ease.outBackHard(t)
      return {
        opacity: Math.min(1, t * 6),
        transform: `translateX(${(1 - p) * 1200}px) rotate(${(1 - p) * 8}deg) skewX(${(1 - p) * 20}deg)`,
      }
    },
    exit: (t) => {
      const p = ease.in(t)
      return { opacity: 1 - p, transform: `translateX(${-p * 1200}px) skewX(${-p * 20}deg)` }
    },
  },
  {
    id: 'whip-diagonal',
    name: 'Whip Diagonal',
    category: 'whip',
    enterFraction: 0.1,
    exitFraction: 0.08,
    enter: (t) => {
      const p = ease.outBack(t)
      return {
        opacity: Math.min(1, t * 5),
        transform: `translate(${(1 - p) * -800}px, ${(1 - p) * 600}px) rotate(${(1 - p) * -25}deg) scale(${0.3 + p * 0.7})`,
      }
    },
    exit: (t) => {
      const p = ease.in(t)
      return { opacity: 1 - p, transform: `translate(${p * 800}px, ${-p * 600}px) rotate(${p * 25}deg)` }
    },
  },
  {
    id: 'whip-spin',
    name: 'Whip Spin',
    category: 'whip',
    enterFraction: 0.12,
    exitFraction: 0.08,
    enter: (t) => {
      const p = ease.outBack(t)
      return {
        opacity: Math.min(1, t * 4),
        transform: `translateX(${(1 - p) * -1000}px) rotate(${(1 - p) * -720}deg) scale(${0.2 + p * 0.8})`,
      }
    },
    exit: (t) => {
      const p = ease.in(t)
      return { opacity: 1 - p, transform: `translateX(${p * 1000}px) rotate(${p * 360}deg) scale(${1 - p * 0.5})` }
    },
  },
  {
    id: 'boomerang',
    name: 'Boomerang',
    category: 'whip',
    enterFraction: 0.15,
    exitFraction: 0.1,
    enter: (t) => {
      // Swing in from far right, overshoot left, settle center
      const x = t < 0.6
        ? (1 - t / 0.6) * 1500
        : -Math.sin((t - 0.6) / 0.4 * Math.PI) * 80
      const rot = t < 0.6 ? (1 - t / 0.6) * 30 : -Math.sin((t - 0.6) / 0.4 * Math.PI) * 5
      return {
        opacity: Math.min(1, t * 4),
        transform: `translateX(${x}px) rotate(${rot}deg)`,
      }
    },
    exit: (t) => {
      const p = ease.in(t)
      return { opacity: 1 - p, transform: `translateX(${-p * 1500}px) rotate(${-p * 30}deg)` }
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // SHAKE — Vibrate and tremble
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'earthquake',
    name: 'Earthquake',
    category: 'shake',
    enterFraction: 0.1,
    exitFraction: 0.1,
    enter: (t) => {
      const p = ease.outBack(t)
      return { opacity: Math.min(1, t * 5), transform: `scale(${3 - 2 * p}) rotate(${(1 - t) * 15 * Math.sin(t * 40)}deg)` }
    },
    hold: (t) => {
      const freq = 15 + t * 10
      const amp = 4 * (1 - t * 0.5)
      const x = Math.sin(t * freq * Math.PI) * amp
      const y = Math.cos(t * freq * Math.PI * 1.3) * amp * 0.6
      const rot = Math.sin(t * freq * Math.PI * 0.7) * 1.5
      return { transform: `translate(${x}px, ${y}px) rotate(${rot}deg)` }
    },
    exit: (t) => {
      const p = ease.in(t)
      return { opacity: 1 - p, transform: `scale(${1 - p * 0.5}) translateY(${p * 200}px)` }
    },
  },
  {
    id: 'vibrate',
    name: 'Vibrate',
    category: 'shake',
    enterFraction: 0.06,
    exitFraction: 0.06,
    enter: (t) => {
      const p = ease.snap(t)
      return { opacity: Math.min(1, t * 10), transform: `scale(${5 - 4 * p})` }
    },
    hold: (t) => {
      const x = Math.sin(t * 60 * Math.PI) * 3
      const y = Math.cos(t * 50 * Math.PI) * 2
      return { transform: `translate(${x}px, ${y}px)` }
    },
    exit: (t) => {
      return { opacity: 1 - t, transform: `scale(${1 - t})` }
    },
  },
  {
    id: 'jitter-snap',
    name: 'Jitter Snap',
    category: 'shake',
    enterFraction: 0.15,
    exitFraction: 0.08,
    enter: (t) => {
      // Random-feeling jitter that snaps to final position
      const jitterX = (1 - t) * (Math.sin(t * 80) * 30 + Math.cos(t * 130) * 15)
      const jitterY = (1 - t) * (Math.cos(t * 70) * 20 + Math.sin(t * 110) * 10)
      const jitterRot = (1 - t) * Math.sin(t * 90) * 10
      return {
        opacity: Math.min(1, t * 3),
        transform: `translate(${jitterX}px, ${jitterY}px) rotate(${jitterRot}deg) scale(${0.8 + t * 0.2})`,
      }
    },
    exit: (t) => {
      const jitterX = t * Math.sin(t * 60) * 20
      return { opacity: 1 - t * t, transform: `translateX(${jitterX}px)` }
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // GLITCH — Digital distortion
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'glitch-slam',
    name: 'Glitch Slam',
    category: 'glitch',
    enterFraction: 0.15,
    exitFraction: 0.1,
    enter: (t) => {
      const p = ease.snap(t)
      const glitchX = t < 0.8 ? Math.sin(t * 100) * 20 * (1 - t) : 0
      const skew = t < 0.8 ? Math.sin(t * 60) * 8 * (1 - t) : 0
      return {
        opacity: t < 0.1 ? 0 : t < 0.15 ? 1 : t < 0.2 ? 0 : Math.min(1, t * 3),
        transform: `translateX(${glitchX}px) scaleY(${0.3 + p * 0.7}) skewX(${skew}deg)`,
      }
    },
    hold: (t) => {
      // Occasional glitch flicker
      const glitch = Math.sin(t * 50) > 0.9
      return glitch
        ? { transform: `translateX(${Math.sin(t * 200) * 8}px) skewX(${Math.sin(t * 150) * 3}deg)` }
        : {}
    },
    exit: (t) => {
      const slices = Math.sin(t * 80) * 15 * t
      return {
        opacity: t > 0.8 ? 0 : t > 0.7 ? 1 : t > 0.6 ? 0 : 1 - t * 0.3,
        transform: `translateX(${slices}px) scaleY(${1 - t * 0.5}) skewX(${t * 15}deg)`,
      }
    },
  },
  {
    id: 'digital-corrupt',
    name: 'Digital Corrupt',
    category: 'glitch',
    enterFraction: 0.2,
    exitFraction: 0.1,
    enter: (t) => {
      const p = ease.out(t)
      // Stutter-step entrance with scale jumps
      const scaleJump = t < 0.3 ? [3, 0.5, 2, 0.8, 1.5][Math.floor(t * 15) % 5] : 1
      const xShift = t < 0.5 ? Math.sin(t * 80) * 30 * (1 - t * 2) : 0
      return {
        opacity: t < 0.05 ? 0 : t < 0.1 ? 1 : t < 0.15 ? 0.3 : p,
        transform: `scale(${t < 0.3 ? scaleJump : 1}) translateX(${xShift}px)`,
        filter: t < 0.4 ? `brightness(${1 + (1 - t / 0.4) * 2})` : undefined,
      }
    },
    exit: (t) => {
      const flicker = Math.sin(t * 40) > 0.3 ? 1 : 0
      return { opacity: t > 0.8 ? 0 : flicker * (1 - t), transform: `scaleX(${1 + t * 3})` }
    },
  },
  {
    id: 'scanline',
    name: 'Scanline',
    category: 'glitch',
    enterFraction: 0.15,
    exitFraction: 0.1,
    enter: (t) => {
      const p = ease.out(t)
      const scan = t * 100
      return {
        opacity: p,
        transform: `scaleY(${0.01 + p * 0.99})`,
        clipPath: t < 0.8
          ? `polygon(0 ${scan % 20}%, 100% ${scan % 20}%, 100% ${(scan % 20) + 5}%, 0 ${(scan % 20) + 5}%, 0 ${(scan + 30) % 100}%, 100% ${(scan + 30) % 100}%, 100% ${((scan + 30) % 100) + 8}%, 0 ${((scan + 30) % 100) + 8}%, 0 ${(scan + 60) % 100}%, 100% ${(scan + 60) % 100}%, 100% 100%, 0 100%)`
          : undefined,
      }
    },
    exit: (t) => {
      return { opacity: 1 - t, transform: `scaleY(${1 - t * 0.95})` }
    },
  },
  {
    id: 'rgb-split',
    name: 'RGB Split',
    category: 'glitch',
    enterFraction: 0.12,
    exitFraction: 0.08,
    enter: (t) => {
      const p = ease.outBack(t)
      const split = (1 - p) * 15
      return {
        opacity: Math.min(1, t * 4),
        transform: `scale(${2 - p})`,
        textShadow: split > 0.5
          ? `${-split}px 0 rgba(255,0,0,0.7), ${split}px 0 rgba(0,255,255,0.7), 0 ${split * 0.5}px rgba(0,255,0,0.5)`
          : undefined,
      }
    },
    hold: (t) => {
      const glitch = Math.sin(t * 30) > 0.85
      const s = glitch ? 4 + Math.sin(t * 200) * 3 : 0
      return glitch
        ? { textShadow: `${-s}px 0 rgba(255,0,0,0.7), ${s}px 0 rgba(0,255,255,0.7)`, transform: `translateX(${s * 0.5}px)` }
        : {}
    },
    exit: (t) => {
      const split = t * 20
      return { opacity: 1 - t, textShadow: `${-split}px 0 rgba(255,0,0,0.5), ${split}px 0 rgba(0,255,255,0.5)` }
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // 3D FLIP — Perspective rotations
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'flip-x',
    name: 'Flip Horizontal',
    category: '3d-flip',
    enterFraction: 0.12,
    exitFraction: 0.1,
    enter: (t) => {
      const p = ease.outBack(t)
      return {
        opacity: Math.min(1, t * 3),
        transform: `perspective(800px) rotateY(${(1 - p) * 90}deg) scale(${0.5 + p * 0.5})`,
      }
    },
    exit: (t) => {
      const p = ease.in(t)
      return { opacity: 1 - p, transform: `perspective(800px) rotateY(${-p * 90}deg)` }
    },
  },
  {
    id: 'flip-y',
    name: 'Flip Vertical',
    category: '3d-flip',
    enterFraction: 0.12,
    exitFraction: 0.1,
    enter: (t) => {
      const p = ease.outBack(t)
      return {
        opacity: Math.min(1, t * 3),
        transform: `perspective(800px) rotateX(${(1 - p) * -90}deg) translateY(${(1 - p) * 100}px)`,
      }
    },
    exit: (t) => {
      const p = ease.in(t)
      return { opacity: 1 - p, transform: `perspective(800px) rotateX(${p * 90}deg) translateY(${-p * 100}px)` }
    },
  },
  {
    id: 'cube-turn',
    name: 'Cube Turn',
    category: '3d-flip',
    enterFraction: 0.15,
    exitFraction: 0.1,
    enter: (t) => {
      const p = ease.outBack(t)
      return {
        opacity: Math.min(1, t * 3),
        transform: `perspective(600px) rotateY(${(1 - p) * -90}deg) translateZ(${(1 - p) * -200}px) translateX(${(1 - p) * -300}px)`,
      }
    },
    exit: (t) => {
      const p = ease.in(t)
      return { opacity: 1 - p, transform: `perspective(600px) rotateY(${p * 90}deg) translateZ(${-p * 200}px) translateX(${p * 300}px)` }
    },
  },
  {
    id: 'door-swing',
    name: 'Door Swing',
    category: '3d-flip',
    enterFraction: 0.15,
    exitFraction: 0.1,
    enter: (t) => {
      const p = ease.outElastic(t)
      return {
        opacity: Math.min(1, t * 3),
        // transformOrigin is set on the element — this simulates a left-hinged door
        transform: `perspective(800px) rotateY(${(1 - p) * -110}deg)`,
      }
    },
    exit: (t) => {
      const p = ease.in(t)
      return { opacity: 1 - p, transform: `perspective(800px) rotateY(${p * 110}deg)` }
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // ZOOM — Scale-based attention grabbers
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'zoom-snap',
    name: 'Zoom Snap',
    category: 'zoom',
    enterFraction: 0.06,
    exitFraction: 0.06,
    enter: (t) => {
      const p = ease.snap(t)
      return {
        opacity: Math.min(1, t * 10),
        transform: `scale(${6 - 5 * p})`,
        filter: t < 0.3 ? `blur(${(1 - t / 0.3) * 10}px)` : undefined,
      }
    },
    exit: (t) => {
      return { opacity: 1 - ease.in(t), transform: `scale(${1 - t * 0.9})` }
    },
  },
  {
    id: 'zoom-rotate-snap',
    name: 'Zoom Rotate',
    category: 'zoom',
    enterFraction: 0.1,
    exitFraction: 0.08,
    enter: (t) => {
      const p = ease.outBack(t)
      return {
        opacity: Math.min(1, t * 5),
        transform: `scale(${8 - 7 * p}) rotate(${(1 - p) * 180}deg)`,
        filter: t < 0.3 ? `blur(${(1 - t / 0.3) * 12}px)` : undefined,
      }
    },
    exit: (t) => {
      const p = ease.in(t)
      return { opacity: 1 - p, transform: `scale(${1 + p * 4}) rotate(${p * -90}deg)`, filter: `blur(${p * 8}px)` }
    },
  },
  {
    id: 'pop-scale',
    name: 'Pop Scale',
    category: 'zoom',
    enterFraction: 0.08,
    exitFraction: 0.06,
    enter: (t) => {
      const p = ease.outElastic(t)
      return {
        opacity: Math.min(1, t * 6),
        transform: `scale(${p})`,
      }
    },
    exit: (t) => {
      return { opacity: 1 - t * t, transform: `scale(${1 + t * 2})`, filter: `blur(${t * 6}px)` }
    },
  },
  {
    id: 'scale-overshoot',
    name: 'Scale Overshoot',
    category: 'zoom',
    enterFraction: 0.1,
    exitFraction: 0.06,
    enter: (t) => {
      const p = ease.spring(t)
      return {
        opacity: Math.min(1, t * 5),
        transform: `scale(${p})`,
      }
    },
    exit: (t) => {
      return { opacity: 1 - t, transform: `scale(${1 - t})` }
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // BOUNCE — Elastic and springy
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'bounce-slam',
    name: 'Bounce Slam',
    category: 'bounce',
    enterFraction: 0.2,
    exitFraction: 0.08,
    enter: (t) => {
      const p = ease.outBounce(t)
      return {
        opacity: Math.min(1, t * 4),
        transform: `translateY(${(1 - p) * -500}px) scale(${0.8 + p * 0.2})`,
      }
    },
    exit: (t) => {
      const p = ease.in(t)
      return { opacity: 1 - p, transform: `translateY(${p * 300}px)` }
    },
  },
  {
    id: 'spring-pop',
    name: 'Spring Pop',
    category: 'bounce',
    enterFraction: 0.15,
    exitFraction: 0.08,
    enter: (t) => {
      const p = ease.spring(t)
      return {
        opacity: Math.min(1, t * 4),
        transform: `scale(${p}) rotate(${(1 - p) * 10 * Math.sin(t * 20)}deg)`,
      }
    },
    exit: (t) => {
      return { opacity: 1 - t * t, transform: `scale(${1 - t * 0.8})` }
    },
  },
  {
    id: 'rubber-band',
    name: 'Rubber Band',
    category: 'bounce',
    enterFraction: 0.2,
    exitFraction: 0.1,
    enter: (t) => {
      const p = ease.outElastic(t)
      return {
        opacity: Math.min(1, t * 3),
        transform: `scaleX(${p}) scaleY(${2 - p})`,
      }
    },
    hold: (t) => {
      const squash = Math.sin(t * 8) * 0.03
      return { transform: `scaleX(${1 + squash}) scaleY(${1 - squash})` }
    },
    exit: (t) => {
      const p = ease.in(t)
      return { opacity: 1 - p, transform: `scaleX(${1 + p * 2}) scaleY(${1 - p * 0.5})` }
    },
  },
  {
    id: 'trampoline',
    name: 'Trampoline',
    category: 'bounce',
    enterFraction: 0.25,
    exitFraction: 0.08,
    enter: (t) => {
      // Multi-bounce from bottom
      const bounceH = ease.outBounce(t)
      const squash = t > 0.3 && t < 0.5 ? 0.15 : t > 0.6 && t < 0.7 ? 0.05 : 0
      return {
        opacity: Math.min(1, t * 3),
        transform: `translateY(${(1 - bounceH) * 400}px) scaleY(${1 - squash}) scaleX(${1 + squash * 0.5})`,
      }
    },
    exit: (t) => {
      return { opacity: 1 - t, transform: `translateY(${-t * 500}px) scale(${1 - t * 0.3})` }
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // REVEAL — Wipe and mask reveals
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'wipe-right',
    name: 'Wipe Right',
    category: 'reveal',
    enterFraction: 0.12,
    exitFraction: 0.1,
    enter: (t) => {
      const p = ease.outHard(t)
      return {
        clipPath: `polygon(0 0, ${p * 100}% 0, ${p * 100}% 100%, 0 100%)`,
      }
    },
    exit: (t) => {
      const p = ease.in(t)
      return { clipPath: `polygon(${p * 100}% 0, 100% 0, 100% 100%, ${p * 100}% 100%)` }
    },
  },
  {
    id: 'wipe-down',
    name: 'Wipe Down',
    category: 'reveal',
    enterFraction: 0.12,
    exitFraction: 0.1,
    enter: (t) => {
      const p = ease.outHard(t)
      return {
        clipPath: `polygon(0 0, 100% 0, 100% ${p * 100}%, 0 ${p * 100}%)`,
      }
    },
    exit: (t) => {
      const p = ease.in(t)
      return { clipPath: `polygon(0 ${p * 100}%, 100% ${p * 100}%, 100% 100%, 0 100%)` }
    },
  },
  {
    id: 'circle-reveal',
    name: 'Circle Reveal',
    category: 'reveal',
    enterFraction: 0.15,
    exitFraction: 0.1,
    enter: (t) => {
      const p = ease.out(t)
      return {
        clipPath: `circle(${p * 75}% at 50% 50%)`,
      }
    },
    exit: (t) => {
      const p = ease.in(t)
      return { clipPath: `circle(${(1 - p) * 75}% at 50% 50%)` }
    },
  },
  {
    id: 'diamond-reveal',
    name: 'Diamond Reveal',
    category: 'reveal',
    enterFraction: 0.15,
    exitFraction: 0.1,
    enter: (t) => {
      const p = ease.out(t)
      const s = p * 55
      return {
        clipPath: `polygon(50% ${50 - s}%, ${50 + s}% 50%, 50% ${50 + s}%, ${50 - s}% 50%)`,
      }
    },
    exit: (t) => {
      const p = ease.in(t)
      const s = (1 - p) * 55
      return { clipPath: `polygon(50% ${50 - s}%, ${50 + s}% 50%, 50% ${50 + s}%, ${50 - s}% 50%)` }
    },
  },
  {
    id: 'slash-reveal',
    name: 'Slash Reveal',
    category: 'reveal',
    enterFraction: 0.1,
    exitFraction: 0.08,
    enter: (t) => {
      const p = ease.outHard(t)
      const w = p * 120
      return {
        clipPath: `polygon(${w - 20}% 0, ${w}% 0, ${w - 80}% 100%, ${w - 100}% 100%)`,
        opacity: t < 0.6 ? undefined : 1,
      }
    },
    exit: (t) => {
      const p = ease.in(t)
      return { opacity: 1 - p * p, clipPath: `polygon(0 0, ${(1 - p) * 100}% 0, ${(1 - p) * 100}% 100%, 0 100%)` }
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // KINETIC — Circular and path-based motion
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'spiral-in',
    name: 'Spiral In',
    category: 'kinetic',
    enterFraction: 0.2,
    exitFraction: 0.1,
    enter: (t) => {
      const angle = (1 - t) * 720 * (Math.PI / 180)
      const radius = (1 - ease.out(t)) * 400
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius
      const scale = 0.1 + ease.out(t) * 0.9
      return {
        opacity: Math.min(1, t * 3),
        transform: `translate(${x}px, ${y}px) scale(${scale}) rotate(${(1 - t) * 720}deg)`,
      }
    },
    exit: (t) => {
      const angle = t * 360 * (Math.PI / 180)
      const radius = ease.in(t) * 300
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius
      return { opacity: 1 - t, transform: `translate(${x}px, ${y}px) rotate(${t * 360}deg) scale(${1 - t * 0.5})` }
    },
  },
  {
    id: 'orbit',
    name: 'Orbit',
    category: 'kinetic',
    enterFraction: 0.15,
    exitFraction: 0.1,
    enter: (t) => {
      const angle = (1 - t) * 360 * (Math.PI / 180)
      const radius = (1 - ease.outBack(t)) * 500
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius * 0.3 // elliptical
      return {
        opacity: Math.min(1, t * 3),
        transform: `translate(${x}px, ${y}px) scale(${0.3 + t * 0.7})`,
      }
    },
    hold: (t) => {
      const wobble = Math.sin(t * 6) * 3
      return { transform: `translateY(${wobble}px)` }
    },
    exit: (t) => {
      const angle = t * 180 * (Math.PI / 180)
      const radius = ease.in(t) * 400
      return { opacity: 1 - t, transform: `translate(${Math.cos(angle) * radius}px, ${Math.sin(angle) * radius * 0.3}px) scale(${1 - t * 0.5})` }
    },
  },
  {
    id: 'pendulum',
    name: 'Pendulum',
    category: 'kinetic',
    enterFraction: 0.2,
    exitFraction: 0.1,
    enter: (t) => {
      // Swing from top-right corner like a pendulum
      const damping = Math.exp(-4 * t)
      const angle = damping * 60 * Math.cos(t * 10 * Math.PI)
      return {
        opacity: Math.min(1, t * 3),
        transform: `rotate(${angle}deg)`,
        // transform-origin would be top-center, simulated here
      }
    },
    exit: (t) => {
      const p = ease.in(t)
      return { opacity: 1 - p, transform: `rotate(${p * 45}deg) translateY(${p * 200}px)` }
    },
  },
  {
    id: 'arc-sweep',
    name: 'Arc Sweep',
    category: 'kinetic',
    enterFraction: 0.12,
    exitFraction: 0.08,
    enter: (t) => {
      const p = ease.outBack(t)
      // Follow a curved arc from bottom-left to center
      const angle = (1 - p) * Math.PI * 0.75
      const radius = (1 - p) * 600
      const x = -Math.cos(angle) * radius
      const y = Math.sin(angle) * radius
      return {
        opacity: Math.min(1, t * 4),
        transform: `translate(${x}px, ${y}px) rotate(${(1 - p) * -30}deg) scale(${0.5 + p * 0.5})`,
      }
    },
    exit: (t) => {
      const p = ease.in(t)
      const angle = p * Math.PI * 0.5
      const radius = p * 500
      return { opacity: 1 - p, transform: `translate(${Math.cos(angle) * radius}px, ${-Math.sin(angle) * radius}px) rotate(${p * 30}deg)` }
    },
  },
  {
    id: 'figure-eight',
    name: 'Figure Eight',
    category: 'kinetic',
    enterFraction: 0.25,
    exitFraction: 0.1,
    enter: (t) => {
      // Lemniscate (figure-8) path that converges to center
      const a = (1 - t) * 300
      const angle = t * 4 * Math.PI
      const x = a * Math.cos(angle) / (1 + Math.sin(angle) * Math.sin(angle))
      const y = a * Math.sin(angle) * Math.cos(angle) / (1 + Math.sin(angle) * Math.sin(angle))
      return {
        opacity: Math.min(1, t * 2.5),
        transform: `translate(${x}px, ${y}px) scale(${0.3 + t * 0.7})`,
      }
    },
    exit: (t) => {
      const p = ease.in(t)
      return { opacity: 1 - p, transform: `scale(${1 + p * 3}) rotate(${p * 90}deg)`, filter: `blur(${p * 10}px)` }
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // SPLIT — Text splitting and reassembling
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'split-horizontal',
    name: 'Split Open',
    category: 'split',
    enterFraction: 0.12,
    exitFraction: 0.1,
    enter: (t) => {
      const p = ease.outBack(t)
      return {
        opacity: Math.min(1, t * 4),
        transform: `scaleX(${p})`,
        letterSpacing: `${(1 - p) * 50}px`,
      }
    },
    exit: (t) => {
      const p = ease.in(t)
      return { opacity: 1 - p, letterSpacing: `${p * 80}px`, filter: `blur(${p * 6}px)` }
    },
  },
  {
    id: 'split-vertical',
    name: 'Split Vertical',
    category: 'split',
    enterFraction: 0.12,
    exitFraction: 0.1,
    enter: (t) => {
      const p = ease.outBack(t)
      return {
        opacity: Math.min(1, t * 4),
        transform: `scaleY(${p})`,
        filter: t < 0.5 ? `blur(${(1 - t * 2) * 4}px)` : undefined,
      }
    },
    exit: (t) => {
      const p = ease.in(t)
      return { opacity: 1 - p, transform: `scaleY(${1 - p * 0.9})`, filter: `blur(${p * 8}px)` }
    },
  },
  {
    id: 'stretch-snap',
    name: 'Stretch Snap',
    category: 'split',
    enterFraction: 0.1,
    exitFraction: 0.08,
    enter: (t) => {
      const p = ease.outElastic(t)
      return {
        opacity: Math.min(1, t * 5),
        transform: `scaleX(${p * 1.0}) scaleY(${Math.max(0.01, 1 - (1 - t) * 0.8)})`,
      }
    },
    exit: (t) => {
      return { opacity: 1 - t, transform: `scaleX(${1 + t * 5}) scaleY(${1 - t * 0.8})` }
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // PULSE — Rhythmic attention effects
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'heartbeat',
    name: 'Heartbeat',
    category: 'pulse',
    enterFraction: 0.08,
    exitFraction: 0.08,
    enter: (t) => {
      const p = ease.outBack(t)
      return { opacity: Math.min(1, t * 6), transform: `scale(${p})` }
    },
    hold: (t) => {
      // Double-beat pattern
      const beat = t * 4 % 1
      const doublePulse = beat < 0.15 ? 1.15
        : beat < 0.25 ? 1 + (0.25 - beat) * 1.5
        : beat < 0.35 ? 1.1
        : beat < 0.45 ? 1 + (0.45 - beat) * 1.0
        : 1
      return { transform: `scale(${doublePulse})` }
    },
    exit: (t) => {
      return { opacity: 1 - t * t, transform: `scale(${1 + t * 0.5})` }
    },
  },
  {
    id: 'strobe',
    name: 'Strobe',
    category: 'pulse',
    enterFraction: 0.15,
    exitFraction: 0.06,
    enter: (t) => {
      // Fast on/off flicker that resolves to solid
      const flickerRate = 30
      const flicker = t < 0.6 ? (Math.sin(t * flickerRate * Math.PI) > 0 ? 1 : 0) : 1
      const scale = ease.outBack(t)
      return {
        opacity: flicker,
        transform: `scale(${0.8 + scale * 0.2})`,
        filter: t < 0.3 ? `brightness(${1 + (1 - t / 0.3) * 3})` : undefined,
      }
    },
    exit: (t) => {
      const flicker = Math.sin(t * 25 * Math.PI) > 0 ? 1 - t : 0
      return { opacity: flicker }
    },
  },
  {
    id: 'neon-pulse',
    name: 'Neon Pulse',
    category: 'pulse',
    enterFraction: 0.12,
    exitFraction: 0.1,
    enter: (t) => {
      const p = ease.outBack(t)
      return {
        opacity: Math.min(1, t * 4),
        transform: `scale(${p})`,
        textShadow: `0 0 ${20 + (1 - t) * 40}px currentColor, 0 0 ${40 + (1 - t) * 80}px currentColor`,
      }
    },
    hold: (t) => {
      const glow = 15 + Math.sin(t * 10) * 10
      return { textShadow: `0 0 ${glow}px currentColor, 0 0 ${glow * 2}px currentColor` }
    },
    exit: (t) => {
      const p = ease.in(t)
      return {
        opacity: 1 - p,
        textShadow: `0 0 ${(1 - p) * 30}px currentColor`,
      }
    },
  },
  {
    id: 'flash-bang',
    name: 'Flash Bang',
    category: 'pulse',
    enterFraction: 0.06,
    exitFraction: 0.06,
    enter: (t) => {
      const p = ease.snap(t)
      return {
        opacity: Math.min(1, t * 10),
        transform: `scale(${10 - 9 * p})`,
        filter: `brightness(${1 + (1 - t) * 5})`,
      }
    },
    hold: (t) => {
      const pulse = t * 3 % 1
      const brightness = pulse < 0.1 ? 2 : 1
      return { filter: `brightness(${brightness})` }
    },
    exit: (t) => {
      return { opacity: 1 - t, filter: `brightness(${1 + t * 3})`, transform: `scale(${1 + t * 2})` }
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // EXIT — Dramatic exits
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'explode-out',
    name: 'Explode Out',
    category: 'exit',
    enterFraction: 0.08,
    exitFraction: 0.1,
    enter: (t) => {
      const p = ease.outBack(t)
      return { opacity: Math.min(1, t * 6), transform: `scale(${p})` }
    },
    exit: (t) => {
      const p = ease.in(t)
      return {
        opacity: 1 - p * p,
        transform: `scale(${1 + p * 8}) rotate(${p * 45}deg)`,
        filter: `blur(${p * 20}px)`,
      }
    },
  },
  {
    id: 'suck-away',
    name: 'Suck Away',
    category: 'exit',
    enterFraction: 0.1,
    exitFraction: 0.12,
    enter: (t) => {
      const p = ease.outBack(t)
      return { opacity: Math.min(1, t * 5), transform: `scale(${p})` }
    },
    exit: (t) => {
      const p = ease.in(t)
      const spin = p * 540
      return {
        opacity: 1 - p,
        transform: `scale(${1 - p * 0.95}) rotate(${spin}deg)`,
      }
    },
  },
  {
    id: 'fall-away',
    name: 'Fall Away',
    category: 'exit',
    enterFraction: 0.1,
    exitFraction: 0.15,
    enter: (t) => {
      const p = ease.outBack(t)
      return { opacity: Math.min(1, t * 5), transform: `scale(${p})` }
    },
    exit: (t) => {
      const p = ease.in(t)
      return {
        opacity: 1 - p,
        transform: `perspective(800px) rotateX(${p * 90}deg) translateY(${p * 300}px) scale(${1 - p * 0.3})`,
      }
    },
  },
  {
    id: 'glitch-out',
    name: 'Glitch Out',
    category: 'exit',
    enterFraction: 0.08,
    exitFraction: 0.15,
    enter: (t) => {
      const p = ease.outBack(t)
      return { opacity: Math.min(1, t * 6), transform: `scale(${p})` }
    },
    exit: (t) => {
      const sliceX = Math.sin(t * 80) * 30 * t
      const flicker = Math.sin(t * 30) > 0.2 ? 1 - t * 0.5 : 0
      return {
        opacity: flicker,
        transform: `translateX(${sliceX}px) scaleY(${1 - t * 0.6}) skewX(${t * 20}deg)`,
        textShadow: `${-t * 10}px 0 rgba(255,0,0,0.5), ${t * 10}px 0 rgba(0,255,255,0.5)`,
      }
    },
  },
  // ── Handwriting / Whiteboard ──
  {
    id: 'handwriting',
    name: 'Handwriting',
    category: 'reveal',
    enterFraction: 0.6,
    exitFraction: 0.08,
    enter: (t) => {
      const p = t
      return {
        clipPath: `polygon(0 0, ${p * 100}% 0, ${p * 100}% 100%, 0 100%)`,
      }
    },
    exit: (t) => {
      const p = ease.in(t)
      return { opacity: 1 - p }
    },
  },
  {
    id: 'typewriter',
    name: 'Typewriter',
    category: 'reveal',
    enterFraction: 0.7,
    exitFraction: 0.08,
    enter: (t) => {
      // Step-based reveal for typewriter effect
      const steps = 20
      const stepped = Math.floor(t * steps) / steps
      return {
        clipPath: `polygon(0 0, ${stepped * 100}% 0, ${stepped * 100}% 100%, 0 100%)`,
      }
    },
    exit: (t) => {
      const p = ease.in(t)
      return { opacity: 1 - p }
    },
  },
]

// ── Category metadata for UI ──────────────────────────────────

export const CATEGORY_INFO: Record<TextAnimationCategory, { label: string; icon: string; order: number }> = {
  impact:   { label: 'Impact',   icon: '💥', order: 0 },
  takeover: { label: 'Takeover', icon: '🔥', order: 1 },
  whip:     { label: 'Whip',     icon: '⚡', order: 2 },
  shake:    { label: 'Shake',    icon: '📳', order: 3 },
  glitch:   { label: 'Glitch',   icon: '👾', order: 4 },
  '3d-flip':{ label: '3D Flip',  icon: '🎲', order: 5 },
  zoom:     { label: 'Zoom',     icon: '🔎', order: 6 },
  bounce:   { label: 'Bounce',   icon: '🏀', order: 7 },
  reveal:   { label: 'Reveal',   icon: '🎭', order: 8 },
  kinetic:  { label: 'Kinetic',  icon: '🌀', order: 9 },
  split:    { label: 'Split',    icon: '✂️', order: 10 },
  pulse:    { label: 'Pulse',    icon: '💓', order: 11 },
  exit:     { label: 'Exit',     icon: '💨', order: 12 },
}

// ── Compute function ──────────────────────────────────────────

export function computeTextAnimation(
  presetId: string,
  currentFrame: number,
  startFrame: number,
  endFrame: number,
  fps: number,
): TextAnimationStyle | undefined {
  const preset = TEXT_ANIMATION_PRESETS.find((p) => p.id === presetId)
  if (!preset) return undefined

  // Clamp endFrame to prevent Infinity math issues
  const safeEnd = Number.isFinite(endFrame) ? endFrame : startFrame + fps * 10
  const totalFrames = Math.max(1, safeEnd - startFrame)
  const elapsed = currentFrame - startFrame

  if (elapsed < 0) return { opacity: 0 }
  if (elapsed > totalFrames) return undefined // animation done — show text normally

  const enterFrac = preset.enterFraction ?? 0.15
  const exitFrac = preset.exitFraction ?? 0.15

  const enterFrames = Math.max(1, Math.round(totalFrames * enterFrac))
  const exitFrames = Math.max(1, Math.round(totalFrames * exitFrac))

  // Enter phase
  if (elapsed < enterFrames) {
    const t = elapsed / enterFrames
    return preset.enter(Math.max(0, Math.min(1, t)))
  }

  // Exit phase
  if (elapsed > totalFrames - exitFrames) {
    const t = (elapsed - (totalFrames - exitFrames)) / exitFrames
    return preset.exit(Math.max(0, Math.min(1, t)))
  }

  // Hold phase
  if (preset.hold) {
    const holdStart = enterFrames
    const holdEnd = totalFrames - exitFrames
    const holdDuration = Math.max(1, holdEnd - holdStart)
    const t = (elapsed - holdStart) / holdDuration
    return preset.hold(Math.max(0, Math.min(1, t)))
  }

  return undefined
}
