import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export for AWS S3 + CloudFront deployment
  output: 'export',
  trailingSlash: true,
  
  // Image optimization (unoptimized for static export compatibility)
  images: {
    unoptimized: true,
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's1.ticketm.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.discovery.indeedevents.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.eventfinda.com.au',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'eventfinda-media.s3.ap-southeast-2.amazonaws.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  
  // Turbopack configuration (moved from experimental)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // Production optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Fast refresh for development
  reactStrictMode: false,
  
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
