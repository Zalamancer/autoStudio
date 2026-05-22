import { Check } from 'lucide-react'
import type { FeatureItem } from './featureData'

interface FeatureTabProps {
  feature: FeatureItem
}

export function FeatureTab({ feature }: FeatureTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
      {/* Text */}
      <div>
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
          {feature.title}
        </h3>
        <p className="text-zinc-400 leading-relaxed mb-6">
          {feature.description}
        </p>
        <ul className="space-y-3">
          {feature.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
              <Check size={16} className="text-accent mt-0.5 shrink-0" />
              {b}
            </li>
          ))}
        </ul>
      </div>

      {/* Visual placeholder */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] aspect-[4/3] flex items-center justify-center">
        <div className="text-center">
          <feature.icon size={48} className="mx-auto text-accent/40 mb-3" />
          <p className="text-sm text-zinc-600">{feature.title} preview</p>
        </div>
      </div>
    </div>
  )
}
