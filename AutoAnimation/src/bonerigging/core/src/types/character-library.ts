import type { SerializedRigData } from '../serialization/schema'

export interface CharacterLibraryEntry {
  id: string
  name: string
  thumbnailUrl: string
  imageUrl: string
  /** Raw SVG source text — when present, the rig editor should use SVGParser
   *  instead of rasterizing the imageUrl. */
  svgSource?: string
  /** Previously saved rig data for this character. When present, the editor
   *  should restore the saved rig instead of auto-rigging from scratch. */
  savedRigData?: SerializedRigData
}
