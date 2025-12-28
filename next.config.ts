import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://discord.com https://www.googletagmanager.com https://cmp.clickio.com https://clickiocmp.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://cmp.clickio.com https://clickiocmp.com",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://discord.com http://localhost:8000 https://www.google-analytics.com https://analytics.google.com https://cmp.clickio.com https://clickiocmp.com",
              "frame-src https://www.googletagmanager.com https://cmp.clickio.com https://clickiocmp.com",
              "frame-ancestors 'self'",
            ].join('; ')
          },
        ],
      },
    ];
  },
};

export default nextConfig;
