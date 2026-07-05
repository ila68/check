import type { Config } from 'tailwindcss'
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: { extend: { colors: { primary: { DEFAULT: '#4361ee', dark: '#3451d1' } } } },
  plugins: [],
}
export default config
