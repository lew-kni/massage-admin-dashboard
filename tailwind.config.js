/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f8faf7',
          100: '#f0f4f0',
          200: '#dce4da',
          300: '#c0d1c4',
          400: '#8fb095',
          500: '#6b9a74',
          600: '#557d62',
          700: '#43614d',
          800: '#364e3f',
          900: '#2c4034',
          950: '#182319',
        },
        sky: {
          50: '#f7fbfd',
          100: '#eff8fc',
          200: '#d9eef8',
          300: '#b9dff4',
          400: '#7bc5ed',
          500: '#4eaae8',
          600: '#3189d1',
          700: '#2670b3',
          800: '#1f5895',
          900: '#1b467a',
          950: '#0f2d50',
        }
      }
    }
  },
  plugins: [],
}
