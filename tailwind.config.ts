import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        glass: {
          bg: 'rgba(255, 255, 255, 0.08)',
          border: 'rgba(255, 255, 255, 0.12)',
          hover: 'rgba(255, 255, 255, 0.14)',
        },
        accent: {
          light: '#F59E0B',
          climate: '#3B82F6',
          security: '#10B981',
          cover: '#8B5CF6',
          camera: '#EC4899',
        },
        surface: {
          DEFAULT: '#0F1117',
          elevated: '#1A1D27',
          card: 'rgba(30, 34, 46, 0.7)',
        },
      },
      backdropBlur: {
        glass: '20px',
      },
      borderRadius: {
        card: '16px',
      },
      minHeight: {
        touch: '48px',
      },
      minWidth: {
        touch: '48px',
      },
    },
  },
  plugins: [],
} satisfies Config;
