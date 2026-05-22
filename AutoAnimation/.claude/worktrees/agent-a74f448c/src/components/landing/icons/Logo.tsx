export function Logo({ className = '', size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
    >
      <defs>
        <linearGradient id="gb1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#4ade80' }} />
          <stop offset="50%" style={{ stopColor: '#22c55e' }} />
          <stop offset="100%" style={{ stopColor: '#16a34a' }} />
        </linearGradient>
        <linearGradient id="gb1g" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#22c55e' }} />
          <stop offset="100%" style={{ stopColor: '#16a34a' }} />
        </linearGradient>
        <filter id="glb1">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glb1s">
          <feGaussianBlur stdDeviation="14" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <clipPath id="lb1">
          <path d="M16 16 L340 16 L172 496 L16 496 Z" />
        </clipPath>
        <clipPath id="rb1">
          <path d="M340 16 L496 16 L496 496 L172 496 Z" />
        </clipPath>
        <clipPath id="rcb1">
          <rect x="16" y="16" width="480" height="480" rx="96" />
        </clipPath>
      </defs>

      <rect x="16" y="16" width="480" height="480" rx="96" fill="none" stroke="url(#gb1)" strokeWidth="10" />

      <g clipPath="url(#rcb1)">
        <rect x="16" y="16" width="480" height="480" fill="#050a05" />

        <g clipPath="url(#rb1)">
          <rect x="16" y="16" width="480" height="480" fill="url(#gb1g)" />
        </g>

        {/* Film strip perforations along top */}
        <g opacity="0.2">
          <rect x="60" y="28" width="14" height="10" rx="2" fill="#4ade80" />
          <rect x="86" y="28" width="14" height="10" rx="2" fill="#4ade80" />
          <rect x="112" y="28" width="14" height="10" rx="2" fill="#4ade80" />
          <rect x="138" y="28" width="14" height="10" rx="2" fill="#4ade80" />
          <rect x="164" y="28" width="14" height="10" rx="2" fill="#4ade80" />
        </g>
        {/* Film strip perforations along bottom */}
        <g opacity="0.2">
          <rect x="340" y="474" width="14" height="10" rx="2" fill="#ffffff" />
          <rect x="366" y="474" width="14" height="10" rx="2" fill="#ffffff" />
          <rect x="392" y="474" width="14" height="10" rx="2" fill="#ffffff" />
          <rect x="418" y="474" width="14" height="10" rx="2" fill="#ffffff" />
          <rect x="444" y="474" width="14" height="10" rx="2" fill="#ffffff" />
        </g>

        {/* Echo lines */}
        <line x1="320" y1="16" x2="152" y2="496" stroke="#4ade80" strokeWidth="1.5" opacity="0.15" filter="url(#glb1s)" />
        <line x1="340" y1="16" x2="172" y2="496" stroke="#4ade80" strokeWidth="5" opacity="0.9" filter="url(#glb1)" />
        <line x1="360" y1="16" x2="192" y2="496" stroke="#4ade80" strokeWidth="1" opacity="0.1" filter="url(#glb1s)" />

        {/* Dark side letters */}
        <g clipPath="url(#lb1)">
          <path d="M133 152 L133 360 M133 152 L241 152 C301 152 301 248 241 248 L133 248"
                fill="none" stroke="#4ade80" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" filter="url(#glb1)" />
          <path d="M265 360 L337 152 L409 360"
                fill="none" stroke="#22c55e" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" filter="url(#glb1)" />
          <line x1="289" y1="275" x2="385" y2="275" stroke="#22c55e" strokeWidth="20" strokeLinecap="round" opacity="0.8" />
        </g>

        {/* Green side letters */}
        <g clipPath="url(#rb1)">
          <path d="M133 152 L133 360 M133 152 L241 152 C301 152 301 248 241 248 L133 248"
                fill="none" stroke="#0a0a0a" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M265 360 L337 152 L409 360"
                fill="none" stroke="#ffffff" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="289" y1="275" x2="385" y2="275" stroke="rgba(255,255,255,0.85)" strokeWidth="20" strokeLinecap="round" />
        </g>

        {/* Play triangle nestled inside P's bowl */}
        <g clipPath="url(#lb1)">
          <path d="M170 178 L205 200 L170 222 Z" fill="#4ade80" opacity="0.4" filter="url(#glb1)" />
        </g>
        <g clipPath="url(#rb1)">
          <path d="M170 178 L205 200 L170 222 Z" fill="#0a0a0a" opacity="0.35" />
        </g>

        {/* Motion wave */}
        <path d="M80 420 Q170 396 256 420 Q342 444 432 420"
              fill="none" stroke="#4ade80" strokeWidth="5" opacity="0.3" filter="url(#glb1)" />
      </g>
    </svg>
  )
}
