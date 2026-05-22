/**
 * FCP XML v1.9 Generator — produces Final Cut Pro XML that imports into
 * Premiere Pro, DaVinci Resolve, and Final Cut Pro.
 */

import type { Track, Clip } from '@/types/timeline'
import { fpsToTimebase } from './timecodeUtils'

interface FCPXMLOptions {
  sequenceName: string
  fps: number
  totalFrames: number
  width: number
  height: number
  tracks: Track[]
  mediaAssets: MediaAssetRef[]
  useRelativePaths: boolean
}

export interface MediaAssetRef {
  id: string
  name: string
  url: string
  type: 'video' | 'audio' | 'image'
  duration?: number // in frames
}

/**
 * Generate FCP XML v1.9 from timeline data.
 */
export function generateFCPXML(options: FCPXMLOptions): string {
  const { sequenceName, fps, totalFrames, width, height, tracks, mediaAssets, useRelativePaths } = options
  const timebase = fpsToTimebase(fps)

  // Build asset file references
  const fileRefs = buildFileReferences(mediaAssets, useRelativePaths, timebase)
  const videoTracks = tracks.filter((t) => t.type === 'video' || t.type === 'sprite')
  const audioTracks = tracks.filter((t) => t.type === 'audio')

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`
  xml += `<!DOCTYPE xmeml>\n`
  xml += `<xmeml version="5">\n`
  xml += `  <project>\n`
  xml += `    <name>${escapeXml(sequenceName)}</name>\n`
  xml += `    <children>\n`
  xml += `      <sequence>\n`
  xml += `        <name>${escapeXml(sequenceName)}</name>\n`
  xml += `        <duration>${totalFrames}</duration>\n`
  xml += `        <rate>\n`
  xml += `          <timebase>${timebase}</timebase>\n`
  xml += `          <ntsc>FALSE</ntsc>\n`
  xml += `        </rate>\n`
  xml += `        <media>\n`

  // Video section
  xml += `          <video>\n`
  xml += `            <format>\n`
  xml += `              <samplecharacteristics>\n`
  xml += `                <width>${width}</width>\n`
  xml += `                <height>${height}</height>\n`
  xml += `                <pixelaspectratio>square</pixelaspectratio>\n`
  xml += `                <rate>\n`
  xml += `                  <timebase>${timebase}</timebase>\n`
  xml += `                  <ntsc>FALSE</ntsc>\n`
  xml += `                </rate>\n`
  xml += `              </samplecharacteristics>\n`
  xml += `            </format>\n`

  for (let i = 0; i < videoTracks.length; i++) {
    const track = videoTracks[i]
    xml += generateTrackXML(track, fileRefs, timebase, i + 1, 'video')
  }

  // If no video tracks but we have non-empty tracks, add an empty one
  if (videoTracks.length === 0) {
    xml += `            <track/>\n`
  }

  xml += `          </video>\n`

  // Audio section
  xml += `          <audio>\n`

  for (let i = 0; i < audioTracks.length; i++) {
    const track = audioTracks[i]
    xml += generateTrackXML(track, fileRefs, timebase, i + 1, 'audio')
  }

  if (audioTracks.length === 0) {
    xml += `            <track/>\n`
  }

  xml += `          </audio>\n`
  xml += `        </media>\n`
  xml += `      </sequence>\n`
  xml += `    </children>\n`
  xml += `  </project>\n`
  xml += `</xmeml>\n`

  return xml
}

function generateTrackXML(
  track: Track,
  fileRefs: Map<string, string>,
  timebase: number,
  trackNum: number,
  mediaType: 'video' | 'audio',
): string {
  let xml = `            <track>\n`

  const visibleClips = track.clips.filter(() => true) // All clips
  for (const clip of visibleClips) {
    xml += generateClipItemXML(clip, fileRefs, timebase, trackNum, mediaType)
  }

  xml += `            </track>\n`
  return xml
}

function generateClipItemXML(
  clip: Clip,
  fileRefs: Map<string, string>,
  timebase: number,
  _trackNum: number,
  mediaType: 'video' | 'audio',
): string {
  const fileRef = fileRefs.get(clip.sourceId)
  const clipName = clip.name || `Clip_${clip.id.slice(0, 8)}`
  const duration = clip.endFrame - clip.startFrame

  let xml = `              <clipitem>\n`
  xml += `                <name>${escapeXml(clipName)}</name>\n`
  xml += `                <duration>${duration}</duration>\n`
  xml += `                <rate>\n`
  xml += `                  <timebase>${timebase}</timebase>\n`
  xml += `                  <ntsc>FALSE</ntsc>\n`
  xml += `                </rate>\n`
  xml += `                <start>${clip.startFrame}</start>\n`
  xml += `                <end>${clip.endFrame}</end>\n`
  xml += `                <in>${clip.sourceInPoint}</in>\n`
  xml += `                <out>${clip.sourceOutPoint || duration}</out>\n`

  if (fileRef) {
    xml += `                <file id="${escapeXml(clip.sourceId)}">\n`
    xml += `                  <name>${escapeXml(clipName)}</name>\n`
    xml += `                  <pathurl>${escapeXml(fileRef)}</pathurl>\n`
    xml += `                  <media>\n`
    xml += `                    <${mediaType}>\n`
    xml += `                      <samplecharacteristics>\n`
    xml += `                        <samplerate>48000</samplerate>\n`
    xml += `                      </samplecharacteristics>\n`
    xml += `                    </${mediaType}>\n`
    xml += `                  </media>\n`
    xml += `                </file>\n`
  }

  xml += `              </clipitem>\n`
  return xml
}

function buildFileReferences(
  assets: MediaAssetRef[],
  useRelativePaths: boolean,
  _timebase: number,
): Map<string, string> {
  const refs = new Map<string, string>()
  for (const asset of assets) {
    const path = useRelativePaths
      ? `media/${asset.name}`
      : asset.url
    refs.set(asset.id, path)
  }
  return refs
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
