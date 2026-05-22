import { useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import gsap from 'gsap'

interface FAQItemProps {
  question: string
  answer: string
}

export function FAQItem({ question, answer }: FAQItemProps) {
  const [open, setOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const chevronRef = useRef<SVGSVGElement>(null)

  const toggle = () => {
    const next = !open
    setOpen(next)

    if (contentRef.current) {
      if (next) {
        gsap.set(contentRef.current, { height: 'auto' })
        const h = contentRef.current.offsetHeight
        gsap.fromTo(contentRef.current, { height: 0 }, { height: h, duration: 0.3, ease: 'power2.out' })
      } else {
        gsap.to(contentRef.current, { height: 0, duration: 0.3, ease: 'power2.inOut' })
      }
    }

    if (chevronRef.current) {
      gsap.to(chevronRef.current, { rotation: next ? 180 : 0, duration: 0.3, ease: 'power2.out' })
    }
  }

  return (
    <div className="border-b border-white/[0.06]">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between py-5 text-left"
      >
        <span className="text-base font-medium text-white pr-4">{question}</span>
        <ChevronDown
          ref={chevronRef as React.Ref<SVGSVGElement>}
          size={18}
          className="text-zinc-500 shrink-0"
        />
      </button>
      <div ref={contentRef} className="overflow-hidden" style={{ height: 0 }}>
        <p className="pb-5 text-sm text-zinc-400 leading-relaxed">{answer}</p>
      </div>
    </div>
  )
}
