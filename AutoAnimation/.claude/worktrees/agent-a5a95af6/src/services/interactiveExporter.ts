/**
 * Interactive Runtime Exporter
 *
 * Converts ProAnimate compositions into interactive HTML bundles
 * with a lightweight player runtime. Supports click/hover triggers,
 * scene transitions, and scroll-driven animations.
 */

import type {
  InteractiveManifest,
  InteractiveScene,
  InteractiveLayer,
  InteractiveKeyframe,
  InteractiveExportConfig,
  InteractiveLayerType,
} from '@/types/interactiveExport'
import type { VideoCompositionProps, TextOverlayData, ShapeLayerData } from '@/remotion/types'

/**
 * Convert a VideoCompositionProps into an InteractiveManifest.
 */
export function buildInteractiveManifest(
  props: VideoCompositionProps,
  projectName: string,
): InteractiveManifest {
  const canvasWidth = props.width
  const canvasHeight = props.height
  const fps = props.fps

  const scenes: InteractiveScene[] = []
  const assets: Record<string, 'image' | 'audio' | 'video' | 'svg' | 'font'> = {}

  // Create a single scene from the full composition (can be split later)
  const mainScene = buildMainScene(props, assets)
  scenes.push(mainScene)

  return {
    version: '1.0.0',
    metadata: {
      name: projectName,
      exportedAt: new Date().toISOString(),
    },
    canvas: {
      width: canvasWidth,
      height: canvasHeight,
      fps,
      backgroundColor: '#000000',
    },
    scenes,
    initialScene: mainScene.id,
    variables: {},
    assets,
  }
}

function buildMainScene(
  props: VideoCompositionProps,
  assets: Record<string, 'image' | 'audio' | 'video' | 'svg' | 'font'>,
): InteractiveScene {
  const layers: InteractiveLayer[] = []
  let layerIndex = 0

  // Add text overlay layers
  if (props.textOverlays) {
    for (const overlay of props.textOverlays) {
      layers.push(buildTextLayer(overlay, layerIndex++))
    }
  }

  // Add shape layers
  if (props.shapes) {
    for (const shape of props.shapes) {
      layers.push(buildShapeLayer(shape, layerIndex++))
    }
  }

  // Add media layers
  if (props.mediaItems) {
    for (const media of props.mediaItems) {
      const assetKey = `media_${layerIndex}.png`
      if (media.imageUrl) {
        assets[assetKey] = 'image'
      }
      layers.push({
        id: `layer_media_${layerIndex}`,
        type: 'image' as InteractiveLayerType,
        data: {
          src: assetKey,
          url: media.imageUrl,
        },
        transform: {
          x: media.position?.x ?? 0,
          y: media.position?.y ?? 0,
          width: props.width,
          height: props.height,
          rotation: media.rotation ?? 0,
          scaleX: media.scale ?? 1,
          scaleY: media.scale ?? 1,
          anchorX: 0.5,
          anchorY: 0.5,
        },
        opacity: media.opacity ?? 1,
        zIndex: media.zIndex ?? layerIndex,
      })
      layerIndex++
    }
  }

  return {
    id: 'scene_main',
    name: 'Main Scene',
    startFrame: 0,
    endFrame: props.durationInFrames || 300,
    layers,
    background: '#000000',
  }
}

function buildTextLayer(overlay: TextOverlayData, index: number): InteractiveLayer {
  const keyframes: InteractiveKeyframe[] = []

  // Build entry/exit keyframes
  if (overlay.startFrame !== undefined && overlay.endFrame !== undefined) {
    keyframes.push({
      time: 0,
      properties: { opacity: 0 },
      easing: 'ease-out',
    })
    keyframes.push({
      time: 0.1,
      properties: { opacity: 1 },
      easing: 'ease-out',
    })
    keyframes.push({
      time: 0.9,
      properties: { opacity: 1 },
      easing: 'ease-in',
    })
    keyframes.push({
      time: 1.0,
      properties: { opacity: 0 },
      easing: 'ease-in',
    })
  }

  return {
    id: `layer_text_${index}`,
    type: 'text',
    data: {
      content: overlay.content,
      fontFamily: overlay.fontFamily || 'Inter',
      fontSize: overlay.fontSize || 24,
      fontWeight: overlay.fontWeight || 'normal',
      color: overlay.color || '#ffffff',
      align: overlay.align || 'center',
      backgroundColor: overlay.background ? `rgba(0,0,0,${overlay.backgroundOpacity})` : undefined,
    },
    transform: {
      x: overlay.freeX ?? 0,
      y: overlay.freeY ?? 0,
      width: overlay.width ?? 400,
      height: overlay.height ?? 60,
      rotation: overlay.rotation ?? 0,
      scaleX: 1,
      scaleY: 1,
      anchorX: 0.5,
      anchorY: 0.5,
    },
    opacity: overlay.opacity ?? 1,
    zIndex: overlay.zIndex ?? index + 10,
    keyframes,
  }
}

function buildShapeLayer(shape: ShapeLayerData, index: number): InteractiveLayer {
  return {
    id: `layer_shape_${index}`,
    type: 'shape',
    data: {
      shapeType: shape.type,
      fill: shape.fill,
      stroke: shape.stroke,
      strokeWidth: shape.strokeWidth,
      borderRadius: shape.borderRadius,
    },
    transform: {
      x: shape.position.x,
      y: shape.position.y,
      width: shape.width,
      height: shape.height,
      rotation: shape.rotation ?? 0,
      scaleX: 1,
      scaleY: 1,
      anchorX: 0.5,
      anchorY: 0.5,
    },
    opacity: shape.opacity ?? 1,
    zIndex: shape.zIndex ?? index,
  }
}

/**
 * Generate the HTML bundle string for the interactive export.
 */
export function generateInteractiveHTML(
  manifest: InteractiveManifest,
  config: InteractiveExportConfig,
): string {
  const { canvas, initialScene, metadata } = manifest

  const playerThemeClass = config.playerTheme === 'dark'
    ? 'background:#111;color:#fff'
    : config.playerTheme === 'light'
      ? 'background:#fff;color:#111'
      : 'background:transparent'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${metadata.name} - ProAnimate Interactive</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{${playerThemeClass};display:flex;align-items:center;justify-content:center;min-height:100vh;overflow:hidden}
    #pa-player{position:relative;width:${canvas.width}px;height:${canvas.height}px;max-width:100vw;max-height:100vh;overflow:hidden;background:${canvas.backgroundColor}}
    .pa-layer{position:absolute;transition:opacity 0.3s ease}
    .pa-layer-text{display:flex;align-items:center;justify-content:center}
    .pa-layer-shape{pointer-events:none}
    .pa-layer-image img{width:100%;height:100%;object-fit:cover}
    .pa-controls{position:absolute;bottom:0;left:0;right:0;padding:8px 16px;background:rgba(0,0,0,0.6);display:flex;align-items:center;gap:8px;opacity:0;transition:opacity 0.3s}
    #pa-player:hover .pa-controls{opacity:1}
    .pa-btn{background:none;border:none;color:#fff;cursor:pointer;padding:4px 8px;font-size:14px}
    .pa-progress{flex:1;height:4px;background:rgba(255,255,255,0.2);border-radius:2px;cursor:pointer}
    .pa-progress-fill{height:100%;background:#3b82f6;border-radius:2px;width:0%;transition:width 0.1s linear}
    [data-trigger]{cursor:pointer}
    [data-trigger]:hover{filter:brightness(1.1)}
  </style>
</head>
<body>
  <div id="pa-player">
    <!-- Layers rendered by runtime -->
    ${config.showControls ? `
    <div class="pa-controls">
      <button class="pa-btn" id="pa-play-btn">Play</button>
      <div class="pa-progress" id="pa-progress">
        <div class="pa-progress-fill" id="pa-progress-fill"></div>
      </div>
      <span class="pa-btn" id="pa-time">0:00</span>
    </div>` : ''}
  </div>
  <script>
    // ProAnimate Interactive Player Runtime v1.0
    (function(){
      var manifest = ${JSON.stringify(manifest, null, config.minify ? 0 : 2)};
      var player = document.getElementById('pa-player');
      var currentScene = '${initialScene}';
      var isPlaying = ${config.autoplay ? 'true' : 'false'};
      var currentTime = 0;
      var fps = ${canvas.fps};
      var lastTimestamp = 0;
      var variables = Object.assign({}, manifest.variables);

      function getScene(id) {
        return manifest.scenes.find(function(s) { return s.id === id; });
      }

      function renderScene(sceneId) {
        var scene = getScene(sceneId);
        if (!scene) return;
        currentScene = sceneId;

        // Clear existing layers
        var existing = player.querySelectorAll('.pa-layer');
        existing.forEach(function(el) { el.remove(); });

        // Render layers
        scene.layers.forEach(function(layer) {
          var el = document.createElement('div');
          el.className = 'pa-layer pa-layer-' + layer.type;
          el.id = layer.id;
          el.style.left = layer.transform.x + 'px';
          el.style.top = layer.transform.y + 'px';
          el.style.width = layer.transform.width + 'px';
          el.style.height = layer.transform.height + 'px';
          el.style.opacity = layer.opacity;
          el.style.zIndex = layer.zIndex;
          el.style.transform = 'rotate(' + layer.transform.rotation + 'deg) scale(' + layer.transform.scaleX + ',' + layer.transform.scaleY + ')';

          if (layer.type === 'text') {
            el.style.fontFamily = layer.data.fontFamily || 'sans-serif';
            el.style.fontSize = (layer.data.fontSize || 24) + 'px';
            el.style.fontWeight = layer.data.fontWeight || 'normal';
            el.style.color = layer.data.color || '#fff';
            el.style.textAlign = layer.data.align || 'center';
            if (layer.data.backgroundColor) el.style.backgroundColor = layer.data.backgroundColor;
            el.textContent = layer.data.content || '';
          } else if (layer.type === 'shape') {
            el.style.backgroundColor = layer.data.fill || '#333';
            if (layer.data.borderRadius) el.style.borderRadius = layer.data.borderRadius + 'px';
            if (layer.data.stroke) el.style.border = (layer.data.strokeWidth || 1) + 'px solid ' + layer.data.stroke;
          } else if (layer.type === 'image' && layer.data.url) {
            var img = document.createElement('img');
            img.src = layer.data.url;
            img.alt = '';
            el.appendChild(img);
          }

          // Add triggers
          if (layer.triggers && layer.triggers.length > 0) {
            el.setAttribute('data-trigger', 'true');
            layer.triggers.forEach(function(trigger) {
              if (trigger.type === 'click') {
                el.addEventListener('click', function() { executeTrigger(trigger); });
              } else if (trigger.type === 'hover') {
                el.addEventListener('mouseenter', function() { executeTrigger(trigger); });
              }
            });
          }

          player.insertBefore(el, player.querySelector('.pa-controls'));
        });
      }

      function executeTrigger(trigger) {
        var delay = trigger.delay || 0;
        setTimeout(function() {
          switch (trigger.action) {
            case 'goto-scene':
              renderScene(trigger.target);
              currentTime = 0;
              break;
            case 'play':
              isPlaying = true;
              break;
            case 'pause':
              isPlaying = false;
              break;
            case 'toggle-play':
              isPlaying = !isPlaying;
              break;
            case 'open-url':
              window.open(trigger.target, '_blank');
              break;
            case 'show-layer':
              var showEl = document.getElementById(trigger.target);
              if (showEl) showEl.style.display = '';
              break;
            case 'hide-layer':
              var hideEl = document.getElementById(trigger.target);
              if (hideEl) hideEl.style.display = 'none';
              break;
          }
        }, delay);
      }

      function interpolateKeyframes(layer, time) {
        if (!layer.keyframes || layer.keyframes.length < 2) return;
        var scene = getScene(currentScene);
        if (!scene) return;
        var sceneDuration = (scene.endFrame - scene.startFrame) / fps;
        var normalizedTime = time / sceneDuration;

        var prev = null, next = null;
        for (var i = 0; i < layer.keyframes.length; i++) {
          if (layer.keyframes[i].time <= normalizedTime) prev = layer.keyframes[i];
          if (layer.keyframes[i].time >= normalizedTime && !next) next = layer.keyframes[i];
        }

        if (!prev || !next || prev === next) return;
        var t = (normalizedTime - prev.time) / (next.time - prev.time);
        t = Math.max(0, Math.min(1, t));

        var el = document.getElementById(layer.id);
        if (!el) return;

        if (prev.properties.opacity !== undefined && next.properties.opacity !== undefined) {
          el.style.opacity = prev.properties.opacity + (next.properties.opacity - prev.properties.opacity) * t;
        }
      }

      function tick(timestamp) {
        if (!lastTimestamp) lastTimestamp = timestamp;
        var dt = (timestamp - lastTimestamp) / 1000;
        lastTimestamp = timestamp;

        if (isPlaying) {
          currentTime += dt;
          var scene = getScene(currentScene);
          if (scene) {
            var sceneDuration = (scene.endFrame - scene.startFrame) / fps;
            if (currentTime >= sceneDuration) {
              currentTime = ${config.loop ? '0' : 'sceneDuration'};
              ${config.loop ? '' : 'isPlaying = false;'}
            }
            scene.layers.forEach(function(layer) {
              interpolateKeyframes(layer, currentTime);
            });
            ${config.showControls ? `
            var fill = document.getElementById('pa-progress-fill');
            if (fill) fill.style.width = (currentTime / sceneDuration * 100) + '%';
            var timeEl = document.getElementById('pa-time');
            if (timeEl) {
              var m = Math.floor(currentTime / 60);
              var s = Math.floor(currentTime % 60);
              timeEl.textContent = m + ':' + (s < 10 ? '0' : '') + s;
            }` : ''}
          }
        }

        requestAnimationFrame(tick);
      }

      // Initialize
      renderScene(currentScene);
      requestAnimationFrame(tick);

      ${config.showControls ? `
      var playBtn = document.getElementById('pa-play-btn');
      if (playBtn) {
        playBtn.addEventListener('click', function() {
          isPlaying = !isPlaying;
          playBtn.textContent = isPlaying ? 'Pause' : 'Play';
        });
      }
      var progressBar = document.getElementById('pa-progress');
      if (progressBar) {
        progressBar.addEventListener('click', function(e) {
          var rect = progressBar.getBoundingClientRect();
          var pct = (e.clientX - rect.left) / rect.width;
          var scene = getScene(currentScene);
          if (scene) {
            currentTime = pct * (scene.endFrame - scene.startFrame) / fps;
          }
        });
      }` : ''}
    })();
  </script>
</body>
</html>`
}

/**
 * Export the interactive composition as a downloadable blob.
 */
export function exportInteractiveBundle(
  props: VideoCompositionProps,
  projectName: string,
  config: InteractiveExportConfig,
): Blob {
  const manifest = buildInteractiveManifest(props, projectName)

  if (config.format === 'json-manifest') {
    return new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' })
  }

  const html = generateInteractiveHTML(manifest, config)
  return new Blob([html], { type: 'text/html' })
}
