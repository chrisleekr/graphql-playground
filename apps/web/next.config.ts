import type { NextConfig } from 'next';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '../..');

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  transpilePackages: ['@repo/shared', '@repo/database'],
  // Externalize pino to avoid bundling issues with worker threads
  serverExternalPackages: ['pino', 'pino-pretty'],

  outputFileTracingRoot: repoRoot,
  turbopack: {
    root: repoRoot,
  },

  // You can specify a name to use for a custom build directory to use instead of .next.
  // distDir: '.next',

  // Configure allowed remote image sources for next/image
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
    ],
  },

  async headers() {
    // Content Security Policy
    // Reference: https://nextjs.org/docs/app/guides/content-security-policy
    // Reference: https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html
    //
    // Note: 'unsafe-inline' for scripts is required for Next.js hydration.
    // For stricter security, consider using nonces with middleware.
    // See: https://nextjs.org/docs/app/guides/content-security-policy#adding-a-nonce-with-middleware

    // Build connect-src with all allowed API endpoints
    // Include both local dev and production Vercel URLs
    const allowedConnectSources = [
      "'self'",
      'http://localhost:3001', // Local development
      'https://*.vercel.app', // Vercel preview and production deployments
      process.env.GRAPHQL_API_URL, // Explicit API URL if set
    ]
      .filter(Boolean)
      .join(' ');

    const cspDirectives = [
      "default-src 'self'",
      // Scripts: self + inline (required for Next.js)
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Styles: self + inline (for CSS modules)
      "style-src 'self' 'unsafe-inline'",
      // Images: self + external image sources
      "img-src 'self' https://picsum.photos data: blob:",
      // Fonts: self + data URIs (for inline fonts)
      "font-src 'self' data:",
      // Connections: self + API servers (dev + production)
      `connect-src ${allowedConnectSources}`,
      // No plugins, media, or iframes
      "object-src 'none'",
      "media-src 'none'",
      "frame-src 'none'",
      // Prevent clickjacking
      "frame-ancestors 'none'",
      // Form submissions only to self
      "form-action 'self'",
      // No base tag manipulation
      "base-uri 'self'",
      // Upgrade HTTP to HTTPS in production
      ...(process.env.NODE_ENV === 'production' ? ['upgrade-insecure-requests'] : []),
    ].join('; ');

    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: cspDirectives,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
