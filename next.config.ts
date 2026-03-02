import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
    unoptimized: true,
  },
  // Excluir carpetas que no son parte del proyecto Next.js
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/nueva demo/**', '**/www.cdrmedios.com/**', '**/node_modules/**'],
    };
    return config;
  },
};

export default nextConfig;
