/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // === Navy-Aqua Palette (Lovable) ===
        'navy-deep': '#0a1628',
        'navy': '#1a2f4d',
        'aqua': '#5bb5d4',
        'aqua-glow': '#8ed4ed',

        // === Premium Color Palette ===
        midnight: '#0A0E27',
        charcoal: '#1A1F3A',
        slate: '#2A3150',
        mist: '#E8ECF4',
        pearl: '#F5F7FA',
        azure: '#3B82F6',
        cyan: '#06B6D4',
        emerald: '#10B981',
        amber: '#F59E0B',

        // === Semantic tokens (referensi CSS variables) ===
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        border: 'var(--border)',
        ring: 'var(--ring)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: 'calc(var(--radius) - 4px)',
        md: 'calc(var(--radius) - 2px)',
        lg: 'var(--radius)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
        '3xl': 'calc(var(--radius) + 12px)',
      },
      backgroundImage: {
        'gradient-ocean': 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)',
        'gradient-midnight': 'linear-gradient(135deg, #0A0E27 0%, #1A1F3A 50%, #2A3150 100%)',
        'gradient-pearl': 'linear-gradient(135deg, #F5F7FA 0%, #E8ECF4 100%)',
        'gradient-hero': 'linear-gradient(135deg, #0a1628 0%, #1a2f4d 45%, #3d5f7d 100%)',
        'gradient-aqua': 'linear-gradient(135deg, #5bb5d4 0%, #8ed4ed 100%)',
      },
      boxShadow: {
        'luxury': '0 20px 60px -15px rgba(10, 14, 39, 0.15)',
        'luxury-lg': '0 30px 80px -20px rgba(10, 14, 39, 0.2)',
        'glow-blue': '0 20px 60px -15px rgba(59, 130, 246, 0.4)',
        'glow-cyan': '0 20px 60px -15px rgba(6, 182, 212, 0.4)',
      },
    },
  },
  plugins: [],
}
