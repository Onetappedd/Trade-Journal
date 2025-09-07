/** @type {import('next').NextConfig} */

const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://s3.tradingview.com https://www.tradingview.com https://s.tradingview.com",
              "worker-src 'self' blob:",
              "style-src 'self' 'unsafe-inline' https://s3.tradingview.com https://www.tradingview.com https://s.tradingview.com",
              "img-src 'self' data: https: https://s3.tradingview.com https://www.tradingview.com https://s.tradingview.com",
              "frame-src 'self' https://s3.tradingview.com https://www.tradingview.com https://s.tradingview.com",
              "connect-src 'self' https://s3.tradingview.com https://www.tradingview.com https://s.tradingview.com https://lobigrwmngwirucuklmc.supabase.co https://*.supabase.co",
              "font-src 'self' data: https://s3.tradingview.com",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
