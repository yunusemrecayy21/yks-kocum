/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#090D16',          // Deepest background
          surface: '#0F172A',     // Sidebar and card containers
          card: '#131D31',        // Elevated card background
          cardHover: '#18243E',   // Card hover state
          border: '#1E293B',      // Subtle dividers
          borderLight: '#334155', // Elevated borders
          muted: '#64748B',       // Muted captions
          text: '#F8FAFC',        // Crisp white text
          subtext: '#94A3B8',     // Light grey text
        },
        brand: {
          purple: '#8B5CF6',      // Elegant purple accent
          purpleHover: '#7C3AED',
          purpleDark: '#6D28D9',
          purpleLight: '#A78BFA',
          midnight: '#3B82F6',    // Deep night blue
          cyan: '#06B6D4',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glow-purple': '0 0 25px -5px rgba(139, 92, 246, 0.25)',
        'glow-midnight': '0 0 25px -5px rgba(59, 130, 246, 0.25)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
}
