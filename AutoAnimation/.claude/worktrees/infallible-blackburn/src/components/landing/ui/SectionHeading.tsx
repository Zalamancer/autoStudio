interface SectionHeadingProps {
  tag?: string
  title: React.ReactNode
  description?: string
  className?: string
}

export function SectionHeading({ tag, title, description, className = '' }: SectionHeadingProps) {
  return (
    <div className={`text-center max-w-2xl mx-auto mb-16 ${className}`}>
      {tag && (
        <span className="inline-block px-3 py-1 mb-4 text-xs font-medium tracking-wider uppercase rounded-full border border-accent/30 text-accent bg-accent/5">
          {tag}
        </span>
      )}
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-lg text-zinc-400 leading-relaxed">{description}</p>
      )}
    </div>
  )
}
