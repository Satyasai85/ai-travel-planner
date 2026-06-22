import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        slate: {
          750: '#293548',
        },
      },
    },
  },
  plugins: [],
};

export default config;
