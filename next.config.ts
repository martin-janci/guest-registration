import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';
import createNextIntlPlugin from 'next-intl/plugin';

const isProd = process.env.NODE_ENV === 'production';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

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
  // Keep Node-only packages out of the webpack server bundle so that
  // instrumentation.ts (which dynamically imports the scheduler) builds cleanly.
  serverExternalPackages: ['node-cron', 'node-ical', 'axios', '@prisma/client', 'prisma'],
  webpack(webpackConfig, { isServer }) {
    if (isServer) {
      // Treat all node: protocol imports as external (they are native Node modules).
      webpackConfig.externals = [
        ...(Array.isArray(webpackConfig.externals) ? webpackConfig.externals : [webpackConfig.externals].filter(Boolean)),
        ({ request }: { request?: string }, callback: (err?: Error | null, result?: string) => void) => {
          if (request && (request.startsWith('node:') || ['fs', 'path', 'child_process', 'crypto', 'os', 'stream', 'util', 'events', 'net', 'tls', 'http', 'https', 'zlib', 'buffer'].includes(request))) {
            return callback(null, `commonjs ${request}`);
          }
          callback();
        },
      ];
    }
    return webpackConfig;
  },
};

export default withSerwist(withNextIntl(config));
