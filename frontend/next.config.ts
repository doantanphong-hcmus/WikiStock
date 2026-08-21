import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    // Allow external images from any HTTPS source
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Responsive image sizes for different devices
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Modern image formats for better compression
    formats: ['image/avif', 'image/webp'],
    // Cache optimization
    minimumCacheTTL: 60,
  },
  async redirects() {
    return [
      // Redirect /companies to /search where users can browse companies
      {
        source: '/companies',
        destination: '/search',
        permanent: false,
      },
      // Redirect /market to homepage (no market page exists yet)
      {
        source: '/market',
        destination: '/',
        permanent: false,
      },
    ];
  },
  // Compress responses
  compress: true,
  // Power headers for caching
  poweredByHeader: false,
};

export default nextConfig;
