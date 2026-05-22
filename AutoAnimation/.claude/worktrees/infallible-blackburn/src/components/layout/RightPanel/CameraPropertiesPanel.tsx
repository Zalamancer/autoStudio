/**
 * Camera Properties Panel — Right panel for editing virtual camera properties
 * at the current playhead position.
 *
 * Shows live camera values (zoom, panX, panY, rotation) and allows direct editing.
 * Edits update the nearest keyframe or create a new one at the current frame.
 */

import { Plus, RotateCcw } from 'lucide-react'
import { PanelSlider, PanelSelect, PanelToggle, PanelMultiSelect } from '@/components/ui/panel-controls'
import { useCameraStore } from '@/stores/useCameraStore'
import type { CameraKeyframe } from '@/stores/useCameraStore'
import { useCinemaStore } from '@/stores/useCinemaStore'
import { CAMERA_BODIES } from '@/data/cameraBodies'
import { LENS_PROFILES } from '@/data/lensProfiles'
import { useTimelineStore } from '@/stores'
import { useShallow } from 'zustand/react/shallow'

const OPTICAL_EFFECTS = [
  { value: 'dofEnabled', label: 'Depth of Field' },
  { value: 'bokehEnabled', label: 'Bokeh' },
  { value: 'vignettingEnabled', label: 'Vignetting' },
  { value: 'chromaticAberrationEnabled', label: 'Chromatic Aberration' },
  { value: 'lensFlareEnabled', label: 'Lens Flare' },
  { value: 'filmGrainEnabled', label: 'Film Grain' },
  { value: 'anamorphicEnabled', label: 'Anamorphic' },
]

export function CameraPropertiesPanel({
  activeTab,
}: {
  activeTab: 'all' | 'transform' | 'camera' | 'optical' | 'effects'
}) {
  const {
    keyframes,
    shakes,
    focusPull,
    addKeyframe,
    updateKeyframe,
    addShake,
    clearShakes,
    setFocusPull,
    clearFocusPull,
    getCameraAtFrame,
  } = useCameraStore(
    useShallow((s) => ({
      keyframes: s.keyframes,
      shakes: s.shakes,
      focusPull: s.focusPull,
      addKeyframe: s.addKeyframe,
      updateKeyframe: s.updateKeyframe,
      addShake: s.addShake,
      clearShakes: s.clearShakes,
      setFocusPull: s.setFocusPull,
      clearFocusPull: s.clearFocusPull,
      getCameraAtFrame: s.getCameraAtFrame,
    })),
  )

  const cinemaStore = useCinemaStore()

  const selectedBody = CAMERA_BODIES.find((b) => b.id === cinemaStore.selectedBodyId)
  const selectedLens = LENS_PROFILES.find((l) => l.id === cinemaStore.selectedLensId)

  const currentFrame = useTimelineStore((s) => s.currentFrame)
  const fps = useTimelineStore((s) => s.fps)

  // Get interpolated camera at current playhead
  const cam = getCameraAtFrame(currentFrame, fps)

  // Find if there's a keyframe at or near the current frame (within 1 frame)
  const currentKfIndex = keyframes.findIndex((kf) => Math.abs(kf.frame - currentFrame) <= 1)
  const currentKf = currentKfIndex >= 0 ? keyframes[currentKfIndex] : null

  // Update or create a keyframe at current frame
  const setCameraProperty = (
    prop: keyof Pick<CameraKeyframe, 'zoom' | 'panX' | 'panY' | 'rotation'>,
    value: number,
  ) => {
    if (currentKfIndex >= 0) {
      updateKeyframe(currentKfIndex, { [prop]: value })
    } else {
      // Create new keyframe at current frame with current interpolated values
      addKeyframe({
        frame: currentFrame,
        zoom: prop === 'zoom' ? value : cam.zoom,
        panX: prop === 'panX' ? value : cam.panX,
        panY: prop === 'panY' ? value : cam.panY,
        rotation: prop === 'rotation' ? value : cam.rotation,
        easing: 'ease-in-out',
      })
    }
  }

  const showTransform = activeTab === 'all' || activeTab === 'transform'
  const showCamera = activeTab === 'all' || activeTab === 'camera'
  const showOptical = activeTab === 'all' || activeTab === 'optical'
  const showEffects = activeTab === 'all' || activeTab === 'effects'

  return (
    <div className="p-4 space-y-4">
      {/* Transform section */}
      {showTransform && (
        <div className="space-y-3">
          {activeTab === 'all' && (
            <h4 className="text-xs font-medium text-zinc-400 tracking-wider uppercase">Transform</h4>
          )}
          <PanelSlider
            label="Zoom"
            value={cam.zoom}
            onChange={(v) => setCameraProperty('zoom', v)}
            min={0.1}
            max={5}
            step={0.05}
            precision={2}
            suffix="x"
          />
          <PanelSlider
            label="Pan X"
            value={cam.panX}
            onChange={(v) => setCameraProperty('panX', v)}
            min={-50}
            max={50}
            step={0.1}
            precision={1}
            suffix="%"
          />
          <PanelSlider
            label="Pan Y"
            value={cam.panY}
            onChange={(v) => setCameraProperty('panY', v)}
            min={-50}
            max={50}
            step={0.1}
            precision={1}
            suffix="%"
          />
          <PanelSlider
            label="Rotation"
            value={cam.rotation}
            onChange={(v) => setCameraProperty('rotation', v)}
            min={-180}
            max={180}
            step={0.1}
            precision={1}
            suffix="°"
          />

          {/* Easing (only when on a keyframe) */}
          {currentKf && (
            <PanelSelect
              label="Easing"
              value={currentKf.easing}
              onChange={(v) => updateKeyframe(currentKfIndex, { easing: v as CameraKeyframe['easing'] })}
              options={[
                { value: 'linear', label: 'Linear' },
                { value: 'ease-in', label: 'Ease In' },
                { value: 'ease-out', label: 'Ease Out' },
                { value: 'ease-in-out', label: 'Ease In-Out' },
              ]}
              fullWidth
            />
          )}

          {/* Keyframe indicator */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <span className="text-[10px] text-zinc-600">
              {currentKf
                ? `Keyframe at ${(currentKf.frame / fps).toFixed(1)}s`
                : `Interpolated at ${(currentFrame / fps).toFixed(1)}s`}
            </span>
            {!currentKf && (
              <button
                onClick={() =>
                  addKeyframe({
                    frame: currentFrame,
                    zoom: cam.zoom,
                    panX: cam.panX,
                    panY: cam.panY,
                    rotation: cam.rotation,
                    easing: 'ease-in-out',
                  })
                }
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-[#4a7eff] hover:bg-[#4a7eff]/10 transition-colors"
              >
                <Plus size={10} />
                Add Keyframe
              </button>
            )}
          </div>

          {/* Reset */}
          <button
            onClick={() => useCameraStore.getState().reset()}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] text-zinc-600 hover:text-zinc-400 hover:bg-[#2a2a2a] transition-colors"
          >
            <RotateCcw size={10} />
            Reset Camera
          </button>
        </div>
      )}

      {/* Divider */}
      {activeTab === 'all' && <div className="border-t border-white/5" />}

      {/* Camera section */}
      {showCamera && (
        <div className="space-y-3">
          {activeTab === 'all' && (
            <h4 className="text-xs font-medium text-zinc-400 tracking-wider uppercase">Camera</h4>
          )}
          <PanelSelect
            label="Camera Body"
            value={cinemaStore.selectedBodyId}
            onChange={(v) => cinemaStore.setBody(v)}
            options={CAMERA_BODIES.map((b) => ({
              value: b.id,
              label: `${b.name} (${b.sensorWidth}x${b.sensorHeight}mm, ${b.dynamicRange}DR, ISO ${b.nativeISO})`,
            }))}
          />
          <div>
            <PanelSelect
              label="Lens"
              value={cinemaStore.selectedLensId}
              onChange={(v) => cinemaStore.setLens(v)}
              options={LENS_PROFILES.map((l) => ({
                value: l.id,
                label: `${l.name} (${l.focalLength}mm f/${l.maxAperture})`,
              }))}
            />
            {selectedLens?.anamorphic && (
              <p className="text-[10px] text-[#4a7eff] ml-[calc(80px+12px)] -mt-1">
                Anamorphic {selectedLens.anamorphicSqueeze}x
              </p>
            )}
          </div>
        </div>
      )}

      {/* Divider */}
      {activeTab === 'all' && <div className="border-t border-white/5" />}

      {/* Optical section */}
      {showOptical && (
        <div className="space-y-3">
          {activeTab === 'all' && (
            <h4 className="text-xs font-medium text-zinc-400 tracking-wider uppercase">Optical</h4>
          )}
          <PanelSlider
            label="Aperture"
            value={cinemaStore.opticalSettings.aperture}
            onChange={(v) => cinemaStore.setOptical({ aperture: v })}
            min={1.4}
            max={22}
            step={0.1}
            precision={1}
            formatValue={(v) => `f/${v.toFixed(1)}`}
          />
          <PanelSlider
            label="Focus Dist."
            value={cinemaStore.opticalSettings.focusDistance}
            onChange={(v) => cinemaStore.setOptical({ focusDistance: v })}
            min={0.3}
            max={30}
            step={0.1}
            precision={1}
            suffix="m"
          />
          <PanelSlider
            label="ISO"
            value={cinemaStore.opticalSettings.iso}
            onChange={(v) => cinemaStore.setOptical({ iso: v })}
            min={100}
            max={12800}
            step={100}
          />
          <PanelMultiSelect
            label="Effects"
            options={OPTICAL_EFFECTS}
            value={OPTICAL_EFFECTS.filter(
              (e) => cinemaStore.opticalSettings[e.value as keyof typeof cinemaStore.opticalSettings],
            ).map((e) => e.value)}
            onChange={(vals) => {
              for (const effect of OPTICAL_EFFECTS) {
                const isEnabled = vals.includes(effect.value)
                const currentlyEnabled =
                  cinemaStore.opticalSettings[effect.value as keyof typeof cinemaStore.opticalSettings]
                if (isEnabled !== currentlyEnabled) {
                  cinemaStore.toggleOptical(effect.value as any)
                }
              }
            }}
            placeholder="None"
          />
        </div>
      )}

      {/* Divider */}
      {activeTab === 'all' && <div className="border-t border-white/5" />}

      {/* Effects section */}
      {showEffects && (
        <div className="space-y-4">
          {activeTab === 'all' && (
            <h4 className="text-xs font-medium text-zinc-400 tracking-wider uppercase">Effects</h4>
          )}

          {/* Camera Shake */}
          <div className="space-y-3">
            <PanelToggle
              label="Camera Shake"
              checked={shakes.length > 0}
              onChange={(enabled) => {
                if (enabled) {
                  if (shakes.length === 0) {
                    addShake({
                      intensity: 5,
                      frequency: 8,
                      decay: 0.5,
                      durationFrames: 0,
                      startFrame: currentFrame,
                    })
                  }
                } else {
                  clearShakes()
                }
              }}
            />
            {shakes.length > 0 &&
              shakes.map((shake, i) => (
                <div key={i}>
                  <PanelSlider
                    label="Intensity"
                    value={shake.intensity}
                    onChange={(v) => {
                      const updated = [...shakes]
                      updated[i] = { ...shake, intensity: v }
                      useCameraStore.setState({ shakes: updated })
                    }}
                    min={0}
                    max={30}
                    step={0.5}
                    precision={1}
                  />
                  <PanelSlider
                    label="Frequency"
                    value={shake.frequency}
                    onChange={(v) => {
                      const updated = [...shakes]
                      updated[i] = { ...shake, frequency: v }
                      useCameraStore.setState({ shakes: updated })
                    }}
                    min={1}
                    max={30}
                    step={0.5}
                    precision={1}
                  />
                  <PanelSlider
                    label="Decay"
                    value={shake.decay}
                    onChange={(v) => {
                      const updated = [...shakes]
                      updated[i] = { ...shake, decay: v }
                      useCameraStore.setState({ shakes: updated })
                    }}
                    min={0}
                    max={1}
                    step={0.05}
                    precision={2}
                  />
                </div>
              ))}
          </div>

          {/* Focus Pull */}
          <div className="space-y-3">
            <PanelToggle
              label="Focus Pull"
              checked={!!focusPull}
              onChange={(enabled) => {
                if (enabled) {
                  if (!focusPull) {
                    setFocusPull({
                      targetZoom: 1.5,
                      focusX: 0.5,
                      focusY: 0.5,
                      transitionFrames: Math.round(fps * 0.5),
                      startFrame: currentFrame,
                      holdFrames: Math.round(fps * 1),
                      pullBack: true,
                    })
                  }
                } else {
                  clearFocusPull()
                }
              }}
            />
            {focusPull && (
              <>
                <PanelSlider
                  label="Zoom"
                  value={focusPull.targetZoom}
                  onChange={(v) => setFocusPull({ ...focusPull, targetZoom: v })}
                  min={1}
                  max={3}
                  step={0.05}
                  precision={2}
                />
                <PanelSlider
                  label="Focus X"
                  value={focusPull.focusX}
                  onChange={(v) => setFocusPull({ ...focusPull, focusX: v })}
                  min={0}
                  max={1}
                  step={0.01}
                  precision={2}
                />
                <PanelSlider
                  label="Focus Y"
                  value={focusPull.focusY}
                  onChange={(v) => setFocusPull({ ...focusPull, focusY: v })}
                  min={0}
                  max={1}
                  step={0.01}
                  precision={2}
                />
                <PanelSlider
                  label="Transition"
                  value={Math.round((focusPull.transitionFrames / fps) * 10) / 10}
                  onChange={(v) => setFocusPull({ ...focusPull, transitionFrames: Math.round(v * fps) })}
                  min={0.1}
                  max={3}
                  step={0.1}
                  precision={1}
                  suffix="s"
                />
                <PanelSlider
                  label="Hold"
                  value={Math.round((focusPull.holdFrames / fps) * 10) / 10}
                  onChange={(v) => setFocusPull({ ...focusPull, holdFrames: Math.round(v * fps) })}
                  min={0}
                  max={5}
                  step={0.1}
                  precision={1}
                  suffix="s"
                />
                <PanelToggle
                  label="Pull Back"
                  checked={focusPull.pullBack}
                  onChange={(v) => setFocusPull({ ...focusPull, pullBack: v })}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
