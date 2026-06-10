import type { NextConfig } from 'next'
import { env, isTruthy } from './lib/core/config/env'
import { isDev } from './lib/core/config/feature-flags'
import {
  getChatEmbedCSPPolicy,
  getMainCSPPolicy,
  getWorkflowExecutionCSPPolicy,
} from './lib/core/security/csp'

const nextConfig: NextConfig = {
  output: 'export',
  devIndicators: false,
  poweredByHeader: false,
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'api.stability.ai',
      },
      // Azure Blob Storage
      {
        protocol: 'https',
        hostname: '*.blob.core.windows.net',
      },
      // AWS S3
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.s3.*.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      // Brand logo domain if configured
      ...(process.env.NEXT_PUBLIC_BRAND_LOGO_URL
        ? (() => {
            try {
              return [
                {
                  protocol: 'https' as const,
                  hostname: new URL(process.env.NEXT_PUBLIC_BRAND_LOGO_URL!).hostname,
                },
              ]
            } catch {
              return []
            }
          })()
        : []),
      // Brand favicon domain if configured
      ...(process.env.NEXT_PUBLIC_BRAND_FAVICON_URL
        ? (() => {
            try {
              return [
                {
                  protocol: 'https' as const,
                  hostname: new URL(process.env.NEXT_PUBLIC_BRAND_FAVICON_URL!).hostname,
                },
              ]
            } catch {
              return []
            }
          })()
        : []),
    ],
  },
  typescript: {
    ignoreBuildErrors: isTruthy(env.DOCKER_BUILD),
  },
  serverExternalPackages: [
    '@1password/sdk',
    'unpdf',
    'ffmpeg-static',
    'fluent-ffmpeg',
    'ws',
    'isolated-vm',
    '@e2b/code-interpreter',
    'e2b',
  ],
  outputFileTracingIncludes: {
    '/api/tools/stagehand/*': ['./node_modules/ws/**/*'],
    '/*': [
      './node_modules/sharp/**/*',
      './node_modules/@img/**/*',
      './lib/execution/sandbox/bundles/*.cjs',
    ],
  },
  turbopack: {
    resolveAlias: {
      // `dns/promises` has no browser shim. Server-only connector fetch logic
      // (which imports `input-validation.server`) is statically reachable from
      // the client bundle via the connector registry, but never runs there.
      // Stub it for the browser only; the server keeps the real module so SSRF
      // validation is unaffected.
      'dns/promises': { browser: './lib/core/security/empty-node-fallback.browser.ts' },
      dns: { browser: './lib/core/security/empty-node-fallback.browser.ts' },
    },
  },
  experimental: {
    optimizeCss: true,
    preloadEntriesOnStart: false,
    optimizePackageImports: [
      'lodash',
      'framer-motion',
      'reactflow',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-accordion',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-switch',
      '@radix-ui/react-slider',
      'streamdown',
      'zod',
    ],
  },
  ...(isDev && {
    allowedDevOrigins: [
      ...(env.NEXT_PUBLIC_APP_URL
        ? (() => {
            try {
              return [new URL(env.NEXT_PUBLIC_APP_URL).host]
            } catch {
              return []
            }
          })()
        : []),
      'localhost:3000',
      'localhost:3001',
    ],
  }),
  transpilePackages: [
    'prettier',
    '@react-email/components',
    '@react-email/render',
    '@t3-oss/env-nextjs',
    '@t3-oss/env-core',
    '@sim/db',
    'better-auth-harmony',
  ]
}

export default nextConfig
