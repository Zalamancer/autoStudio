import { useRef, useEffect, useState } from 'react'
import { Play } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SectionHeading } from './ui/SectionHeading'

gsap.registerPlugin(ScrollTrigger)

const DEMO_CLIPS = [
  { title: 'Product Explainer', category: 'Marketing' },
  { title: 'Story Time', category: 'Entertainment' },
  { title: 'Tutorial Video', category: 'Education' },
  { title: 'News Recap', category: 'Information' },
]

export function DemoSection() {
  const ref = useRef<HTMLDivElement>(null)
  const [typedText, setTypedText] = useState('')
  const fullPrompt = 'Create a 30-second animated explainer about AI video creation...'

  useEffect(() => {
    if (!ref.current) return
    let cancelled = false
    const trigger = ScrollTrigger.create({
      trigger: ref.current,
      start: 'top 70%',
      once: true,
      invalidateOnRefresh: true,
      onEnter: () => {
        let i = 0
        const interval = setInterval(() => {
          if (cancelled || i >= fullPrompt.length) { clearInterval(interval); return }
          i++
          setTypedText(fullPrompt.slice(0, i))
        }, 35)
      },
    })
    return () => { cancelled = true; trigger.kill() }
  }, [])

  return (
    <section id="demo" ref={ref} className="py-24 px-6">
      <SectionHeading
        tag="Demo"
        title="See It in Action"
        description="Watch how a single prompt transforms into a complete animated video"
      />

      <div className="max-w-4xl mx-auto">
        <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm overflow-hidden shadow-2xl">
          <div className="absolute inset-0 rounded-2xl ring-1 ring-accent/15 pointer-events-none" />

          <div className="px-6 py-4 border-b border-white/[0.04] bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-accent animate-glow-pulse" />
              <span className="text-sm text-zinc-300 font-mono">
                {typedText}
                <span className="inline-block w-0.5 h-4 bg-accent/70 ml-0.5 animate-pulse align-middle" />
              </span>
            </div>
          </div>

          <div className="aspect-video bg-gradient-to-br from-zinc-900/60 to-black/60 flex items-center justify-center">
            <button className="group w-20 h-20 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center hover:bg-accent/20 transition-all">
              <Play size={32} className="text-accent ml-1 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {DEMO_CLIPS.map((clip, i) => (
            <div
              key={i}
              className="group rounded-xl border border-white/[0.06] bg-white/[0.02] aspect-video flex flex-col items-center justify-center cursor-pointer hover:border-accent/20 transition-all"
            >
              <Play size={20} className="text-zinc-600 group-hover:text-accent transition-colors mb-2" />
              <p className="text-xs font-medium text-zinc-400 group-hover:text-white transition-colors">{clip.title}</p>
              <p className="text-[10px] text-zinc-600">{clip.category}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
