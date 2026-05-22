import { useRef, useEffect } from 'react'
import { MessageSquare, Wand2, Share2 } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SectionHeading } from './ui/SectionHeading'
import { GlassCard } from './ui/GlassCard'

gsap.registerPlugin(ScrollTrigger)

const STEPS = [
  {
    icon: MessageSquare,
    title: 'Type Your Prompt',
    description: 'Describe the video you want in plain text — topic, style, characters, and tone.',
    step: '01',
  },
  {
    icon: Wand2,
    title: 'AI Builds Everything',
    description: '13 automated steps generate script, characters, voices, lip sync, motion graphics, and music.',
    step: '02',
  },
  {
    icon: Share2,
    title: 'Publish Everywhere',
    description: 'Export in one click to TikTok, YouTube Shorts, Instagram Reels, Facebook, and X.',
    step: '03',
  },
]

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    if (!ref.current || !cardsRef.current) return
    const cards = cardsRef.current.children
    const ctx = gsap.context(() => {
      gsap.from(cards, {
        opacity: 0,
        y: 60,
        scale: 0.95,
        duration: 0.6,
        stagger: 0.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 75%',
          toggleActions: 'play none none none',
          invalidateOnRefresh: true,
        },
      })

      if (lineRef.current) {
        const length = lineRef.current.getTotalLength()
        gsap.fromTo(lineRef.current,
          { strokeDasharray: length, strokeDashoffset: length },
          {
            strokeDashoffset: 0,
            duration: 1.5,
            ease: 'power2.inOut',
            scrollTrigger: {
              trigger: ref.current,
              start: 'top 70%',
              toggleActions: 'play none none none',
              invalidateOnRefresh: true,
            },
          }
        )
      }
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section id="how-it-works" ref={ref} className="py-24 px-6">
      <SectionHeading
        tag="How It Works"
        title="From prompt to published in minutes"
        description="Three simple steps to create professional animated videos"
      />

      <div className="relative max-w-5xl mx-auto">
        <svg
          className="absolute top-1/2 left-0 w-full h-4 -translate-y-1/2 hidden lg:block pointer-events-none"
          viewBox="0 0 1000 10"
          preserveAspectRatio="none"
        >
          <path
            ref={lineRef}
            d="M 100 5 L 500 5 L 900 5"
            fill="none"
            stroke="#22c55e"
            strokeWidth="1.5"
            strokeDasharray="8 6"
            opacity="0.3"
          />
        </svg>

        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {STEPS.map(({ icon: Icon, title, description, step }, i) => (
            <GlassCard key={i} hover className="relative p-8 text-center">
              <span className="absolute top-4 right-6 text-6xl font-bold text-white/[0.03] select-none">
                {step}
              </span>
              <div className="w-14 h-14 mx-auto rounded-xl bg-accent/10 flex items-center justify-center mb-5">
                <Icon size={26} className="text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  )
}
