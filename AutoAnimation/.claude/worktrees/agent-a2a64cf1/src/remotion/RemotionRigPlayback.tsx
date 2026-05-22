/**
 * RemotionRigPlayback — Uses the exact same RigPlaybackViewer (PixiJS) renderer
 * as the live canvas, driven by Remotion's useCurrentFrame() so the preview
 * and export look identical to the canvas.
 */
import { useMemo } from 'react'
import { useFrame, useComposition } from '@/engine'
import { RigPlaybackViewer } from '@bonerigging/editor'
import type { SerializedRigData } from '@bonerigging/core'
import type { RigExportData } from './types'

interface RemotionRigPlaybackProps {
  rigExportData: RigExportData
  displayW: number
}

export function RemotionRigPlayback({ rigExportData, displayW }: RemotionRigPlaybackProps) {
  const frame = useFrame()
  const { fps } = useComposition()

  const serializedData = useMemo<SerializedRigData | null>(() => {
    if (!rigExportData.boneriggingSerializedData) return null
    try {
      return JSON.parse(rigExportData.boneriggingSerializedData) as SerializedRigData
    } catch {
      return null
    }
  }, [rigExportData.boneriggingSerializedData])

  if (!serializedData) return null

  return (
    <RigPlaybackViewer
      data={serializedData}
      width={displayW}
      height={displayW}
      time={frame / fps}
      showBones={false}
      isPlaying={true}
      loop={true}
      padRatio={0}
    />
  )
}
