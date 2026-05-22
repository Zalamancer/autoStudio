import { useState, useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SectionHeading } from './ui/SectionHeading'
import { FeatureTab } from './FeatureTab'
import { FEATURES } from './featureData'

gsap.registerPlugin(ScrollTrigger)

export function FeatureShowcase() {
  const [activeIdx, setActiveIdx] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLDivElement>(null)

  // Animate tab switch
  useEffect(() => {
    if (!contentRef.current) return
    gsap.fromTo(
      contentRef.current,
      { opacity: 0, x: 30 },
      { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' }
    )
  }, [activeIdx])

  // Scroll entrance
  useEffect(() => {
    if (!sectionRef.current) return
    const ctx = gsap.context(() => {
      gsap.from(sectionRef.current!, {
        opacity: 0,
        y: 40,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
          invalidateOnRefresh: true,
        },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section id="features" ref={sectionRef} className="py-24 px-6">
      <SectionHeading
        tag="Features"
        title="Everything you need to create"
        description="A complete animation studio powered by AI — from script to screen"
      />

      <div className="max-w-6xl mx-auto">
        <div className="flex gap-2 mb-12 overflow-x-auto pb-2 scrollbar-none">
          {FEATURES.map((f, i) => (
            <button
              key={f.id}
              onClick={() => setActiveIdx(i)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                i === activeIdx
                  ? 'bg-accent/10 text-accent border border-accent/30'
                  : 'text-zinc-500 hover:text-zinc-300 border border-transparent hover:border-white/[0.06]'
              }`}
            >
              <f.icon size={16} />
              {f.title}
            </button>
          ))}
        </div>

        <div ref={contentRef}>
          <FeatureTab feature={FEATURES[activeIdx]} />
        </div>
      </div>
    </section>
  )
}
