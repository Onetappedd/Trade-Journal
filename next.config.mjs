import path from 'node:path';

/** @type {import('next').NextConfig} */

const nextConfig = {
  webpack: (config) => {
    config.resolve ??= {};
    config.resolve.alias ??= {};
    // Exact-match alias so it doesn't recurse
    config.resolve.alias['date-fns/locale/en-US$'] =
      path.resolve(process.cwd(), 'shims/date-fns-locale-en-US.mjs');
    return config;
  },
};

export default nextConfig;
