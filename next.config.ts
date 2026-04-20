import type { NextConfig } from 'next';

const config: NextConfig = {
  output: 'standalone',
  experimental: {
    typedRoutes: true,
  },
  logging: {
    fetches: { fullUrl: false },
  },
};

export default config;
