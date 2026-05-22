/**
 * Style effect type definitions, settings interfaces, and registry.
 *
 * Canvas 2D effects are mutually exclusive per character/object — only one
 * active at a time. Boiling line (SVG filter) stacks independently.
 */

// ---------------------------------------------------------------------------
// Per-effect settings interfaces
// ---------------------------------------------------------------------------

export interface WoodcutSettings {
  enabled: boolean
  /** Brightness threshold (0-255) */
  threshold: number
  /** Edge line weight in pixels (1-5) */
  lineWeight: number
  /** Contrast multiplier (1.0-3.0) */
  contrast: number
  /** Invert black/white */
  invert: boolean
}

export interface NoiseGrainSettings {
  enabled: boolean
  /** Grain intensity (0-1) */
  intensity: number
  /** Grain size in pixels (1-4) */
  grainSize: number
  /** Monochrome grain or colored */
  monochrome: boolean
  /** Animation speed: frames per variant (1-5) */
  speed: number
}

export interface CelShadeSettings {
  enabled: boolean
  /** Number of color levels per channel (2-8) */
  levels: number
  /** Edge line thickness (0-3px, 0 = no outline) */
  edgeThickness: number
  /** Edge color */
  edgeColor: string
  /** Edge detection sensitivity (10-100) */
  edgeSensitivity: number
}

export interface NeonOutlineSettings {
  enabled: boolean
  /** Glow color */
  glowColor: string
  /** Glow radius (2-30px) */
  glowRadius: number
  /** Glow intensity (0.5-3.0) */
  glowIntensity: number
  /** Edge detection threshold (10-100) */
  edgeThreshold: number
  /** Dark background opacity (0-1, 0 = keep original bg) */
  backgroundDarken: number
}

export interface GlitchSettings {
  enabled: boolean
  /** Overall intensity (1-10) */
  intensity: number
  /** RGB channel split distance (0-20px) */
  rgbSplit: number
  /** Scanline overlay opacity (0-1) */
  scanlineOpacity: number
  /** Block displacement max (0-30px) */
  blockDisplace: number
  /** Animation speed: frames per variant (1-5) */
  speed: number
}

export interface VHSRetroSettings {
  enabled: boolean
  /** Chromatic aberration offset (0-10px) */
  chromaticAberration: number
  /** Scanline opacity (0-1) */
  scanlineOpacity: number
  /** Scanline spacing (2-8px) */
  scanlineSpacing: number
  /** Tracking distortion amount (0-20px) */
  tracking: number
  /** Color bleed amount (0-1) */
  colorBleed: number
  /** Animation speed: frames per variant (1-5) */
  speed: number
}

export interface SketchHatchSettings {
  enabled: boolean
  /** Line spacing (2-10px) */
  lineSpacing: number
  /** Line thickness (1-3px) */
  lineThickness: number
  /** Cross-hatch (adds 135 degree lines) */
  crossHatch: boolean
  /** Line darkness (0-1) */
  lineDarkness: number
  /** Background color */
  paperColor: string
}

export interface HalftoneSettings {
  enabled: boolean
  /** Grid cell size (3-16px) */
  dotSize: number
  /** Max dot radius as fraction of cell (0.3-1.0) */
  dotScale: number
  /** Dot color */
  dotColor: string
  /** Background color */
  backgroundColor: string
  /** Grid angle in degrees (0-90) */
  angle: number
}

export interface VoxelSettings {
  enabled: boolean
  /** Cube size in pixels (4-24) */
  cubeSize: number
  /** Height exaggeration (0.5-3.0) */
  heightScale: number
  /** Top face brightness (0.8-1.2) */
  topBrightness: number
  /** Ambient light (0-0.5) */
  ambient: number
  /** Show grid lines */
  gridLines: boolean
}

export interface WatercolorBleedSettings {
  enabled: boolean
  /** Bleed/blur radius (2-20px) */
  bleedAmount: number
  /** Edge roughness (0-1) */
  edgeRoughness: number
  /** Saturation boost (0.8-2.0) */
  saturation: number
  /** Paper texture opacity (0-0.5) */
  paperTexture: number
  /** Wet edge darkening (0-1) */
  wetEdge: number
}

export interface MosaicSettings {
  enabled: boolean
  /** Number of Voronoi seed points (20-500) */
  cellCount: number
  /** Border line width (0-3px) */
  borderWidth: number
  /** Border color */
  borderColor: string
  /** Random seed for reproducible patterns */
  seed: number
  /** Cell color variation (0-1) */
  colorVariation: number
}

// ---------------------------------------------------------------------------
// Extended effect settings interfaces
// ---------------------------------------------------------------------------

export interface AirBendSettings {
  intensity: number
  direction: number
  turbulence: number
  speed: number
}

export interface AnamorphicSettings {
  squeeze: number
  horizontalFlare: number
  ovalBokeh: number
  breathe: number
}

export interface AnimalizationSettings {
  animal: string
  intensity: number
  blendMode: string
}

export interface AnimeSpeedSettings {
  lineCount: number
  intensity: number
  direction: string
  gap: number
}

export interface AquariumSettings {
  causticIntensity: number
  waterColor: string
  lightRays: boolean
  speed: number
}

export interface AuraSettings {
  color: string
  intensity: number
  pulse: boolean
  size: number
}

export interface BlackTearsSettings {
  streakCount: number
  color: string
  opacity: number
  blurAmount: number
}

export interface BlindsTransitionSettings {
  progress: number
  slatCount: number
  direction: string
}

export interface BulletTimeSettings {
  intensity: number
  focusX: number
  focusY: number
  streaks: number
}

export interface ButterflySettings {
  count: number
  size: number
  wingSpeed: number
  colorful: boolean
}

export interface ChromaticAbSettings {
  redShift: number
  blueShift: number
  radialFalloff: number
}

export interface ComicBurstSettings {
  centerX: number
  centerY: number
  lineCount: number
  lineWidth: number
}

export interface ConfettiSettings {
  density: number
  size: number
  speed: number
  colors: string
}

export interface CosmicSettings {
  starDensity: number
  nebulaOpacity: number
  twinkle: boolean
  colorScheme: string
}

export interface CrownSettings {
  size: number
  color: string
  style: string
  glow: number
}

export interface CrystalSettings {
  facetSize: number
  refraction: number
  edgeSharpness: number
  sparkle: number
}

export interface CrystallizeSettings {
  cellSize: number
  edgeBrightness: number
  refractionIndex: number
}

export interface CurtainTransitionSettings {
  progress: number
  folds: number
  curtainColor: string
}

export interface CyborgSettings {
  coverage: number
  metalness: number
  circuitColor: string
  glowIntensity: number
}

export interface DatamoshSettings {
  blockSize: number
  corruptionRate: number
  colorShift: number
  speed: number
}

export interface DebrisSettings {
  count: number
  size: number
  velocity: number
  gravity: number
}

export interface DeflateSettings {
  amount: number
  centerX: number
  centerY: number
  radius: number
}

export interface DiamondSettings {
  facetCount: number
  refraction: number
  sparkleIntensity: number
  rainbowSheen: number
}

export interface DisintegrationSettings {
  progress: number
  particleSize: number
  direction: string
  speed: number
}

export interface DissolveTransitionSettings {
  progress: number
  blockSize: number
  randomSeed: number
}

export interface DofBokehSettings {
  focusDistance: number
  aperture: number
  maxBlur: number
  bokehShape: string
  focalBandWidth: number
}

export interface DoubleExposureSettings {
  blendMode: string
  opacity: number
  offset: number
}

export interface EarthBendSettings {
  shakeIntensity: number
  crackDensity: number
  crackWidth: number
  dustOpacity: number
}

export interface EmojiRainSettings {
  density: number
  size: number
  speed: number
  emojiSet: string
}

export interface EnergyFieldSettings {
  intensity: number
  color: string
  density: number
  speed: number
}

export interface ExplosionSettings {
  force: number
  fragmentSize: number
  scatter: number
  speed: number
}

export interface ExplosionRingSettings {
  radius: number
  thickness: number
  color: string
  speed: number
}

export interface EyeGlowSettings {
  color: string
  intensity: number
  radius: number
  pulse: boolean
}

export interface FacePaintSettings {
  pattern: string
  color: string
  opacity: number
}

export interface FacePunchSettings {
  force: number
  impactX: number
  impactY: number
  motionBlur: number
}

export interface FilmGrainCinemaSettings {
  intensity: number
  grainSize: number
  monochrome: boolean
}

export interface FireBendSettings {
  intensity: number
  speed: number
  spread: number
  colorTemp: number
}

export interface FireExplosionSettings {
  intensity: number
  size: number
  speed: number
  emberCount: number
}

export interface FireflySettings {
  count: number
  brightness: number
  color: string
  wanderSpeed: number
}

export interface FireRingSettings {
  radius: number
  thickness: number
  intensity: number
  speed: number
}

export interface FlameSettings {
  intensity: number
  height: number
  speed: number
  colorBase: string
}

export interface FlameVariantsSettings {
  variant: string
  size: number
  speed: number
}

export interface FogSettings {
  density: number
  color: string
  drift: number
  height: number
}

export interface FreezingSettings {
  coverage: number
  crystalSize: number
  frostOpacity: number
  blueShift: number
}

export interface GardenBloomSettings {
  bloomCount: number
  colorPalette: string
  speed: number
}

export interface GasSettings {
  density: number
  speed: number
  turbulence: number
  colorTint: string
}

export interface GhostSettings {
  trailCount: number
  opacity: number
  offset: number
  blurAmount: number
}

export interface GlowingFishSettings {
  fishCount: number
  glowColor: string
  size: number
  swimSpeed: number
}

export interface GlowingSkinSettings {
  intensity: number
  color: string
  radius: number
  bloom: number
}

export interface HairStyleSettings {
  color: string
  coverage: number
  blendMode: string
  gradient: boolean
}

export interface HandTransitionSettings {
  progress: number
  direction: string
  handStyle: string
}

export interface HoleTransitionSettings {
  progress: number
  centerX: number
  centerY: number
  shape: string
}

export interface HologramSettings {
  scanLineGap: number
  flickerSpeed: number
  tintStrength: number
  glitchChance: number
}

export interface ImpactSettings {
  impactX: number
  impactY: number
  crackCount: number
  crackLength: number
}

export interface InflateSettings {
  amount: number
  centerX: number
  centerY: number
  radius: number
}

export interface JumpTransitionSettings {
  progress: number
  bounceHeight: number
  squash: number
}

export interface KaleidoscopeSettings {
  segments: number
  rotation: number
  zoom: number
}

export interface LaserEyesSettings {
  color: string
  intensity: number
  beamWidth: number
  length: number
}

export interface LavaFlowSettings {
  temperature: number
  flowSpeed: number
  veinWidth: number
  glowIntensity: number
}

export interface LensFlareSettings {
  glowIntensity: number
  streakCount: number
  streakLength: number
  ghostCount: number
  tintColor: string
  anamorphicStreaks: boolean
}

export interface LevitationSettings {
  height: number
  speed: number
  wobble: number
  shadowOpacity: number
}

export interface LightningSettings {
  boltCount: number
  brightness: number
  branchiness: number
  speed: number
}

export interface MatrixRainNoveltySettings {
  density: number
  speed: number
  charSize: number
  color: string
}

export interface MeltSettings {
  viscosity: number
  dripLength: number
  meltSpeed: number
  speed: number
}

export interface MeltTransitionSettings {
  progress: number
  dripCount: number
  speed: number
}

export interface MetalSettings {
  metalType: string
  reflectivity: number
  contrast: number
}

export interface MoneyRainSettings {
  density: number
  size: number
  speed: number
  billColor: string
}

export interface NorthernLightsSettings {
  intensity: number
  waveSpeed: number
  height: number
  colorRange: string
}

export interface PageFlipTransitionSettings {
  progress: number
  direction: string
  perspective: number
}

export interface PixelateTransitionSettings {
  progress: number
  maxPixelSize: number
  direction: string
}

export interface PizzaFallSettings {
  count: number
  size: number
  speed: number
  rotateSpeed: number
}

export interface PlasmaSettings {
  intensity: number
  frequency: number
  speed: number
  colorScheme: string
}

export interface PolygonSettings {
  complexity: number
  edgeColor: string
  edgeVisible: boolean
}

export interface PopArtSettings {
  dotSize: number
  colorCount: number
  posterize: boolean
  outline: boolean
}

export interface PortalSettings {
  size: number
  rotation: number
  distortion: number
  glowColor: string
}

export interface PrismSettings {
  separation: number
  angle: number
  rainbowStrength: number
}

export interface RainSettings {
  intensity: number
  dropLength: number
  windAngle: number
  speed: number
}

export interface RavenTransitionSettings {
  progress: number
  birdCount: number
  darkness: number
}

export interface Retro8bitSettings {
  colorDepth: number
  scanlines: number
  crtCurve: number
}

export interface RippleSettings {
  amplitude: number
  frequency: number
  centerX: number
  centerY: number
  speed: number
}

export interface RippleTransitionSettings {
  progress: number
  amplitude: number
  waveCount: number
}

export interface RollTransitionSettings {
  progress: number
  direction: string
  curlRadius: number
}

export interface Rotation3dSettings {
  rotateX: number
  rotateY: number
  perspective: number
}

export interface RubberSettings {
  elasticity: number
  amplitude: number
  bounceSpeed: number
}

export interface SaintGlowSettings {
  color: string
  intensity: number
  radius: number
  pulseSpeed: number
}

export interface SakuraPetalsSettings {
  density: number
  size: number
  fallSpeed: number
  color: string
}

export interface SandStormSettings {
  density: number
  speed: number
  particleSize: number
  windAngle: number
}

export interface SeamlessTransitionSettings {
  progress: number
  blendMode: string
}

export interface ShockwaveSettings {
  amplitude: number
  wavelength: number
  originX: number
  originY: number
}

export interface SmokeSettings {
  density: number
  color: string
  opacity: number
  riseSpeed: number
}

export interface SmokeTransitionSettings {
  progress: number
  density: number
  color: string
}

export interface SnowSettings {
  density: number
  flakeSize: number
  speed: number
  windDrift: number
}

export interface SparkSettings {
  count: number
  brightness: number
  size: number
  speed: number
}

export interface SparkleSettings {
  density: number
  brightness: number
  size: number
  speed: number
}

export interface SpherizeSettings {
  amount: number
  centerX: number
  centerY: number
  radius: number
}

export interface SplashTransitionSettings {
  progress: number
  splashSize: number
  color: string
}

export interface SteamSettings {
  density: number
  opacity: number
  riseSpeed: number
  spread: number
}

export interface StickerSettings {
  outlineWidth: number
  outlineColor: string
  rounded: number
  shadow: number
}

export interface StoneSettings {
  stoneType: string
  roughness: number
  cracksVisible: boolean
}

export interface SunbeamSettings {
  intensity: number
  rayCount: number
  angle: number
  warmth: number
}

export interface SwirlSettings {
  angle: number
  radius: number
  centerX: number
  centerY: number
}

export interface TattooAnimSettings {
  pattern: string
  opacity: number
  scale: number
  animate: boolean
}

export interface TeleportSettings {
  progress: number
  particleSize: number
  direction: string
  color: string
}

export interface TimeWarpSettings {
  intensity: number
  centerX: number
  centerY: number
  streakLength: number
}

export interface UnderwaterSettings {
  depth: number
  fogDensity: number
  bubbles: number
  caustics: number
}

export interface VignettingSettings {
  amount: number
  feather: number
  roundness: number
  midpoint: number
}

export interface WaterBendSettings {
  amplitude: number
  frequency: number
  speed: number
  viscosity: number
}

export interface WaveDistortSettings {
  amplitudeX: number
  amplitudeY: number
  frequencyX: number
  frequencyY: number
}

export interface WerewolfSettings {
  furDensity: number
  jawExtend: number
  eyeGlow: number
  moonPhase: number
}

export interface WindSettings {
  speed: number
  angle: number
  streakLength: number
  opacity: number
}

export interface WingsSettings {
  style: string
  size: number
  opacity: number
  animate: boolean
}

export interface WireframeSettings {
  gridSize: number
  lineWidth: number
  lineColor: string
  fillOpacity: number
}

export interface XraySettings {
  intensity: number
  contrast: number
  blueShift: number
}

// ---------------------------------------------------------------------------
// Union types
// ---------------------------------------------------------------------------

export type StyleEffectType =
  | 'pixel-art'
  | 'woodcut'
  | 'woodcut-mask'
  | 'noise-grain'
  | 'cel-shade'
  | 'neon-outline'
  | 'glitch'
  | 'vhs-retro'
  | 'sketch-hatch'
  | 'halftone'
  | 'voxel'
  | 'watercolor-bleed'
  | 'mosaic'
  | 'air-bend'
  | 'anamorphic'
  | 'animalization'
  | 'anime-speed'
  | 'aquarium'
  | 'aura'
  | 'black-tears'
  | 'blinds-transition'
  | 'bullet-time'
  | 'butterfly'
  | 'chromatic-ab'
  | 'comic-burst'
  | 'confetti'
  | 'cosmic'
  | 'crown'
  | 'crystal'
  | 'crystallize'
  | 'curtain-transition'
  | 'cyborg'
  | 'datamosh'
  | 'debris'
  | 'deflate'
  | 'diamond'
  | 'disintegration'
  | 'dissolve-transition'
  | 'dof-bokeh'
  | 'double-exposure'
  | 'earth-bend'
  | 'emoji-rain'
  | 'energy-field'
  | 'explosion'
  | 'explosion-ring'
  | 'eye-glow'
  | 'face-paint'
  | 'face-punch'
  | 'film-grain-cinema'
  | 'fire-bend'
  | 'fire-explosion'
  | 'firefly'
  | 'fire-ring'
  | 'flame'
  | 'flame-variants'
  | 'fog'
  | 'freezing'
  | 'garden-bloom'
  | 'gas'
  | 'ghost'
  | 'glowing-fish'
  | 'glowing-skin'
  | 'hair-style'
  | 'hand-transition'
  | 'hole-transition'
  | 'hologram'
  | 'impact'
  | 'inflate'
  | 'jump-transition'
  | 'kaleidoscope'
  | 'laser-eyes'
  | 'lava-flow'
  | 'lens-flare'
  | 'levitation'
  | 'lightning'
  | 'matrix-rain-novelty'
  | 'melt'
  | 'melt-transition'
  | 'metal'
  | 'money-rain'
  | 'northern-lights'
  | 'page-flip-transition'
  | 'pixelate-transition'
  | 'pizza-fall'
  | 'plasma'
  | 'polygon'
  | 'pop-art'
  | 'portal'
  | 'prism'
  | 'rain'
  | 'raven-transition'
  | 'retro-8bit'
  | 'ripple'
  | 'ripple-transition'
  | 'roll-transition'
  | 'rotation-3d'
  | 'rubber'
  | 'saint-glow'
  | 'sakura-petals'
  | 'sand-storm'
  | 'seamless-transition'
  | 'shockwave'
  | 'smoke'
  | 'smoke-transition'
  | 'snow'
  | 'spark'
  | 'sparkle'
  | 'spherize'
  | 'splash-transition'
  | 'steam'
  | 'sticker'
  | 'stone'
  | 'sunbeam'
  | 'swirl'
  | 'tattoo-anim'
  | 'teleport'
  | 'time-warp'
  | 'underwater'
  | 'vignetting'
  | 'water-bend'
  | 'wave-distort'
  | 'werewolf'
  | 'wind'
  | 'wings'
  | 'wireframe'
  | 'xray'

export type StyleEffectSettings =
  | { type: 'pixel-art' } // Uses existing PixelArtEffectSettings
  | { type: 'woodcut'; settings: WoodcutSettings }
  | { type: 'woodcut-mask'; settings: WoodcutSettings }
  | { type: 'noise-grain'; settings: NoiseGrainSettings }
  | { type: 'cel-shade'; settings: CelShadeSettings }
  | { type: 'neon-outline'; settings: NeonOutlineSettings }
  | { type: 'glitch'; settings: GlitchSettings }
  | { type: 'vhs-retro'; settings: VHSRetroSettings }
  | { type: 'sketch-hatch'; settings: SketchHatchSettings }
  | { type: 'halftone'; settings: HalftoneSettings }
  | { type: 'voxel'; settings: VoxelSettings }
  | { type: 'watercolor-bleed'; settings: WatercolorBleedSettings }
  | { type: 'mosaic'; settings: MosaicSettings }
  | { type: 'air-bend'; settings: AirBendSettings }
  | { type: 'anamorphic'; settings: AnamorphicSettings }
  | { type: 'animalization'; settings: AnimalizationSettings }
  | { type: 'anime-speed'; settings: AnimeSpeedSettings }
  | { type: 'aquarium'; settings: AquariumSettings }
  | { type: 'aura'; settings: AuraSettings }
  | { type: 'black-tears'; settings: BlackTearsSettings }
  | { type: 'blinds-transition'; settings: BlindsTransitionSettings }
  | { type: 'bullet-time'; settings: BulletTimeSettings }
  | { type: 'butterfly'; settings: ButterflySettings }
  | { type: 'chromatic-ab'; settings: ChromaticAbSettings }
  | { type: 'comic-burst'; settings: ComicBurstSettings }
  | { type: 'confetti'; settings: ConfettiSettings }
  | { type: 'cosmic'; settings: CosmicSettings }
  | { type: 'crown'; settings: CrownSettings }
  | { type: 'crystal'; settings: CrystalSettings }
  | { type: 'crystallize'; settings: CrystallizeSettings }
  | { type: 'curtain-transition'; settings: CurtainTransitionSettings }
  | { type: 'cyborg'; settings: CyborgSettings }
  | { type: 'datamosh'; settings: DatamoshSettings }
  | { type: 'debris'; settings: DebrisSettings }
  | { type: 'deflate'; settings: DeflateSettings }
  | { type: 'diamond'; settings: DiamondSettings }
  | { type: 'disintegration'; settings: DisintegrationSettings }
  | { type: 'dissolve-transition'; settings: DissolveTransitionSettings }
  | { type: 'dof-bokeh'; settings: DofBokehSettings }
  | { type: 'double-exposure'; settings: DoubleExposureSettings }
  | { type: 'earth-bend'; settings: EarthBendSettings }
  | { type: 'emoji-rain'; settings: EmojiRainSettings }
  | { type: 'energy-field'; settings: EnergyFieldSettings }
  | { type: 'explosion'; settings: ExplosionSettings }
  | { type: 'explosion-ring'; settings: ExplosionRingSettings }
  | { type: 'eye-glow'; settings: EyeGlowSettings }
  | { type: 'face-paint'; settings: FacePaintSettings }
  | { type: 'face-punch'; settings: FacePunchSettings }
  | { type: 'film-grain-cinema'; settings: FilmGrainCinemaSettings }
  | { type: 'fire-bend'; settings: FireBendSettings }
  | { type: 'fire-explosion'; settings: FireExplosionSettings }
  | { type: 'firefly'; settings: FireflySettings }
  | { type: 'fire-ring'; settings: FireRingSettings }
  | { type: 'flame'; settings: FlameSettings }
  | { type: 'flame-variants'; settings: FlameVariantsSettings }
  | { type: 'fog'; settings: FogSettings }
  | { type: 'freezing'; settings: FreezingSettings }
  | { type: 'garden-bloom'; settings: GardenBloomSettings }
  | { type: 'gas'; settings: GasSettings }
  | { type: 'ghost'; settings: GhostSettings }
  | { type: 'glowing-fish'; settings: GlowingFishSettings }
  | { type: 'glowing-skin'; settings: GlowingSkinSettings }
  | { type: 'hair-style'; settings: HairStyleSettings }
  | { type: 'hand-transition'; settings: HandTransitionSettings }
  | { type: 'hole-transition'; settings: HoleTransitionSettings }
  | { type: 'hologram'; settings: HologramSettings }
  | { type: 'impact'; settings: ImpactSettings }
  | { type: 'inflate'; settings: InflateSettings }
  | { type: 'jump-transition'; settings: JumpTransitionSettings }
  | { type: 'kaleidoscope'; settings: KaleidoscopeSettings }
  | { type: 'laser-eyes'; settings: LaserEyesSettings }
  | { type: 'lava-flow'; settings: LavaFlowSettings }
  | { type: 'lens-flare'; settings: LensFlareSettings }
  | { type: 'levitation'; settings: LevitationSettings }
  | { type: 'lightning'; settings: LightningSettings }
  | { type: 'matrix-rain-novelty'; settings: MatrixRainNoveltySettings }
  | { type: 'melt'; settings: MeltSettings }
  | { type: 'melt-transition'; settings: MeltTransitionSettings }
  | { type: 'metal'; settings: MetalSettings }
  | { type: 'money-rain'; settings: MoneyRainSettings }
  | { type: 'northern-lights'; settings: NorthernLightsSettings }
  | { type: 'page-flip-transition'; settings: PageFlipTransitionSettings }
  | { type: 'pixelate-transition'; settings: PixelateTransitionSettings }
  | { type: 'pizza-fall'; settings: PizzaFallSettings }
  | { type: 'plasma'; settings: PlasmaSettings }
  | { type: 'polygon'; settings: PolygonSettings }
  | { type: 'pop-art'; settings: PopArtSettings }
  | { type: 'portal'; settings: PortalSettings }
  | { type: 'prism'; settings: PrismSettings }
  | { type: 'rain'; settings: RainSettings }
  | { type: 'raven-transition'; settings: RavenTransitionSettings }
  | { type: 'retro-8bit'; settings: Retro8bitSettings }
  | { type: 'ripple'; settings: RippleSettings }
  | { type: 'ripple-transition'; settings: RippleTransitionSettings }
  | { type: 'roll-transition'; settings: RollTransitionSettings }
  | { type: 'rotation-3d'; settings: Rotation3dSettings }
  | { type: 'rubber'; settings: RubberSettings }
  | { type: 'saint-glow'; settings: SaintGlowSettings }
  | { type: 'sakura-petals'; settings: SakuraPetalsSettings }
  | { type: 'sand-storm'; settings: SandStormSettings }
  | { type: 'seamless-transition'; settings: SeamlessTransitionSettings }
  | { type: 'shockwave'; settings: ShockwaveSettings }
  | { type: 'smoke'; settings: SmokeSettings }
  | { type: 'smoke-transition'; settings: SmokeTransitionSettings }
  | { type: 'snow'; settings: SnowSettings }
  | { type: 'spark'; settings: SparkSettings }
  | { type: 'sparkle'; settings: SparkleSettings }
  | { type: 'spherize'; settings: SpherizeSettings }
  | { type: 'splash-transition'; settings: SplashTransitionSettings }
  | { type: 'steam'; settings: SteamSettings }
  | { type: 'sticker'; settings: StickerSettings }
  | { type: 'stone'; settings: StoneSettings }
  | { type: 'sunbeam'; settings: SunbeamSettings }
  | { type: 'swirl'; settings: SwirlSettings }
  | { type: 'tattoo-anim'; settings: TattooAnimSettings }
  | { type: 'teleport'; settings: TeleportSettings }
  | { type: 'time-warp'; settings: TimeWarpSettings }
  | { type: 'underwater'; settings: UnderwaterSettings }
  | { type: 'vignetting'; settings: VignettingSettings }
  | { type: 'water-bend'; settings: WaterBendSettings }
  | { type: 'wave-distort'; settings: WaveDistortSettings }
  | { type: 'werewolf'; settings: WerewolfSettings }
  | { type: 'wind'; settings: WindSettings }
  | { type: 'wings'; settings: WingsSettings }
  | { type: 'wireframe'; settings: WireframeSettings }
  | { type: 'xray'; settings: XraySettings }

/** Stored on characters/SVG objects: type + arbitrary settings */
export interface ActiveStyleEffect {
  type: StyleEffectType
  settings: Record<string, any>
}

/** Whether an effect is animated (cycles through seed variants per frame) */
export function isAnimatedEffect(type: StyleEffectType): boolean {
  const animated: Set<StyleEffectType> = new Set([
    'glitch', 'vhs-retro', 'noise-grain',
    'air-bend', 'aura', 'butterfly', 'confetti', 'cosmic',
    'datamosh', 'diamond', 'earth-bend', 'emoji-rain', 'energy-field',
    'film-grain-cinema', 'fire-bend', 'fire-ring', 'flame', 'flame-variants',
    'ghost', 'hologram', 'lava-flow', 'levitation', 'lightning',
    'matrix-rain-novelty', 'money-rain', 'northern-lights', 'pizza-fall',
    'plasma', 'portal', 'saint-glow', 'sand-storm', 'smoke',
    'spark', 'sparkle', 'steam', 'time-warp', 'water-bend', 'wind', 'wings',
  ])
  return animated.has(type)
}

/** Number of pre-computed variants for animated effects */
export const ANIMATED_VARIANT_COUNT = 8

// ---------------------------------------------------------------------------
// Preset type
// ---------------------------------------------------------------------------

export interface StyleEffectPreset {
  label: string
  settings: Record<string, any>
}

// ---------------------------------------------------------------------------
// Registry — metadata for each effect (used by StylePanel grid picker)
// ---------------------------------------------------------------------------

export interface StyleEffectRegistryEntry {
  type: StyleEffectType
  label: string
  /** Lucide icon name (resolved in component) */
  icon: string
  category: 'basic' | 'artistic' | 'retro' | 'advanced'
  defaults: Record<string, any>
  presets: StyleEffectPreset[]
}

export const STYLE_EFFECT_REGISTRY: StyleEffectRegistryEntry[] = [
  {
    type: 'pixel-art',
    label: 'Pixel Art',
    icon: 'Grid3X3',
    category: 'basic',
    defaults: { pixelSize: 8, colorLevels: 8, outline: true },
    presets: [
      { label: 'Subtle', settings: { pixelSize: 4, colorLevels: 0, outline: false } },
      { label: 'Classic 8-bit', settings: { pixelSize: 8, colorLevels: 8, outline: true } },
      { label: 'Chunky', settings: { pixelSize: 16, colorLevels: 4, outline: true } },
    ],
  },
  {
    type: 'woodcut',
    label: 'Woodcut',
    icon: 'Stamp',
    category: 'artistic',
    defaults: { threshold: 128, lineWeight: 2, contrast: 1.8, invert: false },
    presets: [
      { label: 'Classic', settings: { threshold: 128, lineWeight: 2, contrast: 1.8, invert: false } },
      { label: 'Bold', settings: { threshold: 100, lineWeight: 4, contrast: 2.5, invert: false } },
      { label: 'Inverted', settings: { threshold: 140, lineWeight: 2, contrast: 2.0, invert: true } },
    ],
  },
  {
    type: 'woodcut-mask',
    label: 'Woodcut (Mask)',
    icon: 'Stamp',
    category: 'artistic',
    defaults: { threshold: 128, lineWeight: 2, contrast: 1.8, invert: false },
    presets: [
      { label: 'Classic', settings: { threshold: 128, lineWeight: 2, contrast: 1.8, invert: false } },
      { label: 'Bold', settings: { threshold: 100, lineWeight: 4, contrast: 2.5, invert: false } },
      { label: 'Inverted', settings: { threshold: 140, lineWeight: 2, contrast: 2.0, invert: true } },
    ],
  },
  {
    type: 'noise-grain',
    label: 'Noise Grain',
    icon: 'Sparkles',
    category: 'retro',
    defaults: { intensity: 0.3, grainSize: 1, monochrome: true, speed: 2 },
    presets: [
      { label: 'Subtle Film', settings: { intensity: 0.15, grainSize: 1, monochrome: true, speed: 2 } },
      { label: 'Heavy Grain', settings: { intensity: 0.5, grainSize: 2, monochrome: true, speed: 1 } },
      { label: 'Color Noise', settings: { intensity: 0.3, grainSize: 1, monochrome: false, speed: 2 } },
    ],
  },
  {
    type: 'cel-shade',
    label: 'Cel Shade',
    icon: 'Palette',
    category: 'artistic',
    defaults: { levels: 4, edgeThickness: 2, edgeColor: '#000000', edgeSensitivity: 40 },
    presets: [
      { label: 'Anime', settings: { levels: 3, edgeThickness: 2, edgeColor: '#000000', edgeSensitivity: 30 } },
      { label: 'Comic', settings: { levels: 5, edgeThickness: 3, edgeColor: '#1a1a1a', edgeSensitivity: 25 } },
      { label: 'Flat', settings: { levels: 3, edgeThickness: 0, edgeColor: '#000000', edgeSensitivity: 40 } },
    ],
  },
  {
    type: 'neon-outline',
    label: 'Neon Outline',
    icon: 'Zap',
    category: 'retro',
    defaults: { glowColor: '#00ffff', glowRadius: 10, glowIntensity: 1.5, edgeThreshold: 30, backgroundDarken: 0.7 },
    presets: [
      { label: 'Cyan', settings: { glowColor: '#00ffff', glowRadius: 10, glowIntensity: 1.5, edgeThreshold: 30, backgroundDarken: 0.7 } },
      { label: 'Hot Pink', settings: { glowColor: '#ff00ff', glowRadius: 12, glowIntensity: 2.0, edgeThreshold: 25, backgroundDarken: 0.8 } },
      { label: 'Subtle', settings: { glowColor: '#00ff88', glowRadius: 6, glowIntensity: 1.0, edgeThreshold: 40, backgroundDarken: 0.3 } },
    ],
  },
  {
    type: 'glitch',
    label: 'Glitch',
    icon: 'MonitorOff',
    category: 'retro',
    defaults: { intensity: 5, rgbSplit: 8, scanlineOpacity: 0.3, blockDisplace: 10, speed: 2 },
    presets: [
      { label: 'Mild', settings: { intensity: 3, rgbSplit: 4, scanlineOpacity: 0.1, blockDisplace: 5, speed: 3 } },
      { label: 'Heavy', settings: { intensity: 8, rgbSplit: 15, scanlineOpacity: 0.5, blockDisplace: 25, speed: 1 } },
      { label: 'RGB Split Only', settings: { intensity: 5, rgbSplit: 10, scanlineOpacity: 0, blockDisplace: 0, speed: 2 } },
    ],
  },
  {
    type: 'vhs-retro',
    label: 'VHS / Retro',
    icon: 'Tv',
    category: 'retro',
    defaults: { chromaticAberration: 3, scanlineOpacity: 0.3, scanlineSpacing: 4, tracking: 5, colorBleed: 0.3, speed: 2 },
    presets: [
      { label: 'VHS Tape', settings: { chromaticAberration: 4, scanlineOpacity: 0.4, scanlineSpacing: 3, tracking: 8, colorBleed: 0.4, speed: 2 } },
      { label: 'CRT Monitor', settings: { chromaticAberration: 2, scanlineOpacity: 0.5, scanlineSpacing: 2, tracking: 0, colorBleed: 0.2, speed: 3 } },
      { label: 'Mild Retro', settings: { chromaticAberration: 2, scanlineOpacity: 0.15, scanlineSpacing: 4, tracking: 3, colorBleed: 0.15, speed: 3 } },
    ],
  },
  {
    type: 'sketch-hatch',
    label: 'Sketch Hatch',
    icon: 'PenLine',
    category: 'artistic',
    defaults: { lineSpacing: 4, lineThickness: 1, crossHatch: true, lineDarkness: 0.8, paperColor: '#f5f0e8' },
    presets: [
      { label: 'Pencil', settings: { lineSpacing: 3, lineThickness: 1, crossHatch: false, lineDarkness: 0.6, paperColor: '#f5f0e8' } },
      { label: 'Ink', settings: { lineSpacing: 4, lineThickness: 2, crossHatch: true, lineDarkness: 1.0, paperColor: '#ffffff' } },
      { label: 'Light Sketch', settings: { lineSpacing: 6, lineThickness: 1, crossHatch: false, lineDarkness: 0.4, paperColor: '#faf8f4' } },
    ],
  },
  {
    type: 'halftone',
    label: 'Halftone',
    icon: 'Circle',
    category: 'artistic',
    defaults: { dotSize: 8, dotScale: 0.9, dotColor: '#000000', backgroundColor: '#ffffff', angle: 45 },
    presets: [
      { label: 'Newspaper', settings: { dotSize: 8, dotScale: 0.9, dotColor: '#000000', backgroundColor: '#f5f0e0', angle: 45 } },
      { label: 'Pop Art', settings: { dotSize: 12, dotScale: 1.0, dotColor: '#ff0066', backgroundColor: '#ffee00', angle: 30 } },
      { label: 'Fine Print', settings: { dotSize: 5, dotScale: 0.7, dotColor: '#333333', backgroundColor: '#ffffff', angle: 45 } },
    ],
  },
  {
    type: 'voxel',
    label: 'Voxel',
    icon: 'Box',
    category: 'advanced',
    defaults: { cubeSize: 10, heightScale: 1.5, topBrightness: 1.0, ambient: 0.2, gridLines: false },
    presets: [
      { label: 'Standard', settings: { cubeSize: 10, heightScale: 1.5, topBrightness: 1.0, ambient: 0.2, gridLines: false } },
      { label: 'Tiny Cubes', settings: { cubeSize: 6, heightScale: 1.0, topBrightness: 1.0, ambient: 0.15, gridLines: true } },
      { label: 'Dramatic', settings: { cubeSize: 14, heightScale: 2.5, topBrightness: 1.1, ambient: 0.1, gridLines: false } },
    ],
  },
  {
    type: 'watercolor-bleed',
    label: 'Watercolor',
    icon: 'Droplets',
    category: 'artistic',
    defaults: { bleedAmount: 8, edgeRoughness: 0.5, saturation: 1.3, paperTexture: 0.15, wetEdge: 0.4 },
    presets: [
      { label: 'Soft Wash', settings: { bleedAmount: 10, edgeRoughness: 0.3, saturation: 1.2, paperTexture: 0.2, wetEdge: 0.3 } },
      { label: 'Wet-on-Wet', settings: { bleedAmount: 16, edgeRoughness: 0.7, saturation: 1.5, paperTexture: 0.1, wetEdge: 0.6 } },
      { label: 'Dry Brush', settings: { bleedAmount: 4, edgeRoughness: 0.8, saturation: 1.1, paperTexture: 0.3, wetEdge: 0.2 } },
    ],
  },
  {
    type: 'mosaic',
    label: 'Mosaic',
    icon: 'Shapes',
    category: 'advanced',
    defaults: { cellCount: 100, borderWidth: 1, borderColor: '#333333', seed: 42, colorVariation: 0.1 },
    presets: [
      { label: 'Stained Glass', settings: { cellCount: 80, borderWidth: 2, borderColor: '#1a1a1a', seed: 42, colorVariation: 0.15 } },
      { label: 'Fine Mosaic', settings: { cellCount: 300, borderWidth: 1, borderColor: '#555555', seed: 42, colorVariation: 0.05 } },
      { label: 'Abstract', settings: { cellCount: 50, borderWidth: 3, borderColor: '#000000', seed: 42, colorVariation: 0.25 } },
    ],
  },
]

/** Lookup a registry entry by type */
export function getEffectRegistryEntry(type: StyleEffectType): StyleEffectRegistryEntry | undefined {
  return STYLE_EFFECT_REGISTRY.find((e) => e.type === type)
}

/** Get defaults for an effect type */
export function getEffectDefaults(type: StyleEffectType): Record<string, any> {
  return getEffectRegistryEntry(type)?.defaults ?? {}
}
