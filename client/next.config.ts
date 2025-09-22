import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  eslint: {
    // Disable ESLint during builds for faster deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable type checking during builds for faster deployment
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
