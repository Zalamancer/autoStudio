export interface CharacterLibraryEntry {
  id: string;
  name: string;
  thumbnailUrl: string;
  imageUrl: string;
  /** Raw SVG source text — when present, the rig editor should use SVGParser
   *  instead of rasterizing the imageUrl. */
  svgSource?: string;
}
