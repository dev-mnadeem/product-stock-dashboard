/** @type {import('tailwindcss').Config} */

/**
 * Every semantic colour carries a full 50-900 ramp. Shipping a partial ramp is
 * how `bg-error-50` or `text-success-700` silently becomes a class Tailwind
 * never emits, leaving an alert rendered as plain black text on white.
 */
const ramp = (shades) => shades

module.exports = {
  content: ['./src/app/**/*.{js,ts,jsx,tsx,mdx}', './src/components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: ramp({
          50: '#effaf5',
          100: '#d8f0e5',
          200: '#b2e0cc',
          300: '#7fc8ab',
          400: '#4caa87',
          500: '#2c8c6b',
          600: '#1f7157',
          700: '#1a5a47',
          800: '#17483a',
          900: '#133b31',
        }),
        secondary: ramp({
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#736c66',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        }),
        success: ramp({
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        }),
        warning: ramp({
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        }),
        error: ramp({
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        }),
      },
      fontFamily: {
        // IBM Plex is self-hosted by next/font at build time (see app/layout.tsx),
        // so the browser never calls Google; the stacks after it are fallbacks.
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(28, 25, 23, 0.05), 0 8px 24px -12px rgba(28, 25, 23, 0.2)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 180ms ease-out',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
