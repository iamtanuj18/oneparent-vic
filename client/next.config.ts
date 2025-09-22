import type { NextConfig } from "next";

// Detect if we're building for Vercel (no static export) or Netlify (static export)
const isVercel = process.env.VERCEL === '1';

const nextConfig: NextConfig = {
  // Only use static export for Netlify, not Vercel
  ...(isVercel ? {} : { output: 'export' }),
  trailingSlash: true,
  
  // Conditional image optimization based on platform
  images: {
    ...(isVercel ? {
      formats: ['image/webp', 'image/avif'],
      deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
      imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    } : {
      unoptimized: true
    }),
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
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  // Production optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Fast refresh for development
  reactStrictMode: true,
  
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
