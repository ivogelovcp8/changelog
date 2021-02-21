module.exports = {
  purge: ['./src/**/*.{html,njk,md}'], // we can not scan output HTML because 11ty executes PostCSS transform asynchronously - so it may run before all HTML was output to /dist folder
  theme: {
    extend: {
      colors: {},
      boxShadow:
        {
          glove: '0 0 5px rgba(0,0,0,.8)'
        }
    },
  },
  variants: {},
  plugins: [],
};
