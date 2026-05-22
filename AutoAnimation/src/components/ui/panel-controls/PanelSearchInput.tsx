import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PanelSearchInputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}

export function PanelSearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className,
}: PanelSearchInputProps) {
  return (
    <div className={cn('relative mb-3', className)}>
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-panel-surface text-white text-sm pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-gray-600"
      />
    </div>
  )
}
