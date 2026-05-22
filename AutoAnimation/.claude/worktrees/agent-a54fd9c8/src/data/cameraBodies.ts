/**
 * Cinema camera body profiles — sensor specs, color science, and grain characteristics.
 */

import type { CameraBody } from '@/types/cinemaCamera'

export const CAMERA_BODIES: CameraBody[] = [
  {
    id: 'red-monstro',
    name: 'RED DSMC2 Monstro 8K VV',
    brand: 'RED',
    sensorWidth: 40.96,
    sensorHeight: 21.60,
    maxResolution: { width: 8192, height: 4320 },
    dynamicRange: 17,
    nativeISO: 800,
    colorScience: 'warm',
    grainProfile: { intensity: 0.08, size: 1, color: false },
  },
  {
    id: 'arri-alexa-mini-lf',
    name: 'ARRI ALEXA Mini LF',
    brand: 'ARRI',
    sensorWidth: 36.70,
    sensorHeight: 25.54,
    maxResolution: { width: 4448, height: 3096 },
    dynamicRange: 14.5,
    nativeISO: 800,
    colorScience: 'neutral',
    grainProfile: { intensity: 0.05, size: 1, color: false },
  },
  {
    id: 'sony-venice-2',
    name: 'Sony VENICE 2',
    brand: 'Sony',
    sensorWidth: 36.20,
    sensorHeight: 24.10,
    maxResolution: { width: 8640, height: 5760 },
    dynamicRange: 16,
    nativeISO: 800,
    colorScience: 'cool',
    grainProfile: { intensity: 0.06, size: 1, color: false },
  },
  {
    id: 'bmpcc-ursa-mini-pro',
    name: 'Blackmagic URSA Mini Pro 12K',
    brand: 'Blackmagic',
    sensorWidth: 27.03,
    sensorHeight: 14.25,
    maxResolution: { width: 12288, height: 6480 },
    dynamicRange: 14,
    nativeISO: 800,
    colorScience: 'neutral',
    grainProfile: { intensity: 0.12, size: 2, color: true },
  },
  {
    id: 'canon-c70',
    name: 'Canon EOS C70',
    brand: 'Canon',
    sensorWidth: 26.20,
    sensorHeight: 13.80,
    maxResolution: { width: 4096, height: 2160 },
    dynamicRange: 16,
    nativeISO: 800,
    colorScience: 'warm',
    grainProfile: { intensity: 0.07, size: 1, color: false },
  },
  {
    id: 'panasonic-varicam-lt',
    name: 'Panasonic VariCam LT',
    brand: 'Panasonic',
    sensorWidth: 24.58,
    sensorHeight: 12.84,
    maxResolution: { width: 4096, height: 2160 },
    dynamicRange: 14,
    nativeISO: 5000,
    colorScience: 'neutral',
    grainProfile: { intensity: 0.09, size: 1, color: false },
  },
]

export function getCameraBody(id: string): CameraBody | undefined {
  return CAMERA_BODIES.find((b) => b.id === id)
}
