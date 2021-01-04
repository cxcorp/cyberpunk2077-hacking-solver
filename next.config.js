const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const withWebWorkers = (nextConfig) => {
  return {
    ...nextConfig,
    webpack(config, options) {
      config.module.rules.unshift({
        test: /\.worker\.ts$/i,
        use: {
          loader: "worker-loader",
          options: {
            filename: "static/static/[name].[hash].js",
            publicPath: "/_next/",
            esModule: false,
          },
        },
      });

      //config.output.globalObject = 'typeof self !== "object" ? self : this';

      if (typeof nextConfig.webpack === "function") {
        return nextConfig.webpack(config, options);
      }
      return config;
    },
  };
};

module.exports = (phase, defaultConfig) => {
  return withWebWorkers(withBundleAnalyzer(defaultConfig));
};
