import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDFBF5',
          100: '#FAF4E6',
          200: '#F3E9D2',
        },
        moss: {
          50: '#F1F6ED',
          100: '#E1EDD8',
          200: '#C3DBB1',
          300: '#9FC489',
          400: '#7CAE66',
          500: '#5C8F49',
          600: '#496F39',
          700: '#3A5A2E',
        },
        clay: {
          100: '#F6E9DE',
          200: '#EBD1BC',
          300: '#DDB393',
          400: '#C98F63',
          500: '#B0723F',
        },
        ink: {
          700: '#3B362E',
          900: '#22201B',
        },
      },
      fontSize: {
        base: ['18px', '1.6'],
        lg: ['20px', '1.6'],
        xl: ['24px', '1.5'],
        '2xl': ['28px', '1.4'],
        '3xl': ['34px', '1.35'],
      },
      borderRadius: {
        xl: '1.25rem',
        '2xl': '1.75rem',
      },
      spacing: {
        touch: '48px',
      },
    },
  },
  plugins: [],
};

export default config;
