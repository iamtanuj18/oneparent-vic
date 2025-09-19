/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#2563eb',
          'primary-dark': '#1d4ed8',
          secondary: '#0ea5e9',
          accent: '#06b6d4',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
        },
        hero: {
          bg: '#1e2430',
          text: '#ffffff',
          'text-muted': 'rgba(255, 255, 255, 0.7)',
          'text-subtle': 'rgba(255, 255, 255, 0.6)',
        },
      },
      spacing: {
        'xs': '0.5rem',
        'sm': '0.75rem',
        'md': '1rem',
        'lg': '1.5rem',
        'xl': '2rem',
        '2xl': '3rem',
        '3xl': '4rem',
      },
      borderRadius: {
        'radius': '0.625rem',
      },
    },
  },
  plugins: [],
}
