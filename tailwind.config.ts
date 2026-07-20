import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        // Zero-noise canvas & surfaces
        bg: '#000000',
        surface: {
          DEFAULT: '#0a0a0a',
          2: '#121212',
          3: '#1a1a1a'
        },
        // Apple ink grays
        ink: {
          DEFAULT: '#f5f5f7',
          2: '#a1a1a6',
          3: '#86868b',
          4: '#6e6e73'
        },
        // Hairline rules
        hairline: {
          DEFAULT: 'rgba(255,255,255,0.08)',
          strong: 'rgba(255,255,255,0.16)'
        },
        // Single solar accent
        accent: {
          DEFAULT: '#f59e0b',
          strong: '#fbbf24',
          soft: 'rgba(245,158,11,0.12)'
        },
        success: '#30d158',
        danger: '#ff453a',
        info: '#0a84ff'
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        display: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif']
      },
      borderRadius: {
        ss: '18px'
      },
      letterSpacing: {
        widest2: '0.22em'
      }
    }
  },
  plugins: []
}
export default config
