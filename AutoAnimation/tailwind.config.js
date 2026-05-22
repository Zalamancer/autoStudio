/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', './src/bonerigging/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        accent: {
          DEFAULT: '#22c55e',
          hover: '#16a34a',
          light: 'rgba(34, 197, 94, 0.2)',
          subtle: 'var(--color-accent-subtle)',
          border: 'var(--color-accent-border)',
          muted: 'rgba(34, 197, 94, 0.2)',
        },
        'panel-bg': {
          DEFAULT: '#1e1e1e',
          hover: '#2a2a2a',
        },
        'panel-border': '#3a3a3a',
        'panel-surface': '#2a2a2a',
        'panel-surface-hover': '#3a3a3a',
        page: 'var(--color-page)',
        surface: {
          lowest: 'var(--color-surface-lowest)',
          low: 'var(--color-surface-low)',
          DEFAULT: 'var(--color-surface)',
          high: 'var(--color-surface-high)',
        },
        primary: 'var(--color-text-primary)',
        secondary: 'var(--color-text-secondary)',
        tertiary: 'var(--color-text-tertiary)',
        muted: 'var(--color-text-muted)',
        bdr: {
          DEFAULT: 'var(--color-bdr)',
          subtle: 'var(--color-bdr-subtle)',
          medium: 'var(--color-bdr-medium)',
        },
        glass: 'var(--color-glass)',
        overlay: {
          DEFAULT: 'var(--color-overlay)',
          heavy: 'var(--color-overlay-heavy)',
        },
      },
      boxShadow: {
        glass: '0 4px 30px rgba(0, 0, 0, 0.5)',
        glow: '0 0 15px rgba(34, 197, 94, 0.3)',
        'glow-lg': '0 0 30px rgba(34, 197, 94, 0.4)',
      },
      backgroundImage: {
        'hero-glow': 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(34, 197, 94, 0.18) 0%, transparent 70%)',
        'grid-pattern':
          'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
      },
      zIndex: {
        overlay: '10',
        panel: '20',
        modal: '40',
        'modal-raised': '45',
        toast: '50',
        dropdown: '9999',
      },
      backgroundSize: {
        grid: '60px 60px',
      },
      animation: {
        'thinking-dot': 'thinking-dot 1.4s ease-in-out infinite',
        'success-pop': 'success-pop 0.4s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.3s ease-out forwards',
        'phase-pulse': 'phase-pulse 2s ease-in-out infinite',
        'step-pulse': 'step-pulse 1.5s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
