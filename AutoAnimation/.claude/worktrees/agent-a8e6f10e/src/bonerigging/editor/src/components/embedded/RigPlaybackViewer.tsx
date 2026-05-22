/**
 * RigPlaybackViewer — Lightweight read-only viewer that renders a rigged
 * character with PixiJS using the exact same rendering pipeline as the
 * bonerigging editor (PixiViewport + RasterMesh + BoneOverlay).
 *
 * Does NOT require BoneRiggingProvider or any editor context.
 * Takes SerializedRigData and renders the deformed mesh + skeleton.
 *
 * Rendering strategy:
 * - Inner PixiJS canvas renders at native source image resolution (crisp mesh)
 * - CSS transform scales the container down to the requested display size
 * - uiScale compensates bone overlay sizes so they appear correct on screen
 */

import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import {
  BoneRiggingConverter,
  DeformationEngine,
  AnimationManager,
  RasterParser,
  SVGParser,
  PathReconstructor,
  V2,
} from '@bonerigging/core';
import type {
  SerializedRigData,
  Skeleton,
  MeshData,
  BoneWeight,
  Vec2,
  Animation,
  ParsedCharacter,
} from '@bonerigging/core';
import { PixiViewport } from '../../pixi/PixiViewport';

export interface RigPlaybackViewerHandle {
  /** Set playback time and animation index imperatively (zero React re-renders). */
  setTime: (time: number, animIndex: number) => void;
  /** Blend between two animations for smooth crossfade transitions. */
  setBlendedTime: (animA: number, timeA: number, animB: number, timeB: number, blend: number) => void;
  /** Re-upload the mesh texture (e.g. after re-compositing face sprites). */
  updateTexture: (source: TexImageSource) => void;
}

export interface RigPlaybackViewerProps {
  /** Serialized rig data (from boneriggingSerializedData on RigData) */
  data: SerializedRigData;
  /** Width of the viewer in pixels */
  width: number;
  /** Height of the viewer in pixels */
  height: number;
  /** Animation index to play (default: 0, first animation) */
  animationIndex?: number;
  /** Current playback time in seconds (driven externally). If not provided, uses internal RAF loop. */
  time?: number;
  /** Whether to show the bone skeleton overlay (default: true) */
  showBones?: boolean;
  /** Whether the animation is playing (default: true when time is not provided) */
  isPlaying?: boolean;
  /** Whether to loop the animation (default: true) */
  loop?: boolean;
  /** Extra canvas padding as a fraction of image dimensions (default: 0.4).
   *  Use 0 on the main canvas where deformation overflow isn't needed. */
  padRatio?: number;
  /** Called once after PixiJS is initialized and the first frame is rendered. */
  onReady?: () => void;
}

export const RigPlaybackViewer = forwardRef<RigPlaybackViewerHandle, RigPlaybackViewerProps>(function RigPlaybackViewer({
  data,
  width,
  height,
  animationIndex = 0,
  time: externalTime,
  showBones = true,
  isPlaying = true,
  loop = true,
  padRatio = 0.4,
  onReady,
}, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const pixiRef = useRef<PixiViewport | null>(null);
  const destroyedRef = useRef(false);

  // Track source image dimensions in state so re-render updates the CSS layout
  const [imgDims, setImgDims] = useState<{ w: number; h: number } | null>(null);

  // Deserialized state (mutable refs to avoid re-renders)
  const skeletonRef = useRef<Skeleton | null>(null);
  const weightsRef = useRef<BoneWeight[][] | null>(null);
  const meshRef = useRef<MeshData | null>(null);
  const animationsRef = useRef<Animation[]>([]);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const deformedPosRef = useRef<Vec2[] | null>(null);
  const squashStretchRef = useRef(false);
  const imageWidthRef = useRef(0);
  const imageHeightRef = useRef(0);

  // SVG mode state
  const svgModeRef = useRef(false);
  const parsedSvgRef = useRef<ParsedCharacter | null>(null);

  // Animation state
  const animManagerRef = useRef(new AnimationManager());
  const playbackTimeRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const rafRef = useRef(0);

  // Coordination flag: true once PixiViewport.init() has completed
  const initReadyRef = useRef(false);

  // The PixiJS canvas renders at native image resolution (1:1) so the mesh
  // texture is perfectly crisp. No scaling inside PixiJS.
  // offsetX/offsetY shift all vertex positions by the padding amount so the
  // original content renders in the center of the padded canvas.
  const padRatioRef = useRef(padRatio);
  padRatioRef.current = padRatio;
  const computeTransform = useCallback(() => {
    const imgW = imageWidthRef.current;
    const imgH = imageHeightRef.current;
    const padX = Math.round(imgW * padRatioRef.current);
    const padY = Math.round(imgH * padRatioRef.current);
    return { scale: 1, offsetX: padX, offsetY: padY };
  }, []);

  // Apply deformation at a given time
  const applyDeformationAtTime = useCallback((time: number) => {
    const skeleton = skeletonRef.current;
    const weights = weightsRef.current;
    if (!skeleton || !weights) return;

    const mgr = animManagerRef.current;
    const anim = mgr.currentAnimation;

    // Reset joints to rest
    for (const j of Object.values(skeleton.joints)) {
      j.current = V2(j.rest.x, j.rest.y);
    }

    // Apply animation pose
    if (anim) {
      const pose = mgr.getInterpolatedPose(anim, time);
      if (pose) {
        for (const [jn, d] of Object.entries(pose.deltas)) {
          const j = skeleton.joints[jn];
          if (j) j.current = V2(j.rest.x + d.x, j.rest.y + d.y);
        }
      }
    }

    const boneData = DeformationEngine.computeBoneData(skeleton, squashStretchRef.current);

    // SVG mode: deform control points and reconstruct SVG paths
    if (svgModeRef.current && parsedSvgRef.current) {
      const parsed = parsedSvgRef.current;
      const deformed = DeformationEngine.deformControlPoints(
        parsed.allControlPoints, weights, boneData, squashStretchRef.current
      );
      const reconstructed = PathReconstructor.reconstructPaths(parsed, deformed);
      for (const { element, d } of reconstructed) {
        if (element) element.setAttribute('d', d);
      }
      return;
    }

    // Raster mode: deform mesh vertices
    const mesh = meshRef.current;
    if (!mesh) return;
    if (!deformedPosRef.current || deformedPosRef.current.length !== mesh.vertices.length) {
      deformedPosRef.current = mesh.vertices.map(v => V2(v.point.x, v.point.y));
    }
    DeformationEngine.deformInPlace(
      mesh.vertices, weights, boneData, deformedPosRef.current, squashStretchRef.current
    );
  }, []);

  // Render one frame
  const renderFrame = useCallback(() => {
    // SVG mode: paths are deformed in-place by applyDeformationAtTime,
    // the browser renders the updated SVG DOM automatically.
    // We still render the PixiJS bone overlay if showBones is on.
    if (svgModeRef.current) {
      const pixi = pixiRef.current;
      const skeleton = skeletonRef.current;
      if (pixi && skeleton) {
        const transform = computeTransform();
        const imgW = imageWidthRef.current;
        const imgH = imageHeightRef.current;
        const cssScaleX = width / imgW;
        const cssScaleY = height / imgH;
        const cssScale = Math.min(cssScaleX, cssScaleY);
        const uiScale = cssScale > 0 ? 0.5 / cssScale : 1;
        pixi.render({
          skeleton,
          parsed: parsedSvgRef.current ?? { svgElement: null, viewBox: { x: 0, y: 0, w: imgW, h: imgH }, paths: [], allControlPoints: [], bbox: { minX: 0, minY: 0, maxX: imgW, maxY: imgH, w: imgW, h: imgH, cx: imgW / 2, cy: imgH / 2 } },
          transform,
          weights: weightsRef.current,
          selectedJoint: null,
          hoveredJoint: null,
          pinnedJoints: new Set(),
          showBones,
          showMesh: false,
          showWeights: false,
          showLabels: false,
          editMode: false,
          mode: 'svg',
          mesh: null,
          rasterDeformed: null,
          rasterImage: null,
          uiScale,
        });
      }
      return;
    }

    const pixi = pixiRef.current;
    const skeleton = skeletonRef.current;
    const mesh = meshRef.current;
    const weights = weightsRef.current;
    const image = imageRef.current;
    if (!pixi || !skeleton || !mesh || !weights || !image) return;

    const transform = computeTransform();

    const imgW = imageWidthRef.current;
    const imgH = imageHeightRef.current;
    if (!imgW || !imgH) return;

    // uiScale: compensate bone sizes for the CSS downscale.
    // Canvas is imgW CSS px, displayed at `width` CSS px via CSS scale.
    // Base: 1/cssScale makes bones 5px on screen (same as editor's raw size).
    // But the editor's viewport is much larger (~700px) so 5px looks small
    // relative to the character. On the smaller main canvas display, 5px is
    // proportionally too big. We apply a 0.5 factor so bones appear at the
    // same proportion relative to the character as in the editor.
    const cssScaleX = width / imgW;
    const cssScaleY = height / imgH;
    const cssScale = Math.min(cssScaleX, cssScaleY);
    const uiScale = cssScale > 0 ? 0.5 / cssScale : 1;

    pixi.render({
      skeleton,
      parsed: {
        svgElement: null,
        viewBox: { x: 0, y: 0, w: imgW, h: imgH },
        paths: [],
        allControlPoints: mesh.vertices,
        bbox: { minX: 0, minY: 0, maxX: imgW, maxY: imgH, w: imgW, h: imgH, cx: imgW / 2, cy: imgH / 2 },
      },
      transform,
      weights,
      selectedJoint: null,
      hoveredJoint: null,
      pinnedJoints: new Set(),
      showBones,
      showMesh: false,
      showWeights: false,
      showLabels: false,
      editMode: false,
      mode: 'raster',
      mesh,
      rasterDeformed: deformedPosRef.current,
      rasterImage: image,
      uiScale,
    });
  }, [computeTransform, showBones, width, height]);

  // Full update: deform + render
  const updateScene = useCallback((time: number) => {
    applyDeformationAtTime(time);
    renderFrame();
  }, [applyDeformationAtTime, renderFrame]);

  // Keep a ref to the latest updateScene so async callbacks never use stale closures
  const updateSceneRef = useRef(updateScene);
  updateSceneRef.current = updateScene;

  // --- Blended deformation: deform at two times and lerp positions ---
  const applyBlendedDeformation = useCallback((animA: number, timeA: number, animB: number, timeB: number, blend: number) => {
    const skeleton = skeletonRef.current;
    const mesh = meshRef.current;
    const weights = weightsRef.current;
    if (!skeleton || !mesh || !weights) return;

    const mgr = animManagerRef.current;
    const anims = animationsRef.current;

    // Deform at time A
    for (const j of Object.values(skeleton.joints)) {
      j.current = V2(j.rest.x, j.rest.y);
    }
    const animObjA = anims[Math.min(animA, anims.length - 1)];
    if (animObjA) {
      const pose = mgr.getInterpolatedPose(animObjA, timeA);
      if (pose) {
        for (const [jn, d] of Object.entries(pose.deltas)) {
          const j = skeleton.joints[jn];
          if (j) j.current = V2(j.rest.x + d.x, j.rest.y + d.y);
        }
      }
    }
    const boneDataA = DeformationEngine.computeBoneData(skeleton, squashStretchRef.current);
    const posA = mesh.vertices.map(v => V2(v.point.x, v.point.y));
    DeformationEngine.deformInPlace(mesh.vertices, weights, boneDataA, posA, squashStretchRef.current);

    // Deform at time B
    for (const j of Object.values(skeleton.joints)) {
      j.current = V2(j.rest.x, j.rest.y);
    }
    const animObjB = anims[Math.min(animB, anims.length - 1)];
    if (animObjB) {
      const pose = mgr.getInterpolatedPose(animObjB, timeB);
      if (pose) {
        for (const [jn, d] of Object.entries(pose.deltas)) {
          const j = skeleton.joints[jn];
          if (j) j.current = V2(j.rest.x + d.x, j.rest.y + d.y);
        }
      }
    }
    const boneDataB = DeformationEngine.computeBoneData(skeleton, squashStretchRef.current);
    const posB = mesh.vertices.map(v => V2(v.point.x, v.point.y));
    DeformationEngine.deformInPlace(mesh.vertices, weights, boneDataB, posB, squashStretchRef.current);

    // Lerp positions
    if (!deformedPosRef.current || deformedPosRef.current.length !== posA.length) {
      deformedPosRef.current = posA.map(v => V2(v.x, v.y));
    }
    for (let i = 0; i < posA.length; i++) {
      deformedPosRef.current[i] = V2(
        posA[i].x + (posB[i].x - posA[i].x) * blend,
        posA[i].y + (posB[i].y - posA[i].y) * blend,
      );
    }
  }, []);

  const applyBlendedDeformationRef = useRef(applyBlendedDeformation);
  applyBlendedDeformationRef.current = applyBlendedDeformation;

  // --- Imperative handle for main canvas integration ---
  useImperativeHandle(ref, () => ({
    setTime(time: number, animIdx: number) {
      const mgr = animManagerRef.current;
      const anims = animationsRef.current;
      if (anims.length > 0) {
        const idx = Math.min(animIdx, anims.length - 1);
        if (mgr.currentAnimation !== anims[idx]) {
          mgr.play(idx);
          mgr.pause();
        }
      }
      playbackTimeRef.current = time;
      updateSceneRef.current(time);
    },
    setBlendedTime(animA: number, timeA: number, animB: number, timeB: number, blend: number) {
      applyBlendedDeformationRef.current(animA, timeA, animB, timeB, blend);
      renderFrame();
    },
    updateTexture(source: TexImageSource) {
      const pixi = pixiRef.current;
      if (!pixi) return;
      pixi.rasterMesh.updateTextureFromSource(source);
      renderFrame();
    },
  }), [renderFrame]);

  // Shared coordination: attempt mesh upload + first render when BOTH PixiJS init
  // and image loading have completed. Called from both async completion paths.
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const firedReadyRef = useRef(false);
  const tryFirstRender = useCallback(() => {
    const pixi = pixiRef.current;

    // SVG mode: only need pixi for bone overlay, SVG DOM is already mounted
    if (svgModeRef.current) {
      if (!pixi || !initReadyRef.current) return;
      updateSceneRef.current(playbackTimeRef.current);
      if (!firedReadyRef.current) {
        firedReadyRef.current = true;
        onReadyRef.current?.();
      }
      return;
    }

    // Raster mode: need pixi + image + mesh
    const image = imageRef.current;
    const mesh = meshRef.current;
    if (!pixi || !initReadyRef.current || !image || !mesh) return;

    // Upload mesh geometry (idempotent — re-upload is safe)
    pixi.rasterMesh.uploadMesh(mesh);
    // Render at current playback time
    updateSceneRef.current(playbackTimeRef.current);

    // Notify host that viewer is ready for imperative calls (e.g. updateTexture)
    if (!firedReadyRef.current) {
      firedReadyRef.current = true;
      onReadyRef.current?.();
    }
  }, []);

  // Deserialize data and load image on mount / data change
  useEffect(() => {
    destroyedRef.current = false;

    const deserialized = BoneRiggingConverter.deserialize(data);
    skeletonRef.current = deserialized.skeleton;
    weightsRef.current = deserialized.weights;
    meshRef.current = deserialized.mesh;
    animationsRef.current = deserialized.animations;
    squashStretchRef.current = deserialized.metadata.squashStretchEnabled;
    imageWidthRef.current = deserialized.metadata.imageWidth;
    imageHeightRef.current = deserialized.metadata.imageHeight;

    // Update state so layout re-renders with correct dimensions
    setImgDims({ w: deserialized.metadata.imageWidth, h: deserialized.metadata.imageHeight });

    // Load animations into manager
    const mgr = animManagerRef.current;
    mgr.loadAnimations(deserialized.animations);
    mgr.loop = loop;

    // Select the animation
    if (deserialized.animations.length > 0) {
      const idx = Math.min(animationIndex, deserialized.animations.length - 1);
      mgr.play(idx);
      mgr.pause(); // We drive playback ourselves
    }

    // Detect SVG mode
    // Check svgSource existence as fallback — older rigs may have mode:'raster' but still contain svgSource
    const isSvg = !!deserialized.metadata.svgSource;
    svgModeRef.current = isSvg;

    if (isSvg) {
      // SVG mode: parse SVG source and mount the element in the SVG container
      const parsed = SVGParser.parse(deserialized.metadata.svgSource!);
      parsedSvgRef.current = parsed;

      // Mount SVG element into the container
      const svgContainer = svgContainerRef.current;
      if (svgContainer && parsed.svgElement) {
        svgContainer.innerHTML = '';
        const svgEl = parsed.svgElement;
        const vb = svgEl.viewBox?.baseVal;
        if (vb && vb.width > 0 && vb.height > 0) {
          svgEl.setAttribute('width', String(vb.width));
          svgEl.setAttribute('height', String(vb.height));
        }
        svgEl.style.overflow = 'visible';
        svgEl.style.display = 'block';
        svgContainer.appendChild(svgEl);
      }

      tryFirstRender();
    } else {
      // Raster mode
      parsedSvgRef.current = null;

      // If pixi is already initialized (e.g. data prop changed after mount),
      // re-upload mesh immediately
      if (initReadyRef.current && pixiRef.current && deserialized.mesh) {
        pixiRef.current.rasterMesh.uploadMesh(deserialized.mesh);
      }

      // Load raster image
      const imageUrl = deserialized.metadata.sourceImageUrl;
      if (imageUrl) {
        RasterParser.loadFromUrl(imageUrl).then((img) => {
          if (destroyedRef.current) return;
          imageRef.current = img;
          // Try to render — if pixi isn't ready yet, init callback will handle it
          tryFirstRender();
        }).catch((err) => {
          console.error('[RigPlaybackViewer] Failed to load image:', err);
        });
      }
    }

    return () => {
      destroyedRef.current = true;
    };
  }, [data, animationIndex, loop, tryFirstRender]);

  // Initialize PixiJS — wait until imgDims are known so the container has
  // the correct padded dimensions. Without this, PixiJS creates a canvas at
  // the fallback size (width x height) which becomes tiny after CSS rescaling
  // when the real image dimensions arrive.
  useEffect(() => {
    if (!imgDims) return; // Don't init until deserialization sets image dims
    const container = containerRef.current;
    if (!container) return;

    const vp = new PixiViewport();
    pixiRef.current = vp;
    let destroyed = false;

    vp.init(container).then(() => {
      if (destroyed) {
        vp.destroy();
        return;
      }
      initReadyRef.current = true;
      // Try to render — if image isn't loaded yet, image callback will handle it
      tryFirstRender();
    });

    return () => {
      destroyed = true;
      initReadyRef.current = false;
      if (pixiRef.current) {
        pixiRef.current.destroy();
        pixiRef.current = null;
      }
    };
  }, [imgDims, tryFirstRender]);

  // Handle externally-driven time
  useEffect(() => {
    if (externalTime !== undefined) {
      playbackTimeRef.current = externalTime;
      updateSceneRef.current(externalTime);
    }
  }, [externalTime]);

  // Internal playback RAF loop (when time is NOT externally driven)
  useEffect(() => {
    if (externalTime !== undefined) return; // External time control
    if (!isPlaying) return;

    lastFrameTimeRef.current = performance.now();

    const tick = (now: number) => {
      const dt = (now - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = now;

      const mgr = animManagerRef.current;
      const anim = mgr.currentAnimation;
      if (!anim) return;

      playbackTimeRef.current += dt;

      if (playbackTimeRef.current >= anim.duration) {
        if (loop) {
          playbackTimeRef.current = playbackTimeRef.current % anim.duration;
        } else {
          playbackTimeRef.current = anim.duration;
          updateSceneRef.current(playbackTimeRef.current);
          return; // Stop
        }
      }

      updateSceneRef.current(playbackTimeRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [externalTime, isPlaying, loop]);

  // Re-render when showBones changes
  useEffect(() => {
    renderFrame();
  }, [showBones, renderFrame]);

  // Layout: outer div = display size, inner div = padded canvas at native resolution.
  // cssScale is based on original image dimensions (not padded) so the character
  // appears at the same visual size as before.  The inner div is shifted left/top
  // by padX*cssScale / padY*cssScale so the padded area extends in all directions
  // while the original content stays visually in the same position.
  const imgW = imgDims?.w || width;
  const imgH = imgDims?.h || height;
  const cssScaleX = width / imgW;
  const cssScaleY = height / imgH;
  const cssScale = Math.min(cssScaleX, cssScaleY);
  const padX = Math.round(imgW * padRatio);
  const padY = Math.round(imgH * padRatio);
  const paddedW = imgW + 2 * padX;
  const paddedH = imgH + 2 * padY;

  // Center the scaled content within the display box, matching object-fit:contain.
  // Without this, a non-square image in a square container would be top-left aligned
  // while the original <img> (object-contain) centers it.
  const centerX = (width - imgW * cssScale) / 2;
  const centerY = (height - imgH * cssScale) / 2;

  return (
    <div
      style={{
        width,
        height,
        position: 'relative',
        overflow: 'visible',
      }}
    >
      {/* SVG layer: DOM-rendered vector character (only visible in SVG mode) */}
      <div
        ref={svgContainerRef}
        style={{
          width: imgW,
          height: imgH,
          position: 'absolute',
          left: centerX,
          top: centerY,
          transform: `scale(${cssScale})`,
          transformOrigin: 'top left',
          overflow: 'visible',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      {/* PixiJS canvas: raster mesh (raster mode) or bone overlay (SVG mode) */}
      <div
        ref={containerRef}
        style={{
          width: paddedW,
          height: paddedH,
          position: 'absolute',
          left: centerX - padX * cssScale,
          top: centerY - padY * cssScale,
          transform: `scale(${cssScale})`,
          transformOrigin: 'top left',
          zIndex: 1,
        }}
      />
    </div>
  );
});
