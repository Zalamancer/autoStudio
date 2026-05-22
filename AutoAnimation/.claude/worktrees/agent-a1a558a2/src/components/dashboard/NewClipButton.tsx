import { Plus } from 'lucide-react'

interface NewClipButtonProps {
  onClick: () => void
}

export function NewClipButton({ onClick }: NewClipButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-medium text-sm transition-colors"
    >
      <Plus size={18} />
      New Clip
    </button>
  )
}
