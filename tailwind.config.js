/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--color-primary)',
          light: 'var(--color-primary-light)',
          dark: 'var(--color-primary-dark)',
        },
        accent: 'var(--color-accent)',
        secondary: 'var(--color-secondary)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',
        surface: 'var(--color-surface)',
        background: 'var(--color-background)',
        card: 'var(--color-card)',
        ink: {
          DEFAULT: 'var(--color-text)',
          muted: 'var(--color-text-muted)',
          disabled: 'var(--color-text-disabled)',
        },
        border: 'var(--color-border)',
        holiday: {
          bg: 'var(--color-holiday-bg)',
          text: 'var(--color-holiday-text)',
          border: 'var(--color-holiday-border)',
        },
        break: {
          bg: 'var(--color-break-bg)',
          text: 'var(--color-break-text)',
        },
        lab: {
          bg: 'var(--color-lab-bg)',
          text: 'var(--color-lab-text)',
        },
      },
      fontFamily: {
        display: ['Sora', 'Manrope', 'system-ui', 'sans-serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        mono: ['"Courier New"', 'Courier', 'monospace'],
      },
      boxShadow: {
        soft: '0 18px 36px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}

