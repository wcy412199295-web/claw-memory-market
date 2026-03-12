/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        mako: {
          50: '#f0fdf4',
          100: '#0d1117',
          200: '#161b22',
          300: '#21262d',
          400: '#30363d',
          500: '#484f58',
          600: '#6e7681',
          700: '#8b949e',
          800: '#c9d1d9',
          900: '#f0f6fc',
        },
        claw: {
          primary: '#58a6ff',
          accent: '#f78166',
          green: '#3fb950',
          purple: '#bc8cff',
          pink: '#f778ba',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
};
