import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SectionHeading } from './ui/SectionHeading'
import { FAQItem } from './FAQItem'

gsap.registerPlugin(ScrollTrigger)

const FAQS = [
  { question: 'What kind of videos can I create?', answer: 'ProAnimate specializes in short-form animated videos — explainers, stories, tutorials, product demos, news recaps, and social media content. Perfect for TikTok, YouTube Shorts, and Instagram Reels.' },
  { question: 'How does the AI Director work?', answer: 'Simply type a text prompt describing your video. Our AI orchestrator powered by Gemini generates a complete plan — script, characters, voices, lip sync, motion graphics, and music — then executes a 13-step pipeline to build everything automatically.' },
  { question: 'What AI models power the platform?', answer: 'We use Gemini 2.0 Flash for scripting and orchestration, ElevenLabs for voice synthesis and lip sync alignment, Meshy for text-to-3D generation, and HunyuanMotion for 3D animation.' },
  { question: 'How does lip sync work?', answer: 'Our 24-viseme system (8 mouth shapes x 3 curvatures) uses ElevenLabs phoneme alignment to match lip movements to speech with frame-level precision. Each emotion dynamically selects the right mouth curvature.' },
  { question: 'Can I use my own characters?', answer: 'Yes! Upload any image to create a 2D rigged character with AI auto-rig, or import GLB/FBX 3D models. You can also generate characters from text prompts — 2D sprites via Vertex AI or 3D models via Meshy.' },
  { question: 'Can I publish directly to social media?', answer: 'Yes, ProAnimate supports one-click publishing to TikTok, YouTube, Instagram, Facebook, and X. Pro and Enterprise plans include full social publishing with analytics tracking.' },
  { question: 'Is there an API?', answer: 'Pro plans include API access for programmatic video generation. Enterprise plans add webhook support and white-label publishing capabilities.' },
  { question: 'What export formats are supported?', answer: 'Export as MP4 (H.264) or WebM (VP8) in resolutions from 720p to 4K depending on your plan. WebCodecs provide GPU-accelerated encoding for fast exports.' },
]

export function FAQSection() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const ctx = gsap.context(() => {
      gsap.from('.faq-item', {
        opacity: 0,
        y: 20,
        duration: 0.4,
        stagger: 0.08,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
          invalidateOnRefresh: true,
        },
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={ref} className="py-24 px-6">
      <SectionHeading tag="FAQ" title="Frequently asked questions" />
      <div className="max-w-2xl mx-auto">
        {FAQS.map((faq, i) => (
          <div key={i} className="faq-item">
            <FAQItem question={faq.question} answer={faq.answer} />
          </div>
        ))}
      </div>
    </section>
  )
}
