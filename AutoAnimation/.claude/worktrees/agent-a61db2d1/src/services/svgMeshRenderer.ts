import type { MeshVertex } from '@/types/rig'
import { computeAffineTransform } from './meshRenderer'

// Re-export for convenience
export { computeAffineTransform }

/**
 * Build the SVG `points` attribute string for a triangle's three deformed vertices.
 * Format: "x0,y0 x1,y1 x2,y2"
 */
export function buildSVGTrianglePoints(
  v0: MeshVertex,
  v1: MeshVertex,
  v2: MeshVertex
): string {
  return `${v0.deformedX},${v0.deformedY} ${v1.deformedX},${v1.deformedY} ${v2.deformedX},${v2.deformedY}`
}

/**
 * Build an SVG `transform="matrix(a,b,c,d,e,f)"` attribute string from an affine transform.
 */
export function buildSVGMatrix(t: {
  a: number
  b: number
  c: number
  d: number
  e: number
  f: number
}): string {
  return `matrix(${t.a},${t.b},${t.c},${t.d},${t.e},${t.f})`
}

/**
 * SVG namespace URI for creating SVG elements imperatively.
 */
export const SVG_NS = 'http://www.w3.org/2000/svg'
