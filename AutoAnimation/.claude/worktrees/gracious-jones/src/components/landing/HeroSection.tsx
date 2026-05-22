import { useRef, useEffect, useMemo } from 'react'
import {
  Play, LayoutList, LibraryBig, Film, AudioLines, Type, Sparkles,
  WandSparkles, UserRound, Box, MessageSquare, MessageCircle,
  TerminalSquare, ShoppingBag, Blocks, Palette,
  Undo2, Redo2, SkipBack, SkipForward,
  ZoomIn, User, Smile, Scissors, Mic,
} from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { GradientText } from './ui/GradientText'
import { GlowButton } from './ui/GlowButton'
import { HeroScene } from './HeroScene'

gsap.registerPlugin(ScrollTrigger)

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const subRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const proofRef = useRef<HTMLDivElement>(null)
  const mockupRef = useRef<HTMLDivElement>(null)
  const mockupInnerRef = useRef<HTMLDivElement>(null)
  const textBlockRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // ── Entrance animations ──

      // Word-by-word headline
      if (headlineRef.current) {
        const words = headlineRef.current.querySelectorAll('.hero-word')
        gsap.from(words, {
          opacity: 0,
          y: 30,
          duration: 0.6,
          stagger: 0.05,
          ease: 'power3.out',
        })
      }

      gsap.from(subRef.current, {
        opacity: 0, y: 20, duration: 0.6, delay: 0.4, ease: 'power3.out',
      })

      gsap.from(ctaRef.current, {
        opacity: 0, y: 20, duration: 0.6, delay: 0.6, ease: 'power3.out',
      })

      gsap.from(proofRef.current, {
        opacity: 0, y: 20, duration: 0.6, delay: 0.8, ease: 'power3.out',
      })

      gsap.from(mockupRef.current, {
        opacity: 0, y: 100, duration: 0.9, delay: 0.6, ease: 'power3.out',
      })

      // ── Scroll parallax ──

      // Text content moves up at 0.5x scroll speed
      gsap.to(textBlockRef.current, {
        yPercent: -30,
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
          invalidateOnRefresh: true,
        },
      })

      // WebGL scene moves up at 0.3x scroll speed
      gsap.to(sceneRef.current, {
        yPercent: -15,
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
          invalidateOnRefresh: true,
        },
      })

      // Mockup: rotateX(8deg) → rotateX(0deg) as you scroll, with slight y parallax
      if (mockupInnerRef.current) {
        gsap.fromTo(mockupInnerRef.current,
          { rotateX: 8 },
          {
            rotateX: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: mockupRef.current,
              start: 'top 80%',
              end: 'top 20%',
              scrub: true,
              invalidateOnRefresh: true,
            },
          }
        )
      }

      // Mockup parallax — moves slower than text
      gsap.to(mockupRef.current, {
        yPercent: -10,
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
          invalidateOnRefresh: true,
        },
      })

    }, containerRef)

    return () => ctx.revert()
  }, [])

  const headlineWords = 'Create Animated Videos with a'.split(' ')

  const logoRevealHtml = useMemo(() => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
:root{--green-400:#4ade80;--green-500:#22c55e;--green-600:#16a34a;--dark:#050a05;--darker:#020502}
body{background:var(--darker);color:#fff;font-family:sans-serif;overflow:hidden;width:100vw;height:100vh;display:flex;align-items:center;justify-content:center}
.bg-grain{position:fixed;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:0;opacity:0.03;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");background-size:200px}
.bg-radial{position:fixed;top:50%;left:50%;width:120vmax;height:120vmax;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,rgba(34,197,94,0.06) 0%,transparent 65%);pointer-events:none;z-index:0;opacity:0;transition:opacity 0.8s ease}
.logo-wrap{position:relative;width:min(70vmin,280px);height:min(70vmin,280px);z-index:2}
.logo-svg{width:100%;height:100%}
.layer{opacity:0}
.title-reveal{position:fixed;bottom:8%;left:50%;transform:translateX(-50%);text-align:center;z-index:100;opacity:0;transition:all 1s cubic-bezier(0.16,1,0.3,1);pointer-events:none}
.title-reveal.visible{opacity:1}
.title-reveal h1{font-family:sans-serif;font-weight:800;font-size:clamp(12px,4vw,24px);letter-spacing:-0.5px;line-height:1;margin-bottom:3px}
.title-reveal h1 .pro{color:#fff}
.title-reveal h1 .animate{color:var(--green-400)}
.title-reveal .tagline{font-family:monospace;font-size:6px;letter-spacing:2px;text-transform:uppercase;color:var(--green-500);opacity:0.6}
@keyframes perfScrollLeft{from{transform:translateX(0)}to{transform:translateX(-26px)}}
@keyframes perfScrollRight{from{transform:translateX(0)}to{transform:translateX(26px)}}
.perf-scroll-l{animation:perfScrollLeft 1.2s linear infinite}
.perf-scroll-r{animation:perfScrollRight 1.2s linear infinite}
</style>
</head>
<body>
<div class="bg-grain"></div>
<div class="bg-radial" id="bgRadial"></div>
<div class="title-reveal" id="titleReveal">
  <h1><span class="pro">Pro</span><span class="animate">Animate</span></h1>
  <div class="tagline">AI-Powered Video Creation</div>
</div>
<div class="logo-wrap">
  <svg class="logo-svg" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gb1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#4ade80"/>
        <stop offset="50%" style="stop-color:#22c55e"/>
        <stop offset="100%" style="stop-color:#16a34a"/>
      </linearGradient>
      <linearGradient id="gb1g" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#22c55e"/>
        <stop offset="100%" style="stop-color:#16a34a"/>
      </linearGradient>
      <filter id="glb1"><feGaussianBlur stdDeviation="8" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="glb1s"><feGaussianBlur stdDeviation="14" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <clipPath id="lb1"><path d="M16 16 L340 16 L172 496 L16 496 Z"/></clipPath>
      <clipPath id="rb1"><path d="M340 16 L496 16 L496 496 L172 496 Z"/></clipPath>
      <clipPath id="rcb1"><rect x="16" y="16" width="480" height="480" rx="96"/></clipPath>
      <clipPath id="perfClipTop"><rect x="40" y="24" width="160" height="18"/></clipPath>
      <clipPath id="perfClipBot"><rect x="320" y="470" width="160" height="18"/></clipPath>
    </defs>
    <rect class="layer" id="layer-border" x="16" y="16" width="480" height="480" rx="96" fill="none" stroke="url(#gb1)" stroke-width="10" stroke-dasharray="2000" stroke-dashoffset="2000"/>
    <g clip-path="url(#rcb1)">
      <rect class="layer" id="layer-bg" x="16" y="16" width="480" height="480" fill="#050a05"/>
      <g class="layer" id="layer-split" clip-path="url(#rb1)"><rect x="16" y="16" width="480" height="480" fill="url(#gb1g)"/></g>
      <g class="layer" id="layer-echoes">
        <line x1="320" y1="16" x2="152" y2="496" stroke="#4ade80" stroke-width="1.5" opacity="0.15" filter="url(#glb1s)"/>
        <line x1="340" y1="16" x2="172" y2="496" stroke="#4ade80" stroke-width="5" opacity="0.9" filter="url(#glb1)"/>
        <line x1="360" y1="16" x2="192" y2="496" stroke="#4ade80" stroke-width="1" opacity="0.1" filter="url(#glb1s)"/>
      </g>
      <g class="layer" id="layer-P" clip-path="url(#lb1)">
        <path d="M133 152 L133 360 M133 152 L241 152 C301 152 301 248 241 248 L133 248" fill="none" stroke="#4ade80" stroke-width="32" stroke-linecap="round" stroke-linejoin="round" filter="url(#glb1)" stroke-dasharray="800" stroke-dashoffset="800"/>
      </g>
      <g class="layer" id="layer-P-green" clip-path="url(#rb1)">
        <path d="M133 152 L133 360 M133 152 L241 152 C301 152 301 248 241 248 L133 248" fill="none" stroke="#0a0a0a" stroke-width="32" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="800" stroke-dashoffset="800"/>
      </g>
      <g class="layer" id="layer-A" clip-path="url(#lb1)">
        <path id="a-path-dark" d="M265 360 L337 152 L409 360" fill="none" stroke="#22c55e" stroke-width="32" stroke-linecap="round" stroke-linejoin="round" filter="url(#glb1)" stroke-dasharray="500" stroke-dashoffset="500"/>
        <line x1="289" y1="275" x2="385" y2="275" stroke="#22c55e" stroke-width="20" stroke-linecap="round" opacity="0"/>
      </g>
      <g class="layer" id="layer-A-green" clip-path="url(#rb1)">
        <path id="a-path-light" d="M265 360 L337 152 L409 360" fill="none" stroke="#ffffff" stroke-width="32" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="500" stroke-dashoffset="500"/>
        <line x1="289" y1="275" x2="385" y2="275" stroke="rgba(255,255,255,0.85)" stroke-width="20" stroke-linecap="round" opacity="0"/>
      </g>
      <g class="layer" id="layer-perfs">
        <g clip-path="url(#perfClipTop)" opacity="0.2">
          <g class="perf-scroll-l">
            <rect x="46" y="28" width="14" height="10" rx="2" fill="#4ade80"/><rect x="72" y="28" width="14" height="10" rx="2" fill="#4ade80"/>
            <rect x="98" y="28" width="14" height="10" rx="2" fill="#4ade80"/><rect x="124" y="28" width="14" height="10" rx="2" fill="#4ade80"/>
            <rect x="150" y="28" width="14" height="10" rx="2" fill="#4ade80"/><rect x="176" y="28" width="14" height="10" rx="2" fill="#4ade80"/>
            <rect x="202" y="28" width="14" height="10" rx="2" fill="#4ade80"/>
          </g>
        </g>
        <g clip-path="url(#perfClipBot)" opacity="0.2">
          <g class="perf-scroll-r">
            <rect x="300" y="474" width="14" height="10" rx="2" fill="#ffffff"/><rect x="326" y="474" width="14" height="10" rx="2" fill="#ffffff"/>
            <rect x="352" y="474" width="14" height="10" rx="2" fill="#ffffff"/><rect x="378" y="474" width="14" height="10" rx="2" fill="#ffffff"/>
            <rect x="404" y="474" width="14" height="10" rx="2" fill="#ffffff"/><rect x="430" y="474" width="14" height="10" rx="2" fill="#ffffff"/>
            <rect x="456" y="474" width="14" height="10" rx="2" fill="#ffffff"/>
          </g>
        </g>
      </g>
      <g class="layer" id="layer-play">
        <g clip-path="url(#lb1)">
          <path d="M170 178 L205 200 L170 222 Z" fill="#4ade80" opacity="0" filter="url(#glb1)">
            <animate attributeName="opacity" values="0.25;0.55;0.25" dur="2s" repeatCount="indefinite" begin="indefinite" id="playAnim"/>
          </path>
        </g>
        <g clip-path="url(#rb1)">
          <path d="M170 178 L205 200 L170 222 Z" fill="#0a0a0a" opacity="0">
            <animate attributeName="opacity" values="0.2;0.45;0.2" dur="2s" repeatCount="indefinite" begin="indefinite" id="playAnim2"/>
          </path>
        </g>
      </g>
      <path class="layer" id="layer-wave" fill="none" stroke="#4ade80" stroke-width="5" opacity="0" filter="url(#glb1)" d="M80 420 Q170 396 256 420 Q342 444 432 420"/>
    </g>
  </svg>
</div>
<script>
(function(){
  /* Time-driven animation: total duration ~6s, loops forever */
  var DURATION=6000,HOLD=3000,CYCLE=DURATION+HOLD;
  var bgRadial=document.getElementById('bgRadial');
  var titleReveal=document.getElementById('titleReveal');
  var playStarted=false;
  function ease(t){return 1-Math.pow(1-t,3)}
  function clamp01(v){return Math.max(0,Math.min(1,v))}
  function lerp(a,b,t){return a+(b-a)*clamp01(t)}
  var start=performance.now();
  function update(){
    var elapsed=(performance.now()-start)%CYCLE;
    var p=clamp01(elapsed/DURATION);
    bgRadial.style.opacity=lerp(0,1,(p-0.15)/0.3);
    var b=document.getElementById('layer-border'),bT=ease(clamp01(p/0.12));
    b.style.opacity=bT>0?1:0;b.style.strokeDashoffset=String(2000*(1-bT));
    var bg=document.getElementById('layer-bg');bg.style.opacity=String(ease(clamp01((p-0.10)/0.08)));
    var sp=document.getElementById('layer-split'),spT=ease(clamp01((p-0.18)/0.10));
    sp.style.opacity=String(spT);sp.style.transform='translateX('+(1-spT)*80+'px)';
    var ec=document.getElementById('layer-echoes');ec.style.opacity=String(ease(clamp01((p-0.28)/0.10)));
    var pE=document.getElementById('layer-P'),pG=document.getElementById('layer-P-green'),pT=ease(clamp01((p-0.38)/0.15));
    pE.style.opacity=pT>0?'1':'0';pG.style.opacity=pT>0?'1':'0';
    pE.querySelectorAll('path').forEach(function(x){x.style.strokeDashoffset=String(800*(1-pT))});
    pG.querySelectorAll('path').forEach(function(x){x.style.strokeDashoffset=String(800*(1-pT))});
    var aE=document.getElementById('layer-A'),aG=document.getElementById('layer-A-green'),aT=ease(clamp01((p-0.53)/0.15));
    aE.style.opacity=aT>0?'1':'0';aG.style.opacity=aT>0?'1':'0';
    var ad=document.getElementById('a-path-dark'),al=document.getElementById('a-path-light');
    if(ad)ad.style.strokeDashoffset=String(500*(1-aT));if(al)al.style.strokeDashoffset=String(500*(1-aT));
    var cT=ease(clamp01((p-0.62)/0.06));
    aE.querySelectorAll('line').forEach(function(l){l.style.opacity=String(cT*0.8)});
    aG.querySelectorAll('line').forEach(function(l){l.style.opacity=String(cT*0.85)});
    var pf=document.getElementById('layer-perfs');pf.style.opacity=String(ease(clamp01((p-0.68)/0.10)));
    var pl=document.getElementById('layer-play'),plT=ease(clamp01((p-0.78)/0.10));
    pl.style.opacity=String(plT);
    if(plT>0.5&&!playStarted){playStarted=true;var a1=document.getElementById('playAnim');if(a1&&a1.beginElement)a1.beginElement();var a2=document.getElementById('playAnim2');if(a2&&a2.beginElement)a2.beginElement()}
    if(plT<0.1)playStarted=false;
    var wv=document.getElementById('layer-wave');wv.style.opacity=String(ease(clamp01((p-0.75)/0.10))*0.3);
    titleReveal.classList.toggle('visible',p>0.88);
    requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
})();
</script>
</body>
</html>`, [])

  return (
    <section ref={containerRef} className="relative isolate min-h-screen flex flex-col items-center justify-center pt-24 pb-32 px-6 overflow-visible">
      {/* WebGL background — parallax layer */}
      <div ref={sceneRef} className="absolute inset-0 z-0">
        <HeroScene />
      </div>

      {/* Glow overlay */}
      <div className="absolute inset-0 z-[1] bg-hero-glow pointer-events-none" />

      {/* Content — parallax layer */}
      <div ref={textBlockRef} className="relative z-10 max-w-4xl mx-auto text-center">
        <h1 ref={headlineRef} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight text-white">
          {headlineWords.map((word, i) => (
            <span key={i} className="hero-word inline-block mr-[0.3em]">{word}</span>
          ))}
          <br className="hidden sm:block" />
          <GradientText className="hero-word inline-block text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold">
            Single Prompt
          </GradientText>
        </h1>

        <p ref={subRef} className="mt-6 text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          AI-powered studio for TikTok, Shorts, and Reels — type a prompt, get a complete animated video with characters, voices, and motion graphics.
        </p>

        <div ref={ctaRef} className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <GlowButton to="/dashboard" className="text-base py-3.5 px-8">
            Try for free
          </GlowButton>
          <GlowButton variant="ghost" href="#demo" className="text-base py-3.5 px-8">
            <Play size={18} className="fill-current" />
            Watch demo
          </GlowButton>
        </div>

        {/* Social proof */}
        <div ref={proofRef} className="mt-10 flex items-center justify-center gap-3">
          <div className="flex -space-x-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-gradient-to-br from-accent/40 to-emerald-800/40"
                style={{ zIndex: 6 - i }}
              />
            ))}
          </div>
          <span className="text-sm text-zinc-500">Trusted by 2,000+ creators</span>
        </div>
      </div>

      {/* Editor mockup — perspective + scroll rotation */}
      <div
        ref={mockupRef}
        className="relative z-10 mt-16 mb-[-120px] w-full max-w-5xl mx-auto"
        style={{ perspective: '1200px' }}
      >
        <div
          ref={mockupInnerRef}
          className="relative rounded-xl border border-white/[0.08] bg-zinc-950 shadow-2xl overflow-hidden will-change-transform"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Glow border */}
          <div className="absolute inset-0 rounded-xl ring-1 ring-accent/20 pointer-events-none z-50" />

          {/* ── Top Menu Bar ── */}
          <div className="h-7 bg-zinc-900/80 border-b border-white/5 flex items-center px-3 gap-3 text-[10px] text-zinc-500">
            <div className="flex gap-1.5 mr-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
            </div>
            <span className="hover:text-zinc-300">File</span>
            <span className="hover:text-zinc-300">Settings</span>
            <span className="hover:text-zinc-300">Marketplace</span>
            <span className="hover:text-zinc-300">Dashboard</span>
            <div className="flex-1" />
            <span className="text-zinc-600 truncate max-w-[120px]">My Explainer Video</span>
            <span className="text-green-500/70 flex items-center gap-1">Saved</span>
            <span className="px-2 py-0.5 rounded bg-accent/90 text-black font-semibold text-[9px]">Render</span>
          </div>

          <div className="flex" style={{ height: 420 }}>
            {/* ── Left Icon Sidebar ── */}
            <div className="hidden sm:flex w-10 bg-zinc-900 border-r border-white/5 flex-col items-center py-2 gap-1 shrink-0">
              {[
                { icon: LayoutList, active: false },
                { icon: LibraryBig, active: false },
                { icon: Film, active: false },
                { icon: AudioLines, active: false },
                { icon: Type, active: false },
                { icon: Sparkles, active: false },
                { icon: WandSparkles, active: true },
                { icon: UserRound, active: false },
                { icon: Box, active: false },
                { icon: MessageSquare, active: false },
                { icon: MessageCircle, active: false },
                { icon: TerminalSquare, active: false },
                { icon: ShoppingBag, active: false },
                { icon: Blocks, active: false },
                { icon: Palette, active: false },
              ].map(({ icon: Icon, active }, i) => (
                <div
                  key={i}
                  className={`w-7 h-7 rounded flex items-center justify-center ${
                    active ? 'bg-accent text-white' : 'text-zinc-600'
                  }`}
                >
                  <Icon size={13} />
                </div>
              ))}
            </div>

            {/* ── Left Panel Content ── */}
            <div className="hidden md:block w-44 bg-zinc-900/50 border-r border-white/5 p-2 overflow-hidden shrink-0">
              <div className="text-[10px] font-semibold text-zinc-400 mb-2 px-1">Animations</div>
              {['Fade In', 'Slide Up', 'Bounce', 'Zoom In', 'Spin', 'Typewriter'].map((name) => (
                <div key={name} className="flex items-center gap-2 px-2 py-1.5 rounded text-[10px] text-zinc-500 hover:bg-white/[0.03]">
                  <WandSparkles size={10} className="text-accent/50" />
                  {name}
                </div>
              ))}
              <div className="text-[10px] font-semibold text-zinc-400 mt-3 mb-2 px-1">Lottie Library</div>
              <div className="grid grid-cols-2 gap-1.5 px-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-square rounded bg-zinc-800/60 border border-white/[0.04]" />
                ))}
              </div>
            </div>

            {/* ── Center Canvas + Timeline ── */}
            <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden">
              {/* Canvas viewport */}
              <div className="flex-1 relative flex items-center justify-center bg-[#0a0a0c]">
                {/* 16:9 canvas frame */}
                <div className="w-[85%] aspect-video bg-zinc-950 border border-white/[0.04] rounded relative overflow-hidden">
                  <iframe
                    srcDoc={logoRevealHtml}
                    className="absolute inset-0 w-full h-full border-0"
                    sandbox="allow-scripts"
                    loading="lazy"
                    title="Logo reveal animation"
                  />
                </div>
              </div>

              {/* ── Timeline (between panels) ── */}
              <div className="h-24 bg-zinc-800/80 border-t border-zinc-700/50 relative">
                {/* Timeline controls */}
                <div className="h-6 flex items-center px-2 gap-1 border-b border-zinc-700/30">
                  <Undo2 size={10} className="text-zinc-600" />
                  <Redo2 size={10} className="text-zinc-600" />
                  <div className="w-px h-3 bg-zinc-700/50 mx-1" />
                  <SkipBack size={10} className="text-zinc-500" />
                  <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                    <Play size={8} className="text-accent ml-0.5" />
                  </div>
                  <SkipForward size={10} className="text-zinc-500" />
                  <div className="w-px h-3 bg-zinc-700/50 mx-1" />
                  <span className="text-[8px] text-zinc-500 font-mono">00:00 / 00:30</span>
                  <div className="flex-1" />
                  <ZoomIn size={10} className="text-zinc-600" />
                </div>
                {/* Time ruler */}
                <div className="h-4 flex items-end px-10 border-b border-zinc-700/20">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className="flex-1 flex flex-col items-start">
                      <div className={`w-px ${i % 5 === 0 ? 'h-2 bg-zinc-600' : 'h-1 bg-zinc-700/50'}`} />
                      {i % 5 === 0 && <span className="text-[6px] text-zinc-600 -ml-1">{i * 2}s</span>}
                    </div>
                  ))}
                </div>
                {/* Track rows */}
                <div className="px-1 py-0.5 space-y-px">
                  {[
                    { label: 'Dialogue', color: 'bg-blue-500/20 border-blue-500/30', width: '85%' },
                    { label: 'Character', color: 'bg-accent/20 border-accent/30', width: '100%' },
                    { label: 'Captions', color: 'bg-purple-500/20 border-purple-500/30', width: '80%' },
                    { label: 'Music', color: 'bg-amber-500/20 border-amber-500/30', width: '95%' },
                    { label: 'Template', color: 'bg-cyan-500/20 border-cyan-500/30', width: '60%' },
                  ].map((track) => (
                    <div key={track.label} className="flex items-center h-[11px]">
                      <span className="w-12 text-[7px] text-zinc-600 truncate shrink-0 pl-1">{track.label}</span>
                      <div className="flex-1 h-full relative">
                        <div
                          className={`h-full rounded-sm border ${track.color}`}
                          style={{ width: track.width }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {/* Playhead line */}
                <div className="absolute left-[35%] top-6 bottom-0 w-px bg-accent/40 pointer-events-none" />
              </div>
            </div>

            {/* ── Right Panel ── */}
            <div className="hidden lg:block w-40 bg-zinc-900/50 border-l border-white/5 p-2 overflow-hidden shrink-0">
              {/* Right panel tabs */}
              <div className="flex gap-0.5 mb-2">
                {[
                  { icon: User, active: true },
                  { icon: Smile, active: false },
                  { icon: Scissors, active: false },
                  { icon: Mic, active: false },
                ].map(({ icon: Icon, active }, i) => (
                  <div
                    key={i}
                    className={`flex-1 flex items-center justify-center py-1 rounded text-[9px] ${
                      active ? 'bg-zinc-700/50 text-zinc-200' : 'text-zinc-600'
                    }`}
                  >
                    <Icon size={11} />
                  </div>
                ))}
              </div>
              {/* Properties */}
              <div className="text-[10px] font-semibold text-zinc-400 mb-2">Transform</div>
              {['Position', 'Scale', 'Rotation', 'Opacity'].map((prop) => (
                <div key={prop} className="flex items-center justify-between py-1 text-[9px]">
                  <span className="text-zinc-600">{prop}</span>
                  <span className="text-zinc-400 bg-zinc-800/50 px-1.5 py-0.5 rounded text-[8px] font-mono">
                    {prop === 'Position' ? '480, 320' : prop === 'Scale' ? '1.0' : prop === 'Rotation' ? '0°' : '100%'}
                  </span>
                </div>
              ))}
              <div className="text-[10px] font-semibold text-zinc-400 mt-3 mb-2">Emotion</div>
              <div className="grid grid-cols-3 gap-1">
                {['Joy', 'Anger', 'Fear', 'Sad', 'Shock', 'Calm'].map((e) => (
                  <div key={e} className={`text-center py-1 rounded text-[8px] ${e === 'Joy' ? 'bg-accent/15 text-accent border border-accent/20' : 'bg-zinc-800/40 text-zinc-600'}`}>
                    {e}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
