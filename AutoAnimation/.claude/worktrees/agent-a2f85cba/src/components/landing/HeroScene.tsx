import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/* ── Adaptive particle count ── */
function getParticleCount() {
  const cores = navigator.hardwareConcurrency || 2
  if (cores >= 8) return 900
  if (cores >= 4) return 500
  return 0
}

/* ── Smooth value noise (safe integer hashing) ── */
function hash2(ix: number, iy: number, iz: number) {
  // Wrapping to safe integer range with Math.imul + bitwise AND
  let h = (Math.imul(ix, 374761) ^ Math.imul(iy, 668265) ^ Math.imul(iz, 127412)) | 0
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) | 0
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) | 0
  h = h ^ (h >>> 16)
  return (h & 0x7fff) / 0x7fff // 0..1
}

function valueNoise3D(x: number, y: number, z: number) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z)
  const fx = x - ix, fy = y - iy, fz = z - iz
  // Smoothstep
  const sx = fx * fx * (3 - 2 * fx)
  const sy = fy * fy * (3 - 2 * fy)
  const sz = fz * fz * (3 - 2 * fz)

  const n = (a: number, b: number, t: number) => a + (b - a) * t
  const v000 = hash2(ix, iy, iz), v100 = hash2(ix + 1, iy, iz)
  const v010 = hash2(ix, iy + 1, iz), v110 = hash2(ix + 1, iy + 1, iz)
  const v001 = hash2(ix, iy, iz + 1), v101 = hash2(ix + 1, iy, iz + 1)
  const v011 = hash2(ix, iy + 1, iz + 1), v111 = hash2(ix + 1, iy + 1, iz + 1)

  return n(n(n(v000, v100, sx), n(v010, v110, sx), sy),
           n(n(v001, v101, sx), n(v011, v111, sx), sy), sz) * 2 - 1
}

/* ── Constants ── */
const MAX_LINES = 6000
const CONNECT_R = 1.6
const CONNECT_R_SQ = CONNECT_R * CONNECT_R

/* ── Particle system ── */
function Particles({ count }: { count: number }) {
  const pointsRef = useRef<THREE.Points>(null!)
  const linesRef = useRef<THREE.LineSegments>(null!)
  const mouse = useRef<[number, number]>([9999, 9999])

  const data = useMemo(() => {
    const home = new Float32Array(count * 3)
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count * 3)
    const opa = new Float32Array(count)
    const linePos = new Float32Array(MAX_LINES * 6)
    const lineAlpha = new Float32Array(MAX_LINES * 2)

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      // 35% cluster in play-triangle shape, 65% spread across viewport
      let x: number, y: number
      if (Math.random() < 0.35) {
        // Barycentric random inside triangle: (-2.5, 2.5), (-2.5, -2.5), (3.5, 0)
        const r1 = Math.random(), r2 = Math.random()
        const s = Math.sqrt(r1)
        x = (1 - s) * -2.5 + s * (1 - r2) * -2.5 + s * r2 * 3.5
        y = (1 - s) * 2.5 + s * (1 - r2) * -2.5 + s * r2 * 0
        x += (Math.random() - 0.5) * 1.5
        y += (Math.random() - 0.5) * 1.5
      } else {
        x = (Math.random() - 0.5) * 14
        y = (Math.random() - 0.5) * 8
      }
      const z = (Math.random() - 0.5) * 2.5

      home[i3] = x; home[i3 + 1] = y; home[i3 + 2] = z
      pos[i3] = x; pos[i3 + 1] = y; pos[i3 + 2] = z
      opa[i] = 0.25 + Math.random() * 0.6
    }
    return { home, pos, vel, opa, linePos, lineAlpha }
  }, [count])

  // Attach geometry buffers imperatively
  useEffect(() => {
    if (!pointsRef.current) return
    const pg = pointsRef.current.geometry
    pg.setAttribute('position', new THREE.BufferAttribute(data.pos, 3))
    pg.setAttribute('aOpacity', new THREE.BufferAttribute(data.opa, 1))
  }, [data])

  useEffect(() => {
    if (!linesRef.current) return
    const lg = linesRef.current.geometry
    lg.setAttribute('position', new THREE.BufferAttribute(data.linePos, 3))
    lg.setAttribute('aAlpha', new THREE.BufferAttribute(data.lineAlpha, 1))
    lg.setDrawRange(0, 0)
  }, [data])

  // Shaders
  const ptMat = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float aOpacity;
      varying float vOpa;
      void main() {
        vOpa = aOpacity;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = max(1.5, 3.0 * (10.0 / -mv.z));
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying float vOpa;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float glow = smoothstep(0.5, 0.05, d);
        vec3 green = vec3(0.133, 0.773, 0.369);
        vec3 white = vec3(0.9, 1.0, 0.92);
        vec3 c = mix(green, white, step(0.65, vOpa));
        gl_FragColor = vec4(c, glow * vOpa);
      }
    `,
  }), [])

  const lnMat = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float aAlpha;
      varying float vA;
      void main() {
        vA = aAlpha;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying float vA;
      void main() {
        gl_FragColor = vec4(0.133, 0.773, 0.369, vA);
      }
    `,
  }), [])

  // Mouse tracking → world coords (camera z=8, fov=50)
  useEffect(() => {
    const halfH = 8 * Math.tan(25 * Math.PI / 180) // ≈3.73
    const onMove = (e: MouseEvent) => {
      const ndcX = (e.clientX / window.innerWidth) * 2 - 1
      const ndcY = -(e.clientY / window.innerHeight) * 2 + 1
      const aspect = window.innerWidth / window.innerHeight
      mouse.current = [ndcX * halfH * aspect, ndcY * halfH]
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  // Per-frame physics
  useFrame(({ clock }) => {
    if (!pointsRef.current || !linesRef.current) return

    const p = data.pos, v = data.vel, h = data.home
    const t = clock.getElapsedTime() * 0.35 // faster time
    const [mx, my] = mouse.current

    for (let i = 0; i < count; i++) {
      const i3 = i * 3

      // Noise drift — two offset noise samples for x/y
      const nx = valueNoise3D(p[i3] * 0.25, p[i3 + 1] * 0.25, t)
      const ny = valueNoise3D(p[i3] * 0.25 + 50, p[i3 + 1] * 0.25 + 50, t + 17)
      v[i3] += nx * 0.004
      v[i3 + 1] += ny * 0.004

      // Mouse repulsion
      const dx = p[i3] - mx, dy = p[i3 + 1] - my
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 3.0 && dist > 0.01) {
        const f = (1 - dist / 3.0) * 0.12
        v[i3] += (dx / dist) * f
        v[i3 + 1] += (dy / dist) * f
      }

      // Spring back to home
      v[i3] += (h[i3] - p[i3]) * 0.001
      v[i3 + 1] += (h[i3 + 1] - p[i3 + 1]) * 0.001

      // Damping
      v[i3] *= 0.94; v[i3 + 1] *= 0.94

      // Integrate
      p[i3] += v[i3]; p[i3 + 1] += v[i3 + 1]
    }
    if (pointsRef.current.geometry.attributes.position) {
      pointsRef.current.geometry.attributes.position.needsUpdate = true
    }

    // Connection lines
    const lp = data.linePos, la = data.lineAlpha
    let lc = 0
    for (let i = 0; i < count && lc < MAX_LINES; i++) {
      const i3 = i * 3, px = p[i3], py = p[i3 + 1], pz = p[i3 + 2]
      for (let j = i + 1; j < count && lc < MAX_LINES; j++) {
        const j3 = j * 3
        const ddx = px - p[j3], ddy = py - p[j3 + 1], ddz = pz - p[j3 + 2]
        const dSq = ddx * ddx + ddy * ddy + ddz * ddz
        if (dSq < CONNECT_R_SQ) {
          const k = lc * 6
          lp[k] = px; lp[k + 1] = py; lp[k + 2] = pz
          lp[k + 3] = p[j3]; lp[k + 4] = p[j3 + 1]; lp[k + 5] = p[j3 + 2]
          const a = (1 - dSq / CONNECT_R_SQ) * 0.28
          const ak = lc * 2
          la[ak] = a; la[ak + 1] = a
          lc++
        }
      }
    }
    const lg = linesRef.current.geometry
    if (lg.attributes.position) lg.attributes.position.needsUpdate = true
    if (lg.attributes.aAlpha) lg.attributes.aAlpha.needsUpdate = true
    lg.setDrawRange(0, lc * 2)
  })

  return (
    <>
      <points ref={pointsRef} material={ptMat}><bufferGeometry /></points>
      <lineSegments ref={linesRef} material={lnMat}><bufferGeometry /></lineSegments>
    </>
  )
}

/* ── Exported wrapper ── */
export function HeroScene() {
  const [count] = useState(getParticleCount)

  if (count === 0) {
    return <div className="w-full h-full bg-hero-glow opacity-60" />
  }

  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <Particles count={count} />
      </Canvas>
    </div>
  )
}
