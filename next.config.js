/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  // Disable static optimization for pages that use cookies
  experimental: {
    serverActions: true,
  },
  // Configure dynamic routes
  reactStrictMode: true,
  swcMinify: true,
  // Disable static optimization for specific pages
  unstable_runtimeJS: true,
};

module.exports = nextConfig;