import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './strings/**/*.ts',
  ],
  theme: {
    extend: {
      fontFamily: {
        vazir: ['Vazirmatn', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Design system: neutral base + teal accent + risk encoding
        primary: {
          DEFAULT: '#29348d',
          hover: '#353d9e',
        },
        risk: {
          A: '#047857',
          B: '#475569',
          C: '#b45309',
        },
        surface: '#f8fafc',
        border: '#e2e8f0',
        muted: '#64748b',
      },
    },
  },
  plugins: [],
};

export default config;
