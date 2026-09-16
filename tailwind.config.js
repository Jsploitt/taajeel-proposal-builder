/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Measured from the real deck. The brand-guidelines PDF disagrees;
        // the deck wins.
        navy: {
          DEFAULT: '#0F3353',
          900: '#0A2438',
          700: '#0F3353',
          500: '#2A5578',
          300: '#7A98B2',
          100: '#D6E0E8',
        },
        cream: {
          DEFAULT: '#F1E8D9',
          200: '#F8F3EA',
          400: '#E3D5BE',
          600: '#C9B896',
        },
        blocker: '#9B2226',
        check: '#B5651D',
        tbc: '#7A5C12',
        info: '#2A5578',
      },
      fontSize: {
        xs: ['11px', '15px'],
        sm: ['12.5px', '17px'],
        base: ['14px', '20px'],
        lg: ['16px', '22px'],
        xl: ['19px', '26px'],
        '2xl': ['24px', '30px'],
      },
      borderRadius: {
        DEFAULT: '2px',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'Cascadia Mono', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
