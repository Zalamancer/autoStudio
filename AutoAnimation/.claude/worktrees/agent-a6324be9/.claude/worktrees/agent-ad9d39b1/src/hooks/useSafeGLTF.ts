/**
 * Safe wrapper around useGLTF that validates blob URLs before loading.
 * Prevents R3F canvas crashes from invalid/expired blob URLs.
 */
import { useState, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import type { GLTF } from 'three-stdlib'
import * as THREE from 'three'

/** Empty GLTF result returned when URL is invalid */
const EMPTY_GLTF: GLTF & { scene: THREE.Group; animations: THREE.AnimationClip[] } = {
  scene: new THREE.Group(),
  scenes: [],
  animations: [],
  cameras: [],
  asset: {},
  parser: null as unknown as GLTF['parser'],
  userData: {},
}

/**
 * Validates whether a URL is likely loadable.
 * - For blob: URLs, does a HEAD fetch to check if the blob is still alive
 * - For http/https URLs, assumes valid
 * - Returns false for empty/malformed URLs
 */
async function validateUrl(url: string): Promise<boolean> {
  if (!url) return false

  try {
    new URL(url)
  } catch {
    return false
  }

  if (url.startsWith('blob:')) {
    try {
      const resp = await fetch(url, { method: 'HEAD' })
      return resp.ok
    } catch {
      return false
    }
  }

  return true
}

/**
 * Safe wrapper around useGLTF.
 * Validates the URL before attempting to load. Returns an empty scene
 * if the URL is invalid, preventing R3F canvas crashes.
 */
export function useSafeGLTF(url: string | null | undefined): {
  scene: THREE.Group
  animations: THREE.AnimationClip[]
  isValid: boolean
  isValidating: boolean
} {
  const [validatedUrl, setValidatedUrl] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(true)

  useEffect(() => {
    if (!url) {
      setValidatedUrl(null)
      setIsValidating(false)
      return
    }

    let cancelled = false
    setIsValidating(true)

    validateUrl(url).then((valid) => {
      if (cancelled) return
      setValidatedUrl(valid ? url : null)
      setIsValidating(false)
    })

    return () => {
      cancelled = true
    }
  }, [url])

  // useGLTF requires a string — use a data URI for an empty GLB when URL is invalid.
  // This minimal valid GLB avoids errors from useGLTF.
  const safeUrl = validatedUrl ?? createMinimalGlbDataUri()

  const gltf = useGLTF(safeUrl)

  if (!validatedUrl) {
    return {
      scene: EMPTY_GLTF.scene,
      animations: [],
      isValid: false,
      isValidating,
    }
  }

  return {
    scene: gltf.scene,
    animations: gltf.animations ?? [],
    isValid: true,
    isValidating,
  }
}

/** Minimal valid GLB as a data URI — used as a placeholder when the real URL is invalid */
let _minimalGlbUri: string | null = null
function createMinimalGlbDataUri(): string {
  if (_minimalGlbUri) return _minimalGlbUri

  // Minimal valid glTF 2.0 JSON
  const json = JSON.stringify({
    asset: { version: '2.0', generator: 'useSafeGLTF-placeholder' },
    scene: 0,
    scenes: [{ nodes: [] }],
  })

  const jsonBytes = new TextEncoder().encode(json)
  // Pad to 4-byte alignment
  const paddedLength = Math.ceil(jsonBytes.length / 4) * 4
  const paddedJson = new Uint8Array(paddedLength)
  paddedJson.set(jsonBytes)
  // Fill padding with spaces (0x20)
  for (let i = jsonBytes.length; i < paddedLength; i++) {
    paddedJson[i] = 0x20
  }

  // GLB header (12 bytes) + JSON chunk header (8 bytes) + JSON data
  const totalLength = 12 + 8 + paddedLength
  const buffer = new ArrayBuffer(totalLength)
  const view = new DataView(buffer)

  // GLB header
  view.setUint32(0, 0x46546c67, true)   // magic: "glTF"
  view.setUint32(4, 2, true)             // version: 2
  view.setUint32(8, totalLength, true)   // total length

  // JSON chunk header
  view.setUint32(12, paddedLength, true) // chunk length
  view.setUint32(16, 0x4e4f534a, true)   // chunk type: "JSON"

  // JSON chunk data
  new Uint8Array(buffer, 20).set(paddedJson)

  const blob = new Blob([buffer], { type: 'model/gltf-binary' })
  _minimalGlbUri = URL.createObjectURL(blob)
  return _minimalGlbUri
}
