const config = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary-green': '#00A63E',
        'primary-green-dark': '#009538',
      },
    },
  },
  plugins: [],
};
export default config;
