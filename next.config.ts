import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
    unoptimized: true,
  },
  experimental: {
    // Aumentar memoria del worker para evitar SIGSEGV en builds grandes
    workerThreads: false,
  },
};

export default nextConfig;
