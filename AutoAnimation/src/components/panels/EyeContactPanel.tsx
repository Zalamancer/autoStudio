/**
 * Eye Contact Correction Panel
 *
 * UI for detecting eye regions and adjusting gaze direction in character sprites.
 * Provides controls for target selection, correction strength, and batch processing.
 */

import { useCallback, useState } from 'react'
import { Eye, Target, Camera, Users, Loader2, RotateCcw, Zap } from 'lucide-react'
import { PanelSlider, PanelCheckbox } from '@/components/ui/panel-controls'
import { useEyeContactStore } from '@/stores/useEyeContactStore'
import { useCharacterConfigStore } from '@/stores/useCharacterConfigStore'
import { detectEyeRegions, correctEyeContact, batchCorrectEyeContact } from '@/services/eyeContactCorrection'
import type { GazeTarget } from '@/types/eyeContact'

export function EyeContactPanel() {
  const {
    settings,
    currentDetection,
    batchStatus,
    isDetecting,
    error,
    updateSettings,
    setTarget,
    setStrength,
    setDetection,
    setCorrectedSprite,
    setBatchStatus,
    setDetecting,
    setError,
  } = useEyeContactStore()

  const savedImages = useCharacterConfigStore((s) => s.savedImages)
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null)

  // Get all eye sprites for batch processing
  const eyeSprites = savedImages.eye || []
  const hasSprites = eyeSprites.length > 0

  const handleDetect = useCallback(async () => {
    if (!hasSprites) return
    const firstEye = eyeSprites[0]
    if (!firstEye) return

    setDetecting(true)
    setError(null)

    try {
      const detection = await detectEyeRegions(firstEye)
      setDetection(detection)
      setSelectedPreview(firstEye)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Detection failed')
    } finally {
      setDetecting(false)
    }
  }, [eyeSprites, hasSprites, setDetecting, setError, setDetection])

  const handleCorrectSingle = useCallback(async () => {
    if (!selectedPreview) return

    setDetecting(true)
    setError(null)

    try {
      const result = await correctEyeContact(selectedPreview, settings.target, settings.strength)
      setCorrectedSprite(selectedPreview, result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Correction failed')
    } finally {
      setDetecting(false)
    }
  }, [selectedPreview, settings.target, settings.strength, setDetecting, setError, setCorrectedSprite])

  const handleBatchCorrect = useCallback(async () => {
    if (eyeSprites.length === 0) return

    setBatchStatus({ isProcessing: true, total: eyeSprites.length, processed: 0, failed: 0, results: [] })
    setError(null)

    try {
      await batchCorrectEyeContact(
        eyeSprites,
        settings.target,
        settings.strength,
        (status) => setBatchStatus(status),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Batch correction failed')
    }
  }, [eyeSprites, settings.target, settings.strength, setBatchStatus, setError])

  const handleTargetChange = useCallback((type: GazeTarget['type']) => {
    switch (type) {
      case 'camera':
        setTarget({ type: 'camera' })
        break
      case 'point':
        setTarget({ type: 'point', x: 0, y: 0 })
        break
      case 'character':
        setTarget({ type: 'character', characterId: '' })
        break
    }
  }, [setTarget])

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Eye className="w-4 h-4 text-blue-400" />
        <h3 className="text-sm font-medium text-white">Eye Contact Correction</h3>
      </div>

      <p className="text-xs text-zinc-400">
        Adjust character eye direction to look at the camera or a target point.
        Uses ML-based gaze detection and canvas warping.
      </p>

      {/* Enable toggle */}
      <PanelCheckbox
        label="Enable eye contact correction"
        checked={settings.enabled}
        onChange={(v) => updateSettings({ enabled: v })}
      />

      {/* Gaze Target */}
      <div className="space-y-1.5">
        <span className="text-xs text-zinc-400">Gaze Target</span>
        <div className="flex gap-1.5">
          <button
            onClick={() => handleTargetChange('camera')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              settings.target.type === 'camera'
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            <Camera className="w-3 h-3" />
            Camera
          </button>
          <button
            onClick={() => handleTargetChange('point')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              settings.target.type === 'point'
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            <Target className="w-3 h-3" />
            Point
          </button>
          <button
            onClick={() => handleTargetChange('character')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              settings.target.type === 'character'
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            <Users className="w-3 h-3" />
            Character
          </button>
        </div>
      </div>

      {/* Strength slider */}
      <PanelSlider
        label="Strength"
        value={settings.strength * 100}
        onChange={(v) => setStrength(v / 100)}
        min={0}
        max={100}
        step={1}
        suffix="%"
      />

      {/* Detection section */}
      <div className="border-t border-zinc-800 pt-2 space-y-2">
        <span className="text-xs text-zinc-400 font-medium">Detection</span>

        {!hasSprites && (
          <p className="text-xs text-zinc-500">No eye sprites available. Upload eye sprites first.</p>
        )}

        {hasSprites && (
          <div className="flex gap-2">
            <button
              onClick={handleDetect}
              disabled={isDetecting}
              className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded disabled:opacity-50"
            >
              {isDetecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
              Detect Eyes
            </button>
            <button
              onClick={handleCorrectSingle}
              disabled={isDetecting || !currentDetection}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded disabled:opacity-50"
            >
              <RotateCcw className="w-3 h-3" />
              Correct
            </button>
          </div>
        )}

        {currentDetection && (
          <div className="text-xs text-zinc-500 space-y-0.5">
            <p>Left eye: {currentDetection.leftEye ? 'detected' : 'not found'}</p>
            <p>Right eye: {currentDetection.rightEye ? 'detected' : 'not found'}</p>
            <p>Confidence: {Math.round(currentDetection.confidence * 100)}%</p>
            <p>Current gaze: ({currentDetection.gazeDirection.x.toFixed(2)}, {currentDetection.gazeDirection.y.toFixed(2)})</p>
          </div>
        )}
      </div>

      {/* Batch processing */}
      {hasSprites && eyeSprites.length > 1 && (
        <div className="border-t border-zinc-800 pt-2 space-y-2">
          <span className="text-xs text-zinc-400 font-medium">Batch Processing</span>
          <p className="text-xs text-zinc-500">{eyeSprites.length} eye sprites available</p>
          <button
            onClick={handleBatchCorrect}
            disabled={batchStatus.isProcessing}
            className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded disabled:opacity-50 w-full justify-center"
          >
            {batchStatus.isProcessing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Zap className="w-3 h-3" />
            )}
            Correct All Sprites ({eyeSprites.length})
          </button>

          {batchStatus.isProcessing && (
            <div className="space-y-1">
              <div className="w-full bg-zinc-800 rounded-full h-1.5">
                <div
                  className="bg-purple-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${(batchStatus.processed / batchStatus.total) * 100}%` }}
                />
              </div>
              <p className="text-xs text-zinc-500">
                {batchStatus.processed}/{batchStatus.total} processed
                {batchStatus.failed > 0 && ` (${batchStatus.failed} failed)`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="text-xs text-red-400 bg-red-950/30 rounded px-2 py-1.5">
          {error}
        </div>
      )}
    </div>
  )
}
