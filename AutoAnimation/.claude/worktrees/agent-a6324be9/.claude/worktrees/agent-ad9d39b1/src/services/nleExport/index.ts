/**
 * NLE Export Orchestrator — generates timeline interchange files
 * and optionally bundles them with media assets.
 */

import { useTimelineStore } from '@/stores/useTimelineStore'
import { useMediaStore } from '@/stores/useMediaStore'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { useProjectStore } from '@/stores/useProjectStore'
import { generateFCPXML, type MediaAssetRef } from './fcpXmlGenerator'
import { generateEDL } from './edlGenerator'
import { generateOTIO } from './otioGenerator'

export type NLEFormat = 'fcp-xml' | 'edl' | 'otio'

const ASPECT_DIMENSIONS: Record<string, { width: number; height: number }> = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
  '4:3': { width: 1440, height: 1080 },
  '21:9': { width: 2560, height: 1080 },
}

/**
 * Gather media asset references from stores.
 */
function collectMediaAssets(): MediaAssetRef[] {
  const assets: MediaAssetRef[] = []
  const mediaAssets = useMediaStore.getState().assets

  for (const asset of mediaAssets) {
    let ext = 'bin'
    if (asset.url.includes('.')) {
      ext = asset.url.split('.').pop()?.split('?')[0] || 'bin'
    }
    assets.push({
      id: asset.id,
      name: `${asset.name || asset.id}.${ext}`,
      url: asset.url,
      type: asset.category === 'audio' ? 'audio' : asset.category === 'video' ? 'video' : 'image',
    })
  }

  // Add generated voice audio
  const voiceState = useVoiceStore.getState()
  for (const voice of voiceState.generatedVoices) {
    if (voice.audioUrl) {
      assets.push({
        id: voice.id,
        name: `voice_${voice.id}.mp3`,
        url: voice.audioUrl,
        type: 'audio',
      })
    }
  }

  return assets
}

/**
 * Export FCP XML from the current timeline state.
 */
export async function exportFCPXML(): Promise<Blob> {
  const { fps, totalFrames, tracks } = useTimelineStore.getState()
  const aspectRatio = useEditorStore.getState().aspectRatio
  const projectName = useProjectStore.getState().currentProjectName || 'ProAnimate Export'
  const dims = ASPECT_DIMENSIONS[aspectRatio] || ASPECT_DIMENSIONS['16:9']
  const assets = collectMediaAssets()

  const xml = generateFCPXML({
    sequenceName: projectName,
    fps,
    totalFrames,
    width: dims.width,
    height: dims.height,
    tracks,
    mediaAssets: assets,
    useRelativePaths: false,
  })

  return new Blob([xml], { type: 'application/xml;charset=utf-8' })
}

/**
 * Export EDL from the current timeline state.
 */
export async function exportEDL(): Promise<Blob> {
  const { fps, tracks } = useTimelineStore.getState()
  const projectName = useProjectStore.getState().currentProjectName || 'ProAnimate Export'

  const edl = generateEDL({
    title: projectName,
    fps,
    tracks,
  })

  return new Blob([edl], { type: 'text/plain;charset=utf-8' })
}

/**
 * Export OTIO from the current timeline state.
 */
export async function exportOTIO(): Promise<Blob> {
  const { fps, totalFrames, tracks } = useTimelineStore.getState()
  const projectName = useProjectStore.getState().currentProjectName || 'ProAnimate Export'
  const assets = collectMediaAssets()

  const otio = generateOTIO({
    name: projectName,
    fps,
    totalFrames,
    tracks,
    mediaAssets: assets.map((a) => ({ id: a.id, url: a.url, name: a.name })),
    useRelativePaths: false,
  })

  return new Blob([otio], { type: 'application/json;charset=utf-8' })
}

/**
 * Export timeline file + referenced media assets bundled into a ZIP.
 */
export async function exportWithAssets(format: NLEFormat): Promise<Blob> {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()

  const { fps, totalFrames, tracks } = useTimelineStore.getState()
  const aspectRatio = useEditorStore.getState().aspectRatio
  const projectName = useProjectStore.getState().currentProjectName || 'ProAnimate Export'
  const dims = ASPECT_DIMENSIONS[aspectRatio] || ASPECT_DIMENSIONS['16:9']
  const assets = collectMediaAssets()

  // Generate timeline file with relative paths
  let timelineContent: string
  let timelineFilename: string

  switch (format) {
    case 'fcp-xml': {
      timelineContent = generateFCPXML({
        sequenceName: projectName,
        fps,
        totalFrames,
        width: dims.width,
        height: dims.height,
        tracks,
        mediaAssets: assets,
        useRelativePaths: true,
      })
      timelineFilename = `${projectName}.xml`
      break
    }
    case 'edl': {
      timelineContent = generateEDL({
        title: projectName,
        fps,
        tracks,
      })
      timelineFilename = `${projectName}.edl`
      break
    }
    case 'otio': {
      timelineContent = generateOTIO({
        name: projectName,
        fps,
        totalFrames,
        tracks,
        mediaAssets: assets.map((a) => ({ id: a.id, url: a.url, name: a.name })),
        useRelativePaths: true,
      })
      timelineFilename = `${projectName}.otio`
      break
    }
  }

  zip.file(timelineFilename, timelineContent)

  // Download and bundle media assets
  const mediaFolder = zip.folder('media')!
  for (const asset of assets) {
    try {
      const resp = await fetch(asset.url)
      if (resp.ok) {
        const blob = await resp.blob()
        mediaFolder.file(asset.name, blob)
      }
    } catch {
      console.warn(`[nleExport] Failed to download asset: ${asset.name}`)
    }
  }

  return zip.generateAsync({ type: 'blob' })
}

/**
 * Get the file extension for an NLE format.
 */
export function getNLEFileExtension(format: NLEFormat): string {
  switch (format) {
    case 'fcp-xml': return 'xml'
    case 'edl': return 'edl'
    case 'otio': return 'otio'
  }
}
