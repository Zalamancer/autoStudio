export type GradientType = 'linear' | 'radial' | 'conic'

export interface GradientColorStop {
  id: string
  color: string      // hex, rgb, or rgba
  position: number   // 0-1
}

export interface GradientFill {
  type: GradientType
  stops: GradientColorStop[]
  // Linear-specific
  angle: number                  // degrees, for linear
  // Radial-specific
  centerX: number                // 0-1, relative to shape bounds
  centerY: number                // 0-1, relative to shape bounds
  radius: number                 // multiplier (1 = fill shape, 2 = extend beyond)
  // Conic-specific
  startAngle?: number            // degrees
  // Animation
  animateAngle?: boolean         // shortcut: auto-rotate angle over time
  animateSpeed?: number          // degrees per frame for auto-rotation
}

export const GRADIENT_PRESETS: { label: string; fill: GradientFill }[] = [
  {
    label: 'Sunset',
    fill: {
      type: 'linear',
      angle: 135,
      stops: [
        { id: 's1', color: '#ff6b6b', position: 0 },
        { id: 's2', color: '#feca57', position: 0.5 },
        { id: 's3', color: '#48dbfb', position: 1 },
      ],
      centerX: 0.5, centerY: 0.5, radius: 1,
    }
  },
  {
    label: 'Ocean',
    fill: {
      type: 'radial',
      angle: 0,
      stops: [
        { id: 's1', color: '#0abde3', position: 0 },
        { id: 's2', color: '#1a0052', position: 1 },
      ],
      centerX: 0.5, centerY: 0.5, radius: 1,
    }
  },
  {
    label: 'Neon',
    fill: {
      type: 'linear',
      angle: 90,
      stops: [
        { id: 's1', color: '#f706cf', position: 0 },
        { id: 's2', color: '#3d04c4', position: 0.5 },
        { id: 's3', color: '#00f7ff', position: 1 },
      ],
      centerX: 0.5, centerY: 0.5, radius: 1,
    }
  },
  {
    label: 'Fire',
    fill: {
      type: 'radial',
      angle: 0,
      stops: [
        { id: 's1', color: '#fffc00', position: 0 },
        { id: 's2', color: '#ff6600', position: 0.5 },
        { id: 's3', color: '#cc0000', position: 1 },
      ],
      centerX: 0.5, centerY: 0.8, radius: 1,
    }
  },
  {
    label: 'Mint',
    fill: {
      type: 'linear',
      angle: 45,
      stops: [
        { id: 's1', color: '#a8edea', position: 0 },
        { id: 's2', color: '#fed6e3', position: 1 },
      ],
      centerX: 0.5, centerY: 0.5, radius: 1,
    }
  },
  {
    label: 'Aurora',
    fill: {
      type: 'conic',
      angle: 0,
      stops: [
        { id: 's1', color: '#667eea', position: 0 },
        { id: 's2', color: '#764ba2', position: 0.33 },
        { id: 's3', color: '#f093fb', position: 0.66 },
        { id: 's4', color: '#667eea', position: 1 },
      ],
      centerX: 0.5, centerY: 0.5, radius: 1,
      startAngle: 0,
    }
  },
  {
    label: 'Monochrome',
    fill: {
      type: 'linear',
      angle: 180,
      stops: [
        { id: 's1', color: '#2c3e50', position: 0 },
        { id: 's2', color: '#bdc3c7', position: 1 },
      ],
      centerX: 0.5, centerY: 0.5, radius: 1,
    }
  },
  {
    label: 'Rainbow',
    fill: {
      type: 'conic',
      angle: 0,
      stops: [
        { id: 's1', color: '#ff0000', position: 0 },
        { id: 's2', color: '#ff8800', position: 0.17 },
        { id: 's3', color: '#ffff00', position: 0.33 },
        { id: 's4', color: '#00ff00', position: 0.5 },
        { id: 's5', color: '#0088ff', position: 0.67 },
        { id: 's6', color: '#8800ff', position: 0.83 },
        { id: 's7', color: '#ff0000', position: 1 },
      ],
      centerX: 0.5, centerY: 0.5, radius: 1,
      startAngle: 0,
    }
  },
]
