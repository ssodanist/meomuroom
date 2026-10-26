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
          800: '#2B4221',
          900: '#1F3018',
        },
        clay: {
          50: '#FBF1E7',
          100: '#F6E9DE',
          200: '#EBD1BC',
          300: '#DDB393',
          400: '#C98F63',
          500: '#B0723F',
          600: '#8F5A2F',
        },
        ink: {
          700: '#3B362E',
          900: '#22201B',
        },
      },
      fontFamily: {
        // 본문·버튼 등 UI 전반 — 또렷하고 신뢰감 있는 산세리프
        sans: [
          '"Noto Sans KR"',
          '-apple-system',
          'BlinkMacSystemFont',
          'sans-serif',
        ],
        // 인사말·헤드라인 등 '순간'을 위한 차분하고 격조 있는 명조체
        serif: ['"Gowun Batang"', '"Noto Serif KR"', 'serif'],
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
      boxShadow: {
        // 카드 전반에 쓰는, 기존보다 깊고 차분한 그림자 — 과하지 않게
        soft: '0 2px 10px rgba(43, 66, 33, 0.06), 0 10px 24px -12px rgba(43, 66, 33, 0.12)',
        lifted: '0 4px 14px rgba(43, 66, 33, 0.08), 0 16px 32px -16px rgba(43, 66, 33, 0.16)',
      },
    },
  },
  plugins: [],
};

export default config;
