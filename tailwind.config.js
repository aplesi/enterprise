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
        // === APLESI Brand Palette (dari Lovable theme) ===
        'navy-deep': 'oklch(0.22 0.07 255)',
        'navy': 'oklch(0.32 0.11 255)',
        'aqua': 'oklch(0.72 0.14 210)',
        'aqua-glow': 'oklch(0.82 0.13 200)',

        // === Semantic tokens (referensi CSS variables) ===
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
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
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
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
        'gradient-hero': 'linear-gradient(135deg, oklch(0.22 0.07 255) 0%, oklch(0.32 0.11 255) 45%, oklch(0.52 0.14 220) 100%)',
        'gradient-aqua': 'linear-gradient(135deg, oklch(0.72 0.14 210) 0%, oklch(0.82 0.13 200) 100%)',
        'gradient-aqua-text': 'linear-gradient(135deg, oklch(0.82 0.13 200), white)',
      },
      boxShadow: {
        'glow': '0 20px 60px -20px color-mix(in srgb, #5dc8e0 50%, transparent)',
        'card': '0 4px 20px -8px color-mix(in srgb, #1e2d5a 25%, transparent)',
        'card-hover': '0 20px 50px -15px color-mix(in srgb, #1e2d5a 35%, transparent)',
      },
    },
  },
  plugins: [],
}
