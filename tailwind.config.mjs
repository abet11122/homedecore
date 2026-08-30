/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        paper: '#FBF8F4',
        sand: '#F4EEE6',
        rule: '#E5DCD0',
        ink: {
          DEFAULT: '#1F1B17',
          60: '#4A423A',
          40: '#8A7F73',
          20: '#B9AE9F',
        },
        clay: {
          DEFAULT: '#B05B38',
          deep: '#8F4728',
          soft: '#F1E2DA',
        },
        sage: {
          DEFAULT: '#7C8A72',
          soft: '#E8EBE3',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        body: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      fontSize: {
        eyebrow: ['0.6875rem', { lineHeight: '1', letterSpacing: '0.16em' }],
      },
      maxWidth: {
        reading: '43rem',
      },
      letterSpacing: {
        display: '-0.02em',
      },
      transitionDuration: {
        250: '250ms',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
