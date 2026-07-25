const path = require("path");

// The `WebSdk` bare import inside @digitalpersona/devices is not an npm package —
// it's the browser client library that ships *inside* the same package at
// @types/WebSdk/index.js (it assigns window.WebSdk). Point the bundler at it.
const webSdkPath = path.resolve(
  __dirname,
  "node_modules/@digitalpersona/devices/@types/WebSdk/index.js",
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  webpack: (config) => {
    config.resolve.alias.WebSdk = webSdkPath;
    return config;
  },
  // If you ever run `next dev --turbopack`, mirror the alias here too.
  turbopack: {
    resolveAlias: {
      WebSdk: webSdkPath,
    },
  },
};

module.exports = nextConfig;
