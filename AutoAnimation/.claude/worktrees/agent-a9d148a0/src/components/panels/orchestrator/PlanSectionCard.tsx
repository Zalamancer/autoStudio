import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface PlanSectionCardProps {
  icon: LucideIcon
  title: string
  count?: number
  defaultExpanded?: boolean
  children: React.ReactNode
}

export function PlanSectionCard({
  icon: Icon,
  title,
  count,
  defaultExpanded = false,
  children,
}: PlanSectionCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <div className="bg-[#1e1e1e]/60 border border-[#3a3a3a]/40 rounded-lg overflow-hidden transition-colors hover:border-[#3a3a3a]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 transition-colors hover:bg-[#2a2a2a]/40"
      >
        <Icon size={13} className="text-gray-500 shrink-0" />
        <span className="text-[11px] font-medium text-gray-300 flex-1 text-left">{title}</span>
        {count !== undefined && count > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#3a3a3a]/60 text-gray-400 font-medium">
            {count}
          </span>
        )}
        <ChevronRight
          size={11}
          className={cn(
            'text-gray-500 transition-transform duration-200 shrink-0',
            expanded && 'rotate-90',
          )}
        />
      </button>

      <div
        className={cn(
          'grid transition-all duration-200 ease-out',
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div className="px-3 pb-2.5 pt-0.5 space-y-1 border-t border-white/5/60">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
