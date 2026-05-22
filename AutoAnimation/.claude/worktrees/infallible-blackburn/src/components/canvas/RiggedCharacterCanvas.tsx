/**
 * RiggedCharacterCanvas — WebGL-accelerated rigged character renderer.
 * Single GPU draw call for all mesh triangles. Canvas renders at native image
 * resolution (same as original Canvas2D), CSS scales to display size.
 *
 * Vertex positions are in image-space pixels — the shader converts to clip space.
 */

import React, { useRef, useEffect, useCallback, useState, useMemo, useImperativeHandle, forwardRef } from 'react'
import { BoneRiggingPlaybackEngine } from '@/services/boneriggingPlayback'
import type { SerializedRigData } from '@bonerigging/core'

export interface RiggedCharacterCanvasHandle {
  setTime: (time: number, animIndex: number) => void
  /** Blend between two animations for smooth crossfade transitions. */
  setBlendedTime: (animA: number, timeA: number, animB: number, timeB: number, blend: number) => void
  /** Re-upload the GPU texture (e.g. after re-compositing face sprites). */
  updateTexture: (source: TexImageSource) => void
}

export interface RiggedCharacterCanvasProps {
  data: SerializedRigData
  width: number
  height: number
  animationIndex?: number
  time?: number
  showBones?: boolean
  isPlaying?: boolean
  loop?: boolean
}

// Vertex shader: image-pixel coords → clip space via resolution uniform
const VERT_SRC = `
attribute vec2 aPosition;
attribute vec2 aTexCoord;
uniform vec2 uResolution;
varying vec2 vTexCoord;
void main() {
  vec2 clip = (aPosition / uResolution) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  vTexCoord = aTexCoord;
}
`

const FRAG_SRC = `
precision mediump float;
varying vec2 vTexCoord;
uniform sampler2D uTexture;
void main() {
  gl_FragColor = texture2D(uTexture, vTexCoord);
}
`

interface GLResources {
  gl: WebGLRenderingContext
  program: WebGLProgram
  positionBuf: WebGLBuffer
  texCoordBuf: WebGLBuffer
  indexBuf: WebGLBuffer
  aPosition: number
  aTexCoord: number
  uResolution: WebGLUniformLocation
  texture: WebGLTexture
  indexCount: number
  positionArray: Float32Array
}

function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('[WebGL] Shader:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function linkProgram(gl: WebGLRenderingContext): WebGLProgram | null {
  const vs = compileShader(gl, gl.VERTEX_SHADER, VERT_SRC)
  if (!vs) return null
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC)
  if (!fs) { gl.deleteShader(vs); return null }
  const prog = gl.createProgram()
  if (!prog) return null
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('[WebGL] Link:', gl.getProgramInfoLog(prog))
    gl.deleteProgram(prog)
    return null
  }
  gl.detachShader(prog, vs); gl.detachShader(prog, fs)
  gl.deleteShader(vs); gl.deleteShader(fs)
  return prog
}

export const RiggedCharacterCanvas = React.memo(forwardRef<RiggedCharacterCanvasHandle, RiggedCharacterCanvasProps>(
  function RiggedCharacterCanvas({
    data,
    width,
    height,
    animationIndex = 0,
    time: externalTime,
    showBones: _showBones = false,
    isPlaying = true,
    loop = true,
  }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const textureRef = useRef<HTMLImageElement | null>(null)
    const [textureLoaded, setTextureLoaded] = useState(false)
    const brEngineRef = useRef<BoneRiggingPlaybackEngine | null>(null)
    const glResRef = useRef<GLResources | null>(null)
    const playbackTimeRef = useRef(0)
    const lastFrameTimeRef = useRef(0)
    const rafRef = useRef(0)

    // Native image dimensions — canvas renders at this resolution
    const imgW = data.imageWidth || width
    const imgH = data.imageHeight || height

    const engine = useMemo(() => {
      try { return new BoneRiggingPlaybackEngine(data) }
      catch (err) { console.error('[RigCanvas] Engine init failed:', err); return null }
    }, [data])

    useEffect(() => { brEngineRef.current = engine }, [engine])

    useEffect(() => {
      const url = data.sourceImageUrl
      if (!url) return
      setTextureLoaded(false)
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => { textureRef.current = img; setTextureLoaded(true) }
      img.onerror = () => console.error('[RigCanvas] Image load failed')
      img.src = url
    }, [data.sourceImageUrl])

    // Create/update WebGL resources — context survives across re-runs
    useEffect(() => {
      const canvas = canvasRef.current
      const image = textureRef.current
      const brEngine = brEngineRef.current
      if (!canvas || !image || !brEngine || !textureLoaded) return

      const brMesh = brEngine.getMeshData()
      if (!brMesh) return

      // Reuse existing GL context or create new one
      let gl = glResRef.current?.gl ?? null
      if (!gl || gl.isContextLost()) {
        const opts = { alpha: true, premultipliedAlpha: false, antialias: false }
        gl = (canvas.getContext('webgl2', opts) || canvas.getContext('webgl', opts)) as WebGLRenderingContext | null
        if (!gl) { console.error('[WebGL] No context'); return }
      }

      // Delete old GPU objects
      const prev = glResRef.current
      if (prev) {
        gl.deleteBuffer(prev.positionBuf)
        gl.deleteBuffer(prev.texCoordBuf)
        gl.deleteBuffer(prev.indexBuf)
        gl.deleteTexture(prev.texture)
        gl.deleteProgram(prev.program)
      }

      const program = linkProgram(gl)
      if (!program) return
      gl.useProgram(program)

      const aPosition = gl.getAttribLocation(program, 'aPosition')
      const aTexCoord = gl.getAttribLocation(program, 'aTexCoord')
      const uResolution = gl.getUniformLocation(program, 'uResolution')
      if (uResolution === null) return

      // Set resolution to image dimensions — shader maps pixel coords to clip space
      gl.uniform2f(uResolution, imgW, imgH)

      // Upload texture
      const tex = gl.createTexture()!
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)

      // Index buffer
      const indices = new Uint16Array(brMesh.triangles.length * 3)
      for (let i = 0; i < brMesh.triangles.length; i++) {
        indices[i * 3] = brMesh.triangles[i].v0
        indices[i * 3 + 1] = brMesh.triangles[i].v1
        indices[i * 3 + 2] = brMesh.triangles[i].v2
      }

      // UV buffer (static)
      const texCoords = new Float32Array(brMesh.uvs.length * 2)
      for (let i = 0; i < brMesh.uvs.length; i++) {
        texCoords[i * 2] = brMesh.uvs[i].u
        texCoords[i * 2 + 1] = brMesh.uvs[i].v
      }

      const positionBuf = gl.createBuffer()!
      const texCoordBuf = gl.createBuffer()!
      const indexBuf = gl.createBuffer()!

      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuf)
      gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW)
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf)
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)

      const positionArray = new Float32Array(brMesh.uvs.length * 2)
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuf)
      gl.bufferData(gl.ARRAY_BUFFER, positionArray.byteLength, gl.DYNAMIC_DRAW)

      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

      glResRef.current = {
        gl, program, positionBuf, texCoordBuf, indexBuf,
        aPosition, aTexCoord, uResolution, texture: tex,
        indexCount: indices.length, positionArray,
      }

      console.log(`[RigCanvas/WebGL] Ready — ${brMesh.triangles.length} tris, ${imgW}x${imgH}`)
    }, [textureLoaded, engine, imgW, imgH])

    // GPU draw: uploads vertex positions and issues a single draw call
    const frameTimingRef = useRef({ count: 0, totalMs: 0 })
    const drawDeformed = useCallback((deformed: { x: number; y: number }[]) => {
      const res = glResRef.current
      if (!res) return
      const t0 = performance.now()
      const { gl, program, positionBuf, texCoordBuf, indexBuf, aPosition, aTexCoord, texture, indexCount, positionArray } = res

      for (let i = 0; i < deformed.length; i++) {
        positionArray[i * 2] = deformed[i].x
        positionArray[i * 2 + 1] = deformed[i].y
      }

      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(program)

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuf)
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, positionArray)
      gl.enableVertexAttribArray(aPosition)
      gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0)

      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuf)
      gl.enableVertexAttribArray(aTexCoord)
      gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0)

      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, texture)

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf)
      gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0)

      const dt = performance.now() - t0
      const ft = frameTimingRef.current
      ft.count++
      ft.totalMs += dt
      if (ft.count % 60 === 0) {
        console.log(`[RigCanvas/WebGL] avg: ${(ft.totalMs / ft.count).toFixed(2)}ms`)
      }
    }, [])

    // Render one frame (single animation)
    const renderFrame = useCallback((time: number, animIdx: number) => {
      const brEngine = brEngineRef.current
      if (!brEngine) return
      const deformed = brEngine.animationCount > 0
        ? brEngine.getDeformedMeshAtTime(animIdx, time)
        : brEngine.getRestPositions()
      drawDeformed(deformed)
    }, [drawDeformed])

    // Render blended frame (two animations crossfade)
    const renderBlendedFrame = useCallback((animA: number, timeA: number, animB: number, timeB: number, blend: number) => {
      const brEngine = brEngineRef.current
      if (!brEngine || brEngine.animationCount === 0) return
      const deformed = brEngine.getBlendedMeshAtTime(animA, timeA, animB, timeB, blend)
      drawDeformed(deformed)
    }, [drawDeformed])

    const renderFrameRef = useRef(renderFrame)
    renderFrameRef.current = renderFrame
    const renderBlendedFrameRef = useRef(renderBlendedFrame)
    renderBlendedFrameRef.current = renderBlendedFrame

    useImperativeHandle(ref, () => ({
      setTime(time: number, animIdx: number) {
        playbackTimeRef.current = time
        renderFrameRef.current(time, animIdx)
      },
      setBlendedTime(animA: number, timeA: number, animB: number, timeB: number, blend: number) {
        renderBlendedFrameRef.current(animA, timeA, animB, timeB, blend)
      },
      updateTexture(source: TexImageSource) {
        const res = glResRef.current
        if (!res) return
        const { gl, texture } = res
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
        renderFrameRef.current(playbackTimeRef.current, 0)
      },
    }), [])

    useEffect(() => {
      if (externalTime !== undefined && textureLoaded) {
        playbackTimeRef.current = externalTime
        renderFrameRef.current(externalTime, animationIndex)
      }
    }, [externalTime, textureLoaded, animationIndex])

    useEffect(() => {
      if (externalTime !== undefined || !isPlaying || !textureLoaded) return
      const brEngine = brEngineRef.current
      if (!brEngine || brEngine.animationCount === 0) return
      const animInfo = brEngine.getAnimationInfo(animationIndex)
      if (!animInfo) return

      lastFrameTimeRef.current = performance.now()
      const tick = (now: number) => {
        const dt = (now - lastFrameTimeRef.current) / 1000
        lastFrameTimeRef.current = now
        playbackTimeRef.current += dt
        if (playbackTimeRef.current >= animInfo.duration) {
          if (loop) { playbackTimeRef.current %= animInfo.duration }
          else { renderFrameRef.current(animInfo.duration, animationIndex); return }
        }
        renderFrameRef.current(playbackTimeRef.current, animationIndex)
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
      return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
    }, [externalTime, isPlaying, loop, animationIndex, textureLoaded])

    useEffect(() => {
      if (textureLoaded) renderFrameRef.current(playbackTimeRef.current, animationIndex)
    }, [textureLoaded, animationIndex])

    // CSS scaling: canvas at native image resolution, CSS fits to display size
    const cssScaleX = width / imgW
    const cssScaleY = height / imgH
    const cssScale = Math.min(cssScaleX, cssScaleY)
    const centerX = (width - imgW * cssScale) / 2
    const centerY = (height - imgH * cssScale) / 2

    return (
      <div style={{ width, height, position: 'relative', overflow: 'visible' }}>
        <canvas
          ref={canvasRef}
          width={imgW}
          height={imgH}
          style={{
            position: 'absolute',
            left: centerX,
            top: centerY,
            width: imgW * cssScale,
            height: imgH * cssScale,
          }}
        />
      </div>
    )
  }
))
