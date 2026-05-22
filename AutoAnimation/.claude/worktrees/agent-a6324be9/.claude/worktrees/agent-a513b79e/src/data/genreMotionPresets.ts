/**
 * Genre-specific auto-motion presets — pre-built camera motion styles by film genre.
 */

import type { GenreMotionPreset } from '@/types/cinemaCamera'

export const GENRE_MOTION_PRESETS: GenreMotionPreset[] = [
  // ── Action ──────────────────────────────────────────────────────────
  {
    id: 'genre-action',
    name: 'Action',
    genre: 'action',
    description: 'Fast cuts, shaky cam, dynamic zooms',
    opticalOverrides: { aperture: 2.8, focalLength: 28, shutterAngle: 90 },
    keyframes: [
      { framePercent: 0, position: { x: -5, y: 2, z: 0 }, rotation: { x: 1, y: -3, z: 1 }, zoom: 1.1, easing: 'linear' },
      { framePercent: 12, position: { x: 4, y: -3, z: 0 }, rotation: { x: -1.5, y: 2, z: -1.5 }, zoom: 1.25, easing: 'linear' },
      { framePercent: 25, position: { x: -3, y: 1, z: 0 }, rotation: { x: 0.8, y: -1.5, z: 2 }, zoom: 1.05, easing: 'linear' },
      { framePercent: 38, position: { x: 6, y: -2, z: 0 }, rotation: { x: -2, y: 3, z: -1 }, zoom: 1.35, easing: 'linear' },
      { framePercent: 50, position: { x: -2, y: 3, z: 0 }, rotation: { x: 1.2, y: -2, z: 1.5 }, zoom: 1.1, easing: 'linear' },
      { framePercent: 65, position: { x: 5, y: -1, z: 0 }, rotation: { x: -0.5, y: 2.5, z: -2 }, zoom: 1.4, easing: 'linear' },
      { framePercent: 80, position: { x: -4, y: 2, z: 0 }, rotation: { x: 1.5, y: -1, z: 1 }, zoom: 1.15, easing: 'linear' },
      { framePercent: 100, position: { x: 3, y: -2, z: 0 }, rotation: { x: -1, y: 1.5, z: -0.5 }, zoom: 1.2, easing: 'linear' },
    ],
  },

  // ── Horror ──────────────────────────────────────────────────────────
  {
    id: 'genre-horror',
    name: 'Horror',
    genre: 'horror',
    description: 'Slow creep, sudden snap, dutch angles',
    opticalOverrides: { aperture: 2.0, focalLength: 35, dofEnabled: true },
    keyframes: [
      { framePercent: 0, position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, zoom: 1.05, easing: 'ease-in' },
      { framePercent: 40, position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, zoom: 1.15, easing: 'ease-in' },
      { framePercent: 45, position: { x: 5, y: -3, z: 0 }, rotation: { x: 0, y: 0, z: -8 }, zoom: 1.5, easing: 'ease-out' },
      { framePercent: 50, position: { x: -3, y: 2, z: 0 }, rotation: { x: 0, y: 0, z: 5 }, zoom: 1.3, easing: 'ease-out' },
      { framePercent: 60, position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: -3 }, zoom: 1.2, easing: 'ease-in' },
      { framePercent: 100, position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: -3 }, zoom: 1.4, easing: 'linear' },
    ],
  },

  // ── Comedy ─────────────────────────────────────────────────────────
  {
    id: 'genre-comedy',
    name: 'Comedy',
    genre: 'comedy',
    description: 'Steady medium shots, quick whip pans',
    opticalOverrides: { aperture: 4, focalLength: 35 },
    keyframes: [
      { framePercent: 0, position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, zoom: 1.1, easing: 'linear' },
      { framePercent: 40, position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, zoom: 1.1, easing: 'ease-in' },
      { framePercent: 50, position: { x: 20, y: 0, z: 0 }, rotation: { x: 0, y: 10, z: 0 }, zoom: 1.15, easing: 'ease-out' },
      { framePercent: 60, position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, zoom: 1.1, easing: 'linear' },
      { framePercent: 100, position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, zoom: 1.1, easing: 'linear' },
    ],
  },

  // ── Suspense ────────────────────────────────────────────────────────
  {
    id: 'genre-suspense',
    name: 'Suspense',
    genre: 'suspense',
    description: 'Slow dolly in, rack focus, claustrophobic zoom',
    opticalOverrides: { aperture: 1.4, focalLength: 50, dofEnabled: true },
    keyframes: [
      { framePercent: 0, position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, zoom: 1, focusDistance: 3, easing: 'ease-in' },
      { framePercent: 30, position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, zoom: 1.15, focusDistance: 3, easing: 'ease-in' },
      { framePercent: 50, position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, zoom: 1.3, focusDistance: 1.5, easing: 'ease-in' },
      { framePercent: 100, position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, zoom: 1.8, focusDistance: 0.8, easing: 'linear' },
    ],
  },

  // ── Romance ────────────────────────────────────────────────────────
  {
    id: 'genre-romance',
    name: 'Romance',
    genre: 'romance',
    description: 'Soft tracking, bokeh pulls, warm vignette',
    opticalOverrides: { aperture: 1.4, focalLength: 85, dofEnabled: true, bokehEnabled: true, vignettingEnabled: true, whiteBalance: 4800 },
    keyframes: [
      { framePercent: 0, position: { x: -3, y: 0, z: 0 }, rotation: { x: 0, y: -1, z: 0.5 }, zoom: 1.3, focusDistance: 2, easing: 'ease-in-out' },
      { framePercent: 30, position: { x: 0, y: 0.5, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, zoom: 1.35, focusDistance: 1.8, easing: 'ease-in-out' },
      { framePercent: 60, position: { x: 2, y: -0.3, z: 0 }, rotation: { x: 0, y: 1, z: -0.3 }, zoom: 1.32, focusDistance: 2.2, easing: 'ease-in-out' },
      { framePercent: 100, position: { x: -1, y: 0, z: 0 }, rotation: { x: 0, y: -0.5, z: 0.2 }, zoom: 1.3, focusDistance: 2, easing: 'linear' },
    ],
  },

  // ── Documentary ────────────────────────────────────────────────────
  {
    id: 'genre-documentary',
    name: 'Documentary',
    genre: 'documentary',
    description: 'Handheld feel, follow cam, interview setup',
    opticalOverrides: { aperture: 2.8, focalLength: 35 },
    keyframes: [
      { framePercent: 0, position: { x: -1, y: 0.5, z: 0 }, rotation: { x: 0.2, y: -0.5, z: 0.3 }, zoom: 1.1, easing: 'linear' },
      { framePercent: 15, position: { x: 1, y: -0.3, z: 0 }, rotation: { x: -0.1, y: 0.3, z: -0.2 }, zoom: 1.12, easing: 'linear' },
      { framePercent: 30, position: { x: -0.5, y: 0.4, z: 0 }, rotation: { x: 0.15, y: -0.2, z: 0.15 }, zoom: 1.08, easing: 'linear' },
      { framePercent: 45, position: { x: 0.8, y: -0.2, z: 0 }, rotation: { x: -0.1, y: 0.4, z: -0.1 }, zoom: 1.14, easing: 'linear' },
      { framePercent: 60, position: { x: -0.3, y: 0.3, z: 0 }, rotation: { x: 0.1, y: -0.15, z: 0.2 }, zoom: 1.1, easing: 'linear' },
      { framePercent: 75, position: { x: 0.6, y: -0.4, z: 0 }, rotation: { x: -0.2, y: 0.25, z: -0.15 }, zoom: 1.13, easing: 'linear' },
      { framePercent: 90, position: { x: -0.4, y: 0.2, z: 0 }, rotation: { x: 0.1, y: -0.3, z: 0.1 }, zoom: 1.09, easing: 'linear' },
      { framePercent: 100, position: { x: -1, y: 0.5, z: 0 }, rotation: { x: 0.2, y: -0.5, z: 0.3 }, zoom: 1.1, easing: 'linear' },
    ],
  },
]

export function getGenreMotionPreset(genre: string): GenreMotionPreset | undefined {
  return GENRE_MOTION_PRESETS.find((p) => p.genre === genre)
}
