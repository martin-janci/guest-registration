import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';

const isProd = process.env.NODE_ENV === 'production';

const withSerwist = withSerwistInit({
  swSrc: 'src/worker/index.ts',
  swDest: 'public/sw.js',
  disable: !isProd,
  cacheOnNavigation: true,
});

const config: NextConfig = {
  output: 'standalone',
  experimental: { typedRoutes: true },
  logging: { fetches: { fullUrl: false } },
};

export default withSerwist(config);
