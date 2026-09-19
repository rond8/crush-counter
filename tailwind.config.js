/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        midnight: {
          DEFAULT: 'var(--color-midnight)',
          surface: 'var(--color-midnight-surface)',
          border: 'var(--color-midnight-border)',
        },
        ink: 'var(--color-ink)',
        muted: 'var(--color-muted)',
        heart: {
          purple: 'var(--color-heart-purple)',
          green: 'var(--color-heart-green)',
          red: 'var(--color-heart-red)',
          yellow: 'var(--color-heart-yellow)',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 40px -8px rgba(181, 123, 255, 0.45)',
      },
      keyframes: {
        floatUp: {
          '0%': { transform: 'translateY(200px) scale(1)', opacity: '0' },
          '10%': { opacity: '0.4' },
          '100%': { transform: 'translateY(-130vh) scale(1.5)', opacity: '0' },
        },
        pulseGlow: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.06)', opacity: '0.85' },
        },
      },
      animation: {
        floatUp: 'floatUp 14s linear infinite',
        pulseGlow: 'pulseGlow 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
