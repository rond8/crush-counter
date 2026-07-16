/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        midnight: {
          DEFAULT: '#160C22',
          surface: '#241635',
          border: '#3A2650',
        },
        ink: '#F4E9FF',
        muted: '#B6A2CE',
        heart: {
          purple: '#B57BFF',
          green: '#5FD68A',
          red: '#FF5C7A',
          yellow: '#FFCB57',
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
          '0%': { transform: 'translateY(0) scale(1)', opacity: '0' },
          '10%': { opacity: '0.6' },
          '100%': { transform: 'translateY(-120vh) scale(1.4)', opacity: '0' },
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
