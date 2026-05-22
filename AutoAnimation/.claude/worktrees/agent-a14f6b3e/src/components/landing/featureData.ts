import { Bot, Users, Box, Layers, Mic, BarChart3 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface FeatureItem {
  id: string
  icon: LucideIcon
  title: string
  description: string
  bullets: string[]
}

export const FEATURES: FeatureItem[] = [
  {
    id: 'ai-director',
    icon: Bot,
    title: 'AI Director',
    description: 'Type a prompt, get a complete video. Our AI orchestrator plans and builds every element automatically.',
    bullets: [
      'Gemini-powered script generation',
      '13-step automated pipeline',
      'Smart scene composition',
      'One-click from idea to video',
    ],
  },
  {
    id: '2d-characters',
    icon: Users,
    title: '2D Characters',
    description: 'Fully rigged 2D characters with layered sprites, emotion heads, and 24-viseme lip sync.',
    bullets: [
      '4-layer sprite composite system',
      '24 emotion head variants',
      'AI auto-rig from any image',
      'Bone-based mesh deformation',
    ],
  },
  {
    id: '3d-characters',
    icon: Box,
    title: '3D Characters',
    description: 'Import or generate 3D characters with skeleton animation, retargeting, and spring physics.',
    bullets: [
      'Text-to-3D and Image-to-3D',
      'Mixamo & RPM skeleton support',
      'Animation retargeting across rigs',
      'Spring bones & squash-stretch',
    ],
  },
  {
    id: 'motion-graphics',
    icon: Layers,
    title: 'Motion Graphics',
    description: '100+ professionally designed HTML templates — infographics, kinetic typography, and social overlays.',
    bullets: [
      '100+ built-in templates',
      'Live config editing',
      'Charts, maps, and diagrams',
      'Category-organized library',
    ],
  },
  {
    id: 'voice-lip-sync',
    icon: Mic,
    title: 'Voice & Lip Sync',
    description: 'ElevenLabs TTS with phoneme-aligned lip sync, emotion cues, and AI-generated background music.',
    bullets: [
      '30+ AI voices',
      '24-viseme smooth lip sync',
      'Script emotion cues',
      'AI background music',
    ],
  },
  {
    id: 'publish-analytics',
    icon: BarChart3,
    title: 'Publish & Analytics',
    description: 'Export and publish directly to all major platforms with built-in performance tracking.',
    bullets: [
      'One-click social publishing',
      'TikTok, YouTube, Instagram, X',
      'Pre-publish quality scoring',
      'Performance insights & learning',
    ],
  },
]
