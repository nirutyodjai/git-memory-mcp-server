/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Optimize images
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  // Set output file tracing root to silence warning
  outputFileTracingRoot: __dirname,
  // Custom webpack config for better CSS handling
  webpack: (config, { isServer }) => {
    // Handle CSS imports properly
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;