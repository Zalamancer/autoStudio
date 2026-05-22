/**
 * CharacterTypeSelector — Full-panel type picker for character creation.
 *
 * Shows 4 large row options (1D, 2D, 3D, Avatar) when user clicks
 * "Manual" or "AI Generate". Selection routes to the appropriate
 * character creation panel.
 */

import { ArrowLeft, Grid3x3, User, Box, UserCircle, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export type CharacterTypeChoice = '1d' | '2d' | '3d' | 'avatar'

interface CharacterTypeSelectorProps {
  mode: 'ai' | 'manual'
  onSelect: (type: CharacterTypeChoice) => void
  onBack: () => void
}

const TYPE_OPTIONS: {
  id: CharacterTypeChoice
  label: string
  icon: typeof Grid3x3
  color: string
  bgColor: string
  aiDescription: string
  manualDescription: string
}[] = [
  {
    id: '1d',
    label: 'Pixel Art',
    icon: Grid3x3,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10 border-purple-500/20 hover:border-purple-500/40 hover:bg-purple-500/15',
    aiDescription: 'Generate retro pixel art sprites with PixelLab AI',
    manualDescription: 'Create pixel art characters from scratch',
  },
  {
    id: '2d',
    label: '2D Sprite',
    icon: User,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10 border-green-500/20 hover:border-green-500/40 hover:bg-green-500/15',
    aiDescription: 'AI sprite sheet generation with visemes & expressions',
    manualDescription: 'Upload body part sprites layer by layer',
  },
  {
    id: '3d',
    label: '3D Model',
    icon: Box,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-500/15',
    aiDescription: 'Generate 3D characters with Meshy AI',
    manualDescription: 'Import GLB, FBX, or ZIP model files',
  },
  {
    id: 'avatar',
    label: 'Avatar',
    icon: UserCircle,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10 border-orange-500/20 hover:border-orange-500/40 hover:bg-orange-500/15',
    aiDescription: 'Create realistic talking avatars from text or photo',
    manualDescription: 'Upload a photo to create an avatar character',
  },
]

export function CharacterTypeSelector({ mode, onSelect, onBack }: CharacterTypeSelectorProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2.5 border-b border-white/5">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          <ArrowLeft size={14} />
        </button>
        <span className="text-xs font-medium text-gray-300">
          {mode === 'ai' ? 'AI Generate' : 'Create'} Character
        </span>
      </div>

      {/* Type Options */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            className={cn(
              'w-full flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 text-left group',
              opt.bgColor,
            )}
          >
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                opt.color,
                'bg-white/5',
              )}
            >
              <opt.icon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200">{opt.label}</p>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                {mode === 'ai' ? opt.aiDescription : opt.manualDescription}
              </p>
            </div>
            <ChevronRight
              size={14}
              className="text-gray-600 group-hover:text-gray-400 transition-colors shrink-0"
            />
          </button>
        ))}
      </div>
    </div>
  )
}
