import path from 'node:path';

/** @type {import('next').NextConfig} */

const nextConfig = {
  webpack: (config) => {
    config.resolve ??= {};
    config.resolve.alias ??= {};
    const shim = path.resolve(process.cwd(), 'shims/date-fns-locale-en-US.mjs');

    // Alias both possible import forms used by deps
    config.resolve.alias['date-fns/locale/en-US'] = shim;
    config.resolve.alias['date-fns/locale/en-US/index'] = shim;
    return config;
  },
};

export default nextConfig;
