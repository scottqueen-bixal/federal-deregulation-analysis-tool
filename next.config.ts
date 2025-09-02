import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicitly disable Babel and use SWC for Next.js compilation
  swcMinify: true,
  compiler: {
    // Ensure SWC is used for the app
  },
  experimental: {
    // Force SWC compilation
    forceSwcTransforms: true,
  },
  // Keep Babel only for Jest testing
  webpack: (config, { isServer }) => {
    // Ensure SWC is used instead of Babel for Next.js
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

export default nextConfig;
