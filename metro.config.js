const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.transformer = {
  ...config.transformer,
  minifierPath: 'metro-minify-terser',
  minifierConfig: {
    compress: {
      drop_console: false,
      passes: 1,
    },
    mangle: true,
    output: {
      comments: false,
    },
  },
};

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      res.setTimeout(300000);
      return middleware(req, res, next);
    };
  },
};

config.maxWorkers = 2;

module.exports = config;
